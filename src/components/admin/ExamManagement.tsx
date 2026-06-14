
import React, { useState } from 'react';
import {
    Plus, Edit, Trash2, Eye, EyeOff, CheckSquare,
    Lock, Unlock, Save, FileUp, Calendar, ListOrdered, Type, Trash, Brain, X, Sparkles
} from 'lucide-react';
import { DB } from '../../services/db';
import { Exam, Question } from '../../types';

interface Props {
    isDarkMode: boolean;
    theme: any;
    examList: Exam[];
    setExamList: (list: Exam[]) => void;
}

export const ExamManagement: React.FC<Props> = ({ isDarkMode, theme, examList, setExamList }) => {
    const [filter, setFilter] = useState(() => {
        try {
            const conf = localStorage.getItem('nt_admin_config');
            if (conf) {
                const parsed = JSON.parse(conf);
                return { 
                    stage: parsed.stage, 
                    year: parsed.year, 
                    specialization: parsed.specialization === 'الكل' ? '' : parsed.specialization, 
                    semester: 'الفصل الدراسي الأول' 
                };
            }
        } catch {}
        return {
            stage: 'اعمال دوليه IB', year: 'الفرقة الأولى', specialization: '',
            semester: 'الفصل الدراسي الأول'
        };
    });

    const [form, setForm] = useState({
        id: '',
        title: '',
        type: 'MCQ' as 'MCQ' | 'TF' | 'essay',
        questions: [] as Question[],
        thumbnail: ''
    });
    const [isEditing, setIsEditing] = useState(false);


    const stages = ['اعمال دوليه IB', 'نظم المعلومات BIS'];
    const years = ['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'];
    const semesters = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني'];


    
    
    

    const filteredExams = examList.filter(e => {
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

    const handleToggleLock = () => {
        const currentState = DB.isSemesterLocked(filter.stage, filter.year, filter.specialization);
        DB.setSemesterStatus(filter.stage, filter.year, filter.specialization, !currentState);
        alert(`تم ${!currentState ? 'قفل' : 'فتح'} التسجيل بنجاح`);
    };

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            type: form.type,
            options: form.type === 'MCQ' ? ['', '', '', ''] : undefined,
            correctAnswer: form.type === 'MCQ' ? 0 : form.type === 'TF' ? 'صح' : '',
            essayChoices: form.type === 'essay' ? ['', '', ''] : undefined
        };
        setForm({ ...form, questions: [...form.questions, newQuestion] });
    };

    const handleSave = () => {
        if (!form.title.trim()) return alert('عنوان الامتحان إجباري');
        if (form.questions.length === 0) return alert('يرجى إضافة سؤال واحد على الأقل');

        const type = form.questions.length > 0 && form.questions.every(q => q.type === 'TF') ? 'TF' :
            form.questions.length > 0 && form.questions.every(q => q.type === 'MCQ') ? 'MCQ' :
                form.questions.length > 0 && form.questions.every(q => q.type === 'essay') ? 'essay' : 'MIXED';

        const isQuestionsValid = form.questions.every(q => {
            if (!q.text.trim()) return false;
            if (q.options !== undefined && q.type === 'MCQ') {
                return q.options.every(opt => opt.trim() !== '');
            }
            if (q.essayChoices !== undefined && q.type === 'essay') {
                return q.essayChoices.every(opt => opt.trim() !== '');
            }
            return true;
        });

        if (!isQuestionsValid) {
            return alert('يرجى التأكد من كتابة نص الأسئلة وجميع الخيارات المتاحة');
        }

        if (isEditing) {
            DB.updateExam(form.id, {
                title: form.title,
                type: type as any,
                questions: form.questions,
                thumbnail: form.thumbnail
            });
        } else {
            const newExam: Exam = {
                ...form,
                id: Date.now().toString(),
                stage: filter.stage,
                year: filter.year,
                specialization: filter.specialization || '',
                semester: filter.semester,
                type: type as any,
                date: new Date().toLocaleDateString('ar-EG'),
                isVisible: true,
                thumbnail: form.thumbnail
            };
            DB.addExam(newExam);
            // Automatic Notification
            DB.addNotification({
                id: Date.now().toString(),
                title: 'امتحان جديد متاح ✍️',
                message: `تمت إضافة امتحان جديد: "${newExam.title}" لطلاب ${newExam.year}.`,
                date: new Date().toLocaleDateString('ar-EG'),
                target: 'year',
                stage: newExam.stage,
                year: newExam.year
            });
        }

        setExamList(DB.getExams());
        setForm({ id: '', title: '', type: 'MCQ', questions: [], thumbnail: '' });
        setIsEditing(false);
        alert('تم حفظ الامتحان بنجاح');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف الامتحان؟')) {
            DB.deleteExam(id);
            setExamList(DB.getExams());
        }
    };

    const handleToggleVisibility = (id: string, current: boolean) => {
        DB.updateExam(id, { isVisible: !current });
        setExamList(DB.getExams());
    };

    const handleEdit = (exam: Exam) => {
        setForm({
            id: exam.id,
            title: exam.title,
            type: exam.type as any,
            questions: exam.questions,
            thumbnail: exam.thumbnail || ''
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                        <span className="text-sm font-black text-gray-500">تحرير الاختبارات</span>
                    </div>
                </div>
                <h2 className="text-3xl font-black text-white text-right">إدارة الامتحانات والتقييم</h2>
            </div>

            {/* Filters & Locks */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex flex-wrap gap-4 items-center justify-end">
                {/* Semester Lock — Main Admin Only */}
                {!localStorage.getItem('nt_admin_config') && (
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl">
                    <button
                        onClick={handleToggleLock}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${DB.isSemesterLocked(filter.stage, filter.year, filter.specialization) ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                    >
                        {DB.isSemesterLocked(filter.stage, filter.year, filter.specialization) ? <Lock size={16} /> : <Unlock size={16} />}
                        <span className="text-xs font-bold">{DB.isSemesterLocked(filter.stage, filter.year, filter.specialization) ? 'فتح الفصل' : 'قفل الفصل'}</span>
                    </button>
                    <div className="text-xs text-gray-500 mr-2">حالة التسجيل</div>
                </div>
                )}

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
                    disabled={!!localStorage.getItem('nt_admin_config')}
                    onChange={e => setFilter({ ...filter, year: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm outline-none focus:border-cyan-500/50 disabled:opacity-50"
                >
                    <option value="الكل">الكل (جميع السنين)</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select
                    value={filter.stage}
                    disabled={!!localStorage.getItem('nt_admin_config')}
                    onChange={e => {
                        const newStage = e.target.value;
                        setFilter({
                            stage: newStage,
                            year: newStage === 'الكل' ? 'الكل' : 'الفرقة الأولى',
                            semester: filter.semester,
                            specialization: filter.specialization || ''
                        });
                    }}
                    className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right text-sm outline-none focus:border-cyan-500/50 disabled:opacity-50"
                >
                    <option value="الكل">الكل (جميع المراحل)</option>
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* List (Left) */}
                <div className="order-2 lg:order-1 space-y-4">
                    <h3 className="text-xl font-bold text-right mb-4 flex items-center justify-end gap-2 text-cyan-400">
                        <span>الامتحانات المتاحة</span>
                        <ListOrdered size={20} />
                    </h3>
                    <div className="grid gap-4 max-h-[80vh] overflow-y-auto no-scrollbar pb-10">
                        {filteredExams.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <p className="text-gray-500">لا توجد امتحانات حالياً</p>
                            </div>
                        ) : (
                            filteredExams.map(exam => (
                                <div
                                    key={exam.id}
                                    className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4 group hover:bg-white/10 transition-all shadow-xl"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(exam)} className="p-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(exam.id)} className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition-all"><Trash2 size={16} /></button>
                                            <button onClick={() => handleToggleVisibility(exam.id, exam.isVisible)} className={`p-2 rounded-xl transition-all ${exam.isVisible ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'}`}>
                                                {exam.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <h4 className="font-black text-lg text-white group-hover:text-cyan-400 transition-colors">{exam.title}</h4>
                                                <div className="flex items-center justify-end gap-3 text-[10px] text-gray-400 mt-1">
                                                    <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-500/20">{exam.type}</span>
                                                    <span>{exam.questions.length} سؤال</span>
                                                    <span>{exam.date}</span>
                                                </div>
                                            </div>
                                            {exam.thumbnail && (
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10 shrink-0">
                                                    <img src={exam.thumbnail} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-bold text-left ${exam.isVisible ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {exam.isVisible ? 'ظاهر للطلاب' : 'مخفي عن الطلاب'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Form (Right) */}
                <div className="order-1 lg:order-2 space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-[40px] rounded-full" />

                    <h3 className="text-lg font-bold text-right mb-4 text-white flex items-center justify-end gap-2">
                        <span>{isEditing ? 'تعديل الامتحان' : 'إنشاء امتحان جديد'}</span>
                        <CheckSquare size={20} className="text-cyan-400" />
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-1 text-right">
                            <label className="text-[10px] text-gray-400 font-bold">عنوان الامتحان</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                placeholder="عنوان الامتحان..."
                            />
                        </div>



                        <div className="space-y-4 text-right">
                            <label className="text-[10px] text-gray-400 font-bold">نوع الأسئلة المضافة حالياً</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setForm({ ...form, type: 'TF' })}
                                    className={`py-3 rounded-xl font-bold border transition-all text-xs ${form.type === 'TF' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                >
                                    صح / غلط
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, type: 'MCQ' })}
                                    className={`py-3 rounded-xl font-bold border transition-all text-xs ${form.type === 'MCQ' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                >
                                    اختياري (MCQ)
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, type: 'essay' })}
                                    className={`py-3 rounded-xl font-bold border transition-all text-xs ${form.type === 'essay' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                >
                                    مقال (Essay)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddQuestion}
                                        className="bg-white/5 hover:bg-white/10 text-cyan-400 p-2 rounded-xl transition-all border border-white/10"
                                        title="إضافة سؤال يدوي"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <label className="text-sm text-gray-400 font-bold">الأسئلة</label>
                            </div>


                            <div className="space-y-6 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
                                {form.questions.map((q, idx) => (
                                    <div key={q.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 relative">
                                        <button
                                            onClick={() => setForm({ ...form, questions: form.questions.filter(qu => qu.id !== q.id) })}
                                            className="absolute top-3 left-3 text-red-500 hover:bg-red-500/10 p-1 rounded-lg"
                                        >
                                            <Trash size={12} />
                                        </button>
                                        <div className="space-y-2 text-right">
                                            <label className="text-[10px] text-gray-500 font-black">السؤال رقم {idx + 1}</label>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={e => {
                                                    const newQs = [...form.questions];
                                                    newQs[idx].text = e.target.value;
                                                    setForm({ ...form, questions: newQs });
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-right outline-none text-sm"
                                                placeholder="اكتب نص السؤال..."
                                            />
                                        </div>

                                        {q.type === 'essay' ? (
                                            <div className="space-y-4">
                                                <div className="text-[10px] text-emerald-400 font-bold text-right">:اكتب 3 نماذج للإجابة المقبولة</div>
                                                <div className="space-y-2">
                                                    {q.essayChoices?.map((opt, optIdx) => (
                                                        <div key={optIdx} className="space-y-1 text-right">
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={e => {
                                                                    const newQs = [...form.questions];
                                                                    if (newQs[idx].essayChoices) {
                                                                        newQs[idx].essayChoices![optIdx] = e.target.value;
                                                                        setForm({ ...form, questions: newQs });
                                                                    }
                                                                }}
                                                                className="w-full bg-black/20 border border-emerald-500/10 rounded-lg py-2 px-3 text-right text-xs outline-none focus:border-emerald-500/30"
                                                                placeholder={`نموذج إجابة ${optIdx + 1}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : q.options !== undefined ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {q.options?.map((opt, optIdx) => (
                                                    <div key={optIdx} className="space-y-1 text-right">
                                                        <div className="flex items-center justify-end gap-2">
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
                                                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-right text-xs outline-none"
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
                                                                className="w-4 h-4 accent-cyan-500"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-6 pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <span className={`text-xs font-bold transition-colors ${q.correctAnswer === 'غلط' ? 'text-red-400' : 'text-gray-500'}`}>غلط</span>
                                                    <input
                                                        type="radio"
                                                        name={`correct-${q.id}`}
                                                        checked={q.correctAnswer === 'غلط'}
                                                        onChange={() => {
                                                            const newQs = [...form.questions];
                                                            newQs[idx].correctAnswer = 'غلط';
                                                            setForm({ ...form, questions: newQs });
                                                        }}
                                                        className="w-4 h-4 accent-red-500"
                                                    />
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <span className={`text-xs font-bold transition-colors ${q.correctAnswer === 'صح' ? 'text-emerald-400' : 'text-gray-500'}`}>صح</span>
                                                    <input
                                                        type="radio"
                                                        name={`correct-${q.id}`}
                                                        checked={q.correctAnswer === 'صح'}
                                                        onChange={() => {
                                                            const newQs = [...form.questions];
                                                            newQs[idx].correctAnswer = 'صح';
                                                            setForm({ ...form, questions: newQs });
                                                        }}
                                                        className="w-4 h-4 accent-emerald-500"
                                                    />
                                                </label>
                                                <div className="text-[10px] text-gray-500 font-bold">:الإجابة الصحيحة</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full py-4 rounded-xl font-black text-black transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                            style={{
                                backgroundColor: theme.primary,
                                boxShadow: `0 4px 15px ${theme.primary}30`
                            }}
                        >
                            <span className="text-sm">{isEditing ? 'حفظ التغييرات' : 'نشر الامتحان الآن'}</span>
                            <Save size={16} />
                        </button>

                        {isEditing && (
                            <button
                                onClick={() => {
                                    setForm({ id: '', title: '', type: 'MCQ', questions: [], thumbnail: '' });
                                    setIsEditing(false);
                                }}
                                className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-all bg-white/5 border border-white/5"
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
