import React, { useState, useEffect, useMemo } from 'react';
import {
    AlertTriangle, Activity, User, GraduationCap, Share2, LogOut,
    Trophy, BookOpen, TrendingUp, Calendar, Clock,
    ShieldCheck, Zap, CheckCircle2, XCircle, Hash,
    Phone, Mail, Copy, Gift, BarChart2,
    BadgeCheck, Link2, Wallet, X, Check
} from 'lucide-react';
import { DB, StorageLayer } from '../services/db';
import { Student, Parent, ExamResult } from '../types';
import { cn } from '../utils/cn';

interface ParentDashboardProps {
    parent: Parent;
    theme: any;
    onLogout: () => void;
}

const TEACHER_WHATSAPP = '201270800409';

const buildReport = (child: Student, stats: any): string =>
    `📊 تقرير متابعة الطالب\n━━━━━━━━━━━━━━━━━━\n` +
    `👤 الاسم: ${child.username}\n🏫 المرحلة: ${child.year} • ${child.level}\n📅 الفصل: ${child.semester || 'غير محدد'}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📝 إجمالي الامتحانات: ${stats.totalExams}\n📈 المتوسط: ${stats.averageScore}%\n🏆 أعلى درجة: ${stats.highestScore}%\n` +
    `✅ ناجح: ${stats.passCount}   ❌ راسب: ${stats.failCount}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🪙 الكوينز: ${stats.coins}   🎯 النقاط: ${stats.points}\n` +
    `🎁 أرباح الإحالة: ${stats.referralEarnings} نقطة\n` +
    `━━━━━━━━━━━━━━━━━━\n📌 Mentora`;

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; color?: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-2">
            <Icon size={11} className="opacity-60 shrink-0" style={{ color: color || '#6b7280' }} />
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{label}</span>
        </div>
        <div className="text-[11px] font-bold text-white text-left max-w-[60%] truncate">{value}</div>
    </div>
);

const StatMini: React.FC<{ icon: React.ElementType; label: string; value: string | number; color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/[0.05] transition-all group">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon size={14} style={{ color }} />
        </div>
        <span className="text-base font-black text-white">{value}</span>
        <span className="text-[7px] font-black text-gray-500 uppercase tracking-[0.1em] text-center">{label}</span>
    </div>
);

const ParentDashboard: React.FC<ParentDashboardProps> = ({ parent, theme, onLogout }) => {
    const [child, setChild] = useState<Student | null>(null);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'details'>('overview');
    const [copiedCode, setCopiedCode] = useState(false);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [isOnline, setIsOnline] = useState(false);

    const fetchStudentData = () => {
        if (!parent.studentId) { setIsLoading(false); return; }
        try {
            const students = DB.getStudents();
            const student = students.find(s => s.id === parent.studentId?.trim());
            if (student) {
                setChild(student);
                const sorted = [...(student.achievements || [])].sort((a, b) =>
                    new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime()
                );
                setResults(sorted);
                setIsOnline(DB.getOnlineStatus(student.id));
            } else { setChild(null); setResults([]); }
        } catch (err) { console.error('Error:', err); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchStudentData();

        const handleSync = () => {
            fetchStudentData();
        };

        window.addEventListener('nt-data-sync', handleSync);
        window.addEventListener('nt-students-change', handleSync);

        const iv = setInterval(fetchStudentData, 30000);
        return () => {
            clearInterval(iv);
            window.removeEventListener('nt-data-sync', handleSync);
            window.removeEventListener('nt-students-change', handleSync);
        };
    }, [parent.studentId]);

    const stats = useMemo(() => {
        if (!child) return { totalExams: 0, averageScore: 0, highestScore: 0, passCount: 0, failCount: 0, points: 0, coins: 0, referralEarnings: 0, referralCount: 0 };
        const total = results.length;
        const avg = total > 0 ? Math.round(results.reduce((a, r) => a + (r.percentage || 0), 0) / total) : 0;
        const highest = total > 0 ? Math.round(Math.max(...results.map(r => r.percentage || 0))) : 0;
        return {
            totalExams: total, averageScore: avg, highestScore: highest,
            passCount: results.filter(r => (r.percentage || 0) >= 50).length,
            failCount: results.filter(r => (r.percentage || 0) < 50).length,
            points: child.points || 0, coins: child.coins || 0,
            referralEarnings: child.referral_earnings || 0,
            referralCount: child.referral_count || 0,
        };
    }, [child, results]);

    const P = theme?.primary || '#D4AF37';
    const studentAvatar = child?.profilePictureUrl || child?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${child?.id || 'default'}`;
    const parentAvatar = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

    // Native device share (opens any app: WhatsApp, Facebook, etc.)
    const handleShare = async () => {
        if (!child) return;
        const text = buildReport(child, stats);
        if (navigator.share) {
            try {
                await navigator.share({ title: `تقرير الطالب: ${child.username}`, text });
            } catch (_) { /* user cancelled */ }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text);
            alert('تم نسخ التقرير! يمكنك لصقه في أي تطبيق مشاركة.');
        }
    };

    const handleCopyCode = () => {
        if (!child?.referral_code) return;
        navigator.clipboard.writeText(child.referral_code).then(() => {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        });
    };

    const handleContactTeacher = () => window.open(`https://wa.me/${TEACHER_WHATSAPP}`, '_blank');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center hieroglyph-pattern" dir="rtl">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: P, borderTopColor: 'transparent' }} />
                    <p className="font-black text-sm pharaonic-text-glow" style={{ color: P }}>جاري تحميل بيانات الطالب...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden hieroglyph-pattern" dir="rtl">
            {/* Pharaonic ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-40 -right-20 w-96 h-96 rounded-full blur-[180px] opacity-15" style={{ backgroundColor: P }} />
                <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full blur-[180px] opacity-10" style={{ backgroundColor: P }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full blur-[200px] opacity-5" style={{ backgroundColor: P }} />
            </div>

            {/* ── IMAGE PREVIEW MODAL ── */}
            {showImagePreview && child && (
                <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center" onClick={() => setShowImagePreview(false)}>
                    <button className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center active:scale-95 transition-all hover:bg-white/20" onClick={() => setShowImagePreview(false)}>
                        <X size={22} className="text-white" />
                    </button>
                    <div className="text-center px-6" onClick={e => e.stopPropagation()}>
                        <div className="w-60 h-60 sm:w-72 sm:h-72 rounded-[3rem] overflow-hidden border-4 mx-auto shadow-2xl" style={{ borderColor: P, boxShadow: `0 0 60px ${P}40` }}>
                            <img src={studentAvatar} className="w-full h-full object-cover" alt={child.username} />
                        </div>
                        <p className="text-white font-black text-xl mt-6 pharaonic-text-glow" style={{ color: P }}>{child.username}</p>
                        <p className="text-gray-400 text-xs font-bold mt-1">{child.year} • {child.level}</p>
                        <button onClick={() => setShowImagePreview(false)} className="mt-8 pharaonic-button px-10 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all" style={{ color: P }}>
                            ✕ إغلاق المعاينة
                        </button>
                    </div>
                </div>
            )}

            {/* ── HEADER ── */}
            <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(3,7,18,0.92)', borderBottomColor: `${P}30` }}>
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border overflow-hidden pharaonic-panel" style={{ borderColor: `${P}40` }}>
                            {parentAvatar ? <img src={parentAvatar} className="w-full h-full object-contain p-1" alt="" /> : <User size={18} style={{ color: P }} />}
                        </div>
                        <div>
                            {(() => {
                                const isArabicName = new RegExp('[\\u0600-\\u06FF]').test(parent.username || '');
                                const badgeSvg = (
                                    <span className="inline-flex items-center justify-center text-[#1877f2]" title="حساب موثق">
                                        <svg className="w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] fill-current drop-shadow-[0_1px_2px_rgba(24,119,242,0.3)]" viewBox="0 0 24 24">
                                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.482 0-.937.1-1.357.277C14.774 2.564 13.5 1.77 12 1.77c-1.5 0-2.77.794-3.415 2.01-.42-.178-.875-.278-1.357-.278C5.12 3.502 3.41 5.282 3.41 7.492c0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.482 0 .937-.1 1.357-.277.645 1.216 1.915 2.01 3.415 2.01 1.5 0 2.77-.794 3.415-2.01.42.178.875.278 1.357.278 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 3.12l-3.32-3.32 1.48-1.48 1.84 1.84 4.88-4.88 1.48 1.48-6.36 6.36z" />
                                        </svg>
                                    </span>
                                );
                                return (
                                    <div className="flex items-center gap-1" style={{ direction: isArabicName ? 'rtl' : 'ltr' }}>
                                        {isArabicName ? (
                                            <>
                                                <h1 className="text-xs sm:text-sm font-black text-white whitespace-nowrap">{parent.username}</h1>
                                                {badgeSvg}
                                            </>
                                        ) : (
                                            <>
                                                {badgeSvg}
                                                <h1 className="text-xs sm:text-sm font-black text-white whitespace-nowrap">{parent.username}</h1>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-md border" style={{ color: P, borderColor: `${P}40`, backgroundColor: `${P}10` }}>ولي أمر الطالب</span>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest truncate max-w-[80px]">{child?.username}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {child && (
                            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black border active:scale-95 transition-all" style={{ color: P, borderColor: `${P}40`, backgroundColor: `${P}10` }}>
                                <Share2 size={14} />
                                <span className="hidden sm:inline">مشاركة</span>
                            </button>
                        )}
                        <button onClick={handleContactTeacher} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-black text-black active:scale-95 transition-all" style={{ backgroundColor: '#ffd700' }}>
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            <span className="hidden sm:inline">تواصل مع المعلم</span>
                        </button>
                        <button onClick={onLogout} className="p-2 rounded-xl border border-red-500/20 bg-red-500/10 active:scale-95 transition-all text-red-500">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 relative z-10 pb-10">

                {!child ? (
                    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 blur-3xl pointer-events-none" />
                        <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.1)]">
                            <AlertTriangle size={40} className="text-yellow-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">بيانات الطالب مفقودة</h2>
                            <p className="text-sm text-gray-400 font-bold">النظم لم تتمكن من تحديد هوية الطالب المرتبط.</p>
                        </div>
                        <div className="pharaonic-panel p-4 rounded-2xl border-dashed border-white/10 inline-block mx-auto">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">كود الطالب المسجل</p>
                            <p className="font-mono text-lg font-black mt-1" style={{ color: P }}>{parent.studentId}</p>
                        </div>
                        <div className="space-y-3 pt-4">
                            <button onClick={handleContactTeacher} className="w-full py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 text-black active:scale-95 transition-all shadow-xl" style={{ backgroundColor: P }}>
                                <Phone size={14} />
                                الدعم الفني عبر واتساب
                            </button>
                            <button onClick={onLogout} className="w-full py-3 rounded-2xl font-black text-[10px] border border-red-500/20 bg-red-500/10 text-red-400 active:scale-95 transition-all">
                                تسجيل الخروج والمحاولة مرة أخرى
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── STUDENT CARD ── */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000" />
                            <div className="pharaonic-panel rounded-[2.5rem] overflow-hidden bg-slate-950/40 backdrop-blur-3xl border-white/5 shadow-2xl relative">
                                <div className="p-4 flex items-center gap-4">
                                    {/* Clickable avatar */}
                                    <button onClick={() => setShowImagePreview(true)} className="relative shrink-0 group/avatar" title="اضغط لمعاينة الصورة">
                                        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 group-hover/avatar:scale-105 transition-all duration-500" style={{ borderColor: `${P}50`, boxShadow: `0 0 20px ${P}20` }}>
                                            <img src={studentAvatar} className="w-full h-full object-cover" alt={child.username} />
                                        </div>
                                        <div className="absolute inset-0 rounded-[1.5rem] bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="text-white text-[8px] font-black uppercase tracking-widest">معاينة</span>
                                        </div>
                                        <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[3px] border-[#030712] flex items-center justify-center", isOnline ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]")}>
                                            <div className={cn("w-1 h-1 rounded-full bg-white", isOnline ? "animate-pulse" : "")} />
                                        </div>
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-black text-white truncate pharaonic-text-glow leading-tight">{child.username}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <GraduationCap size={12} className="text-cyan-400 opacity-60" />
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{child.year}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black transition-all", isOnline ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-red-400 border-red-500/30 bg-red-500/10")}>
                                                <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")} />
                                                {isOnline ? 'نشط' : 'غير نشط'}
                                            </div>
                                            {child.isPremiumUnlocked && (
                                                <div className="px-2 py-0.5 rounded-full border text-[8px] font-black text-yellow-500 border-yellow-500/30 bg-yellow-500/10">⭐ بريميوم</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                                        <div className="text-3xl font-black pharaonic-text-glow leading-none" style={{ color: P }}>{stats.averageScore}<span className="text-[10px] opacity-50 ml-0.5">%</span></div>
                                        <div className="text-[7px] text-gray-500 font-extrabold uppercase tracking-widest mt-1">المتوسط</div>
                                    </div>
                                </div>

                                <div className="px-4 pb-4 grid grid-cols-4 gap-2">
                                    <StatMini icon={BookOpen} label="امتحانات" value={stats.totalExams} color="#38bdf8" />
                                    <StatMini icon={CheckCircle2} label="ناجح" value={stats.passCount} color="#10b981" />
                                    <StatMini icon={XCircle} label="راسب" value={stats.failCount} color="#ef4444" />
                                    <StatMini icon={Trophy} label="نقاط" value={stats.points} color={P} />
                                </div>
                            </div>
                        </div>

                        {/* ── ALERT ── */}
                        {results.length > 0 && (results[0].percentage || 0) < 50 && (
                            <div className="pharaonic-panel flex items-center gap-3 p-4 rounded-[1.5rem] border border-red-500/30">
                                <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-red-400">تنبيه: تراجع في المستوى</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">آخر امتحان: <span className="text-white font-bold">{Math.round(results[0].percentage || 0)}%</span> — يُنصح بمراجعة المادة</p>
                                </div>
                            </div>
                        )}

                        {/* ── TABS ── */}
                        <div className="bg-white/5 backdrop-blur-2xl p-1 rounded-2xl border border-white/5 flex gap-1 relative overflow-hidden">
                            {[
                                { id: 'overview', label: 'الأداء', icon: Activity },
                                { id: 'details', label: 'البيانات', icon: User },
                                { id: 'results', label: 'النتائج', icon: BookOpen },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        'flex-1 py-2.5 rounded-xl text-[9px] font-black flex items-center justify-center gap-1.5 transition-all relative z-10',
                                        activeTab === tab.id ? 'text-black' : 'text-gray-500'
                                    )}
                                    style={activeTab === tab.id ? { backgroundColor: P, boxShadow: `0 5px 15px ${P}30` } : {}}
                                >
                                    <tab.icon size={12} />
                                    <span className="tracking-widest uppercase">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ── OVERVIEW TAB ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="pharaonic-panel rounded-[2.5rem] overflow-hidden bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-xl">
                                    <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                                <Zap size={18} className="text-cyan-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-white tracking-widest uppercase">ملخص الأداء التحليلي</h3>
                                        </div>
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full">Realtime AI Analytics</div>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        {[
                                            { label: 'المتوسط العام', value: stats.averageScore, color: stats.averageScore >= 50 ? '#10b981' : '#ef4444', icon: Activity },
                                            { label: 'أعلى درجة محققة', value: stats.highestScore, color: '#38bdf8', icon: Trophy },
                                            { label: 'نسبة النجاح الكلية', value: stats.totalExams > 0 ? Math.round((stats.passCount / stats.totalExams) * 100) : 0, color: P, icon: BadgeCheck },
                                        ].map(bar => (
                                            <div key={bar.label} className="group">
                                                <div className="flex justify-between items-center mb-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <bar.icon size={12} className="opacity-50" style={{ color: bar.color }} />
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{bar.label}</span>
                                                    </div>
                                                    <span className="text-lg font-black pharaonic-text-glow" style={{ color: bar.color }}>{bar.value}<span className="text-[10px] opacity-60 ml-0.5">%</span></span>
                                                </div>
                                                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden p-[1px] border border-white/5">
                                                    <div className="h-full rounded-full transition-all duration-1500 ease-out shadow-[0_0_15px_rgba(255,255,255,0.1)]" style={{ width: `${Math.min(100, bar.value)}%`, backgroundColor: bar.color }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center gap-2 shadow-lg group">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                            <span className="text-xl">🪙</span>
                                        </div>
                                        <div>
                                            <div className="text-xl font-black" style={{ color: P }}>{stats.coins}</div>
                                            <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5">الرصيد</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center gap-2 shadow-lg group">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <Gift size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-xl font-black text-emerald-400">{stats.referralEarnings}</div>
                                            <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5">الأرباح</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── DETAILS TAB ── */}
                        {activeTab === 'details' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-lg">
                                    <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                            <User size={13} className="text-purple-400" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">المعلومات الشخصية</h3>
                                    </div>
                                    <div className="px-5 divide-y divide-white/5">
                                        <InfoRow icon={User} label="الاسم" value={child.username} color={P} />
                                        <InfoRow icon={GraduationCap} label="المرحلة" value={child.level} color="#38bdf8" />
                                        <InfoRow icon={Calendar} label="السنة" value={child.year} color="#a78bfa" />
                                        <InfoRow icon={Hash} label="الفصل" value={child.semester || 'غير محدد'} color="#f472b6" />
                                        <InfoRow icon={User} label="النوع" value={child.gender === 'ذكر' ? '👦 ذكر' : child.gender === 'أنثى' ? '👧 أنثى' : 'غير محدد'} color="#fb923c" />
                                        <InfoRow icon={Phone} label="الهاتف" value={child.phoneNumber || 'غير مسجل'} color="#22c55e" />
                                        <InfoRow icon={Mail} label="البريد الإلكتروني" value={child.email || 'غير مسجل'} color="#60a5fa" />
                                        <InfoRow icon={ShieldCheck} label="الموقع" value={child.location || 'غير محدد'} color="#f59e0b" />
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-lg">
                                    <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                            <ShieldCheck size={13} className="text-cyan-400" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">حالة الحساب</h3>
                                    </div>
                                    <div className="px-5 divide-y divide-white/5">
                                        <InfoRow icon={Activity} label="الحالة" value={<span className={cn("px-3 py-1 rounded-full text-[10px] font-black", child.isBlocked ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-green-400 bg-green-500/10 border border-green-500/20')}>{child.isBlocked ? '🚫 محظور' : '✅ نشط'}</span>} />
                                        <InfoRow icon={BadgeCheck} label="تاريخ التسجيل" value={child.regDate || '—'} color="#6b7280" />
                                        <InfoRow icon={Clock} label="آخر دخول" value={child.lastLogin || 'لم يسجل بعد'} color="#6b7280" />
                                        <InfoRow icon={Hash} label="مرات الدخول" value={<span className="text-white font-black">{child.loginCount || 0} مرة</span>} color="#a78bfa" />
                                        <InfoRow icon={User} label="نوع الجهاز" value={child.deviceType === 'mobile' ? '📱 موبايل' : child.deviceType === 'tablet' ? '📟 تابلت' : '💻 كمبيوتر'} />
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-lg">
                                    <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <Gift size={13} className="text-emerald-400" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">نظام الإحالة</h3>
                                    </div>
                                    <div className="px-5 divide-y divide-white/5">
                                        <InfoRow icon={Link2} label="الكود" value={
                                            child.referral_code ? (
                                                <button onClick={handleCopyCode} className="flex items-center gap-1.5 font-mono text-[10px] active:scale-95 transition-all bg-white/5 px-2.5 py-1 rounded-lg border border-white/10" style={{ color: P }}>
                                                    {copiedCode ? <Check size={10} className="text-green-400" /> : <Copy size={9} />}
                                                    {child.referral_code}
                                                </button>
                                            ) : <span className="text-gray-600">--</span>
                                        } />
                                        <InfoRow icon={Gift} label="عدد الإحالات" value={`${stats.referralCount} طالب`} color="#22c55e" />
                                        <InfoRow icon={Wallet} label="أرباح الإحالة" value={`${stats.referralEarnings} نقطة`} color="#f59e0b" />
                                        <InfoRow icon={Trophy} label="الكوينز" value={<span className="font-black" style={{ color: P }}>{stats.coins} 🪙</span>} color={P} />
                                        <InfoRow icon={BadgeCheck} label="النقاط الإجمالية" value={`${stats.points} نقطة`} color="#38bdf8" />
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[1.5rem] p-5 flex items-center justify-between shadow-xl">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5 opacity-60">كود الطالب التعريفي (UID)</p>
                                        <p className="font-mono text-[11px] font-black truncate tracking-tighter" style={{ color: P }}>{child.id}</p>
                                    </div>
                                    <button onClick={() => navigator.clipboard.writeText(child.id)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 active:scale-95 hover:bg-white/10 transition-all flex items-center justify-center text-gray-400 ml-2 shrink-0 group">
                                        <Copy size={14} className="group-hover:text-white transition-colors" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── RESULTS TAB ── */}
                        {activeTab === 'results' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                {results.length === 0 ? (
                                    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-16 text-center rounded-[2.5rem] shadow-xl">
                                        <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 opacity-50">
                                            <BookOpen size={30} className="text-gray-400" />
                                        </div>
                                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest leading-relaxed">لم يتم العثور على أي نتائج <br /> مسجلة لهذا الطالب حتى الآن</p>
                                    </div>
                                ) : results.map((res, i) => (
                                    <div key={res.id || i} className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 flex items-center gap-3 p-4 rounded-2xl hover:bg-white/[0.06] transition-all group shadow-md">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex flex-col items-center justify-center border shrink-0',
                                            (res.percentage || 0) >= 90 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                                (res.percentage || 0) >= 50 ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                                                    'bg-red-500/10 border-red-500/30 text-red-400'
                                        )}>
                                            <span className="text-base font-black">{Math.round(res.percentage || 0)}%</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-white truncate uppercase tracking-tight">{res.examTitle}</h4>
                                            <div className="flex items-center gap-3 text-[8px] text-gray-500 font-bold mt-0.5">
                                                <span>{res.date}</span>
                                                <span>{res.time}</span>
                                            </div>
                                        </div>
                                        <div className="text-center shrink-0">
                                            <div className="text-xs font-black text-white">{res.score}<span className="text-[9px] text-gray-600 mx-0.5">/</span>{res.totalQuestions}</div>
                                            <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">SCORE</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <div className="text-center pt-2">
                    <p className="text-[8px] text-gray-700 font-black tracking-widest uppercase">Mentora • {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
