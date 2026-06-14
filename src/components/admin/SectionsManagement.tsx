
import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Edit2, Trash, Trash2, Save, X, PlusCircle, Check, AlertCircle, FileText,
    Lock, Unlock, FileUp, Calendar, ExternalLink, CheckSquare, Eye, EyeOff, Package, Layout,
    Brain, Sparkles, FolderPlus, ChevronLeft, ChevronRight, Filter, BookOpen
} from 'lucide-react';
import { DB, DEFAULT_SUBJECTS, logSecurityEvent } from '../../services/db';
import { Section, Question } from '../../types';

const normalizeArabic = (text: string) => {
    if (!text) return '';
    return text.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
};

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

// ────────────────────────────────────────────────────────────
// SubjectsPanel — embedded subjects manager (matches screenshot)
// ────────────────────────────────────────────────────────────
interface SubjectsPanelProps {
    stage: string;
    year: string;
    specialization: string;
    units: string[];
    setUnits: (u: string[]) => void;
    theme: any;
    onSave: (names: string[]) => void;
}

const SubjectsPanel: React.FC<SubjectsPanelProps> = ({ stage, year, specialization, units, setUnits, theme, onSave }) => {
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editVal, setEditVal] = useState('');
    const [newName, setNewName] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const handleAdd = () => {
        if (!newName.trim()) return;
        const next = [...units, newName.trim()];
        setUnits(next);
        onSave(next);
        setNewName('');
        setShowAdd(false);
    };

    const handleDelete = (i: number) => {
        if (!window.confirm(`هل تريد حذف "${units[i]}"؟`)) return;
        const next = units.filter((_, idx) => idx !== i);
        setUnits(next);
        onSave(next);
    };

    const handleSaveEdit = () => {
        if (editingIdx === null || !editVal.trim()) return;
        const next = units.map((u, i) => i === editingIdx ? editVal.trim() : u);
        setUnits(next);
        onSave(next);
        setEditingIdx(null);
    };

    return (
        <div className="glass rounded-3xl border border-white/5 p-5 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg">
                        {units.length} مواد
                    </span>
                </div>
                <h3 className="text-lg font-black text-right flex items-center justify-end gap-2 text-white">
                    <span>إدارة المواد ({stage} - {year}{specialization ? ` - ${specialization}` : ''})</span>
                    <BookOpen size={18} className="text-cyan-400" />
                </h3>
            </div>

            <div className="flex overflow-x-auto no-scrollbar items-center justify-start gap-3 pb-2 w-full" dir="rtl">
                {showAdd ? (
                    <div className="flex items-center bg-black/60 border border-cyan-500/50 rounded-full px-2 py-1.5 flex-shrink-0" dir="rtl">
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false); }}
                            autoFocus
                            placeholder="اسم المادة..."
                            className="bg-transparent text-sm font-bold text-white outline-none px-2 w-32"
                        />
                        <button onClick={handleAdd} className="p-1.5 bg-cyan-500 text-black rounded-full hover:bg-cyan-400 mr-1"><Check size={14} /></button>
                        <button onClick={() => setShowAdd(false)} className="p-1.5 text-gray-400 hover:text-red-400 mr-1"><X size={14} /></button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-xs transition-all hover:bg-cyan-500/30 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex-shrink-0"
                    >
                        <Plus size={14} /> إضافة مادة
                    </button>
                )}

                {units.map((name, idx) => (
                    <div key={idx} className="group relative flex items-center bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm font-bold text-white hover:border-cyan-500/50 hover:bg-white/5 transition-all flex-shrink-0">
                        {editingIdx === idx ? (
                            <div className="flex items-center gap-2" dir="rtl">
                                <input type="text" value={editVal} onChange={e => setEditVal(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                                    autoFocus className="bg-transparent border-b border-cyan-500 outline-none text-right w-24 text-cyan-400" />
                                <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                                <button onClick={() => setEditingIdx(null)} className="text-gray-400 hover:text-red-400"><X size={14} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingIdx(idx); setEditVal(name); }} className="text-cyan-400 hover:text-cyan-300 p-1"><Edit2 size={13} /></button>
                                    <button onClick={() => handleDelete(idx)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                                </div>
                                <span>{name}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {units.length === 0 && !showAdd && (
                <div className="text-center py-2 opacity-50 text-xs font-bold">لا توجد مواد مضافة حالياً</div>
            )}
        </div>
    );
};

interface Props {
    isDarkMode: boolean;
    theme: any;
    sectionList: Section[];
    setSectionList: (list: Section[]) => void;
}

export const SectionsManagement: React.FC<Props> = ({ isDarkMode, theme, sectionList, setSectionList }) => {
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

    const [settings, setSettings] = useState(() => DB.getSettings());
    const [isSectionsEnabled, setIsSectionsEnabled] = useState<boolean>(settings.isSectionsEnabled ?? true);

    useEffect(() => {
        const handleSync = () => {
            const current = DB.getSettings();
            setSettings(current);
            setIsSectionsEnabled(current.isSectionsEnabled ?? true);
        };
        window.addEventListener('nt-settings-change', handleSync);
        return () => window.removeEventListener('nt-settings-change', handleSync);
    }, []);

    const [form, setForm] = useState({
        id: '',
        title: '',
        text: '',
        unit: filter.unit,
        type: 'MCQ' as 'MCQ' | 'TF' | 'essay',
        files: [] as string[], // Base64 data URLs: "name|||base64"
        pdfUrl: '',
        linkUrl: '',
        videoUrl: '',
        questions: [] as Question[],
        thumbnail: '',
        isFree: true,
        showPremiumLock: false,
        requiredCoins: 0,
        requiredPoints: 0,
        allowDownload: false
    });

    const [isEditing, setIsEditing] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');
    const [showAddUnitInput, setShowAddUnitInput] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingUnitName, setEditingUnitName] = useState({ oldName: '', newName: '' });
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    // Sync lock state
    const [lockForceUpdate, setLockForceUpdate] = useState(0);

    const stages = ['اعمال دوليه IB', 'نظم المعلومات BIS'];
    const years = ['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'];
    
    
    const semesters = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني'];

    

    const currentLockStatus = DB.isSemesterLocked(filter.stage, filter.year, filter.specialization);

    const handleStageChange = (stage: string) => {
        setFilter({
            ...filter,
            stage,
            year: 'الفرقة الأولى', specialization: ''
        });
    };

    const handleLockToggle = (locked: boolean) => {
        DB.setSemesterStatus(filter.stage, filter.year, filter.specialization, locked);
        setLockForceUpdate(v => v + 1);
    };

    useEffect(() => {
        const u = DB.getSubjects(filter.stage, filter.year, filter.specialization);
        setUnits(u);
    }, [filter.stage, filter.year, filter.specialization]);

    const handleAddUnit = () => {
        if (!newUnitName.trim()) return;
        const updatedUnits = [...units, newUnitName.trim()];
        setUnits(updatedUnits);
        DB.saveSubjects(filter.stage, filter.year, filter.specialization, updatedUnits);
        setNewUnitName('');
        setShowAddUnitInput(false);
    };

    const handleDeleteUnit = (u: string) => {
        const updatedUnits = units.filter(item => item !== u);
        setUnits(updatedUnits);
        DB.saveSubjects(filter.stage, filter.year, filter.specialization, updatedUnits);

        if (filter.unit === u) setFilter({ ...filter, unit: updatedUnits[0] });
        if (form.unit === u) setForm({ ...form, unit: updatedUnits[0] });
    };

    const handleRenameUnit = (oldName: string, newName: string) => {
        if (!newName.trim() || newName === oldName) {
            setEditingUnitName({ oldName: '', newName: '' });
            return;
        }
        const updatedUnits = units.map(u => u === oldName ? newName.trim() : u);
        setUnits(updatedUnits);
        DB.saveSubjects(filter.stage, filter.year, filter.specialization, updatedUnits);

        const allSection = DB.getSection();
        let changed = false;
        const updatedSection = allSection.map(c => {
            const oldUnitTrimmed = oldName.trim();
            const cUnitTrimmed = (c.unit || '').trim();
            if (cUnitTrimmed === oldUnitTrimmed && c.stage === filter.stage && c.year === filter.year && c.semester === filter.semester) {
                changed = true;
                return { ...c, unit: newName.trim() };
            }
            return c;
        });
        if (changed) {
            DB.saveSection(updatedSection);
            setSectionList(updatedSection);
        }

        if (filter.unit === oldName) setFilter({ ...filter, unit: newName.trim() });
        if (form.unit === oldName) setForm({ ...form, unit: newName.trim() });
        setEditingUnitName({ oldName: '', newName: '' });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIndex) return;

        const newUnits = [...units];
        const [draggedItem] = newUnits.splice(draggedIdx, 1);
        newUnits.splice(dropIndex, 0, draggedItem);

        setUnits(newUnits);
        DB.saveSubjects(filter.stage, filter.year, filter.specialization, newUnits);
        setDraggedIdx(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        setIsUploading(true);
        const newFiles: string[] = [...form.files];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                newFiles.push(`${file.name}|||${base64}`);
                if (newFiles.length === form.files.length + files.length) {
                    setForm(prev => ({ ...prev, files: newFiles }));
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleAddQuestion = () => {
        const type = form.type;
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            type,
            options: type === 'MCQ' ? ['', '', '', ''] : undefined,
            correctAnswer: type === 'MCQ' ? 0 : type === 'TF' ? 'صح' : '',
            essayChoices: type === 'essay' ? ['', '', ''] : undefined
        };
        setForm({ ...form, questions: [...form.questions, newQuestion] });
    };

    const handleSave = () => {
        if (!form.title.trim()) {
            return alert('يرجى كتابة العنوان على الأقل');
        }

        const selectedUnit = isEditing ? form.unit : filter.unit;
        const finalUnit = selectedUnit === 'الكل' ? (units[0] || "") : selectedUnit;

        const sectionData: Section = {
            id: isEditing ? form.id : Date.now().toString(),
            stage: filter.stage,
            year: filter.year,
            specialization: filter.specialization,
            semester: filter.semester,
            unit: finalUnit.trim(),
            title: form.title,
            text: form.text,
            files: form.files,
            pdfUrl: form.pdfUrl,
            linkUrl: form.linkUrl,
            videoUrl: form.videoUrl,
            questions: form.questions,
            date: new Date().toLocaleDateString('ar-EG'),
            isVisible: true,
            isFree: !!form.isFree,
            showPremiumLock: !!form.showPremiumLock,
            allowDownload: !!form.allowDownload,
            requiredCoins: Number(form.requiredCoins || 0),
            requiredPoints: Number(form.requiredPoints || 0),
            thumbnail: form.thumbnail
        };

        if (isEditing) {
            DB.updateSection(sectionData.id, sectionData);
        } else {
            DB.addSection(sectionData);
            logSecurityEvent('content_created', 'info', { title: sectionData.title, year: sectionData.year });
            // Automatic Notification
            DB.addNotification({
                id: Date.now().toString(),
                title: 'سكشن جديد متاح 📖',
                message: `تمت إضافة سكشن جديد: "${sectionData.title}" لطلاب ${sectionData.year}.`,
                date: new Date().toLocaleDateString('ar-EG'),
                target: 'year',
                stage: sectionData.stage,
                year: sectionData.year
            });
        }

        setSectionList(DB.getSection());
        setForm({ id: '', title: '', text: '', unit: filter.unit, type: 'MCQ', files: [], pdfUrl: '', linkUrl: '', videoUrl: '', questions: [], thumbnail: '', isFree: true, showPremiumLock: false, requiredCoins: 0, requiredPoints: 0, allowDownload: false });
        setIsEditing(false);
        alert('تم الحفظ بنجاح');
    };

    const handleDelete = (id: string) => {
        DB.deleteSection(id);
        setSectionList(DB.getSection());
    };

    const handleEdit = (c: Section) => {
        setForm({
            id: c.id,
            title: c.title,
            text: c.text,
            unit: (c.unit || units[0] || '').trim(),
            files: c.files || [],
            pdfUrl: c.pdfUrl || '',
            linkUrl: c.linkUrl || '',
            videoUrl: c.videoUrl || '',
            questions: c.questions || [],
            thumbnail: c.thumbnail || '',
            isFree: c.isFree !== false,
            showPremiumLock: !!c.showPremiumLock,
            allowDownload: !!c.allowDownload,
            requiredCoins: c.requiredCoins || 0,
            requiredPoints: c.requiredPoints || 0,
            type: 'MCQ'
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleForceEdit = (e: any) => {
            if (e.detail.type === 'content') {
                const item = e.detail.item;
                setFilter(prev => ({ ...prev, stage: item.stage, year: item.year, semester: item.semester, unit: item.unit || units[0], specialization: item.specialization || '' }));
                handleEdit(item);
            }
        };
        window.addEventListener('nt-admin-force-edit-section', handleForceEdit);
        return () => window.removeEventListener('nt-admin-force-edit-section', handleForceEdit);
    }, [units]);

    const filteredList = sectionList.filter(c => {
        const cUnit = normalizeArabic(c.unit || units[0] || '');
        const fUnit = normalizeArabic(filter.unit || '');
        const cStage = normalizeArabic(c.stage || '');
        const fStage = normalizeArabic(filter.stage || '');
        const cYear = normalizeArabic(c.year || '');
        const fYear = normalizeArabic(filter.year || '');
        const cSem = normalizeArabic(c.semester || '');
        const fSem = normalizeArabic(filter.semester || '');

        const matchStage = fStage === normalizeArabic('الكل') || cStage === fStage;
        const matchYear = fYear === normalizeArabic('الكل') || cYear === fYear;
        const matchSemester = fSem === normalizeArabic('الكل') || cSem === fSem;
        const matchUnit = fUnit === normalizeArabic('الكل') || cUnit === fUnit;

        return matchStage && matchYear && matchSemester && matchUnit;
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-black text-white text-right">إدارة السكاشن</h2>

                {/* Semester Lock Switcher — Main Admin Only */}
                {!localStorage.getItem('nt_admin_config') && (
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-3xl border border-white/5 self-end">
                    <button
                        onClick={() => handleLockToggle(false)}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2",
                            !currentLockStatus ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:bg-white/5"
                        )}
                    >
                        <Unlock size={14} />
                        فتح الفصل
                    </button>
                    <button
                        onClick={() => handleLockToggle(true)}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2",
                            currentLockStatus ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-500 hover:bg-white/5"
                        )}
                    >
                        <Lock size={14} />
                        قفل الفصل
                    </button>
                </div>
                )}
            </div>

            {/* Global Sections Toggle — Main Admin Only */}
            {!localStorage.getItem('nt_admin_config') && (
            <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="text-right flex flex-col items-start gap-2">
                        <h3 className="text-white font-black text-lg">تفعيل قسم إدارة السكاشن للطالب</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide border ${isSectionsEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {isSectionsEnabled ? 'ظاهر عند الطلاب' : 'مغلق عند الطلاب'}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const newValue = !isSectionsEnabled;
                            setIsSectionsEnabled(newValue);
                            DB.updateSettings({ ...settings, isSectionsEnabled: newValue });
                        }}
                        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black ${isSectionsEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-300 ${isSectionsEnabled ? 'translate-x-1' : 'translate-x-7'}`} />
                    </button>
                </div>
            </div>
            )}

            {/* Stage/Year/Unit Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 glass rounded-[2.5rem] border border-white/5">
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
                    <label className="text-xs font-bold text-gray-500 mr-2 flex items-center justify-end gap-2">
                        المادة
                        {currentLockStatus && <Lock size={12} className="text-red-500" />}
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={filter.unit}
                            onChange={(e) => setFilter({ ...filter, unit: e.target.value })}
                            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                        >
                            <option value="الكل">الكل (أرشيف كامل)</option>
                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {/* ===== Subjects Management Panel ===== */}
            <SubjectsPanel
                stage={filter.stage}
                year={filter.year}
                specialization={filter.specialization}
                units={units}
                setUnits={setUnits}
                theme={theme}
                onSave={(names) => {
                    DB.saveSubjects(filter.stage, filter.year, filter.specialization, names);
                    setUnits(DB.getSubjects(filter.stage, filter.year, filter.specialization));
                }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form Section */}
                <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -z-10 group-hover:bg-cyan-500/10 transition-all duration-700" />

                    <h3 className="text-xl font-black text-right mb-6 flex items-center justify-end gap-3">
                        {isEditing ? 'تعديل السكشن' : 'إضافة سكشن جديد'}
                        <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                            {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                        </div>
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">عنوان السكشن</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="عنوان الدرس أو السكشن"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                            />
                        </div>

                        <div className="space-y-1 text-right">
                            <label className="text-xs font-bold text-gray-500 mr-2">نص السكشن (اختياري)</label>
                            <textarea
                                value={form.text}
                                onChange={(e) => setForm({ ...form, text: e.target.value })}
                                placeholder="اكتب ملخص الدرس أو ملاحظات الطلاب هنا..."
                                className="w-full bg-black/40 border border-white/10 rounded-3xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all min-h-[150px] resize-none leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">المرفقات (PDF)</label>
                                <label className="flex items-center justify-between w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 cursor-pointer hover:border-cyan-500/30 transition-all group/up">
                                    <FileUp size={18} className="text-gray-500 group-hover/up:text-cyan-400 transition-colors" />
                                    <span className="text-gray-400 text-sm">ارفع ملف PDF</span>
                                    <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">رابط ملف PDF خارجي (اختياري)</label>
                                <input
                                    type="text"
                                    value={form.pdfUrl}
                                    onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                                    placeholder="أضف رابط التحميل المباشر أو Drive هنا..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-[10px]"
                                />
                            </div>
                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-gray-500 mr-2">رابط سكشن خارجي (مثال: جوجل فورم) (اختياري)</label>
                                <input
                                    type="text"
                                    value={form.linkUrl}
                                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                                    placeholder="أضف رابط لاختبار أو موقع..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-[10px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">

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
                                        <span className="text-xs font-black text-emerald-400">سكشن مجاني؟</span>
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
                                                "w-12 h-6 rounded-full relative transition-all duration-300 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]",
                                                form.allowDownload ? "bg-blue-500" : "bg-gray-700"
                                            )}
                                        >
                                            <div
                                                style={{ left: form.allowDownload ? '24px' : '4px' }}
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300"
                                            />
                                        </button>
                                        <span className="text-xs font-black text-blue-400">إتاحة التحميل المباشر؟</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 text-right">
                                    <label className="text-[10px] font-black text-gray-500 mr-2 flex items-center justify-end gap-1">
                                        <Sparkles size={10} className="text-yellow-400" />
                                        الكوينز المطلوبة (لغير البريميوم)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.requiredCoins}
                                        onChange={(e) => setForm({ ...form, requiredCoins: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-yellow-500/50 transition-all font-bold text-sm"
                                        placeholder="0 كوينز"
                                    />
                                </div>
                                <div className="space-y-1 text-right">
                                    <label className="text-[10px] font-black text-gray-500 mr-2 flex items-center justify-end gap-1">
                                        <Brain size={10} className="text-cyan-400" />
                                        النقاط المطلوبة (لفك القفل)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.requiredPoints}
                                        onChange={(e) => setForm({ ...form, requiredPoints: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                        placeholder="0 نقاط"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Question Builder (Exactly Mirroring ExamManagement) */}
                        <div className="space-y-6 pt-6 border-t border-white/5">
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
                                <label className="text-sm text-gray-400 font-bold">الأسئلة والتقييم الذاتي</label>
                            </div>

                            <div className="space-y-4 text-right">
                                <label className="text-[10px] text-gray-500 font-bold">نوع الأسئلة المضافة حالياً</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setForm({ ...form, type: 'TF' })}
                                        className={`py-3 rounded-xl font-bold border transition-all text-xs ${form.type === 'TF' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                    >
                                        صح / غلط
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, type: 'MCQ' })}
                                        className={`py-3 rounded-xl font-bold border transition-all text-xs ${form.type === 'MCQ' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                    >
                                        اختياري (MCQ)
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, type: 'essay' })}
                                        className={`py-3 rounded-xl font-bold border transition-all text-xs ${form.type === 'essay' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                    >
                                        مقال (Essay)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                                {form.questions.map((q, idx) => (
                                    <div key={q.id} className="p-5 bg-white/5 rounded-[2rem] border border-white/5 space-y-4 relative group/q hover:bg-white/[0.07] transition-all">
                                        <button
                                            onClick={() => setForm(prev => ({ ...prev, questions: prev.questions.filter(qu => qu.id !== q.id) }))}
                                            className="absolute top-4 left-4 text-red-500 hover:bg-red-500/10 p-1.5 rounded-xl opacity-0 group-hover/q:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="space-y-2 text-right">
                                            <label className="text-[10px] text-gray-500 font-black">السؤال رقم {idx + 1} ({q.type === 'MCQ' ? 'اختياري' : q.type === 'TF' ? 'صح/خطأ' : 'مقالي'})</label>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={e => {
                                                    const newQs = [...form.questions];
                                                    newQs[idx].text = e.target.value;
                                                    setForm({ ...form, questions: newQs });
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-5 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                                placeholder="اكتب نص السؤال هنا..."
                                            />
                                        </div>

                                        {q.type === 'essay' ? (
                                            <div className="space-y-4">
                                                <div className="text-[10px] text-emerald-400 font-bold text-right">:اكتب 3 نماذج للإجابة المقبولة</div>
                                                <div className="space-y-2">
                                                    {q.essayChoices?.map((opt, optIdx) => (
                                                        <input
                                                            key={optIdx}
                                                            type="text"
                                                            value={opt}
                                                            onChange={e => {
                                                                const newQs = [...form.questions];
                                                                if (newQs[idx].essayChoices) {
                                                                    newQs[idx].essayChoices![optIdx] = e.target.value;
                                                                    setForm({ ...form, questions: newQs });
                                                                }
                                                            }}
                                                            className="w-full bg-black/20 border border-emerald-500/10 rounded-xl py-2.5 px-4 text-right text-xs outline-none focus:border-emerald-500/50 transition-all"
                                                            placeholder={`نموذج إجابة ${optIdx + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : q.options !== undefined ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {q.options?.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center justify-end gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
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
                                                            className="flex-1 bg-transparent text-right text-xs outline-none font-bold"
                                                            placeholder={`خيار ${optIdx + 1}`}
                                                        />
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="radio"
                                                                name={`c-mgmt-${q.id}`}
                                                                checked={q.correctAnswer === optIdx}
                                                                onChange={() => {
                                                                    const newQs = [...form.questions];
                                                                    newQs[idx].correctAnswer = optIdx;
                                                                    setForm({ ...form, questions: newQs });
                                                                }}
                                                                className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-8 pt-2">
                                                <label className="flex items-center gap-3 cursor-pointer group/opt">
                                                    <span className={`text-xs font-black transition-colors ${q.correctAnswer === 'غلط' ? 'text-red-500' : 'text-gray-500 group-hover/opt:text-gray-400'}`}>غلط</span>
                                                    <input
                                                        type="radio"
                                                        name={`c-mgmt-${q.id}`}
                                                        checked={q.correctAnswer === 'غلط'}
                                                        onChange={() => {
                                                            const newQs = [...form.questions];
                                                            newQs[idx].correctAnswer = 'غلط';
                                                            setForm({ ...form, questions: newQs });
                                                        }}
                                                        className="w-4 h-4 accent-red-500"
                                                    />
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group/opt">
                                                    <span className={`text-xs font-black transition-colors ${q.correctAnswer === 'صح' ? 'text-emerald-500' : 'text-gray-500 group-hover/opt:text-gray-400'}`}>صح</span>
                                                    <input
                                                        type="radio"
                                                        name={`c-mgmt-${q.id}`}
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
                                {form.questions.length === 0 && (
                                    <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-30 flex flex-col items-center gap-4">
                                        <Brain size={40} className="text-gray-600" />
                                        <p className="text-xs font-bold leading-relaxed">لا توجد أسئلة مضافة لهذا القسم بعد.<br />اضغط على رمز (+) لإضافة أول سؤال.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {form.files.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right">الملفات المرفوعة :</p>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {form.files.map((fileEntry, i) => {
                                        const name = fileEntry.split('|||')[0];
                                        return (
                                            <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                                                <button onClick={() => setForm(prev => ({ ...prev, files: prev.files.filter((_, idx) => idx !== i) }))}>
                                                    <X size={12} />
                                                </button>
                                                <span className="truncate max-w-[150px]">{name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex gap-3">
                            {isEditing && (
                                <button
                                    onClick={() => {
                                        setForm({ id: '', title: '', text: '', unit: filter.unit, type: 'MCQ', files: [], pdfUrl: '', linkUrl: '', videoUrl: '', questions: [], thumbnail: '', isFree: true, showPremiumLock: false, requiredCoins: 0, requiredPoints: 0, allowDownload: false });
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
                                className="flex-[2] py-4 rounded-2xl font-black text-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ backgroundColor: theme.primary }}
                            >
                                {isUploading ? 'جاري الرفع...' : isEditing ? 'تحديث السكشن' : 'نشر السكشن الآن'}
                                <Save size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">السكشن المنشور في {filter.unit}</span>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold">
                            <span>{filteredList.length} عنصر</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-10">
                        {filteredList.length === 0 ? (
                            <div className="p-16 text-center glass rounded-3xl border border-white/5 border-dashed">
                                <AlertCircle size={40} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-500 font-bold">لا يوجد سكشن منشور حالياً</p>
                                <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">No items found for this unit</p>
                            </div>
                        ) : (
                            filteredList.map((content) => (
                                <div
                                    key={content.id}
                                    className="glass p-6 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all flex flex-col gap-4 relative"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const newVisibility = !content.isVisible;
                                                    DB.updateSection(content.id, { isVisible: newVisibility });
                                                    setSectionList(DB.getSection());
                                                }}
                                                className={cn(
                                                    "p-2.5 rounded-xl transition-all border border-white/5",
                                                    content.isVisible ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                                )}
                                                title={content.isVisible ? "إخفاء" : "إظهار"}
                                            >
                                                {content.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(content)}
                                                className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all border border-white/5"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(content.id)}
                                                className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-white/5"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <h4 className="font-black text-base text-gray-200 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{content.title}</h4>
                                                <div className="flex items-center justify-end gap-3 mt-1 opacity-50">
                                                    <span className="text-[10px] font-bold">{content.date}</span>
                                                    <Calendar size={12} />
                                                    {content.pdfUrl && <div className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black border border-blue-500/20">رابط خارجي</div>}
                                                    {content.showPremiumLock && <div className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[8px] font-black border border-amber-500/20 flex items-center gap-1"><Lock size={8} /> قفل 3D</div>}
                                                    {content.requiredCoins !== undefined && content.requiredCoins > 0 && (
                                                        <div className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[8px] font-black border border-yellow-500/20 flex items-center gap-1">
                                                            <Sparkles size={8} /> {content.requiredCoins}
                                                        </div>
                                                    )}
                                                    {content.requiredPoints !== undefined && content.requiredPoints > 0 && (
                                                        <div className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[8px] font-black border border-cyan-500/20 flex items-center gap-1">
                                                            <Brain size={8} /> {content.requiredPoints}
                                                        </div>
                                                    )}
                                                    {content.allowDownload && <div className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black border border-blue-500/20">قابل للتحميل</div>}
                                                    {!content.isFree && <div className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[8px] font-black border border-purple-500/20">مدفوع</div>}
                                                </div>
                                            </div>
                                            {content.thumbnail && (
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10 shrink-0">
                                                    <img src={content.thumbnail} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {content.text && (
                                        <p className="text-xs text-right text-gray-400 line-clamp-2 leading-relaxed bg-black/10 p-3 rounded-xl">
                                            {content.text}
                                        </p>
                                    )}

                                    {(content.files.length > 0 || content.pdfUrl || content.linkUrl || (content.questions && content.questions.length > 0)) && (
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {content.pdfUrl && (
                                                <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    رابط PDF خارجي
                                                </div>
                                            )}
                                            {content.linkUrl && (
                                                <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                    <ExternalLink size={10} />
                                                    رابط مضاف
                                                </div>
                                            )}
                                            {content.questions && content.questions.length > 0 && (
                                                <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                    <CheckSquare size={10} />
                                                    شيت {content.questions.length} سؤال
                                                </div>
                                            )}
                                            {content.files.map((file, idx) => (
                                                <div key={idx} className="bg-cyan-500/10 text-cyan-500 p-2 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                    <FileText size={10} />
                                                    {file.split('|||')[0]}
                                                </div>
                                            ))}
                                        </div>
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



