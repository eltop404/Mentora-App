
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
    BookOpen, X, FileText, Download,
    ExternalLink, Clock, Sparkles, Command,
    Layout, LayoutGrid, ChevronRight, ChevronLeft, Book,
    ArrowLeft, ArrowRight, CheckCircle2, Zap, ZapOff
} from 'lucide-react';
import { DB } from '../services/db';
import { Content } from '../types';
import { cn } from '../utils/cn';
import { AdBanner } from './AdBanner';

// Helper to normalize Arabic text for consistent searching/filtering
const normalizeArabic = (text: string) => {
    if (!text) return '';
    return text.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
};

// Helper to get direct download URL for Google Drive links
const getDirectDownloadUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }
    return url;
};

interface AutoFitTitleProps {
    text: string;
    theme: any;
}

const AutoFitTitle: React.FC<AutoFitTitleProps> = ({ text, theme }) => {
    const containerRef = React.useRef<HTMLHeadingElement>(null);
    const [fontSize, setFontSize] = React.useState<string>('');

    const adjustFontSize = React.useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        // Reset font-size to measure the unscaled scrollWidth
        el.style.fontSize = '';

        const parent = el.parentElement;
        if (!parent) return;

        const parentWidth = parent.clientWidth;
        const scrollWidth = el.scrollWidth;

        // Scale proportionally down to a legible minimum of 11px on small mobile screens
        if (window.innerWidth <= 480 && scrollWidth > parentWidth && parentWidth > 0) {
            const ratio = parentWidth / scrollWidth;
            const calculatedSize = Math.max(11, Math.floor(18 * ratio * 0.95));
            setFontSize(`${calculatedSize}px`);
        } else {
            setFontSize('');
        }
    }, []);

    React.useLayoutEffect(() => {
        adjustFontSize();
        
        window.addEventListener('resize', adjustFontSize);
        return () => {
            window.removeEventListener('resize', adjustFontSize);
        };
    }, [text, adjustFontSize]);

    return (
        <h4
            ref={containerRef}
            className="font-black group-hover:text-white w-full text-lg md:text-xl drop-shadow-[0_2px_12px_rgba(0,0,0,1)] text-right subject-card-title"
            style={{ 
                color: theme.primary,
                fontSize: fontSize || undefined,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}
        >
            {text}
        </h4>
    );
};

interface SectionsStudentSectionProps {
    user: { stage: string; year: string; semester: string; specialization?: string; id?: string };
    theme: any;
    onOpenFile?: (fileEntry: string) => void;
    onDownloadFile?: (fileName: string, base64: string) => void;
    onVideoClick?: (video: { title: string; videoUrl?: string; videoFile?: string; description?: string }) => void;
    onUnitOpen?: (unitName: string) => void;
    onUnitClose?: () => void;
    completedExams: string[];
    currentTime?: number;
    onOpenRetakeModal?: (exam: any) => void;
    onLockClick?: (type: 'شيت' | 'سكشن', item: any) => void;
    achievements: any[];
    purchasedLessons: string[];
    isBgAnimated?: boolean;
    toggleBgAnimation?: () => void;
}

export const SectionsStudentSection: React.FC<SectionsStudentSectionProps> = ({ user, theme, onVideoClick, onOpenFile, onDownloadFile, onUnitOpen, onUnitClose, completedExams, currentTime, onOpenRetakeModal, onLockClick, achievements, purchasedLessons, isBgAnimated, toggleBgAnimation }) => {
    const [units, setUnits] = useState<string[]>(() => DB.getSubjects().filter(s => s.division === user.stage && s.year === user.year && (s.specialization === user.specialization || !s.specialization || user.year === 'الفرقة الأولى' || user.year === 'الفرقة الثانية')).map(s => s.name));
    const [contents, setContents] = useState<Content[]>(() => DB.getSections());
    const [activeUnit, setActiveUnit] = useState<string | null>(null);
    const [unitSeenTimes, setUnitSeenTimes] = useState<Record<string, number>>({});

    const refresh = useCallback(async () => {
        setUnits(DB.getSubjects().filter(s => s.division === user.stage && s.year === user.year && (s.specialization === user.specialization || !s.specialization || user.year === 'الفرقة الأولى' || user.year === 'الفرقة الثانية')).map(s => s.name));
        setContents(DB.getSections());
    }, [user.stage, user.year, user.semester]);

    useEffect(() => {
        refresh();
        window.addEventListener('nt-units-change', refresh);
        window.addEventListener('nt-content-change', refresh);
        window.addEventListener('nt-data-sync', refresh);
        return () => {
            window.removeEventListener('nt-units-change', refresh);
            window.removeEventListener('nt-content-change', refresh);
            window.removeEventListener('nt-data-sync', refresh);
        };
    }, [refresh]);

    useEffect(() => {
        const seen: Record<string, number> = {};
        units.forEach(u => {
            const key = `nt_seen_section_unit_${user.stage}_${user.year}_${user.semester}_${u}`;
            seen[u] = Number(localStorage.getItem(key) || '0');
        });
        setUnitSeenTimes(seen);
    }, [units, user]);

    const handleUnitClick = (unitName: string) => {
        setActiveUnit(unitName);
        onUnitOpen?.(unitName);
        const key = `nt_seen_section_unit_${user.stage}_${user.year}_${user.semester}_${unitName}`;
        const now = Date.now();
        localStorage.setItem(key, now.toString());
        setUnitSeenTimes(prev => ({ ...prev, [unitName]: now }));
    };

    const handleActionRequest = (fileEntry: string, action: 'open' | 'download') => {
        if (action === 'open') {
            onOpenFile?.(fileEntry);
        } else {
            const [name, base64] = fileEntry.split('|||');
            onDownloadFile?.(name, base64);
        }
    };

    const unitItems = useMemo(() => {
        return units.map(u => ({
            name: u,
            items: contents.filter(c => {
                const sameUnit = normalizeArabic(c.unit || '') === normalizeArabic(u);
                const sameStage = normalizeArabic(c.stage) === normalizeArabic(user.stage);
                const sameYear = normalizeArabic(c.year) === normalizeArabic(user.year);
                const sameSem = (normalizeArabic(c.semester || '-') === normalizeArabic(user.specialization || '-')) || normalizeArabic(c.semester || '-') === '-';
                const sameTerm = (normalizeArabic(c.term || 'الفصل الدراسي الأول') === normalizeArabic(user.semester || 'الفصل الدراسي الأول')) || !c.term;
                return sameUnit && sameStage && sameYear && sameSem && sameTerm && c.isVisible;
            })
        }));
    }, [units, contents, user]);

    const activeContent = useMemo(() => {
        return unitItems.find(u => u.name === activeUnit)?.items || [];
    }, [activeUnit, unitItems]);

    return (
        <div className="w-full max-w-[600px] mx-auto px-4 py-6 space-y-4 relative">
            <div className="flex items-center justify-center p-3 mb-4 mt-2">
                <div className="flex flex-col items-center gap-2.5 relative">
                    {unitItems.some(u => {
                        const updatedTime = DB.getUnitUpdatedTime(user.stage, user.year, user.semester, u.name);
                        const seenTime = unitSeenTimes[u.name] || 0;
                        return u.items.length > 0 && updatedTime > seenTime;
                    }) && (
                            <div className="absolute -top-1 -right-5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        )}
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl md:text-3xl font-black text-white tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] pharaonic-text-glow">
                            سكاشن
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="h-[3px] w-8 rounded-full" style={{ backgroundColor: `${theme.primary}50` }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }} />
                        <div className="h-[3px] w-8 rounded-full" style={{ backgroundColor: `${theme.primary}50` }} />
                    </div>
                </div>
            </div>

            <AdBanner theme={theme} isActive={user?.goldenMembershipActive || false} />

            <div className="grid grid-cols-2 gap-3.5 py-2">
                {unitItems.map((u, i) => {
                    const updatedTime = DB.getUnitUpdatedTime(user.stage, user.year, user.semester, u.name);
                    const seenTime = unitSeenTimes[u.name] || 0;
                    const hasNewContent = updatedTime > seenTime;
                    return (
                        <button
                            key={i}
                            onClick={() => handleUnitClick(u.name)}
                            className={`group relative flex items-center justify-between p-4 md:p-6 rounded-[2.5rem] bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 hover:border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden cv-section col-span-2 w-full flex-row`}
                        >
                            {/* Glossy overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100" />
                            <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-cyan-400 border border-white/5 flex-shrink-0">
                                <ChevronLeft size={18} className="" />
                            </div>

                            <div className={`flex-1 text-right relative min-w-0 flex flex-col pr-3 md:pr-6 items-end`}>
                                {u.items.length > 0 && hasNewContent && (
                                    <div className={`absolute bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.8)] border-2 border-[#020617] z-20 top-1/2 -translate-y-1/2 -right-1 w-3.5 h-3.5`} />
                                )}
                                <AutoFitTitle text={u.name} theme={theme} />
                                <div className={`flex items-center gap-2 mt-1.5 opacity-60 justify-end w-full`}>
                                    <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{u.items.length} سكشن</span>
                                    <div className="w-1 w-1 rounded-full shrink-0" style={{ backgroundColor: theme.primary }} />
                                </div>
                            </div>

                            <div className={`shrink-0 rounded-xl bg-black/20 border border-white/5 flex items-center justify-center shadow-xl w-10 h-10 md:w-12 md:h-12`}
                                style={{ color: theme.primary, borderColor: `${theme.primary}20` }}>
                                <Book size={20} className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                            </div>
                        </button>
                    )
                })}
            </div>

            {activeUnit && (
                <div
                    className="fixed inset-0 z-[10000] flex flex-col pt-14 pb-16 p-2 sm:p-6 bg-black/95 backdrop-blur-[100px] overflow-hidden items-center justify-start md:justify-center"
                    onClick={() => { setActiveUnit(null); onUnitClose?.(); }}
                >
                    <div
                        className="w-full h-auto max-h-full max-w-lg sm:max-w-5xl relative flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: theme.primary }} />
                        <div className="absolute bottom-0 right-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: theme.primary }} />

                        <div className="flex items-center justify-between pt-8 p-4 sm:p-6 sticky top-0 z-[810] flex-row gap-4 bg-black/40 backdrop-blur-md">
                            <button
                                onClick={() => { setActiveUnit(null); onUnitClose?.(); }}
                                className="flex items-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white active:scale-95 group shadow-lg border border-white/10 shrink-0"
                            >
                                <ArrowRight size={16} className="" style={{ color: theme.primary }} />
                                <span className="font-bold text-[10px]">رجوع</span>
                            </button>
                            <div className="text-right">
                                <h2 className="text-lg font-bold text-white glow-text">{activeUnit}</h2>
                                <div className="flex items-center justify-end gap-2 font-bold text-[10px] mt-1 uppercase tracking-widest"
                                    style={{ color: `${theme.primary}dd` }}>
                                    <span>{activeContent.length} مادة دراسية</span>
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 no-scrollbar pb-10">
                            {activeContent.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                                    <Sparkles size={40} />
                                    <p className="mt-4 font-black">لا يوجد محتوى مدرج</p>
                                </div>
                            ) : (
                                activeContent.map((item, idx) => {
                                    const isPaid = (item.showPremiumLock && !item.isFree) || (item.requiredPoints && item.requiredPoints > 0) || (item.requiredCoins && item.requiredCoins > 0);
                                    const isApproved = (purchasedLessons || []).includes(item.id);
                                    const displayTitle = item.title ? item.title.replace(/(?<!\d)[0٠]+(?!\d)/g, '').trim() : '';

                                    return (
                                        <div
                                            key={item.id || idx}
                                            className="p-1.5 sm:p-2.5 space-y-1.5 sm:space-y-2 relative overflow-hidden group/item transform-gpu cv-section"
                                        >
                                            <div className="flex items-center justify-end gap-3 sm:gap-4">
                                                <div className="text-right flex-1">
                                                    <div className="text-[7px] sm:text-[8px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5 w-fit ml-auto mb-0.5 sm:mb-1">
                                                        {item.date}
                                                    </div>
                                                    <h4 className="text-[11px] sm:text-sm font-black text-gray-100 flex items-center justify-end gap-1.5"
                                                        style={{ color: 'white' }}>
                                                        {isPaid && !isApproved && (
                                                            <span className="text-[10px] text-[#d4af37] border border-[#d4af37]/30 px-2 py-0.5 rounded-lg font-bold bg-[#d4af37]/5 shrink-0">مدفوع 🔒</span>
                                                        )}
                                                        {displayTitle}
                                                    </h4>
                                                </div>
                                                {item.thumbnail && (
                                                    <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 overflow-hidden shadow-xl relative group-hover:border-primary/50 bg-slate-900/50">
                                                        <img
                                                            src={item.thumbnail.startsWith('data:') ? item.thumbnail : (item.thumbnail.startsWith('http') ? item.thumbnail : `data:image/jpeg;base64,${item.thumbnail}`)}
                                                            className={`w-full h-full object-cover ${isPaid && !isApproved ? 'blur-md opacity-60' : ''}`}
                                                            alt=""
                                                        />
                                                        {isPaid && !isApproved && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                <img
                                                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked.png"
                                                                    className="w-6 h-6 md:w-8 md:h-8 z-10 drop-shadow-md"
                                                                    alt="Lock"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {item.text && (
                                                <div className="text-right text-gray-400 leading-relaxed text-xs sm:text-sm bg-black/40 p-3.5 sm:p-6 rounded-2xl sm:rounded-[1.8rem] border border-white/5">
                                                    {item.text}
                                                </div>
                                            )}

                                            {item.questions && item.questions.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        const isDone = (completedExams || []).includes(item.id);
                                                        if (isPaid && !isApproved) {
                                                            return onLockClick?.('شيت', item);
                                                        }

                                                        const itemAchievements = (achievements || []).filter(a => a.examId === item.id);
                                                        const highestScore = itemAchievements.length > 0 ? Math.max(...itemAchievements.map(a => a.score)) : 0;

                                                        if (isDone) {
                                                            if (highestScore >= 90) return;
                                                            return onOpenRetakeModal?.(item);
                                                        }
                                                        onOpenFile?.(`SHEET_START|||${JSON.stringify({
                                                            ...item,
                                                            questions: item.questions
                                                        })}`);
                                                    }}
                                                    className={`w-full p-1.5 sm:p-2.5 rounded-xl text-right flex items-center justify-between border shadow-md relative overflow-hidden bg-white/[0.01] group/sh mb-0.5 sm:mb-1 ${completedExams.includes(item.id)
                                                        ? "opacity-60 border-emerald-500/10"
                                                        : "border-white/5 shadow-inner"
                                                        }`}
                                                >
                                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/sh:opacity-100" />

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isPaid && !isApproved ? (
                                                            <div className="flex items-center gap-2 bg-[#d4af37]/10 px-3 py-1.5 rounded-2xl border border-[#d4af37]/30 group-hover/sh:border-[#d4af37]/60">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[7px] font-black text-[#d4af37] uppercase leading-none mb-1">فتح الشيت</span>
                                                                    <span className="text-[10px] font-black text-white flex items-center gap-1">
                                                                        {item.requiredPoints && item.requiredPoints > 0 ? `${item.requiredPoints} نقاط` : `${item.requiredCoins || 0} كوينز`}
                                                                    </span>
                                                                </div>
                                                                <ArrowLeft size={16} className="text-[#d4af37]" />
                                                            </div>
                                                        ) : completedExams.includes(item.id) ? (
                                                            <div className="p-1.5 sm:p-2 bg-black/40 rounded-xl border border-white/5">
                                                                <CheckCircle2 size={20} className="text-emerald-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="p-1 sm:p-1.5 bg-black/20 rounded-lg border border-white/5">
                                                                <ArrowLeft size={16} className="text-cyan-400 shadow-glow" style={{ color: theme.primary }} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-right flex-1 pr-2 sm:pr-4 relative z-10 overflow-hidden flex items-center justify-start gap-3 sm:gap-4 flex-row-reverse">
                                                        <div className="flex flex-col items-end gap-1 flex-1">
                                                            <div className="flex items-center justify-end gap-3">
                                                                {(() => {
                                                                    const itemAchievements = (achievements || []).filter(a => a.examId === item.id);
                                                                    const highestScore = itemAchievements.length > 0 ? Math.max(...itemAchievements.map(a => a.score)) : 0;

                                                                    if (isPaid && !isApproved) return null;

                                                                    if (completedExams.includes(item.id)) {
                                                                        if (highestScore < 90) {
                                                                            return (
                                                                                <button onClick={(e) => { e.stopPropagation(); onOpenRetakeModal?.(item); }}
                                                                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black text-white active:scale-95">إعادة</button>
                                                                            );
                                                                        } else {
                                                                            return <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-400">تم الحل ✓</div>;
                                                                        }
                                                                    }
                                                                    return null;
                                                                })()}

                                                                <div className="font-black text-xs sm:text-lg text-white group-hover:text-cyan-400 truncate text-right"
                                                                    style={{ color: completedExams.includes(item.id) ? undefined : theme.primary }}>
                                                                    {isPaid && !isApproved ? (
                                                                        <div className="flex items-center gap-2 bg-[#d4af37]/5 border border-[#d4af37]/20 px-3 py-1 rounded-xl">
                                                                            <span className="text-[#d4af37] text-xs">{`شراء: ${displayTitle}`}</span>
                                                                        </div>
                                                                    ) : (
                                                                        displayTitle
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {!isPaid || isApproved ? (
                                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Interactive Digital Sheet</span>
                                                            ) : null}
                                                        </div>

                                                        {/* Green Open Button - Fixed Right Side Position */}
                                                        <div className="shrink-0">
                                                            <div
                                                                className={cn(
                                                                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black flex items-center gap-2 border",
                                                                    completedExams.includes(item.id)
                                                                        ? "bg-gray-500/20 text-gray-500 border-gray-500/30 line-through opacity-50"
                                                                        : "bg-emerald-500 text-black border-emerald-400/50 shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95"
                                                                )}
                                                            >
                                                                <span>{completedExams.includes(item.id) ? 'تم الانتهاء' : 'فتح'}</span>
                                                                <BookOpen size={12} className="" />
                                                            </div>
                                                        </div>

                                                        <div className="absolute inset-y-0 right-0 w-1 flex items-center justify-center" style={{ backgroundColor: completedExams.includes(item.id) ? '#10b981' : theme.primary }} />
                                                    </div>
                                                </button>
                                            )}

                                            <div className="flex flex-wrap items-center justify-end gap-2.5">
                                                {item.files?.map((f, i) => {
                                                    const [name] = f.split('|||');
                                                    const isPdf = name.toLowerCase().endsWith('.pdf') || f.includes('application/pdf');
                                                    return (
                                                        <div key={i} className="flex flex-col gap-1.5">
                                                            <button onClick={() => handleActionRequest(f, 'open')}
                                                                className="px-6 py-2 bg-slate-800/60 hover:bg-slate-700/80 rounded-xl text-[10px] font-black border border-white/5 flex items-center justify-center gap-2 shadow-sm w-full">
                                                                {isPdf ? <FileText size={12} className="text-orange-400" /> : <ExternalLink size={12} className="text-blue-400" />}
                                                                <span>فتح</span>
                                                            </button>
                                                            {item.allowDownload && (
                                                                <button onClick={() => handleActionRequest(f, 'download')}
                                                                    className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black border border-blue-500/30 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.2)] w-full">
                                                                    <Download size={12} />
                                                                    <span>تحميل</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {item.pdfUrl && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer"
                                                            className="px-6 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black border border-blue-500/20 flex items-center justify-center gap-2 w-full">
                                                            <FileText size={12} />
                                                            فتح
                                                        </a>
                                                        {item.allowDownload && (
                                                            <a href={getDirectDownloadUrl(item.pdfUrl)} download target="_blank" rel="noopener noreferrer"
                                                                className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black border border-blue-500/30 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.2)] w-full">
                                                                <Download size={12} />
                                                                <span>تحميل</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {item.linkUrl && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer"
                                                            className="px-6 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-[10px] font-black border border-purple-500/20 flex items-center justify-center gap-2 w-full">
                                                            <ExternalLink size={12} />
                                                            فتح الرابط
                                                        </a>
                                                        {item.allowDownload && (
                                                            <a href={getDirectDownloadUrl(item.linkUrl)} download target="_blank" rel="noopener noreferrer"
                                                                className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl text-[10px] font-black border border-purple-500/30 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(168,85,247,0.2)] w-full">
                                                                <Download size={12} />
                                                                <span>تحميل</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {item.videoUrl && (
                                                    <button onClick={() => onVideoClick?.({ title: displayTitle, videoUrl: item.videoUrl, description: item.text })}
                                                        className="px-6 py-2 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] rounded-xl text-[10px] font-black border border-[#d4af37]/20">مشاهدة الفيديو 🎬</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="w-full py-2 flex items-center justify-center shrink-0 z-50 relative pointer-events-none">
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold whitespace-nowrap">
                                جميع الحقوق محفوظة Mentora <span style={{ color: theme.primary }}>2026</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectionsStudentSection;
