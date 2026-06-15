
import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, FileText,
    Save, FileUp, Calendar, X, AlertCircle, Coins, Link, Eye, EyeOff, Upload, Download, Play, Archive, Lock, ShieldCheck, ShieldAlert, Sparkles, Brain
} from 'lucide-react';
import { DB } from '../../services/db';
import { Booklet } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const normalizeArabic = (text: string) => {
    if (!text) return '';
    return text.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
};

interface Props {
    isDarkMode: boolean;
    theme: any;
    bookletList: Booklet[];
    setBookletList: (list: Booklet[]) => void;
}

export const BookletManagement: React.FC<Props> = ({ isDarkMode, theme, bookletList, setBookletList }) => {
    const [filter, setFilter] = useState(() => {
        try {
            const conf = localStorage.getItem('nt_admin_config');
            if (conf) {
                const parsed = JSON.parse(conf);
                const initStage = parsed.stage;
                const initYear = parsed.year;
                const initSpec = parsed.specialization === 'الكل' ? '' : parsed.specialization;
                const initUnits = DB.getSubjects(initStage, initYear, initSpec);
                return {
                    stage: initStage,
                    year: initYear,
                    specialization: initSpec,
                    semester: 'الفصل الدراسي الأول',
                    unit: initUnits[0] || ''
                };
            }
        } catch {}
        const defaultUnits = DB.getSubjects('اعمال دوليه IB', 'الفرقة الأولى', '');
        return {
            stage: 'اعمال دوليه IB', year: 'الفرقة الأولى', specialization: '',
            semester: 'الفصل الدراسي الأول',
            unit: defaultUnits[0] || ''
        };
    });
    const [units, setUnits] = useState<string[]>(() => DB.getSubjects(filter.stage, filter.year, filter.specialization));

    const [isBookletsEnabled, setIsBookletsEnabled] = useState(() => DB.getSettings().isBookletsEnabled !== false);

    const [form, setForm] = useState({
        id: '',
        title: '',
        text: '',
        unit: filter.unit,
        price: 0,
        files: [] as string[], // "name|||base64"
        isFree: false,
        discountPercentage: 0,
        linkUrl: '',
        allowDownload: false,
        thumbnail: '',
        showPremiumLock: false,
        requiredCoins: 0,
        requiredPoints: 0
    });

    const [isEditing, setIsEditing] = useState(false);
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

    useEffect(() => {
        const u = DB.getSubjects(filter.stage, filter.year, filter.specialization);
        setUnits(u);
    }, [filter.stage, filter.year, filter.specialization]);

    const toggleSectionVisibility = () => {
        const newVal = !isBookletsEnabled;
        setIsBookletsEnabled(newVal);
        DB.updateSettings({ isBookletsEnabled: newVal });
    };

    
    const handleSave = () => {
        if (!form.title.trim()) return alert('يرجى كتابة العنوان');

        const selectedUnit = isEditing ? form.unit : filter.unit;
        const finalUnit = selectedUnit === 'الكل' ? (units[0] || "") : selectedUnit;

        const bookletData: Booklet = {
            id: isEditing ? form.id : Math.random().toString(36).substr(2, 9),
            stage: filter.stage,
            year: filter.year,
            specialization: filter.specialization,
            semester: filter.semester,
            unit: finalUnit.trim(),
            title: form.title,
            text: form.text,
            files: form.files,
            price: form.price,
            discountPercentage: form.discountPercentage,
            date: new Date().toLocaleDateString('ar-EG'),
            isVisible: true,
            isFree: form.isFree,
            linkUrl: form.linkUrl,
            allowDownload: form.allowDownload,
            thumbnail: form.thumbnail,
            showPremiumLock: form.showPremiumLock,
            requiredCoins: form.requiredCoins || 0,
            requiredPoints: form.requiredPoints || 0
        };

        if (isEditing) {
            DB.updateBooklet(bookletData.id, bookletData);
        } else {
            DB.addBooklet(bookletData);
            // Automatic Notification
            DB.addNotification({
                id: Date.now().toString(),
                title: 'ملخص جديد متاح 📚',
                message: `تم إضافة ملخص جديد: "${bookletData.title}" لطلاب ${bookletData.year}.`,
                date: new Date().toLocaleDateString('ar-EG'),
                target: 'year',
                stage: bookletData.stage,
                year: bookletData.year
            });
        }

        setBookletList(DB.getBooklets());
        setForm({ id: '', title: '', text: '', unit: filter.unit, price: 0, files: [], isFree: false, discountPercentage: 0, linkUrl: '', allowDownload: false, thumbnail: '', showPremiumLock: false, requiredCoins: 0, requiredPoints: 0 });
        setIsEditing(false);
        alert('تم حفظ الملخص بنجاح');
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الملخص؟')) return;
        DB.deleteBooklet(id);
        setBookletList(DB.getBooklets());
    };

    const handleEdit = (b: Booklet) => {
        setForm({
            id: b.id,
            title: b.title,
            text: b.text,
            unit: (b.unit || units[0] || '').trim(),
            price: b.price || 0,
            discountPercentage: b.discountPercentage || 0,
            files: b.files,
            isFree: !!b.isFree,
            linkUrl: b.linkUrl || '',
            allowDownload: !!b.allowDownload,
            thumbnail: b.thumbnail || '',
            showPremiumLock: !!b.showPremiumLock,
            requiredCoins: b.requiredCoins || 0,
            requiredPoints: b.requiredPoints || 0
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleForceEdit = (e: any) => {
            if (e.detail.type === 'booklet') {
                const item = e.detail.item;
                setFilter(prev => ({ ...prev, stage: item.stage, year: item.year, semester: item.semester, unit: item.unit || units[0], specialization: item.specialization || '' }));
                handleEdit(item);
            }
        };
        window.addEventListener('nt-admin-force-edit', handleForceEdit);
        return () => window.removeEventListener('nt-admin-force-edit', handleForceEdit);
    }, [units]);

    const filteredList = (bookletList || []).filter(b => {
        const bUnit = normalizeArabic(b.unit || units[0] || '');
        const fUnit = normalizeArabic(filter.unit || '');
        const bStage = normalizeArabic(b.stage || '');
        const fStage = normalizeArabic(filter.stage || '');
        const bYear = normalizeArabic(b.year || '');
        const fYear = normalizeArabic(filter.year || '');
        const bSem = normalizeArabic(b.semester || '');
        const fSem = normalizeArabic(filter.semester || '');

        const matchStage = fStage === normalizeArabic('الكل') || bStage === fStage;
        const matchYear = fYear === normalizeArabic('الكل') || bYear === fYear;
        const matchSemester = fSem === normalizeArabic('الكل') || bSem === fSem;
        const matchUnit = fUnit === normalizeArabic('الكل') || bUnit === fUnit;

        return matchStage && matchYear && matchSemester && matchUnit;
    });

    return (
        <div className="space-y-6 pb-20 text-right">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {!localStorage.getItem('nt_admin_config') && (
                    <button
                        onClick={toggleSectionVisibility}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl border",
                            isBookletsEnabled
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                                : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                        )}
                    >
                        {isBookletsEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                        {isBookletsEnabled ? 'قسم الملخصات: مفعل للطلاب' : 'قسم الملخصات: مغلق بالقفل 3D'}
                    </button>
                )}
                <h2 className="text-3xl font-black text-white">إدارة الملخصات والملفات</h2>
            </div>

            {/* Stage/Year/Unit Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 glass rounded-[2.5rem] border border-white/5">
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
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">المادة</label>
                    <select
                        value={filter.unit}
                        onChange={(e) => setFilter({ ...filter, unit: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                    >
                        <option value="الكل">الكل (أرشيف كامل)</option>
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form Section */}
                <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] -z-10 group-hover:bg-amber-500/10 transition-all duration-700" />

                    <h3 className="text-xl font-black text-right mb-6 flex items-center justify-end gap-3">
                        {isEditing ? 'تعديل الملخص' : 'إضافة ملخص جديد'}
                        <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500">
                            {isEditing ? <Edit size={20} /> : <Plus size={20} />}
                        </div>
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">عنوان الملخص</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="مثال: ملخص ليلة الامتحان - مراجعة عامة"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-amber-500/50 transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">وصف الملخص</label>
                            <textarea
                                value={form.text}
                                onChange={(e) => setForm({ ...form, text: e.target.value })}
                                placeholder="اكتب تفاصيل الملخص وما يحتويه..."
                                className="w-full bg-black/40 border border-white/10 rounded-3xl py-4 px-6 text-right outline-none focus:border-amber-500/50 transition-all min-h-[120px] resize-none leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">سعر الملخص</label>
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
                                {form.discountPercentage > 0 && form.price > 0 && (
                                    <div className="text-[10px] text-emerald-400 font-bold mt-1 text-center bg-emerald-500/10 py-1 rounded-lg">
                                        بعد الخصم: {form.price - (form.price * (form.discountPercentage / 100))} ج.م
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2 flex items-center justify-end gap-1">
                                    <Sparkles size={14} className="text-yellow-500" />
                                    الكوينز المطلوبة (لغير البريميوم)
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
                                    <Brain size={14} className="text-cyan-400" />
                                    النقاط المطلوبة لفتح الملخص
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={form.requiredPoints}
                                        onChange={e => setForm({ ...form, requiredPoints: Number(e.target.value) })}
                                        min="0"
                                        className="w-full bg-cyan-500/10 border border-cyan-500/20 rounded-2xl py-3 px-10 text-right outline-none focus:border-cyan-500/50 font-black text-cyan-400"
                                    />
                                    <Brain size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                                </div>
                                <span className="text-[9px] text-gray-500 font-bold mt-1 block">اتركه 0 إذا لم تكن تريد قفله بالنقاط</span>
                            </div>
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">رابط خارجي (اختياري)</label>
                                <input
                                    type="text"
                                    value={form.linkUrl}
                                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                                    placeholder="أضف رابط التحميل المباشر أو Drive هنا..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-amber-500/50 transition-all font-bold text-xs"
                                />
                            </div>
                            <div className="pt-5 border-t border-white/5">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-3 bg-black/20 p-2.5 px-4 rounded-xl border border-white/5">
                                        <button
                                            onClick={() => setForm({ ...form, isFree: !form.isFree })}
                                            className={cn(
                                                "w-10 h-5 rounded-full relative transition-all duration-300",
                                                form.isFree ? "bg-emerald-500 shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]" : "bg-gray-700"
                                            )}
                                        >
                                            <div
                                                style={{ left: form.isFree ? '22px' : '3px' }}
                                                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-300"
                                            />
                                        </button>
                                        <span className="text-[10px] font-black text-emerald-400">دخول مجاني؟</span>
                                    </div>

                                    <div className="flex items-center gap-3 bg-black/20 p-2.5 px-4 rounded-xl border border-white/5">
                                        <button
                                            onClick={() => setForm({ ...form, showPremiumLock: !form.showPremiumLock })}
                                            className={cn(
                                                "w-10 h-5 rounded-full relative transition-all duration-300",
                                                form.showPremiumLock ? "bg-amber-500" : "bg-gray-700"
                                            )}
                                        >
                                            <div
                                                style={{ left: form.showPremiumLock ? '22px' : '3px' }}
                                                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-300"
                                            />
                                        </button>
                                        <span className="text-[10px] font-black text-amber-500">قفل 3D متحرك؟</span>
                                    </div>

                                    <div className="flex items-center gap-3 bg-black/20 p-2.5 px-4 rounded-xl border border-white/5">
                                        <button
                                            onClick={() => setForm({ ...form, allowDownload: !form.allowDownload })}
                                            className={cn(
                                                "w-10 h-5 rounded-full relative transition-all duration-300",
                                                form.allowDownload ? "bg-emerald-500" : "bg-gray-700"
                                            )}
                                        >
                                            <div
                                                style={{ left: form.allowDownload ? '22px' : '3px' }}
                                                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-300"
                                            />
                                        </button>
                                        <span className="text-[10px] font-black text-gray-400">سماح بالتحميل؟</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        

                        <div className="pt-4 flex gap-3">
                            {isEditing && (
                                <button
                                    onClick={() => {
                                        setForm({ id: '', title: '', text: '', unit: filter.unit, price: 0, files: [], isFree: false, discountPercentage: 0, linkUrl: '', allowDownload: false, thumbnail: '', showPremiumLock: false, requiredCoins: 0, requiredPoints: 0 });
                                        setIsEditing(false);
                                    }}
                                    className="flex-1 py-4 rounded-2xl font-black text-gray-500 bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                                >
                                    إلغاء
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                
                                className="flex-[2] py-4 rounded-2xl font-black text-black shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ backgroundColor: theme.primary }}
                            >
                                {isEditing ? 'تحديث الملخص' : 'حفظ ونشر الملخص'}
                                <Save size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">الملخصات المتاحة في {filter.unit}</span>
                        <div className="flex items-center gap-2 text-amber-500 font-bold">
                            <span>{filteredList.length} ملخص</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-10">
                        {filteredList.length === 0 ? (
                            <div className="p-16 text-center glass rounded-3xl border border-white/5 border-dashed">
                                <AlertCircle size={40} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-500 font-bold">لا توجد ملخصات حالياً</p>
                            </div>
                        ) : (
                            filteredList.map((booklet) => (
                                <div
                                    key={booklet.id}
                                    className="glass p-6 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all flex flex-col gap-4 relative"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const newVisibility = !booklet.isVisible;
                                                    DB.updateBooklet(booklet.id, { isVisible: newVisibility });
                                                    setBookletList(DB.getBooklets());
                                                }}
                                                className={cn(
                                                    "p-2.5 rounded-xl transition-all border border-white/5",
                                                    booklet.isVisible ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                                )}
                                                title={booklet.isVisible ? "إخفاء" : "إظهار"}
                                            >
                                                {booklet.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(booklet)}
                                                className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all border border-white/5"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(booklet.id)}
                                                className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-white/5"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <h4 className="font-black text-base text-gray-200 group-hover:text-amber-500 transition-colors">{booklet.title}</h4>
                                            <div className="flex items-center justify-end gap-3 mt-1">
                                                <div className="flex flex-col items-end">
                                                    {(booklet.discountPercentage || 0) > 0 && !booklet.isFree ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-gray-500 line-through">{booklet.price} ج.م</span>
                                                            <span className="text-xs font-black text-emerald-500">{booklet.price - (booklet.price * ((booklet.discountPercentage || 0) / 100))} ج.م</span>
                                                            <div className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[8px] font-black border border-red-500/20">-{booklet.discountPercentage}%</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-black text-emerald-500">{booklet.isFree ? 'مجاني' : `${booklet.price} ج.م`}</span>
                                                    )}
                                                </div>
                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                <span className="text-[10px] font-bold text-gray-500">{booklet.date}</span>
                                                {booklet.linkUrl && <div className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black border border-blue-500/20 flex items-center gap-1"><Link size={8} /> رابط</div>}
                                                {booklet.allowDownload && <div className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[8px] font-black border border-emerald-500/20 flex items-center gap-1">تحميل مفعل</div>}
                                                {booklet.isFree && <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black border border-emerald-500/20">دخول مجاني</div>}
                                                {booklet.showPremiumLock && <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md text-[8px] font-black border border-amber-500/20 flex items-center gap-1"><Lock size={10} /> قفل 3D</div>}
                                                {booklet.requiredCoins && booklet.requiredCoins > 0 ? (
                                                    <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-md text-[8px] font-black border border-yellow-500/20 flex items-center gap-1">
                                                        <Sparkles size={10} /> {booklet.requiredCoins}
                                                    </div>
                                                ) : null}
                                                {booklet.requiredPoints && booklet.requiredPoints > 0 ? (
                                                    <div className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md text-[8px] font-black border border-cyan-500/20 flex items-center gap-1">
                                                        <Brain size={10} /> {booklet.requiredPoints}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    {booklet.text && (
                                        <p className="text-xs text-right text-gray-400 line-clamp-2 leading-relaxed bg-black/10 p-3 rounded-xl border border-white/5">
                                            {booklet.text}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(BookletManagement);


