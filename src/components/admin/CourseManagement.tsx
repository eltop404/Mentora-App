
import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Edit, Trash2, Video,
    Save, FileUp, Calendar, X, AlertCircle, Coins, Link, Eye, EyeOff,
    Upload, Download, Play, Lock, ShoppingCart, CheckCircle, XCircle, Brain, Sparkles, Clock, ShieldCheck, ShieldAlert,
    Scissors, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, GripVertical
} from 'lucide-react';
import { DB } from '../../services/db';
import { Course } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Convert any video URL to an embeddable URL (client-side only, zero DB) */
function getEmbedUrl(url: string, start?: number, end?: number): { type: 'iframe' | 'video'; src: string } {
    if (!url) return { type: 'video', src: '' };
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (ytMatch) {
        let src = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
        if (start !== undefined && start > 0) src += `&start=${start}`;
        if (end !== undefined && end > 0) src += `&end=${end}`;
        return { type: 'iframe', src };
    }
    // Google Drive
    const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
    if (driveMatch) {
        return { type: 'iframe', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
    }
    // Base64 / direct video
    if (url.startsWith('data:video') || /\.(mp4|webm|ogg|mkv)$/i.test(url)) {
        return { type: 'video', src: url };
    }
    // Fallback: try iframe
    return { type: 'iframe', src: url };
}

interface Props {
    isDarkMode: boolean;
    theme: any;
    courseList: Course[];
    setCourseList: (list: Course[]) => void;
}

export const CourseManagement: React.FC<Props> = ({ isDarkMode, theme, courseList, setCourseList }) => {
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

    const [isCoursesEnabled, setIsCoursesEnabled] = useState(() => DB.getSettings().isCoursesEnabled !== false);

    const [form, setForm] = useState({
        id: '',
        title: '',
        description: '',
        category: '',
        allowDownload: false,
        price: 0,
        videoUrls: [''] as string[], // multiple video URLs (deprecated but kept for compat)
        videos: [{ title: '', url: '', description: '' }] as { title: string, url: string, description?: string }[],
        videoFile: '', // name|||base64
        isFree: false,
        discountPercentage: 0,
        thumbnail: '',
        showPremiumLock: false,
        requiredCoins: 0,
        requiredPoints: 0,
        quizId: '',
        unit: ''
    });

    const [allExams, setAllExams] = useState(() => DB.getExams());

    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // ── Video Preview Modal State (pure client-side, zero DB) ──
    const [previewVideo, setPreviewVideo] = useState<{ url: string; idx: number } | null>(null);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [iframeTrimInfo, setIframeTrimInfo] = useState<{ start?: number, end?: number }>({});
    const videoRef = useRef<HTMLVideoElement>(null);

    // ── Drag & Drop Reordering for Videos (Pointer Events based) ──
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const longPressTimeout = useRef<any>(null);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
        if (e.button !== 0) return; // Only left click / primary touch

        const target = e.target as HTMLElement;
        if (target.closest('input, textarea, select, button')) {
            return;
        }

        e.persist();

        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);

        const startX = e.clientX;
        const startY = e.clientY;

        const onPointerMoveBeforeDrag = (moveEvent: PointerEvent) => {
            if (Math.abs(moveEvent.clientX - startX) > 10 || Math.abs(moveEvent.clientY - startY) > 10) {
                if (longPressTimeout.current) {
                    clearTimeout(longPressTimeout.current);
                    longPressTimeout.current = null;
                }
                window.removeEventListener('pointermove', onPointerMoveBeforeDrag);
            }
        };
        window.addEventListener('pointermove', onPointerMoveBeforeDrag);

        longPressTimeout.current = setTimeout(() => {
            window.removeEventListener('pointermove', onPointerMoveBeforeDrag);
            setDraggingIdx(idx);
            const targetElement = e.currentTarget;
            try {
                targetElement.setPointerCapture(e.pointerId);
            } catch (err) {
                console.error('Pointer capture failed:', err);
            }
        }, 250);

        const handlePointerUpOnce = () => {
            if (longPressTimeout.current) {
                clearTimeout(longPressTimeout.current);
                longPressTimeout.current = null;
            }
            window.removeEventListener('pointermove', onPointerMoveBeforeDrag);
            window.removeEventListener('pointerup', handlePointerUpOnce);
        };
        window.addEventListener('pointerup', handlePointerUpOnce);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
        if (draggingIdx === null || draggingIdx !== idx) return;

        const listContainer = containerRef.current;
        if (!listContainer) return;

        const cards = Array.from(listContainer.querySelectorAll('[data-video-idx]'));
        const pointerY = e.clientY;

        let targetIdx: number | null = null;
        for (const card of cards) {
            const itemIdx = parseInt(card.getAttribute('data-video-idx') || '', 10);
            if (isNaN(itemIdx) || itemIdx === draggingIdx) continue;

            const rect = card.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;

            if (draggingIdx < itemIdx) {
                if (pointerY > midpoint) {
                    targetIdx = itemIdx;
                }
            } else {
                if (pointerY < midpoint) {
                    targetIdx = itemIdx;
                }
            }
        }

        if (targetIdx !== null) {
            setForm(prev => {
                const nextVideos = [...prev.videos];
                const dragged = nextVideos[draggingIdx];
                nextVideos.splice(draggingIdx, 1);
                nextVideos.splice(targetIdx!, 0, dragged);
                return { ...prev, videos: nextVideos };
            });
            setDraggingIdx(targetIdx);
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
        if (draggingIdx !== null) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch (err) {}
            setDraggingIdx(null);
        }
    };


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

    const toggleSectionVisibility = () => {
        const newVal = !isCoursesEnabled;
        setIsCoursesEnabled(newVal);
        DB.updateSettings({ isCoursesEnabled: newVal });
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setForm(prev => ({ ...prev, videoFile: `${file.name}|||${base64}` }));
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!form.title.trim()) return alert('يرجى كتابة عنوان الكورس');
        if (form.price <= 0) return alert('يرجى تحديد سعر الكورس');
        const validUrls = [
            ...form.videoUrls.filter(u => u.trim()),
            ...form.videos.map(v => v.url).filter(u => u.trim())
        ];
        if (validUrls.length === 0 && !form.videoFile) return alert('يرجى إضافة رابط فيديو واحد على الأقل أو رفع ملف فيديو');

        const courseData: Course = {
            id: isEditing ? form.id : Math.random().toString(36).substr(2, 9),
            stage: filter.stage,
            
            year: filter.year,
            specialization: filter.specialization,
            semester: filter.semester,
            title: form.title,
            description: form.description,
            category: form.category || 'كورس عام',
            allowDownload: form.allowDownload,
            price: form.price,
            videoUrl: form.videos[0]?.url || '',
            videoUrls: form.videos.map(v => v.url),
            videos: form.videos.map((v, idx) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: v.title || `فيديو ${idx + 1}`,
                url: v.url,
                description: v.description,
                order: idx
            })),
            videoFile: form.videoFile,
            discountPercentage: form.discountPercentage,
            date: new Date().toLocaleDateString('ar-EG'),
            isVisible: true,
            isFree: form.isFree,
            thumbnail: form.thumbnail,
            showPremiumLock: form.showPremiumLock,
            requiredCoins: form.requiredCoins,
            requiredPoints: form.requiredPoints,
            quizId: form.quizId,
            unit: form.unit
        };

        if (isEditing) {
            DB.updateCourse(courseData.id, courseData);
        } else {
            DB.addCourse(courseData);
            DB.addNotification({
                id: Date.now().toString(),
                title: 'فيديو جديد متاح 🎬',
                message: `تم رفع فيديو جديد: "${courseData.title}" لطلاب ${courseData.year}.`,
                date: new Date().toLocaleDateString('ar-EG'),
                target: 'year',
                stage: courseData.stage,
                year: courseData.year
            });
        }

        setCourseList(DB.getCourses());
        setForm({ id: '', title: '', description: '', category: '', allowDownload: false, price: 0, videoUrls: [''], videos: [{ title: '', url: '', description: '' }], videoFile: '', isFree: false, discountPercentage: 0, thumbnail: '', showPremiumLock: false, requiredCoins: 0, requiredPoints: 0, quizId: '', unit: '' });
        setIsEditing(false);
        alert('تم حفظ الكورس بنجاح');
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الكورس؟')) return;
        DB.deleteCourse(id);
        setCourseList(DB.getCourses());
    };

    const handleEdit = (c: Course) => {
        let urls: string[] = [];
        if (c.videoUrls && c.videoUrls.length > 0) {
            urls = [...c.videoUrls];
        } else if (c.videoUrl) {
            urls = [c.videoUrl];
        }
        if (urls.length === 0) urls = [''];

        setForm({
            id: c.id,
            title: c.title,
            description: c.description || '',
            category: c.category || '',
            allowDownload: !!c.allowDownload,
            price: c.price || 0,
            videoUrls: urls,
            videos: c.videos && c.videos.length > 0
                ? c.videos.map(v => ({ title: v.title, url: v.url || '', description: v.description || '' }))
                : urls.map((u, i) => ({ title: `????? ${i + 1}`, url: u, description: '' })),
            videoFile: c.videoFile || '',
            isFree: !!c.isFree,
            discountPercentage: c.discountPercentage || 0,
            thumbnail: c.thumbnail || '',
            showPremiumLock: !!c.showPremiumLock,
            requiredCoins: c.requiredCoins || 0,
            requiredPoints: c.requiredPoints || 0,
            quizId: c.quizId || '',
            unit: c.unit || ''
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleForceEdit = (e: any) => {
            if (e.detail.type === 'course') {
                const item = e.detail.item;
                setFilter(prev => ({ ...prev, stage: item.stage, year: item.year, semester: item.semester }));
                handleEdit(item);
            }
        };
        window.addEventListener('nt-admin-force-edit', handleForceEdit);
        return () => window.removeEventListener('nt-admin-force-edit', handleForceEdit);
    }, []);

    const filteredList = (courseList || []).filter(c => {
        const cStage = c.stage || '';
        const fStage = filter.stage || '';
        const cYear = c.year || '';
        const fYear = filter.year || '';
        const cSem = c.semester || '';
        const fSem = filter.semester || '';

        const matchStage = fStage === 'الكل' || cStage === fStage;
        const matchYear = fYear === 'الكل' || cYear === fYear;
        const matchSemester = fSem === 'الكل' || cSem === fSem;

        return matchStage && matchYear && matchSemester;
    });

    return (
        <div className="space-y-6 pb-20 text-right">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {!localStorage.getItem('nt_admin_config') && (
                        <button
                            onClick={toggleSectionVisibility}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl border",
                                isCoursesEnabled
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                                    : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                            )}
                        >
                            {isCoursesEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                            {isCoursesEnabled ? 'قسم الكورسات: مفعل للطلاب' : 'قسم الكورسات: مغلق بالقفل 3D'}
                        </button>
                    )}
                </div>
                <h2 className="text-3xl font-black text-white">إدارة الكورسات والدورات</h2>
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
                        {isEditing ? 'تعديل الكورس' : 'إضافة كورس جديد'}
                        <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                            {isEditing ? <Edit size={20} /> : <Plus size={20} />}
                        </div>
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">عنوان الكورس</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="مثال: كورس شرح المادة الأولى كاملاً"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">تصنيف الكورس</label>
                                <input
                                    type="text"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    placeholder="مثال: جغرافيا، تاريخ، مراجعة..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">وصف الكورس</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="اكتب تفاصيل الكورس ومحتوياته..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all min-h-[60px] resize-none leading-relaxed text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">صورة الكورس (Thumbnail)</label>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('course-thumbnail-upload')?.click()}
                                        className="flex-1 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2"
                                    >
                                        <Upload size={14} />
                                        رفع صورة
                                    </button>
                                    <input
                                        type="text"
                                        value={form.thumbnail}
                                        onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                                        placeholder="أو أدخل رابط صورة..."
                                        className="flex-[2] bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-xs"
                                    />
                                </div>
                                <input
                                    id="course-thumbnail-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (prev) => {
                                                const b64 = prev.target?.result as string;
                                                setForm({ ...form, thumbnail: b64 });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {form.thumbnail && (
                                    <div className="relative group w-full h-32 rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                                        <img src={form.thumbnail} alt="Preview" className="w-full h-full object-cover" />
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

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2">سعر الكورس</label>
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
                                <div className="space-y-2 text-right col-span-2">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, videos: [...prev.videos, { title: '', url: '', description: '' }] }))}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl font-black text-xs transition-all"
                                        >
                                            <Plus size={14} />
                                            إضافة رابط فيديو
                                        </button>
                                        <div className="flex flex-col items-end">
                                            <label className="text-xs font-bold text-gray-500">روابط الفيديو ({(form.videos || []).length})</label>
                                            {(form.videos || []).length > 1 && (
                                                <span className="text-[10px] text-cyan-500/70 font-bold mt-0.5">اضغط ضغطة طويلة مع السحب للترتيب ⇅</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4" ref={containerRef}>
                                        {form.videos.map((vid, idx) => (
                                            <div
                                                key={idx}
                                                data-video-idx={idx}
                                                onPointerDown={(e) => handlePointerDown(e, idx)}
                                                onPointerMove={(e) => handlePointerMove(e, idx)}
                                                onPointerUp={(e) => handlePointerUp(e, idx)}
                                                onPointerCancel={(e) => handlePointerUp(e, idx)}
                                                className={cn(
                                                    "bg-black/40 border p-4 rounded-[2rem] space-y-3 relative group/vid transition-all duration-200 select-none",
                                                    draggingIdx === idx
                                                        ? "border-cyan-500/50 bg-cyan-950/20 scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.15)] z-50 cursor-grabbing touch-none"
                                                        : "border-white/5 cursor-grab hover:border-white/10"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex gap-1.5">
                                                        {(form.videos || []).length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setForm(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }))}
                                                                className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20"
                                                                title="حذف الفيديو"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                        {(form.videos || []).length > 1 && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={idx === 0}
                                                                    onClick={() => {
                                                                        if (idx === 0) return;
                                                                        setForm(prev => {
                                                                            const next = [...prev.videos];
                                                                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                                                            return { ...prev, videos: next };
                                                                        });
                                                                    }}
                                                                    className={`p-1.5 rounded-lg border transition-all ${
                                                                        idx === 0
                                                                            ? 'bg-white/5 text-gray-600 border-white/5 opacity-30 cursor-not-allowed'
                                                                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
                                                                    }`}
                                                                    title="تحريك لأعلى"
                                                                >
                                                                    <ChevronUp size={12} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={idx === form.videos.length - 1}
                                                                    onClick={() => {
                                                                        if (idx === form.videos.length - 1) return;
                                                                        setForm(prev => {
                                                                            const next = [...prev.videos];
                                                                            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                                                            return { ...prev, videos: next };
                                                                        });
                                                                    }}
                                                                    className={`p-1.5 rounded-lg border transition-all ${
                                                                        idx === form.videos.length - 1
                                                                            ? 'bg-white/5 text-gray-600 border-white/5 opacity-30 cursor-not-allowed'
                                                                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
                                                                    }`}
                                                                    title="تحريك لأسفل"
                                                                >
                                                                    <ChevronDown size={12} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {(form.videos || []).length > 1 && (
                                                            <div 
                                                                className="p-1 bg-white/5 text-gray-400 rounded-lg hover:text-white transition-colors"
                                                                title="اضغط واسحب للترتيب"
                                                            >
                                                                <GripVertical size={12} />
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">فيديو {idx + 1}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                value={vid.url}
                                                                onChange={e => {
                                                                    const next = [...form.videos];
                                                                    next[idx].url = e.target.value;
                                                                    setForm(prev => ({ ...prev, videos: next }));
                                                                }}
                                                                placeholder="ضع رابط الفيديو هنا (YouTube / Drive...)"
                                                                className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 pr-4 pl-10 text-right outline-none focus:border-cyan-500/30 text-xs font-bold transition-all"
                                                            />
                                                            <Link size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/50 pointer-events-none" />
                                                        </div>
                                                        {vid.url.trim() && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTrimStart(0);
                                                                    setTrimEnd(0);
                                                                    setVideoDuration(0);
                                                                    setIframeTrimInfo({});
                                                                    setPreviewVideo({ url: vid.url.trim(), idx });
                                                                }}
                                                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-[11px] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                                                title="معاينة الفيديو"
                                                            >
                                                                <Play size={12} />
                                                                تشغيل
                                                            </button>
                                                        )}
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={vid.title}
                                                        onChange={e => {
                                                            const next = [...form.videos];
                                                            next[idx].title = e.target.value;
                                                            setForm(prev => ({ ...prev, videos: next }));
                                                        }}
                                                        placeholder="اسم الفيديو (مثال: المقدمة)"
                                                        className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 px-4 text-right outline-none focus:border-cyan-500/30 text-xs font-bold transition-all"
                                                    />

                                                    <textarea
                                                        value={vid.description}
                                                        onChange={e => {
                                                            const next = [...form.videos];
                                                            next[idx].description = e.target.value;
                                                            setForm(prev => ({ ...prev, videos: next }));
                                                        }}
                                                        placeholder="وصف الفيديو (اختياري)"
                                                        className="w-full bg-black/60 border border-white/5 rounded-xl py-2 px-4 text-right outline-none focus:border-cyan-500/30 text-[10px] transition-all min-h-[40px] resize-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center justify-end gap-1">
                                        <Sparkles size={14} className="text-yellow-500" />
                                        الكوينز المطلوبة لفتح الكورس
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.requiredCoins}
                                            onChange={e => setForm({ ...form, requiredCoins: Number(e.target.value) })}
                                            min="0"
                                            className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-2xl py-3 px-10 text-right outline-none focus:border-yellow-500/50 font-black text-yellow-500"
                                        />
                                        <Sparkles size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" />
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-bold mt-1 block">اتركه 0 إذا لم تكن تريد قفله بالكوينز</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2 flex items-center justify-end gap-1">
                                    <Brain size={14} className="text-cyan-400" />
                                    النقاط المطلوبة لفتح الكورس
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center justify-end gap-1">
                                        <Sparkles size={14} className="text-purple-400" />
                                        ربط اختبار (كويز) بهذا الكورس
                                    </label>
                                    <select
                                        value={form.quizId}
                                        onChange={e => setForm({ ...form, quizId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-purple-500/50 font-bold text-sm"
                                    >
                                        <option value="">لا يوجد اختبار مرتبطة</option>
                                        {allExams.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.title} ({ex.year})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-gray-500 mr-2">وحدة / قسم الكورس</label>
                                    <input
                                        type="text"
                                        value={form.unit}
                                        onChange={e => setForm({ ...form, unit: e.target.value })}
                                        placeholder="مثال: المادة الأولى"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-purple-500/50 font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">رفع ملف فيديو مباشر</label>
                                <label className="flex items-center justify-between w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 cursor-pointer hover:border-cyan-500/30 transition-all group/up">
                                    <FileUp size={20} className="text-gray-500 group-hover/up:text-cyan-400 transition-colors" />
                                    <span className="text-gray-400 text-sm font-bold truncate max-w-[150px]">{form.videoFile ? form.videoFile.split('|||')[0] : 'اختر فيديو'}</span>
                                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
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
                                        <span className="text-xs font-black text-emerald-400">تفعيل الدخول المجاني؟</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
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
                                <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
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
                                        <span className="text-xs font-black text-gray-400">السماح بتحميل الفيديو؟</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        {isEditing && (
                            <button
                                onClick={() => {
                                    setForm({ id: '', title: '', description: '', category: '', allowDownload: false, price: 0, videoUrls: [''], videos: [{ title: '', url: '', description: '' }], videoFile: '', isFree: false, discountPercentage: 0, thumbnail: '', showPremiumLock: false, requiredCoins: 0, requiredPoints: 0, quizId: '', unit: '' });
                                    setIsEditing(false);
                                }}
                                className="flex-1 py-4 rounded-2xl font-black text-gray-500 bg-white/5 hover:bg-white/10 transition-all"
                            >
                                إلغاء
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isUploading}
                            className="flex-[2] py-4 rounded-2xl font-black text-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{ backgroundColor: theme.primary }}
                        >
                            {isUploading ? 'جاري الرفع...' : isEditing ? 'تحديث الكورس' : 'حفظ ونشر الكورس'}
                            <Save size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest text-right w-full">الكورسات المتاحة ({filteredList.length})</span>
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2 pb-10">
                    {filteredList.length === 0 ? (
                        <div className="p-16 text-center glass rounded-3xl border border-white/5 border-dashed">
                            <Video size={40} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-500 font-bold">لا توجد كورسات في هذه الفئة</p>
                        </div>
                    ) : (
                        filteredList.map((course) => (
                            <div
                                key={course.id}
                                className="glass p-6 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all flex flex-col gap-4 relative"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const newVisible = !course.isVisible;
                                                DB.updateCourse(course.id, { isVisible: newVisible });
                                                setCourseList(DB.getCourses());
                                            }}
                                            className={cn(
                                                "p-2.5 rounded-xl transition-all border border-white/5",
                                                course.isVisible ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                            )}
                                            title={course.isVisible ? "إخفاء" : "إظهار"}
                                        >
                                            {course.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all border border-white/5"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(course.id)}
                                            className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-white/5"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <h4 className="font-black text-base text-gray-200 group-hover:text-cyan-400 transition-colors">{course.title}</h4>
                                        <div className="flex items-center justify-end gap-3 mt-1">
                                            <span className="text-[10px] font-bold text-cyan-500">{course.category || 'عام'}</span>
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            <div className="flex flex-col items-end">
                                                {course.discountPercentage > 0 && !course.isFree ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-500 line-through">{course.price} ج.م</span>
                                                        <span className="text-xs font-black text-emerald-500">{course.price - (course.price * (course.discountPercentage / 100))} ج.م</span>
                                                        <div className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[8px] font-black border border-red-500/20">-{course.discountPercentage}%</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-black text-emerald-500">{course.isFree ? 'مجاني' : `${course.price} ج.م`}</span>
                                                )}
                                            </div>
                                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                            <span className="text-[10px] font-bold text-gray-500">{course.date}</span>
                                            {course.isFree && <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black border border-emerald-500/20">دخول مجاني</div>}
                                            {course.showPremiumLock && <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md text-[8px] font-black border border-amber-500/20 flex items-center gap-1"><Lock size={10} /> قفل 3D</div>}
                                            {course.requiredCoins && course.requiredCoins > 0 ? (
                                                <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-md text-[8px] font-black border border-yellow-500/20 flex items-center gap-1">
                                                    <Sparkles size={10} /> {course.requiredCoins}
                                                </div>
                                            ) : null}
                                            {course.requiredPoints && course.requiredPoints > 0 ? (
                                                <div className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md text-[8px] font-black border border-cyan-500/20 flex items-center gap-1">
                                                    <Brain size={10} /> {course.requiredPoints}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                VIDEO PREVIEW MODAL
                Pure client-side — ZERO DB reads/writes
            ══════════════════════════════════════════ */}
            {previewVideo && (() => {
                const { type, src } = getEmbedUrl(previewVideo.url, iframeTrimInfo.start, iframeTrimInfo.end);
                const isDirectVideo = type === 'video';
                return (
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setPreviewVideo(null); }}
                    >
                        <div
                            id="video-preview-modal"
                            className="relative w-full max-w-4xl mx-4 glass rounded-[2.5rem] border border-white/10 overflow-y-auto no-scrollbar shadow-2xl max-h-[90vh] flex flex-col"
                            style={{ boxShadow: '0 0 60px rgba(0,255,200,0.08)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                <button
                                    onClick={() => setPreviewVideo(null)}
                                    className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                                >
                                    <X size={18} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-gray-200">معاينة الفيديو</span>
                                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                                        <Play size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Player */}
                            <div id="video-player-container" className="relative w-full flex-shrink-0 bg-black" style={{ paddingTop: '56.25%' }}>
                                {isDirectVideo ? (
                                    <video
                                        ref={videoRef}
                                        src={src}
                                        controls
                                        autoPlay
                                        className="absolute inset-0 w-full h-full"
                                        onLoadedMetadata={(e) => {
                                            const dur = (e.target as HTMLVideoElement).duration;
                                            setVideoDuration(Math.floor(dur));
                                            if (trimEnd === 0) setTrimEnd(Math.floor(dur));
                                        }}
                                        onTimeUpdate={(e) => {
                                            const vid = e.target as HTMLVideoElement;
                                            if (trimEnd > 0 && vid.currentTime >= trimEnd) {
                                                vid.pause();
                                            }
                                        }}
                                    />
                                ) : (
                                    <iframe
                                        src={src}
                                        className="absolute inset-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        frameBorder="0"
                                    />
                                )}
                            </div>

                            {/* Trim Controls — Always visible */}
                            <div className="px-6 py-5 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-400">
                                    <Scissors size={14} className="text-cyan-400" />
                                    <span>خيارات قص الفيديو</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 text-right">
                                        <label className="text-[10px] font-black text-gray-500">بداية القص (ثانية)</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTrimStart(s => Math.max(0, s - 1))}
                                                className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                                            ><ChevronRight size={14} /></button>
                                            <input
                                                type="number"
                                                value={trimStart}
                                                min={0}
                                                max={trimEnd > 0 ? trimEnd - 1 : undefined}
                                                onChange={e => setTrimStart(Math.max(0, Number(e.target.value)))}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-center outline-none focus:border-cyan-500/50 font-black text-cyan-400 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setTrimStart(s => s + 1)}
                                                className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                                            ><ChevronLeft size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <label className="text-[10px] font-black text-gray-500">نهاية القص (ثانية)</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTrimEnd(s => Math.max(trimStart + 1, s - 1))}
                                                className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                                            ><ChevronRight size={14} /></button>
                                            <input
                                                type="number"
                                                value={trimEnd}
                                                min={trimStart + 1}
                                                max={videoDuration > 0 ? videoDuration : undefined}
                                                onChange={e => setTrimEnd(Math.max(Number(e.target.value), trimStart + 1))}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-center outline-none focus:border-cyan-500/50 font-black text-cyan-400 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setTrimEnd(s => (videoDuration > 0 ? Math.min(videoDuration, s + 1) : s + 1))}
                                                className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                                            ><ChevronLeft size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline bar */}
                                {videoDuration > 0 && (
                                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="absolute h-full bg-cyan-500/40 rounded-full transition-all"
                                            style={{
                                                left: `${(trimStart / videoDuration) * 100}%`,
                                                width: `${((trimEnd - trimStart) / videoDuration) * 100}%`
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="text-center text-[10px] text-gray-500 font-bold">
                                    المقطع المحدد: {trimStart}ث → {trimEnd}ث
                                    &nbsp;|&nbsp;
                                    المدة: {trimEnd - trimStart}ث {videoDuration > 0 ? `من أصل ${videoDuration}ث` : ''}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isDirectVideo && videoRef.current) {
                                            videoRef.current.currentTime = trimStart;
                                            videoRef.current.play();
                                        } else {
                                            // Set state so the iframe re-renders with new src parameters
                                            setIframeTrimInfo({ start: trimStart, end: trimEnd });
                                        }
                                        // Auto-scroll to the player so the user can see the preview
                                        setTimeout(() => {
                                            document.getElementById('video-player-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 50);
                                    }}
                                    className="w-full flex-shrink-0 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2"
                                >
                                    <Play size={14} />
                                    معاينة المقطع المحدد
                                </button>
                            </div>

                            {/* Footer - Save button */}
                            <div className="px-6 py-4 border-t border-white/5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPreviewVideo(null)}
                                    className="flex-1 py-3 rounded-2xl font-black text-gray-500 bg-white/5 hover:bg-white/10 transition-all text-sm"
                                >
                                    إغلاق
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Save trim metadata into the video description (client-side only)
                                        if (trimEnd > trimStart) {
                                            const next = [...form.videos];
                                            const trimNote = `[قص: ${trimStart}ث-${trimEnd}ث]`;
                                            const desc = next[previewVideo.idx].description || '';
                                            // Update or append trim note
                                            next[previewVideo.idx].description = desc.replace(/\[قص:.*?\]/g, '').trim() + ' ' + trimNote;
                                            setForm(prev => ({ ...prev, videos: next }));
                                            alert(`✅ تم حفظ بيانات القص: ${trimStart}ث → ${trimEnd}ث
ستُطبق هذه الإعدادات عند تشغيل الفيديو للمستخدم.`);
                                        }
                                        setPreviewVideo(null);
                                    }}
                                    className="flex-[2] py-3 rounded-2xl font-black text-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-2 text-sm"
                                    style={{ backgroundColor: '#22d3ee' }}
                                >
                                    <Save size={16} />
                                    حفظ التغييرات
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

