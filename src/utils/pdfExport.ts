import { useState, useCallback } from 'react';

interface PDFOptions {
    scale?: number;
    quality?: number;
    fileName?: string;
    onStart?: () => void;
    onSuccess?: () => void;
    onError?: (error: any) => void;
    retryCount?: number;
}

/**
 * Universal PDF Export Utility - Anti-Modern-CSS Edition
 * Handles: oklch, lab, color, hwb, filters, animations.
 */
export const exportToPDF = async (
    elementId: string,
    options: PDFOptions = {}
) => {
    const {
        scale = 2,
        quality = 0.95,
        fileName = 'report',
        onStart,
        onSuccess,
        onError,
        retryCount = 0
    } = options;

    const element = document.getElementById(elementId);
    if (!element) {
        onError?.(new Error(`المحتوى #${elementId} غير موجود`));
        return;
    }

    onStart?.();

    try {
        console.log(`[PDF Export] Engine: html2pdf (Safe Mode)... Attempt: ${retryCount + 1}`);

        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) throw new Error('مكتبة html2pdf غير محملة');

        const opt = {
            margin: 0,
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg', quality: quality },
            html2canvas: {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: async (clonedDoc: HTMLDocument) => {
                    // 1. Explicitly remove the action buttons from PDF capture
                    const actionButtons = clonedDoc.getElementById('report-action-buttons');
                    if (actionButtons) {
                        actionButtons.remove();
                    }

                    // 2. Convert all <img> to base64 BEFORE rendering
                    const imgTags = Array.from(clonedDoc.querySelectorAll('img'));
                    await Promise.all(imgTags.map((img) => new Promise<void>((resolve) => {
                        const src = img.getAttribute('src') || '';
                        if (!src || src.startsWith('data:')) { resolve(); return; }

                        const tempImg = new Image();
                        tempImg.crossOrigin = 'anonymous';
                        tempImg.onload = () => {
                            try {
                                const cvs = document.createElement('canvas');
                                cvs.width = tempImg.naturalWidth || 100;
                                cvs.height = tempImg.naturalHeight || 100;
                                const ctx = cvs.getContext('2d');
                                if (ctx) { ctx.drawImage(tempImg, 0, 0); img.src = cvs.toDataURL('image/png'); }
                            } catch { /* keep original src */ }
                            resolve();
                        };
                        tempImg.onerror = () => resolve();
                        tempImg.src = src;
                    })));

                    // 3. Strip unsupported CSS color functions
                    const colorRegex = /(oklch|oklab|lab|color|hwb|color-mix)\s*\((?:[^()]+|\([^()]*\))*\)/gi;
                    const fallbackColor = '#1e3a8a';

                    clonedDoc.querySelectorAll('style').forEach(s => {
                        if (colorRegex.test(s.innerHTML)) {
                            s.innerHTML = s.innerHTML.replace(colorRegex, fallbackColor);
                        }
                    });

                    // 4. Clean elements
                    clonedDoc.querySelectorAll('*').forEach((el) => {
                        const target = el as HTMLElement;
                        if (!target.style) return;

                        const inlineStyle = target.getAttribute('style');
                        if (inlineStyle && colorRegex.test(inlineStyle)) {
                            target.setAttribute('style', inlineStyle.replace(colorRegex, fallbackColor));
                        }

                        target.style.animation = 'none';
                        target.style.transition = 'none';
                        target.style.backdropFilter = 'none';
                        target.style.textShadow = 'none';

                        const tag = target.tagName;
                        if (tag !== 'IMG') {
                            target.style.filter = 'none';
                        } else {
                            target.style.display = 'block';
                        }
                    });

                    // Final flush
                    const safeStyle = clonedDoc.createElement('style');
                    safeStyle.innerHTML = `
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                        
                        * { 
                            animation: none !important; 
                            transition: none !important; 
                            backdrop-filter: none !important;
                            text-rendering: optimizeLegibility !important;
                            -webkit-font-smoothing: antialiased !important;
                            font-variant-ligatures: common-ligatures !important;
                        }
                        
                        #report-action-buttons { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
                        
                        /* Arabic Font Joining Fix */
                        h1, h2, h3, h4, span, div, p, td, th {
                            font-family: 'Cairo', sans-serif !important;
                            letter-spacing: 0 !important;
                            word-spacing: 0 !important;
                            direction: rtl !important;
                            unicode-bidi: isolate !important;
                        }

                        img { filter: none !important; display: block !important; }
                    `;
                    clonedDoc.head.appendChild(safeStyle);
                }
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'p',
                compress: true
            }
        };

        await html2pdf().set(opt).from(element).save();
        onSuccess?.();
        return true;

    } catch (err: any) {
        console.error('[PDF Export Error]:', err);

        if (retryCount < 1) {
            console.warn('PDF generation failed. Retrying with ultra-simplified settings...');
            return exportToPDF(elementId, {
                ...options,
                scale: 1.5,
                retryCount: retryCount + 1
            });
        }

        const msg = err?.message || String(err);
        onError?.(new Error(msg));
    }
};

export const usePDFExport = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const generatePDF = useCallback(async (elementId: string, fileName: string, options: Partial<PDFOptions> = {}) => {
        setIsGenerating(true);
        setExportError(null);

        try {
            await exportToPDF(elementId, {
                ...options,
                fileName,
                onStart: () => {
                    setIsGenerating(true);
                    options.onStart?.();
                },
                onSuccess: () => {
                    setIsGenerating(false);
                    options.onSuccess?.();
                },
                onError: (err) => {
                    const msg = err instanceof Error ? err.message : String(err);
                    setExportError(msg);
                    setIsGenerating(false);
                    options.onError?.(err);
                },
            });
        } catch (err: any) {
            const msg = err instanceof Error ? err.message : String(err);
            setExportError(msg);
            setIsGenerating(false);
            options.onError?.(new Error(msg));
        }
    }, []);

    return {
        generatePDF,
        isGenerating,
        exportError
    };
};
