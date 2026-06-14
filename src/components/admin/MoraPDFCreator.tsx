import React, { useState, useRef, useEffect } from 'react';
import {
    FileUp, Sparkles, Settings, CheckCircle2, AlertCircle,
    Trash2, Edit3, Plus, Save, Download, Globe, X,
    FileText, HelpCircle, CheckSquare, Brain, Send,
    RefreshCw, ChevronRight, ChevronLeft, Upload, Layout
} from 'lucide-react';
import { DB } from '../../services/db';
import { Question, Exam } from '../../types';

// PDF.js CDN URL
const PDFJS_VERSION = '3.11.174';
const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;

interface Props {
    isDarkMode: boolean;
    theme: any;
    onClose: () => void;
    onPublish: (exam: Exam) => void;
}

export const MoraPDFCreator: React.FC<Props> = ({ isDarkMode, theme, onClose, onPublish }) => {
    const [lang, setLang] = useState<'ar' | 'en'>(() => (localStorage.getItem('nt_lang') as 'ar' | 'en') || 'ar');
    const [step, setStep] = useState<'upload' | 'config' | 'generating' | 'review'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [config, setConfig] = useState({
        type: 'mixed' as 'mcq' | 'tf' | 'essay' | 'mixed',
        count: 20,
        difficulty: 'mixed' as 'easy' | 'medium' | 'hard' | 'mixed'
    });
    const [pdfText, setPdfText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [examTitle, setExamTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState(localStorage.getItem('nt_gemini_key') || '');
    const [showKeyBtn, setShowKeyBtn] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = {
        ar: {
            title: 'إنشاء امتحان من ملف PDF',
            subtitle: 'مدعوم بالذكاء الاصطناعي لاستخراج الأسئلة من الملفات',
            uploadTitle: 'ارفع ملف PDF الآن',
            uploadSubtitle: 'اسحب الملف هنا أو اضغط للاختيار من جهازك',
            engineReady: 'محرك الذكاء الاصطناعي جاهز',
            examTitle: 'عنوان الامتحان',
            qCount: 'عدد الأسئلة',
            qType: 'نوع الأسئلة',
            difficulty: 'مستوى الصعوبة',
            generateBtn: 'إنشاء الامتحان الآن',
            generating: 'جاري تحليل الملف...',
            generatingSub: 'الذكاء الاصطناعي يقوم الآن باستخراج أهم النقاط وصياغة الأسئلة',
            reviewTitle: 'مراجعة الامتحان المقترح',
            reviewSub: (count: number) => `تم إنشاء ${count} سؤال بناءً على المحتوى`,
            publishBtn: 'نشر الامتحان الآن للطلاب',
            types: { mcq: 'اختيار من متعدد', tf: 'صح أو خطأ', essay: 'أسئلة مقالية', mixed: 'مختلط' },
            levels: { easy: 'سهل', medium: 'متوسط', hard: 'صعب', mixed: 'مختلط' },
            back: 'رجوع',
            addQ: 'إضافة سؤال جديد يدوياً',
            keyRequired: 'مفتاح API مطلوب'
        },
        en: {
            title: 'Create Exam from PDF',
            subtitle: 'AI-powered question extraction from your files',
            uploadTitle: 'Upload PDF Now',
            uploadSubtitle: 'Drag & Drop your file or click to browse',
            engineReady: 'AI Engine Ready',
            examTitle: 'Exam Title',
            qCount: 'Questions Count',
            qType: 'Questions Type',
            difficulty: 'Difficulty Level',
            generateBtn: 'Generate Exam Now',
            generating: 'Analyzing File...',
            generatingSub: 'AI is extracting key points and drafting questions',
            reviewTitle: 'Review Suggested Exam',
            reviewSub: (count: number) => `${count} questions generated based on content`,
            publishBtn: 'Publish Exam to Students',
            types: { mcq: 'Multiple Choice', tf: 'True/False', essay: 'Essay Questions', mixed: 'Mixed' },
            levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' },
            back: 'Back',
            addQ: 'Add New Question Manually',
            keyRequired: 'API Key Required'
        }
    };

    const currentT = t[lang];

    // Load PDF.js
    useEffect(() => {
        if (!(window as any).pdfjsLib) {
            const script = document.createElement('script');
            script.src = PDFJS_URL;
            script.onload = () => {
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
            };
            document.head.appendChild(script);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setExamTitle(selectedFile.name.replace('.pdf', ''));
            setStep('config');
        } else {
            alert(lang === 'ar' ? 'يرجى اختيار ملف PDF فقط' : 'Please select a PDF file only');
        }
    };

    const extractTextFromPDF = async (file: File) => {
        setIsExtracting(true);
        try {
            const pdfjsLib = (window as any).pdfjsLib;
            if (!pdfjsLib) throw new Error('PDF.js not loaded');

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }

            setPdfText(fullText);
            return fullText;
        } catch (err: any) {
            console.error('PDF Extraction Error:', err);
            setError('Failed to extract text from PDF');
            return '';
        } finally {
            setIsExtracting(false);
        }
    };

    const generateExam = async () => {
        if (!apiKey) {
            setShowKeyBtn(true);
            return;
        }

        setStep('generating');
        const text = await extractTextFromPDF(file!);
        if (!text) {
            setStep('config');
            return;
        }

        try {
            const promptContent = `
            Analyze the following text and generate ${config.count} questions for an exam.
            Questions should be in Arabic. Professional pedagogical style.
            Question Type: ${config.type}.
            Level: ${config.difficulty}.
            
            Return ONLY a valid JSON array of objects with this structure:
            [
              {
                "id": "unique_id",
                "text": "question text in Arabic",
                "type": "MCQ" or "TF" or "essay",
                "options": ["opt1", "opt2", "opt3", "opt4"] (only for MCQ),
                "correctAnswer": number (index for MCQ, 0-3) or "صح" or "غلط" (for TF) or "",
                "essayChoices": ["keyword1", "keyword2", "keyword3"] (for essay questions)
              }
            ]
            
            Text content:
            ${text.substring(0, 15000)}
            `;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            let response;
            try {
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptContent }] }] })
                });
            } catch (err) {
                console.warn('Initial fetch failed, trying proxy...');
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                const proxyData = await proxyRes.json();
                response = {
                    ok: true,
                    json: async () => JSON.parse(proxyData.contents)
                } as any;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'AI request failed');
            }

            const data = await response.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!aiText) throw new Error('Empty AI response');

            const jsonMatch = aiText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('No valid questions found in AI response');

            // Robust JSON parse for AI output (removes trailing commas)
            const questions = JSON.parse(jsonMatch[0].replace(/,\s*(?=[\]}])/g, ''));

            const validatedQuestions = questions.map((q: any) => ({
                ...q,
                id: q.id || Math.random().toString(36).substr(2, 9),
                type: q.type?.toUpperCase() === 'MCQ' ? 'MCQ' : q.type?.toUpperCase() === 'TF' ? 'TF' : 'essay',
                correctAnswer: q.type?.toUpperCase() === 'MCQ' ? Number(q.correctAnswer) : q.correctAnswer
            }));

            setGeneratedQuestions(validatedQuestions);
            setStep('review');
        } catch (err: any) {
            console.error('AI Generation Error:', err);
            setError(err.message);
            setStep('config');
        }
    };

    const handlePublish = () => {
        if (!examTitle.trim()) {
            alert(lang === 'ar' ? 'يرجى إدخال عنوان للامتحان' : 'Please enter exam title');
            return;
        }

        const type = generatedQuestions.every(q => q.type === 'MCQ') ? 'MCQ' :
            generatedQuestions.every(q => q.type === 'TF') ? 'TF' :
                generatedQuestions.every(q => q.type === 'essay') ? 'essay' : 'MIXED';

        const newExam: Exam = {
            id: Date.now().toString(),
            title: examTitle,
            type: type as any,
            questions: generatedQuestions,
            date: new Date().toLocaleDateString('ar-EG'),
            isVisible: true,
            stage: 'نظم المعلومات BIS',
            year: 'الفرقة الأولى',
            semester: 'الفصل الدراسي الأول',
            thumbnail: ''
        };

        onPublish(newExam);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[6000] bg-black/90 flex items-center justify-center p-4 overflow-y-auto no-scrollbar"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className="w-full max-w-4xl bg-[#0a1023] rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex gap-4 items-center">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400">
                            <X size={24} />
                        </button>
                        <button
                            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                            className="px-4 py-2 bg-white/5 rounded-xl text-xs font-black text-white hover:bg-white/10 flex items-center gap-2"
                        >
                            <Globe size={14} />
                            {lang === 'ar' ? 'EN' : 'AR'}
                        </button>
                    </div>
                    <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            {lang === 'ar' && <Brain size={28} className="text-cyan-400" />}
                            <span style={{ color: theme.primary }}>Mora PDF</span> {currentT.title}
                            {lang === 'en' && <Brain size={28} className="text-cyan-400" />}
                        </h2>
                        <p className="text-xs text-gray-500 font-bold mt-1">{currentT.subtitle}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-8">

                    {step === 'upload' && (
                        <div className="h-full flex flex-col items-center justify-center space-y-8">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const droppedFile = e.dataTransfer.files[0];
                                    if (droppedFile?.type === 'application/pdf') {
                                        setFile(droppedFile);
                                        setExamTitle(droppedFile.name.replace('.pdf', ''));
                                        setStep('config');
                                    }
                                }}
                                className="w-full max-w-md aspect-square rounded-[3rem] border-4 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <Upload size={40} />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-black text-white">{currentT.uploadTitle}</h3>
                                    <p className="text-sm text-gray-500 font-bold px-8">{currentT.uploadSubtitle}</p>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                            </div>
                            <div className="flex items-center gap-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                <div className="h-px w-12 bg-white/10" />
                                <span>{currentT.engineReady}</span>
                                <div className="h-px w-12 bg-white/10" />
                            </div>
                        </div>
                    )}

                    {step === 'config' && (
                        <div className="space-y-10">
                            <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center justify-between">
                                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                                    <h4 className="font-black text-white">{file?.name}</h4>
                                    <p className="text-[10px] text-gray-500">{(file!.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                                </div>
                                <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400 shadow-lg shadow-cyan-500/10">
                                    <FileText size={24} />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">{currentT.examTitle}</label>
                                        <input
                                            type="text"
                                            value={examTitle}
                                            onChange={e => setExamTitle(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-cyan-500/50 transition-all font-bold text-white shadow-inner"
                                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">{currentT.qCount}</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[10, 20, 30, 50, 100].map(count => (
                                                <button
                                                    key={count}
                                                    onClick={() => setConfig({ ...config, count })}
                                                    className={`flex-1 min-w-[50px] py-4 rounded-2xl font-black text-sm transition-all border ${config.count === count ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                                                >
                                                    {count}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">{currentT.qType}</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(Object.keys(currentT.types) as Array<keyof typeof currentT.types>).map(typeKey => (
                                                <button
                                                    key={typeKey}
                                                    onClick={() => setConfig({ ...config, type: typeKey as any })}
                                                    className={`py-4 rounded-2xl font-bold text-xs transition-all border ${config.type === typeKey ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                                                >
                                                    {currentT.types[typeKey]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">{currentT.difficulty}</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(Object.keys(currentT.levels) as Array<keyof typeof currentT.levels>).map(levelKey => (
                                                <button
                                                    key={levelKey}
                                                    onClick={() => setConfig({ ...config, difficulty: levelKey as any })}
                                                    className={`py-4 rounded-2xl font-bold text-xs transition-all border ${config.difficulty === levelKey ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                                                >
                                                    {currentT.levels[levelKey]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {showKeyBtn && (
                                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-4">
                                    <div className="flex items-center gap-3 text-amber-500 font-bold">
                                        <AlertCircle size={20} />
                                        <span>{currentT.keyRequired}</span>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Gemini API Key..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none text-white text-xs"
                                        value={apiKey}
                                        onChange={e => {
                                            setApiKey(e.target.value);
                                            localStorage.setItem('nt_gemini_key', e.target.value);
                                        }}
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-black flex items-center justify-center gap-3">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="pt-6 border-t border-white/5 flex gap-4">
                                <button
                                    onClick={() => setStep('upload')}
                                    className="flex-1 py-5 rounded-[2rem] font-black text-gray-400 bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
                                    {currentT.back}
                                </button>
                                <button
                                    onClick={generateExam}
                                    className="flex-[2] py-5 rounded-[2rem] font-black text-black flex items-center justify-center gap-3 shadow-xl"
                                    style={{ backgroundColor: theme.primary }}
                                >
                                    <Sparkles size={20} />
                                    <span>{currentT.generateBtn}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="h-full flex flex-col items-center justify-center space-y-10 py-20">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-cyan-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain size={48} className="text-cyan-400" />
                                </div>
                            </div>
                            <div className="text-center space-y-4">
                                <h3 className="text-3xl font-black text-white">{currentT.generating}</h3>
                                <p className="text-gray-400 font-bold">{currentT.generatingSub}</p>
                            </div>
                            <div className="w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    style={{ width: '100%' }}
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-[15000ms]"
                                />
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="space-y-8">
                            <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <button onClick={() => setStep('config')} className="px-6 py-3 bg-white/5 rounded-2xl text-gray-400 font-bold text-xs hover:bg-white/10 transition-all border border-white/5">
                                        {currentT.back}
                                    </button>
                                    <button onClick={generateExam} className="px-6 py-3 bg-cyan-500/10 rounded-2xl text-cyan-400 font-bold text-xs hover:bg-cyan-500/20 transition-all border border-cyan-500/20 flex items-center gap-2">
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                                <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                                    <h4 className="font-black text-white">{currentT.reviewTitle}</h4>
                                    <p className="text-[10px] text-gray-500">{currentT.reviewSub(generatedQuestions.length)}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {generatedQuestions.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6 relative"
                                    >
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <button
                                                onClick={() => setGeneratedQuestions(prev => prev.filter(item => item.id !== q.id))}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">{q.type}</span>
                                                <span className="text-lg font-black text-white/40 tabular-nums">#{idx + 1}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <textarea
                                                value={q.text}
                                                onChange={e => {
                                                    const newQs = [...generatedQuestions];
                                                    newQs[idx].text = e.target.value;
                                                    setGeneratedQuestions(newQs);
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-cyan-500/50 transition-all font-bold text-white shadow-inner resize-none min-h-[80px]"
                                                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                            />
                                        </div>

                                        {q.type === 'MCQ' && q.options && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => {
                                                                const newQs = [...generatedQuestions];
                                                                newQs[idx].correctAnswer = optIdx;
                                                                setGeneratedQuestions(newQs);
                                                            }}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${q.correctAnswer === optIdx ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                                        >
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={e => {
                                                                const newQs = [...generatedQuestions];
                                                                newQs[idx].options![optIdx] = e.target.value;
                                                                setGeneratedQuestions(newQs);
                                                            }}
                                                            className="flex-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none text-xs font-bold transition-all"
                                                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'TF' && (
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => {
                                                        const newQs = [...generatedQuestions];
                                                        newQs[idx].correctAnswer = 'صح';
                                                        setGeneratedQuestions(newQs);
                                                    }}
                                                    className={`flex-1 py-4 rounded-2xl font-black text-sm border transition-all ${q.correctAnswer === 'صح' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                                >
                                                    صح
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newQs = [...generatedQuestions];
                                                        newQs[idx].correctAnswer = 'غلط';
                                                        setGeneratedQuestions(newQs);
                                                    }}
                                                    className={`flex-1 py-4 rounded-2xl font-black text-sm border transition-all ${q.correctAnswer === 'غلط' ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                                >
                                                    غلط
                                                </button>
                                            </div>
                                        )}

                                        {q.type === 'essay' && q.essayChoices && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {q.essayChoices.map((choice, cIdx) => (
                                                    <input
                                                        key={cIdx}
                                                        type="text"
                                                        value={choice}
                                                        onChange={e => {
                                                            const newQs = [...generatedQuestions];
                                                            newQs[idx].essayChoices![cIdx] = e.target.value;
                                                            setGeneratedQuestions(newQs);
                                                        }}
                                                        className="bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none text-xs font-bold transition-all"
                                                        placeholder={`Keyword ${cIdx + 1}`}
                                                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={() => {
                                        const newQ: Question = {
                                            id: Date.now().toString(),
                                            text: 'سؤال جديد...',
                                            type: 'MCQ',
                                            options: ['', '', '', ''],
                                            correctAnswer: 0
                                        };
                                        setGeneratedQuestions([...generatedQuestions, newQ]);
                                    }}
                                    className="w-full py-6 rounded-[2.5rem] border-4 border-dashed border-white/5 text-gray-500 font-black flex items-center justify-center gap-3 hover:bg-white/[0.02] hover:border-cyan-500/20 hover:text-cyan-400 transition-all"
                                >
                                    <Plus size={20} />
                                    <span>{currentT.addQ}</span>
                                </button>
                            </div>

                            <div className="pt-10 border-t border-white/5">
                                <button
                                    onClick={handlePublish}
                                    className="w-full py-6 rounded-[3rem] font-black text-black text-xl shadow-2xl flex items-center justify-center gap-4 group"
                                    style={{ backgroundColor: theme.primary }}
                                >
                                    <Send size={24} className="group-hover:translate-x-1 transition-transform" />
                                    <span>{currentT.publishBtn}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
