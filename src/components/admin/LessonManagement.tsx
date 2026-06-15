
import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Video,
    Save, FileUp, X, AlertCircle, Coins, Link, Eye, EyeOff, ListOrdered, Image as ImageIcon,
    LayoutGrid, ShieldCheck, ShieldAlert, Zap, Lock, Sparkles
} from 'lucide-react';
import { DB } from '../../services/db';
import { Lesson, VideoItem } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Props {
    isDarkMode: boolean;
    theme: any;
    lessonList: Lesson[];
    setLessonList: (list: Lesson[]) => void;
}

export const LessonManagement: React.FC<Props> = ({ isDarkMode, theme, lessonList, setLessonList }) => {
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

    const [isLessonsEnabled, setIsLessonsEnabled] = useState(() => DB.getSettings().isLessonsEnabled !== false);

    const [form, setForm] = useState<Lesson & { showPremiumLock?: boolean }>({
        id: '',
        title: '',
        description: '',
        category: '',
        allowDownload: false,
        price: 0,
        thumbnail: '',
        videos: [],
        isFree: false,
        discountPercentage: 0,
        stage: '',
        year: '',
        semester: '',
        date: '',
        isVisible: true,
        showPremiumLock: false,
        requiredCoins: 0,
        requiredPoints: 0
    });

    const [isEditing, setIsEditing] = useState(false);
        const [videoForm, setVideoForm] = useState<Partial<VideoItem>>({
        title: '',
        url: '',
        file: '',
        description: ''
    });
        const stages = ['اعمال دوليه IB', 'نظم المعلومات BIS'];
    const years = ['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'];
    
    
    const semesters = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني'];

    

    const handleStageChange = (stage: string) => {
        setFilter({
            ...filter,
            stage,
            year: 'الفرقة الأولى', specialization: ''
        });
    };

    const [isLessonsFree, setIsLessonsFree] = useState(() => DB.getSettings().isLessonsFree === true);

    const toggleFreeLessons = () => {
        const newVal = !isLessonsFree;
        setIsLessonsFree(newVal);
        DB.updateSettings({ isLessonsFree: newVal });
    };

    const toggleSectionVisibility = () => {
        const newVal = !isLessonsEnabled;
        setIsLessonsEnabled(newVal);
        DB.updateSettings({ isLessonsEnabled: newVal });
    };

    
    
    const addVideoToLesson = () => {
        if (!videoForm.title) return alert('يرجى كتابة عنوان الفيديو');
        if (!videoForm.url && !videoForm.file) return alert('يرجى إضافة رابط أو ملف للفيديو');

        const newVideo: VideoItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: videoForm.title!,
            url: videoForm.url,
            file: videoForm.file,
            description: videoForm.description,
            order: (form.videos?.length || 0) + 1
        };

        setForm(prev => ({ ...prev, videos: [...(prev.videos || []), newVideo] }));
        setVideoForm({ title: '', url: '', file: '', description: '' });
    };

    const removeVideoFromLesson = (id: string) => {
        setForm(prev => ({
            ...prev,
            videos: (prev.videos || []).filter(v => v.id !== id).map((v, i) => ({ ...v, order: i + 1 }))
        }));
    };

    const handleSave = () => {
        if (!form.title?.trim()) return alert('يرجى كتابة عنوان الشرح');
        if (Number(form.price) < 0) return alert('يرجى تحديد السعر بشكل صحيح');
        if (!form.videos || form.videos.length === 0) return alert('يرجى إضافة فيديو واحد على الأقل');

        const lessonData: Lesson = {
            id: isEditing ? form.id : Math.random().toString(36).substr(2, 9),
            stage: filter.stage,
            
            year: filter.year,
            specialization: filter.specialization,
            semester: filter.semester,
            title: form.title,
            description: form.description || '',
            category: form.category || 'شرح عام',
            allowDownload: !!form.allowDownload,
            price: Number(form.price) || 0,
            thumbnail: form.thumbnail,
            videos: form.videos || [],
            date: new Date().toLocaleDateString('ar-EG'),
            isVisible: true,
            isFree: !!form.isFree,
            discountPercentage: Number(form.discountPercentage) || 0,
            showPremiumLock: !!form.showPremiumLock,
            requiredCoins: form.requiredCoins || 0,
            requiredPoints: form.requiredPoints || 0
        };

        if (isEditing) {
            DB.updateLesson(lessonData.id, lessonData);
        } else {
            DB.addLesson(lessonData);
            DB.addNotification({
                id: Date.now().toString(),
                title: 'شرح جديد متاح 🎬',
                message: `تمت إضافة شرح جديد: "${lessonData.title}" لطلاب ${lessonData.year}.`,
                date: new Date().toLocaleDateString('ar-EG'),
                target: 'year',
                stage: lessonData.stage,
                year: lessonData.year
            });
        }

        setLessonList(DB.getLessons());
        resetForm();
        alert('تم حفظ الشرح بنجاح');
    };

    const resetForm = () => {
        setForm({
            id: '', title: '', description: '', category: '', allowDownload: false, price: 0, thumbnail: '', videos: [], isFree: false, discountPercentage: 0,
            stage: '', year: '', semester: '', date: '', isVisible: true, showPremiumLock: false, requiredCoins: 0, requiredPoints: 0
        });
        setIsEditing(false);
    };

    const handleEdit = (l: Lesson) => {
        setForm({ ...l, showPremiumLock: !!l.showPremiumLock, requiredCoins: l.requiredCoins || 0, requiredPoints: l.requiredPoints || 0 });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleForceEdit = (e: any) => {
            if (e.detail.type === 'lesson') {
                const item = e.detail.item;
                setFilter(prev => ({ ...prev, stage: item.stage, year: item.year, semester: item.semester }));
                handleEdit(item);
            }
        };
        window.addEventListener('nt-admin-force-edit', handleForceEdit);
        return () => window.removeEventListener('nt-admin-force-edit', handleForceEdit);
    }, []);

    const handleDelete = (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الشرح؟')) return;
        DB.deleteLesson(id);
        setLessonList(DB.getLessons());
    };

    const filteredList = (lessonList || []).filter(l => {
        const cStage = l.stage || '';
        const fStage = filter.stage || '';
        const cYear = l.year || '';
        const fYear = filter.year || '';
        const cSem = l.semester || '';
        const fSem = filter.semester || '';

        const matchStage = fStage === 'الكل' || cStage === fStage;
        const matchYear = fYear === 'الكل' || cYear === fYear;
        const matchSemester = fSem === 'الكل' || cSem === fSem;

        return matchStage && matchYear && matchSemester;
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {!localStorage.getItem('nt_admin_config') && (
                        <button
                            onClick={toggleSectionVisibility}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl border",
                                isLessonsEnabled
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                                    : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                            )}
                        >
                            {isLessonsEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                            {isLessonsEnabled ? 'قسم الشرح: مفعل للطلاب' : 'قسم الشرح: مغلق بالقفل 3D'}
                        </button>
                    )}
                    {!localStorage.getItem('nt_admin_config') && (
                        <button
                            onClick={toggleFreeLessons}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl border",
                                isLessonsFree
                                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-amber-500/50 scale-105"
                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                            )}
                        >
                            {isLessonsFree ? <Zap size={20} /> : <Lock size={20} />}
                            {isLessonsFree ? 'دخول مجاني: مفعل' : 'دخول مجاني: غير مفعل'}
                        </button>
                    )}
                </div>
                <h2 className="text-3xl font-black text-white text-right">إدارة شروحات المنصة</h2>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 glass rounded-[2.5rem] border border-white/5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الشعبة</label>
                    <select
                        value={filter.stage}
                        disabled={!!localStorage.getItem('nt_admin_config')}
                        onChange={(e) => handleStageChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm disabled:opacity-50"
                    >
                        <option value="الكل">الكل (جميع المراحل)</option>
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الفرقة</label>
                    <select
                        value={filter.year}
                        disabled={!!localStorage.getItem('nt_admin_config')}
                        onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm disabled:opacity-50"
                    >
                        <option value="الكل">الكل (جميع السنين)</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                {filter.year === 'الفرقة الثالثة' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 mr-2">التخصص</label>
                        <select
                            value={filter.specialization}
                            disabled={!!localStorage.getItem('nt_admin_config')}
                            onChange={(e) => setFilter({ ...filter, specialization: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm disabled:opacity-50"
                        >
                            {filter.stage === 'اعمال دوليه IB' ? (
                                <>
                                    <option value="محاسبة">محاسبة</option>
                                    <option value="تمويل">تمويل</option>
                                </>
                            ) : (
                                <option value="نظم المعلومات">نظم المعلومات</option>
                            )}
                        </select>
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الفصل</label>
                    <select
                        value={filter.semester}
                        onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                    >
                        <option value="الكل">الكل (جميع الفصول)</option>
                        {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form Section */}
                <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -z-10 group-hover:bg-cyan-500/10 transition-all duration-700" />
                    <h3 className="text-xl font-black text-right mb-6 flex items-center justify-end gap-3">
                        {isEditing ? 'تعديل الشرح' : 'إضافة شرح جديد'}
                        <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                            {isEditing ? <Edit size={20} /> : <Plus size={20} />}
                        </div>
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">عنوان الشرح</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="مثال: شرح درس محمد علي وبناء الدولة الحديثة"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">تصنيف الشرح</label>
                                <input
                                    type="text"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    placeholder="مثال: جغرافيا، تاريخ، مراجعة..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">وصف الشرح</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="اكتب تفاصيل الشرح ومحتوياته..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all min-h-[60px] resize-none leading-relaxed text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2">سعر الشرح</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.price}
                                            onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-10 text-right outline-none focus:border-emerald-500/50 font-black text-emerald-500"
                                        />
                                        <Coins size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2">نسبة الخصم (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.discountPercentage}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                if (val >= 0 && val <= 100) setForm({ ...form, discountPercentage: val });
                                            }}
                                            min="0"
                                            max="100"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-10 text-right outline-none focus:border-red-500/50 font-black text-red-500"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-black">%</span>
                                    </div>
                                    {(form.discountPercentage || 0) > 0 && (form.price || 0) > 0 && (
                                        <div className="text-[10px] text-emerald-400 font-bold mt-1 text-center bg-emerald-500/10 py-1 rounded-lg">
                                            بعد الخصم: {(form.price || 0) - ((form.price || 0) * ((form.discountPercentage || 0) / 100))} ج.م
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center justify-end gap-1">
                                        <Coins size={14} className="text-yellow-500" />
                                        الكوينز المطلوبة لفتح الشرح
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.requiredCoins}
                                            onChange={e => setForm({ ...form, requiredCoins: Number(e.target.value) })}
                                            min="0"
                                            className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-2xl py-3 px-10 text-right outline-none focus:border-yellow-500/50 font-black text-yellow-500"
                                        />
                                        <Coins size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" />
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-bold mt-1 block">اتركه 0 إذا لم تكن تريد قفله بالكوينز</span>
                                </div>
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center justify-end gap-1">
                                        <Zap size={14} className="text-cyan-400" />
                                        النقاط المطلوبة لفتح الشرح
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.requiredPoints}
                                            onChange={e => setForm({ ...form, requiredPoints: Number(e.target.value) })}
                                            min="0"
                                            className="w-full bg-cyan-500/10 border border-cyan-500/20 rounded-2xl py-3 px-10 text-right outline-none focus:border-cyan-500/50 font-black text-cyan-400"
                                        />
                                        <Zap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-bold mt-1 block">اتركه 0 إذا لم تكن تريد قفله بالنقاط</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">صورة الغلاف (Thumbnail)</label>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    
                                    <input
                                        type="text"
                                        value={form.thumbnail}
                                        onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                                        placeholder="أو أدخل رابط صورة..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-xs"
                                    />
                                    
                                </div>
                                {form.thumbnail && (
                                    <div className="relative group w-full h-32 rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                                        <img
                                            src={form.thumbnail.startsWith('data:') ? form.thumbnail : form.thumbnail}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, thumbnail: '' })}
                                            className="absolute top-2 left-2 p-1.5 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Videos Management */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-sm font-black text-right text-gray-300">إضافة فيديوهات الشرح</h4>
                            <div className="bg-black/20 p-4 rounded-2xl space-y-3">
                                <input
                                    type="text"
                                    placeholder="عنوان الفيديو (مثال: الجزء الأول)"
                                    value={videoForm.title}
                                    onChange={e => setVideoForm({ ...videoForm, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-right text-xs outline-none focus:border-cyan-500/50 font-bold"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="رابط الفيديو (URL)"
                                        value={videoForm.url}
                                        onChange={e => setVideoForm({ ...videoForm, url: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-right text-[10px] outline-none focus:border-cyan-500/50 font-bold"
                                    />
                                    
                                </div>
                                <textarea
                                    placeholder="وصف الفيديو (اختياري)"
                                    value={videoForm.description}
                                    onChange={e => setVideoForm({ ...videoForm, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-right text-[10px] outline-none focus:border-cyan-500/50 font-bold min-h-[40px] resize-none"
                                />
                                <button
                                    onClick={addVideoToLesson}
                                    className="w-full py-2 bg-cyan-500/20 text-cyan-400 rounded-xl font-black text-xs hover:bg-cyan-500 hover:text-black transition-all"
                                >
                                    إضافة الفيديو للقائمة
                                </button>
                            </div>

                            <div className="space-y-2">
                                {(form.videos || []).map((v, i) => (
                                    <div key={v.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 group">
                                        <button onClick={() => removeVideoFromLesson(v.id)} className="text-red-500 hover:scale-110 transition-transform">
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="flex items-center gap-3 flex-1 justify-end">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-white">{v.title}</span>
                                                {v.description && <span className="text-[9px] text-gray-500 font-bold">{v.description}</span>}
                                            </div>
                                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0">{i + 1}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 flex-1 min-w-[150px]">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setForm({ ...form, isFree: !form.isFree })}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-all duration-300 shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]",
                                            form.isFree ? "bg-emerald-500" : "bg-gray-700"
                                        )}
                                    >
                                        <div
                                            style={{ left: form.isFree ? '24px' : '4px' }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300"
                                        />
                                    </button>
                                    <span className="text-xs font-black text-emerald-400">دخول مجاني؟</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 flex-1 min-w-[150px]">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setForm({ ...form, showPremiumLock: !form.showPremiumLock })}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-all duration-300 shadow-[0_0_15px_-5px_rgba(245,158,11,0.5)]",
                                            form.showPremiumLock ? "bg-amber-500" : "bg-gray-700"
                                        )}
                                    >
                                        <div
                                            style={{ left: form.showPremiumLock ? '24px' : '4px' }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300"
                                        />
                                    </button>
                                    <span className="text-xs font-black text-amber-500">تفعيل القفل 3D؟</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 flex-1 min-w-[150px]">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setForm({ ...form, allowDownload: !form.allowDownload })}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-all duration-300",
                                            form.allowDownload ? "bg-emerald-500" : "bg-gray-700"
                                        )}
                                    >
                                        <div
                                            style={{ left: form.allowDownload ? '24px' : '4px' }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300"
                                        />
                                    </button>
                                    <span className="text-xs font-black text-gray-400">سماح بالتحميل؟</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={false}
                                className="flex-1 py-4 rounded-2xl font-black text-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ backgroundColor: theme.primary }}
                            >
                                {isEditing ? 'تحديث الشرح' : 'حفظ ونشر الشرح'}
                                <Save size={18} />
                            </button>
                            {isEditing && (
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-4 rounded-2xl font-black text-gray-500 bg-white/5 hover:bg-white/10 transition-all"
                                >
                                    إلغاء
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest text-right w-full">الشروحات المتاحة ({filteredList.length})</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-10">
                        {filteredList.length === 0 ? (
                            <div className="p-16 text-center glass rounded-3xl border border-white/5 border-dashed">
                                <Video size={40} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-500 font-bold">لا توجد دروس شرح حالياً</p>
                            </div>
                        ) : (
                            filteredList.map((lesson) => (
                                <div
                                    key={lesson.id}
                                    className="glass p-5 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all flex flex-col gap-4 relative"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const newVisible = !lesson.isVisible;
                                                    DB.updateLesson(lesson.id, { isVisible: newVisible });
                                                    setLessonList(DB.getLessons());
                                                }}
                                                className={cn(
                                                    "p-2.5 rounded-xl transition-all border border-white/5",
                                                    lesson.isVisible ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                                )}
                                                title={lesson.isVisible ? "إخفاء" : "إظهار"}
                                            >
                                                {lesson.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(lesson)}
                                                className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all border border-white/5"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(lesson.id)}
                                                className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-white/5"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="text-right flex-1">
                                            <h4 className="font-black text-base text-gray-200 group-hover:text-cyan-400 transition-colors">{lesson.title}</h4>
                                            <div className="flex items-center justify-end gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-cyan-500">{lesson.category || 'شرح عام'}</span>
                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                <div className="flex flex-col items-end">
                                                    {(lesson.discountPercentage || 0) > 0 && !lesson.isFree ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-gray-500 line-through">{lesson.price} ج.م</span>
                                                            <span className="text-xs font-black text-emerald-500">{lesson.price - (lesson.price * ((lesson.discountPercentage || 0) / 100))} ج.م</span>
                                                            <div className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[8px] font-black border border-red-500/20">-{lesson.discountPercentage}%</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-black text-emerald-500">{lesson.isFree ? 'مجاني' : `${lesson.price} ج.م`}</span>
                                                    )}
                                                </div>
                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                <div className="flex items-center gap-1 text-[10px] font-black text-cyan-500">
                                                    <span>{(lesson.videos || []).length} فيديو</span>
                                                    <ListOrdered size={12} />
                                                </div>
                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                <span className="text-[10px] font-bold text-gray-500">{lesson.date}</span>
                                                {lesson.showPremiumLock && <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md text-[8px] font-black border border-amber-500/20 flex items-center gap-1"><Lock size={10} /> قفل 3D</div>}
                                                {lesson.requiredCoins && lesson.requiredCoins > 0 ? (
                                                    <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-md text-[8px] font-black border border-yellow-500/20 flex items-center gap-1">
                                                        <Sparkles size={10} /> {lesson.requiredCoins}
                                                    </div>
                                                ) : null}
                                                {lesson.requiredPoints && lesson.requiredPoints > 0 ? (
                                                    <div className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md text-[8px] font-black border border-cyan-500/20 flex items-center gap-1">
                                                        <Zap size={10} /> {lesson.requiredPoints}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        {lesson.thumbnail && (
                                            <img src={lesson.thumbnail} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(LessonManagement);
