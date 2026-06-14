import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Eye, EyeOff, CheckSquare,
    Save, ListOrdered, Activity, Trash
} from 'lucide-react';
import { DB } from '../../services/db';
import { GameExam, Question } from '../../types';

export const GameExamManagement: React.FC<{ theme?: any }> = ({ theme }) => {
    const [exams, setExams] = useState<GameExam[]>([]);

    const [filter, setFilter] = useState({
        stage: 'اعمال دوليه IB',
        year: 'الفرقة الأولى',
        semester: 'الفصل الدراسي الأول',
        subject: 'تاريخ'
    });

    const [form, setForm] = useState({
        id: '',
        title: '',
        type: 'MCQ' as 'MCQ' | 'TF',
        subject: 'تاريخ',
        questions: [] as Question[]
    });
    const [isEditing, setIsEditing] = useState(false);

    const prepYears = [];
    const secondaryYears = [];
    const yearsOptions = filter.stage === 'اعمال دوليه IB' ? prepYears : secondaryYears;

    useEffect(() => {
        const load = () => {
            const data = DB.getGameExams();
            setExams(data);
        };
        load();
        window.addEventListener('nt-game-exams-change', load);
        return () => window.removeEventListener('nt-game-exams-change', load);
    }, []);

    const filteredExams = exams.filter(e => {
        const cStage = e.stage || '';
        const fStage = filter.stage || '';
        const cYear = e.year || '';
        const fYear = filter.year || '';
        const cSem = e.semester || '';
        const fSem = filter.semester || '';

        const matchStage = fStage === 'الكل' || cStage === fStage;
        const matchYear = fYear === 'الكل' || cYear === fYear;
        const matchSemester = fSem === 'الكل' || cSem === fSem;

        return matchStage && matchYear && matchSemester;
    });

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            type: form.type,
            options: form.type === 'MCQ' ? ['', '', '', ''] : undefined,
            correctAnswer: form.type === 'MCQ' ? 0 : 'صح'
        };
        setForm({ ...form, questions: [...form.questions, newQuestion] });
    };

    const handleSave = () => {
        if (!form.title.trim()) return alert('عنوان الامتحان إجباري');
        if (form.questions.length === 0) return alert('يرجى إضافة سؤال واحد على الأقل');

        const isQuestionsValid = form.questions.every(q => {
            if (!q.text.trim()) return false;
            if (form.type === 'MCQ') {
                return q.options?.every(opt => opt.trim() !== '');
            }
            return true;
        });

        if (!isQuestionsValid) {
            return alert('يرجى التأكد من كتابة نص الأسئلة وجميع الخيارات المتاحة');
        }

        if (isEditing) {
            DB.updateGameExam(form.id, {
                title: form.title,
                type: form.type,
                subject: form.subject,
                questions: form.questions
            });
        } else {
            const newExam: GameExam = {
                ...form,
                id: Date.now().toString(),
                stage: filter.stage,
                year: filter.year,
                semester: filter.semester,
                date: new Date().toLocaleDateString('ar-EG'),
                isVisible: true
            };
            DB.addGameExam(newExam);
        }

        setExams(DB.getGameExams());
        setForm({ id: '', title: '', type: 'MCQ', subject: filter.stage === 'نظم المعلومات BIS' ? 'تاريخ' : 'تاريخ', questions: [] });
        setIsEditing(false);
        alert('تم حفظ الامتحان بنجاح');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف الامتحان؟')) {
            DB.deleteGameExam(id);
            setExams(DB.getGameExams());
        }
    };

    const handleToggleVisibility = (id: string, current: boolean) => {
        DB.updateGameExam(id, { isVisible: !current });
        setExams(DB.getGameExams());
    };

    const handleEdit = (exam: GameExam) => {
        setForm({
            id: exam.id,
            title: exam.title,
            type: exam.type || 'MCQ',
            subject: exam.subject || 'تاريخ',
            questions: exam.questions
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Activity className="w-8 h-8" style={{ color: theme?.primary || '#3b82f6' }} />
                        <span style={{ color: theme?.primary || '#3b82f6' }}>إدارة امتحان ألعاب</span>
                    </h2>
                    <p className="text-gray-400 mt-2 font-bold text-sm bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                        امتحانات تفاعلية بميزة النقاط السريعة ومخصصة للمواد
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-wrap gap-4 items-center justify-start xl:justify-end">
                <select
                    value={filter.semester}
                    onChange={e => setFilter({ ...filter, semester: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm outline-none focus:border-cyan-500/50"
                >
                    <option value="الكل">الكل (جميع الفصول)</option>
                    <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                </select>

                <select
                    value={filter.year}
                    onChange={e => setFilter({ ...filter, year: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm outline-none focus:border-cyan-500/50"
                >
                    <option value="الكل">الكل (جميع السنين)</option>
                    {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select
                    value={filter.stage}
                    onChange={e => {
                        const newStage = e.target.value;
                        setFilter({
                            stage: newStage,
                            year: 'الفرقة الأولى',
                            semester: filter.semester,
                            subject: filter.subject
                        });
                        setForm(prev => ({ ...prev, subject: prev.subject }));
                    }}
                    className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm outline-none focus:border-cyan-500/50"
                >
                    <option value="الكل">الكل (جميع المراحل)</option>
                                                        </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* List (Left) */}
                <div className="order-2 lg:order-1 space-y-4">
                    <h3 className="text-xl font-bold text-right mb-4 flex items-center justify-start gap-2 text-cyan-400" style={{ color: theme?.primary }}>
                        <ListOrdered size={20} />
                        <span>امتحانات الألعاب المتاحة ({filteredExams.length})</span>
                    </h3>
                    <div className="grid gap-4 max-h-[80vh] overflow-y-auto no-scrollbar pb-10">
                        {filteredExams.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <p className="text-gray-500">لا توجد امتحانات مقترنة حالياً</p>
                            </div>
                        ) : (
                            filteredExams.map(exam => (
                                <div
                                    key={exam.id}
                                    className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4 group hover:bg-white/10 transition-all shadow-xl"
                                    style={{ borderRight: `4px solid ${theme?.primary || '#3b82f6'}` }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="text-right flex-1">
                                            <h4 className="font-black text-lg text-white group-hover:text-cyan-400 transition-colors" style={{ color: theme?.primary }}>{exam.title}</h4>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 mt-2">
                                                <span className="bg-black/30 text-white px-2 py-0.5 rounded-md border border-white/10">{exam.subject}</span>
                                                <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-500/20">{exam.type === 'MCQ' ? 'اختياري' : 'صح وغلط'}</span>
                                                <span>{exam.questions.length} أسئلة</span>
                                                <span>{new Date(exam.date).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mr-4">
                                            <button onClick={() => handleEdit(exam)} className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(exam.id)} className="p-2.5 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition-all"><Trash2 size={16} /></button>
                                            <button onClick={() => handleToggleVisibility(exam.id, exam.isVisible)} className={`p-2.5 rounded-xl transition-all ${exam.isVisible ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'}`}>
                                                {exam.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-bold text-right ${exam.isVisible ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {exam.isVisible ? 'ظاهر للطلاب حالياً' : 'مخفي عن الطلاب'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Form (Right) */}
                <div className="order-1 lg:order-2 space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full opacity-20 pointer-events-none" style={{ backgroundColor: theme?.primary || '#3b82f6' }} />

                    <h3 className="text-lg font-bold text-right mb-4 text-white flex items-center justify-start gap-2">
                        <CheckSquare size={20} style={{ color: theme?.primary || '#3b82f6' }} />
                        <span>{isEditing ? 'تعديل امتحان اللعبة' : 'إنشاء امتحان ألعاب جديد'}</span>
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-1 text-right">
                            <label className="text-[10px] text-gray-400 font-bold">تحديد المادة</label>
                            <select
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-right outline-none focus:border-blue-500 transition-all font-bold text-sm text-white"
                            >
                                {filter.stage === 'اعمال دوليه IB' ? (
                                    <>
                                        <option value="تاريخ" className="bg-slate-900">تاريخ</option>
                                        <option value="جغرافيا" className="bg-slate-900">جغرافيا</option>
                                    </>
                                ) : (
                                    <option value="تاريخ" className="bg-slate-900">تاريخ</option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-1 text-right">
                            <label className="text-[10px] text-gray-400 font-bold">الوصف أو عنوان الامتحان</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-right outline-none transition-all font-bold text-sm text-white focus:ring-1 focus:ring-blue-500"
                                placeholder="مثال: تحدي حرب أكتوبر..."
                            />
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="text-[10px] text-gray-400 font-bold">اختر نوع أسئلة الامتحان</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setForm({ ...form, type: 'TF', questions: [] })}
                                    className={`py-3 rounded-xl font-bold border transition-all text-sm ${form.type === 'TF' ? 'bg-cyan-500 text-black border-cyan-500 shadow-lg' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                    style={form.type === 'TF' ? { backgroundColor: theme?.primary, borderColor: theme?.primary } : {}}
                                >
                                    نظام صح / غلط
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, type: 'MCQ', questions: [] })}
                                    className={`py-3 rounded-xl font-bold border transition-all text-sm ${form.type === 'MCQ' ? 'bg-cyan-500 text-black border-cyan-500 shadow-lg' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                    style={form.type === 'MCQ' ? { backgroundColor: theme?.primary, borderColor: theme?.primary } : {}}
                                >
                                    نظام اختيار من متعدد
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-white/5">
                                <button
                                    onClick={handleAddQuestion}
                                    className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all border border-white/10 flex items-center gap-2"
                                    style={{ color: theme?.primary }}
                                >
                                    <Plus size={18} />
                                    <span className="text-sm font-bold">إضافة سؤال جديد</span>
                                </button>
                                <label className="text-sm text-gray-400 font-bold">الأسئلة الحالية: <span className="text-white bg-white/10 px-2 py-0.5 rounded-lg">{form.questions.length}</span></label>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pl-2 custom-scrollbar">
                                {form.questions.map((q, idx) => (
                                    <div key={q.id} className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4 relative group">
                                        <button
                                            onClick={() => setForm({ ...form, questions: form.questions.filter(qu => qu.id !== q.id) })}
                                            className="absolute top-4 left-4 text-red-500 hover:bg-red-500/20 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all bg-black/50"
                                        >
                                            <Trash size={16} />
                                        </button>
                                        <div className="space-y-2 text-right">
                                            <label className="text-[11px] text-gray-400 font-black">السؤال رقم {idx + 1}</label>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={e => {
                                                    const newQs = [...form.questions];
                                                    newQs[idx].text = e.target.value;
                                                    setForm({ ...form, questions: newQs });
                                                }}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-right outline-none text-sm text-white"
                                                placeholder="اكتب نص السؤال بدقة..."
                                            />
                                        </div>

                                        {form.type === 'MCQ' ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {q.options?.map((opt, optIdx) => (
                                                    <div key={optIdx} className="space-y-1 text-right">
                                                        <div className="flex items-center justify-end gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={e => {
                                                                    const newQs = [...form.questions];
                                                                    if (newQs[idx].options) {
                                                                        newQs[idx].options![optIdx] = e.target.value;
                                                                        setForm({ ...form, questions: newQs });
                                                                    }
                                                                }}
                                                                className="w-full bg-transparent border-none py-1 px-2 text-right text-xs outline-none text-white font-bold"
                                                                placeholder={`خيار ${optIdx + 1}`}
                                                            />
                                                            <input
                                                                type="radio"
                                                                name={`correct-${q.id}`}
                                                                checked={q.correctAnswer === optIdx}
                                                                onChange={() => {
                                                                    const newQs = [...form.questions];
                                                                    newQs[idx].correctAnswer = optIdx;
                                                                    setForm({ ...form, questions: newQs });
                                                                }}
                                                                className="w-5 h-5 cursor-pointer accent-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-10 pt-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <label className="flex items-center gap-2 cursor-pointer group p-2 hover:bg-white/5 rounded-lg transition-all">
                                                    <span className={`text-sm font-black transition-colors ${q.correctAnswer === 'غلط' ? 'text-red-500' : 'text-gray-500'}`}>غلط</span>
                                                    <input
                                                        type="radio"
                                                        name={`correct-${q.id}`}
                                                        checked={q.correctAnswer === 'غلط'}
                                                        onChange={() => {
                                                            const newQs = [...form.questions];
                                                            newQs[idx].correctAnswer = 'غلط';
                                                            setForm({ ...form, questions: newQs });
                                                        }}
                                                        className="w-5 h-5 accent-red-500 cursor-pointer"
                                                    />
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group p-2 hover:bg-white/5 rounded-lg transition-all">
                                                    <span className={`text-sm font-black transition-colors ${q.correctAnswer === 'صح' ? 'text-emerald-500' : 'text-gray-500'}`}>صح</span>
                                                    <input
                                                        type="radio"
                                                        name={`correct-${q.id}`}
                                                        checked={q.correctAnswer === 'صح'}
                                                        onChange={() => {
                                                            const newQs = [...form.questions];
                                                            newQs[idx].correctAnswer = 'صح';
                                                            setForm({ ...form, questions: newQs });
                                                        }}
                                                        className="w-5 h-5 accent-emerald-500 cursor-pointer"
                                                    />
                                                </label>
                                                <div className="text-[10px] text-gray-500 font-bold bg-black/40 px-3 py-1.5 rounded-lg">الجواب الصح</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full py-4 rounded-2xl font-black text-black transition-all flex items-center justify-center gap-2 shadow-xl"
                            style={{
                                backgroundColor: theme.primary,
                                boxShadow: `0 4px 20px ${theme.primary}40`
                            }}
                        >
                            <span className="text-base">{isEditing ? 'تحديث اللعبة' : 'نشر اللعبة للطلاب'}</span>
                            <Save size={20} />
                        </button>

                        {isEditing && (
                            <button
                                onClick={() => {
                                    setForm({ id: '', title: '', type: 'MCQ', subject: 'تاريخ', questions: [] });
                                    setIsEditing(false);
                                }}
                                className="w-full py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/5"
                            >
                                إلغاء التعديل
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
