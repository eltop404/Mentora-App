
import React, { useState, useEffect } from 'react';
import { FileUp, Brain, CheckCircle, Edit, Save, Trash2, X, Plus, Sparkles, Languages, Link as LinkIcon, Loader2, ListOrdered, RefreshCw, AlertCircle, Type, GraduationCap, CalendarDays } from 'lucide-react';
import { LocalAnalysisService } from '../../services/localAnalysisService';
import { DB } from '../../services/db';
import { Question, Exam } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// PDF.js will be loaded dynamically from CDN
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const GEMINI_API_KEY = 'AIzaSyC9hqi6ooWmqFKCD4CttHxd1VQ8FdTSmJ4';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const PROXY_GEMINI_ENDPOINT = `https://api.allorigins.win/raw?url=${encodeURIComponent(GEMINI_ENDPOINT)}`;

interface PdfToExamGeneratorProps {
    onQuestionsGenerated: (questions: Question[]) => void;
    onClose: () => void;
}

const transformUrl = (url: string): string => {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('drive.google.com')) {
            const id = url.match(/\/d\/([^/]+)/)?.[1];
            if (id) return `https://docs.google.com/uc?export=download&id=${id}`;
        }
        if (urlObj.hostname.includes('dropbox.com')) {
            return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
        }
        if (urlObj.hostname.includes('github.com') && !urlObj.hostname.includes('raw.githubusercontent.com')) {
            return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
    } catch (e) {
        console.error("URL Transform Error:", e);
    }
    return url;
};

export const PdfToExamGenerator: React.FC<PdfToExamGeneratorProps> = ({ onQuestionsGenerated, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState('');
    const [qType, setQType] = useState<'MCQ' | 'TF' | 'essay' | 'MIXED'>('MIXED');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [stage, setStage] = useState<'upload' | 'review'>('upload');
    const [questionCount, setQuestionCount] = useState(10);
    const [title, setTitle] = useState('');
    const [selectedStage, setSelectedStage] = useState('إعدادية');
    const [selectedYear, setSelectedYear] = useState('الصف الأول الإعدادي');
    const [selectedSemester, setSelectedSemester] = useState('الفصل الدراسي الأول');

    const [options, setOptions] = useState({
        shuffleQuestions: true,
        shuffleOptions: true,
        mergeAllTypes: false
    });

    const [pipelineStage, setPipelineStage] = useState<string>('');
    const pipelineStages = [
        { id: 'load', label: '1. تحميل المستند', p: 10 },
        { id: 'extract', label: '2. قراءة البيانات', p: 40 },
        { id: 'analyze', label: '3. تحليل الذكاء الاصطناعي (Gemini)', p: 80 },
        { id: 'generate', label: '4. توليد الأسئلة', p: 95 },
        { id: 'create', label: '5. حفظ الامتحان النهائي', p: 100 }
    ];

    const robustFetch = async (url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> => {
        setPipelineStage('load');
        const proxiedUrls = [
            url,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];

        for (const target of proxiedUrls) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(target, { redirect: 'follow', signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const contentType = response.headers.get('content-type') || "";
                    const buffer = await response.arrayBuffer();
                    return { buffer, contentType };
                }
            } catch (e) {
                console.warn(`Fetch failed for ${target}`);
            }
        }
        throw new Error("تعذر جلب الملف. تأكد من أن الرابط مباشر ومتاح.");
    };

    const extractTextFromPdf = async (source: File | string): Promise<{ text?: string; fileData?: { data: string; mimeType: string } }> => {
        let arrayBuffer: ArrayBuffer;
        let fileType = "";

        setPipelineStage('load');
        setProgress(10);
        try {
            if (typeof source === 'string') {
                const res = await robustFetch(source);
                arrayBuffer = res.buffer;
                fileType = res.contentType;
            } else {
                arrayBuffer = await source.arrayBuffer();
                fileType = source.type;
            }
        } catch (e: any) { throw new Error(`خطأ في التحميل: ${e.message}`); }

        const isImg = fileType.includes('image/') || (typeof source === 'string' && source.toLowerCase().match(/\.(jpg|jpeg|png)$/));

        // Helper for fast and safe Base64 conversion using FileReader
        const bufferToBase64 = async (buf: ArrayBuffer): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(new Blob([buf]));
            });
        };

        if (isImg) {
            setProgress(40);
            const base64 = await bufferToBase64(arrayBuffer);
            return { fileData: { data: base64, mimeType: fileType || "image/jpeg" } };
        }

        const rawDataForFallback = arrayBuffer.slice(0); // Create a clone to avoid detachment issues

        try {
            setPipelineStage('extract');
            setProgress(35);
            if (!(window as any).pdfjsLib) {
                const s = document.createElement('script');
                s.src = PDFJS_CDN;
                document.head.appendChild(s);
                await new Promise((resolve) => { s.onload = resolve; });
            }
            const pdfjsLib = (window as any).pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

            // Note: passing a clone or the original is fine here, but we use the original and keep the clone for fallback
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            let fullText = "";
            const pageLimit = Math.min(pdf.numPages, 10);

            for (let i = 1; i <= pageLimit; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map((item: any) => item.str || "").join(" ") + "\n";
                setProgress(35 + (i / pageLimit) * 25);
            }

            if (fullText.trim().length < 100) {
                const base64 = await bufferToBase64(rawDataForFallback);
                return { fileData: { data: base64, mimeType: "application/pdf" } };
            }

            setProgress(60);
            return { text: LocalAnalysisService.cleanAndFixArabic(fullText) };
        } catch (e: any) {
            console.warn("PDF.js failed, falling back to raw upload:", e);
            const base64 = await bufferToBase64(rawDataForFallback);
            return { fileData: { data: base64, mimeType: "application/pdf" } };
        }
    };

    const callGemini = async (input: { text?: string; fileData?: { data: string; mimeType: string } }, count: number, type: string) => {
        const basePrompt = `أنت خبير تعليمي مصري محترف. حلل المحتوى واستخرج ${count} سؤالاً للامتحان بتنسيق JSON (Array) فقط. نوع الأسئلة: ${type === 'MIXED' ? 'متنوع' : type}.
        [ { "id": "${Math.random()}", "type": "MCQ"|"TF"|"essay", "text": "...", "options": [], "correctAnswer": "...", "essayChoices": [] } ]`;

        const parts: any[] = [{ text: basePrompt }];
        if (input.fileData) parts.push({ inline_data: { mime_type: input.fileData.mimeType || "application/pdf", data: input.fileData.data } });
        if (input.text) parts.push({ text: `المحتوى:\n${input.text.substring(0, 30000)}` });

        const body = JSON.stringify({ contents: [{ parts }] });
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        // Strategy: Try Direct -> Proxy 1 -> Proxy 2
        const fetchWithFallback = async () => {
            // 1. Direct Try
            try {
                const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
                if (res.ok) return res;
            } catch (e) { console.warn("Direct fetch failed, trying proxy..."); }

            // 2. Proxy 1: Corsproxy.io
            try {
                const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(endpoint)}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body
                });
                if (res.ok) return res;
            } catch (e) { console.warn("Proxy 1 failed, trying Proxy 2..."); }

            // 3. Proxy 2: Codetabs (Slower but reliable)
            try {
                const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(endpoint)}`, {
                    method: 'POST', body
                });
                if (res.ok) return res;
            } catch (e) { console.error("All connection strategies failed."); }

            throw new Error("فشل الاتصال بخادم الذكاء الاصطناعي. قد تكون الخدمة محجوبة من مزود الإنترنت الخاص بك. حاول استخدام شبكة مختلفة (WIFI/Data).");
        };

        try {
            setProgress(65);
            const response = await fetchWithFallback();
            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("لم يتم توليد رد من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
            }

            const rawOutput = data.candidates[0]?.content?.parts?.[0]?.text || "";
            const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);

            if (jsonMatch) return JSON.parse(jsonMatch[0]) as Question[];
            throw new Error("فشل في تحليل الأسئلة. حاول مرة أخرى.");
        } catch (err: any) {
            console.error("Gemini Robust Error:", err);
            throw new Error(err.message || 'حدث خطأ في الاتصال');
        }
    };

    const handleGenerate = async () => {
        if (!file && !pdfUrl.trim()) return setError("قم باختيار ملف أو رابط أولاً");
        if (!title.trim()) return setError("يرجى إدخال عنوان للاختبار أولاً لضمان حفظه");

        setLoading(true);
        setError(null);
        setProgress(0);

        try {
            // 1. Load & Extract (0-40%)
            const inputData = await extractTextFromPdf(file || pdfUrl);

            // 2. AI Analysis (65-85%)
            setPipelineStage('analyze');
            const questions = await callGemini(inputData, questionCount, options.mergeAllTypes ? 'MIXED' : qType);

            // 3. Finalize & Shuffle (85-100%)
            setPipelineStage('generate');
            setProgress(90);

            let finalQuestions = questions.map(q => ({
                ...q,
                id: q.id || Math.random().toString(36).substring(2, 9)
            }));

            if (options.shuffleQuestions) finalQuestions = [...finalQuestions].sort(() => Math.random() - 0.5);
            if (options.shuffleOptions) finalQuestions = finalQuestions.map(q => ({
                ...q,
                options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : q.options
            }));

            setGeneratedQuestions(finalQuestions);
            setPipelineStage('create');
            setProgress(100);

            setTimeout(() => {
                setStage('review');
                setLoading(false);
            }, 500);

        } catch (err: any) {
            setError(err.message || "حدث خطأ غير متوقع");
            setLoading(false);
        }
    };

    const handlePublish = () => {
        const newExam: Exam = {
            id: Date.now().toString(),
            title: title || "اختبار جديد من PDF",
            stage: selectedStage,
            year: selectedYear,
            semester: selectedSemester,
            type: qType,
            questions: generatedQuestions,
            date: new Date().toLocaleDateString('ar-EG'),
            isVisible: true
        };

        DB.addExam(newExam);
        onQuestionsGenerated(generatedQuestions);
        onClose();
        alert(`✅ تم بنجاح إنشاء الامتحان وحفظه في القاعدة (${generatedQuestions.length} سؤال).`);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-[#050505] w-full max-w-5xl rounded-[3.5rem] border border-white/5 shadow-3xl flex flex-col max-h-[95vh] overflow-hidden">
                <button onClick={onClose} className="absolute top-6 left-6 p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 text-gray-400 z-50"><X size={20} /></button>

                <div className="p-8 border-b border-white/5 flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/10"><Brain size={32} /></div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-white">منشئ الاختبارات الذكي (Gemini 1.5)</h2>
                        <p className="text-xs text-gray-500 font-bold opacity-60">تحليل فوري للمستندات والصور عبر الذكاء الاصطناعي</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                    {stage === 'upload' ? (
                        <div className="max-w-3xl mx-auto space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={`border-2 border-dashed rounded-[3rem] p-12 transition-all relative flex flex-col items-center gap-4 ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => { setFile(e.target.files?.[0] || null); setPdfUrl(''); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <FileUp size={40} className={file ? 'text-emerald-500' : 'text-gray-600'} />
                                    <h3 className="font-black text-sm text-white">{file ? file.name : "رفع ملف محلي (PDF/صورة)"}</h3>
                                </div>
                                <div className={`border-2 border-dashed rounded-[3rem] p-12 transition-all flex flex-col gap-4 ${pdfUrl ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                                    <div className="flex items-center justify-center gap-2 text-cyan-500 mb-2"><LinkIcon size={20} /><span className="text-xs font-black">تحليل من رابط URL</span></div>
                                    <input type="url" placeholder="Drive, Dropbox, GitHub..." value={pdfUrl} onChange={e => { setPdfUrl(e.target.value); setFile(null); }} className="bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-[10px] text-center outline-none focus:border-cyan-500" />
                                </div>
                            </div>

                            <div className="bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 flex items-center justify-end gap-2 pr-2"><Save size={14} /> عنوان الامتحان</label>
                                        <input type="text" placeholder="مثلاً: اختبار الوحدة الأولى التاريخ..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs text-right outline-none focus:border-emerald-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 flex items-center justify-end gap-2 pr-2"><GraduationCap size={14} /> المرحلة والصف</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select value={selectedStage} onChange={e => setSelectedStage(e.target.value)} className="bg-black/40 border border-white/5 px-3 py-3 rounded-xl text-[10px] font-black text-right outline-none appearance-none cursor-pointer">
                                                                                                                                            </select>
                                            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-black/40 border border-white/5 px-3 py-3 rounded-xl text-[10px] font-black text-right outline-none appearance-none cursor-pointer">
                                                {selectedStage === 'اعمال دوليه IB' ? (
                                                    <>
                                                                                                                                                                                                                            </>
                                                ) : (
                                                    <>
                                                                                                                                                                                                                            </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 flex items-center justify-end gap-2 pr-2"><CalendarDays size={14} /> الفصل الدراسي</label>
                                        <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-[10px] font-black text-right outline-none appearance-none cursor-pointer">
                                            <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                                            <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 flex items-center justify-end gap-2 pr-2"><ListOrdered size={14} /> عدد الأسئلة (Gemini)</label>
                                        <div className="grid grid-cols-5 gap-2">{[5, 10, 20, 30, 50].map(v => (<button key={v} onClick={() => setQuestionCount(v)} className={`py-3 rounded-xl text-[10px] font-bold border ${questionCount === v ? 'bg-cyan-500 text-black border-white/20' : 'bg-black/40 border-white/5 text-gray-500'}`}>{v}</button>))}</div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 flex items-center justify-end gap-2 pr-2"><Type size={14} /> نوع الامتحان</label>
                                        <div className="grid grid-cols-2 gap-2">{['MCQ', 'TF', 'essay', 'MIXED'].map(id => (<button key={id} onClick={() => setQType(id as any)} className={`py-3 rounded-xl text-[10px] font-black border ${qType === id ? 'bg-emerald-500 text-black border-white/20' : 'bg-black/40 border-white/5 text-gray-500'}`}>{id === 'MCQ' ? 'اختياري' : id === 'TF' ? 'صح/خطأ' : id === 'essay' ? 'مقالي' : 'شامل'}</button>))}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-white/5">
                                    {[{ id: 'shuffleQuestions', label: 'خلط الأسئلة', icon: <RefreshCw size={12} /> }, { id: 'shuffleOptions', label: 'خلط الاختيارات', icon: <Plus size={12} /> }, { id: 'mergeAllTypes', label: 'دمج كافة الأنواع برمجياً', icon: <Sparkles size={12} /> }].map(opt => (
                                        <button key={opt.id} onClick={() => setOptions(prev => ({ ...prev, [opt.id as any]: !prev[opt.id as any] }))} className={`px-4 py-2 rounded-full text-[9px] font-black transition-all border flex items-center gap-2 ${options[opt.id as keyof typeof options] ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-gray-500 border-white/5'}`}>{opt.icon} {opt.label}</button>
                                    ))}
                                </div>
                            </div>

                            {loading && (
                                <div className="space-y-6 max-w-xl mx-auto">
                                    <div className="flex items-center justify-between text-[11px] font-black">
                                        <span className="text-emerald-400">{progress}%</span>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>{pipelineStages.find(s => s.id === pipelineStage)?.label || 'جاري التحضير...'}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-center gap-3">
                                        {pipelineStages.map(s => (
                                            <div key={s.id} className={cn("text-[8px] font-black px-2 py-1 rounded", pipelineStage === s.id ? "bg-emerald-500 text-black" : "text-gray-600 bg-white/5")}>{s.label}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-[10px] font-black text-center flex items-center justify-center gap-2"><AlertCircle size={16} />{error}</div>}

                            <button onClick={handleGenerate} disabled={loading || (!file && !pdfUrl.trim())} className="w-full py-6 rounded-[2.5rem] font-black text-lg bg-white text-black hover:bg-emerald-500 disabled:opacity-20 shadow-2xl flex items-center justify-center gap-4">
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <Brain size={24} />}
                                <span>{loading ? "جاري معالجة المحتوى..." : "ابدأ التوليد الذكي الآن"}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                                <div className="text-right"><h3 className="text-xl font-black text-white">تم إنشاء {generatedQuestions.length} سؤال بنجاح</h3><p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Review & Save Final Exam</p></div>
                                <button onClick={() => setStage('upload')} className="px-6 py-3 bg-white/5 rounded-2xl hover:bg-white/10 text-xs font-black transition-all border border-white/5 flex items-center gap-2"><RefreshCw size={14} /> تعديل المصدر</button>
                            </div>

                            <div className="grid gap-6">
                                {generatedQuestions.map((q, i) => (
                                    <div key={q.id} className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 relative group hover:bg-white/[0.04]">
                                        <button onClick={() => setGeneratedQuestions(prev => prev.filter(x => x.id !== q.id))} className="absolute top-6 left-6 p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                                        <div className="flex items-center justify-end gap-2 text-emerald-400 font-black text-[9px] mb-4"><span>{q.type}</span><div className="w-1 h-1 rounded-full bg-emerald-500" /><span className="opacity-60">السؤال {i + 1}</span></div>
                                        <textarea value={q.text} onChange={e => setGeneratedQuestions(prev => prev.map(x => x.id === q.id ? { ...x, text: e.target.value } : x))} className="w-full bg-transparent border-none text-lg font-black text-white text-right outline-none resize-none leading-relaxed" rows={2} />
                                        {q.type === 'MCQ' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">{q.options?.map((o, oi) => (<div key={oi} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${q.correctAnswer === o ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-black/30 border-white/5'}`}><input value={o} onChange={e => { const n = [...q.options!]; n[oi] = e.target.value; setGeneratedQuestions(prev => prev.map(x => x.id === q.id ? { ...x, options: n, correctAnswer: x.correctAnswer === o ? e.target.value : x.correctAnswer } : x)) }} className="flex-1 bg-transparent border-none text-xs font-bold text-white text-right outline-none" /><button onClick={() => setGeneratedQuestions(prev => prev.map(x => x.id === q.id ? { ...x, correctAnswer: o } : x))} className={`w-8 h-8 rounded-lg text-[10px] font-black ${q.correctAnswer === o ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'}`}>{oi + 1}</button></div>))}</div>}
                                        {q.type === 'TF' && <div className="flex justify-end gap-4 mt-6">{['صح', 'خطأ'].map(a => (<button key={a} onClick={() => setGeneratedQuestions(prev => prev.map(x => x.id === q.id ? { ...x, correctAnswer: a } : x))} className={`px-10 py-3 rounded-xl text-xs font-black border transition-all ${q.correctAnswer === a ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500 border-white/5'}`}>{a}</button>))}</div>}
                                        {q.type === 'essay' && <div className="space-y-2 mt-6">{q.essayChoices?.map((c, ci) => (<input key={ci} value={c} onChange={e => { const n = [...q.essayChoices!]; n[ci] = e.target.value; setGeneratedQuestions(prev => prev.map(x => x.id === q.id ? { ...x, essayChoices: n } : x)) }} className="w-full bg-black/20 border border-white/5 py-3 px-5 rounded-xl text-[10px] font-bold text-gray-400 text-right outline-none focus:border-emerald-500/40" />))}</div>}
                                    </div>
                                ))}
                            </div>

                            <button onClick={handlePublish} className="w-full max-w-xl mx-auto py-6 bg-emerald-500 text-black font-black text-xl rounded-[2.5rem] shadow-emerald-500/20 shadow-2xl flex items-center justify-center gap-3"><CheckCircle size={24} /><span>نشر وحفظ الامتحان النهائي</span></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
