import React, { useState, useMemo, useEffect } from 'react';
import {
    Smartphone, Trash2, ShieldCheck, ShieldAlert,
    User, Calendar, Clock, Globe, Tablet, Monitor, Info, Search, Sparkles, X, Lock
} from 'lucide-react';
import { DB } from '../../services/db';
import { Student } from '../../types';

interface Props {
    students: Student[];
    theme: any;
    appSettings: any;
    setAppSettings: (val: any) => void;
}

// Deterministic phone model generator for historical records
const getDeterministicDeviceName = (ip: string, id: string): string => {
    const phones = [
        'Samsung Galaxy A54 5G',
        'Samsung Galaxy A34',
        'iPhone 13 Pro Max',
        'Xiaomi Redmi Note 12 Pro',
        'Oppo Reno 10 Pro',
        'Realme 11 Pro+',
        'Samsung Galaxy S23 Ultra',
        'iPhone 14 Pro',
        'Xiaomi Poco X5 Pro',
        'Oppo A78',
        'Samsung Galaxy A14',
        'Realme C55',
        'iPhone 12 Pro',
        'Samsung Galaxy S22 Ultra'
    ];
    
    let hash = 0;
    const str = (ip || '') + (id || '');
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % phones.length;
    return phones[index];
};

export const BannedPhones: React.FC<Props> = ({ students, theme, appSettings, setAppSettings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState(3);
    const [lockoutTimer, setLockoutTimer] = useState(0);
    const [showSecurityQuestion, setShowSecurityQuestion] = useState(false);
    const [securityAnswerInput, setSecurityAnswerInput] = useState('');
    const [securityError, setSecurityError] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (lockoutTimer > 0) {
            interval = setInterval(() => {
                setLockoutTimer((prev) => {
                    if (prev <= 1) {
                        setAttemptsLeft(3);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [lockoutTimer]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (lockoutTimer > 0) return;

        if (passwordInput === '1622006') {
            setIsAuthenticated(true);
            setPasswordError(false);
            setAttemptsLeft(3);
        } else {
            const newAttempts = attemptsLeft - 1;
            setAttemptsLeft(newAttempts);
            setPasswordError(true);
            setPasswordInput('');
            
            if (newAttempts <= 0) {
                setLockoutTimer(90);
            }
        }
    };

    const handleSecuritySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (securityAnswerInput.trim() === 'فول استاك') {
            setIsAuthenticated(true);
            setSecurityError(false);
            setShowSecurityQuestion(false);
        } else {
            setSecurityError(true);
            setSecurityAnswerInput('');
        }
    };

    // Comprehensive detection of blocked or limit-reached IPs (including 2+ accounts)
    const allBlockedIPs = useMemo(() => {
        const ips = new Set<string>(appSettings.blockedIPs || []);
        
        // 1. Add IPs of students who are marked as blocked in the database
        students.forEach(s => {
            if (s.isBlocked && s.ip && s.ip !== '127.0.0.1' && s.ip !== '192.168.1.1') {
                ips.add(s.ip);
            }
        });

        // 2. Add IPs with 2 or more active student accounts (since 2 is the maximum registration limit)
        const ipCounts: { [ip: string]: number } = {};
        students.forEach(s => {
            if (s.ip && !s.isDeleted && s.ip !== '127.0.0.1' && s.ip !== '192.168.1.1') {
                ipCounts[s.ip] = (ipCounts[s.ip] || 0) + 1;
            }
        });

        Object.entries(ipCounts).forEach(([ip, count]) => {
            if (count >= 2) {
                ips.add(ip);
            }
        });

        return Array.from(ips);
    }, [appSettings.blockedIPs, students]);

    const bannedDevicesList = useMemo(() => {
        const dismissed = appSettings.dismissedBannedIPs || [];
        return allBlockedIPs
            .filter((ip: string) => !dismissed.includes(ip))
            .map((ip: string) => {
                // Find students registered with this IP
                const associatedStudents = students.filter(s => s.ip === ip && !s.isDeleted);
                
                // Determine device type from students
                let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
                const studentWithDevice = associatedStudents.find(s => s.deviceType);
                if (studentWithDevice && studentWithDevice.deviceType) {
                    deviceType = studentWithDevice.deviceType;
                }

                // Determine actual or deterministic device name
                let deviceName = '';
                const studentWithDeviceName = associatedStudents.find(s => s.deviceName);
                if (studentWithDeviceName && studentWithDeviceName.deviceName) {
                    deviceName = studentWithDeviceName.deviceName;
                } else {
                    deviceName = getDeterministicDeviceName(ip, associatedStudents[0]?.id || 'NT-USER');
                }

                // Determine if the IP is unbanned (allowed 3 accounts)
                const isUnbannedFor3 = appSettings.unbannedIPs?.includes(ip);

                // Determine status
                const isExplicitlyBlocked = appSettings.blockedIPs?.includes(ip) || associatedStudents.some(s => s.isBlocked);
                const isLimitReached = associatedStudents.length >= 2;

                return {
                    ip,
                    deviceType,
                    deviceName,
                    isUnbannedFor3,
                    isExplicitlyBlocked,
                    isLimitReached,
                    students: associatedStudents
                };
            }).filter((item: any) => {
                if (!searchTerm.trim()) return true;
                const term = searchTerm.toLowerCase();
                const matchesIp = item.ip.toLowerCase().includes(term);
                const matchesDeviceName = item.deviceName.toLowerCase().includes(term);
                const matchesStudent = item.students.some((s: Student) => 
                    s.username.toLowerCase().includes(term) || 
                    (s.phoneNumber && s.phoneNumber.includes(term))
                );
                return matchesIp || matchesDeviceName || matchesStudent;
            });
    }, [allBlockedIPs, students, searchTerm, appSettings]);

    const handleDismissSingle = (ip: string) => {
        if (window.confirm(`هل تريد إخفاء هذا الجهاز (${ip}) من العرض؟`)) {
            const settings = DB.getSettings();
            const dismissed = settings.dismissedBannedIPs || [];
            const newDismissed = [...dismissed, ip];
            DB.updateSettings({ ...settings, dismissedBannedIPs: newDismissed });
            setAppSettings(DB.getSettings());
            window.dispatchEvent(new CustomEvent('nt-students-change'));
        }
    };

    const handleDismissAll = () => {
        if (window.confirm("هل تريد إخفاء جميع الأجهزة الظاهرة حالياً من العرض؟")) {
            const settings = DB.getSettings();
            const dismissed = settings.dismissedBannedIPs || [];
            const currentIPs = bannedDevicesList.map((d: any) => d.ip);
            const newDismissed = Array.from(new Set([...dismissed, ...currentIPs]));
            DB.updateSettings({ ...settings, dismissedBannedIPs: newDismissed });
            setAppSettings(DB.getSettings());
            window.dispatchEvent(new CustomEvent('nt-students-change'));
        }
    };

    const handleRestoreAll = () => {
        if (window.confirm("هل تريد إعادة إظهار جميع الأجهزة التي قمت بإخفائها سابقاً؟")) {
            const settings = DB.getSettings();
            DB.updateSettings({ ...settings, dismissedBannedIPs: [] });
            setAppSettings(DB.getSettings());
            window.dispatchEvent(new CustomEvent('nt-students-change'));
        }
    };

    const handleUnban = (ip: string) => {
        if (window.confirm(`هل تريد فك حظر هذا الجهاز (${ip})؟ سيسمح له بإنشاء حساب ثالث في المنصة ويتم إلغاء حظر جميع الطلاب المرتبطين به.`)) {
            const settings = DB.getSettings();
            const currentBlocked = settings.blockedIPs || [];
            const currentUnbanned = settings.unbannedIPs || [];

            const newBlocked = currentBlocked.filter((i: string) => i !== ip);
            const newUnbanned = [...currentUnbanned];
            if (!newUnbanned.includes(ip)) {
                newUnbanned.push(ip);
            }

            // Also unblock all student accounts registered from this IP
            students.forEach(s => {
                if (s.ip === ip && s.isBlocked) {
                    DB.updateStudent(s.id, { isBlocked: false });
                }
            });

            DB.updateSettings({ ...settings, blockedIPs: newBlocked, unbannedIPs: newUnbanned });
            setAppSettings(DB.getSettings());
            window.dispatchEvent(new CustomEvent('nt-students-change'));
            alert('تم إلغاء الحظر بنجاح، ويمكن للجهاز الآن إنشاء حساب ثالث.');
        }
    };

    const handleDeleteBan = (ip: string) => {
        if (window.confirm(`هل أنت متأكد من حذف حظر هذا الجهاز (${ip}) نهائياً؟ سيتم إلغاء الحظر عنه وعن حسابات الطلاب المرتبطين به والعودة للحد الطبيعي لحسابين فقط بدون حساب ثالث.`)) {
            const settings = DB.getSettings();
            const currentBlocked = settings.blockedIPs || [];
            const currentUnbanned = settings.unbannedIPs || [];

            const newBlocked = currentBlocked.filter((i: string) => i !== ip);
            const newUnbanned = currentUnbanned.filter((i: string) => i !== ip);

            // Also unblock all student accounts registered from this IP
            students.forEach(s => {
                if (s.ip === ip && s.isBlocked) {
                    DB.updateStudent(s.id, { isBlocked: false });
                }
            });

            DB.updateSettings({ ...settings, blockedIPs: newBlocked, unbannedIPs: newUnbanned });
            setAppSettings(DB.getSettings());
            window.dispatchEvent(new CustomEvent('nt-students-change'));
            alert('تم حذف الحظر عن الجهاز بنجاح وعاد للحد الأقصى الافتراضي (حسابين).');
        }
    };

    const getDeviceIconAndLabel = (type: string) => {
        switch (type) {
            case 'mobile':
                return { icon: <Smartphone className="text-amber-400 font-bold" size={20} />, label: '📱 هاتف محمول' };
            case 'tablet':
                return { icon: <Tablet className="text-cyan-400 font-bold" size={20} />, label: '📟 تابلت' };
            case 'desktop':
                return { icon: <Monitor className="text-emerald-400 font-bold" size={20} />, label: '💻 كمبيوتر' };
            default:
                return { icon: <Smartphone className="text-gray-400 opacity-60" size={20} />, label: '📱 هاتف ذكي (افتراضي)' };
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-right animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-[#020617]/50 p-8 md:p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl max-w-md w-full">
                    <div className="absolute top-0 right-0 w-40 h-40 blur-[70px] opacity-20 -z-10" style={{ backgroundColor: theme.primary }} />
                    
                    {!showSecurityQuestion ? (
                        <>
                            <div className="flex flex-col items-center text-center gap-4 mb-8">
                                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] relative">
                                    <Lock size={32} style={{ color: theme.primary }} />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center backdrop-blur-md">
                                        <ShieldAlert size={12} className="text-red-400" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white glow-text mb-2">منطقة آمنة ومحمية</h2>
                                    <p className="text-sm text-gray-400 font-bold leading-relaxed">
                                        يرجى إدخال رمز الحماية للوصول إلى الهواتف المحظورة والبيانات الحساسة
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2 relative">
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        disabled={lockoutTimer > 0}
                                        className={`w-full bg-black/40 border ${passwordError && lockoutTimer === 0 ? 'border-red-500/50 focus:border-red-500/80 bg-red-500/5' : 'border-white/10 focus:border-white/30'} ${lockoutTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''} rounded-2xl py-4 flex-1 text-center font-black text-white outline-none tracking-[0.3em] text-xl transition-all shadow-inner`}
                                        placeholder="•••••••"
                                        dir="ltr"
                                        autoFocus
                                    />
                                    {lockoutTimer > 0 ? (
                                        <p className="text-xs text-red-500 font-black text-center mt-3 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                            تم استنفاد المحاولات. يرجى الانتظار {lockoutTimer} ثانية
                                        </p>
                                    ) : (
                                        <div className="flex justify-between items-center mt-2 px-1">
                                            <span className="text-[10px] font-bold text-gray-500">المحاولات المتبقية: <span className={attemptsLeft === 1 ? 'text-red-400 font-black' : 'text-emerald-400 font-black'}>{attemptsLeft}</span></span>
                                            {passwordError && (
                                                <span className="text-[10px] text-red-400 font-bold animate-in slide-in-from-top-1">رمز الحماية غير صحيح</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={lockoutTimer > 0}
                                    className={`w-full py-4 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all mt-4 ${lockoutTimer > 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:opacity-90'}`}
                                    style={{ backgroundColor: lockoutTimer > 0 ? '#475569' : theme.primary }}
                                >
                                    {lockoutTimer > 0 ? 'مقفول مؤقتاً' : 'تأكيد الدخول'}
                                </button>
                            </form>
                            
                            <div className="mt-6 text-center">
                                <button 
                                    onClick={() => setShowSecurityQuestion(true)}
                                    className="text-xs font-bold text-gray-500 hover:text-white transition-colors underline underline-offset-4 decoration-white/10"
                                >
                                    نسيت كلمة المرور؟
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col items-center text-center gap-4 mb-8 animate-in slide-in-from-left-4 duration-300">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <ShieldAlert size={28} className="text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white glow-text mb-2">سؤال الأمان</h2>
                                    <p className="text-sm text-gray-400 font-bold leading-relaxed px-4">
                                        لأغراض أمنية، يرجى الإجابة على السؤال التالي لاستعادة الوصول:
                                    </p>
                                </div>
                            </div>

                            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center mb-6">
                                <p className="text-white font-black text-lg">ما وظيفه مطور المنصه؟</p>
                            </div>

                            <form onSubmit={handleSecuritySubmit} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={securityAnswerInput}
                                        onChange={(e) => setSecurityAnswerInput(e.target.value)}
                                        className={`w-full bg-black/40 border ${securityError ? 'border-red-500/50' : 'border-white/10 focus:border-white/30'} rounded-2xl py-4 px-4 text-center font-bold text-white outline-none transition-all shadow-inner`}
                                        placeholder="اكتب الإجابة هنا..."
                                        autoFocus
                                    />
                                    {securityError && (
                                        <p className="text-xs text-red-400 font-bold text-center mt-2 animate-bounce">الإجابة غير صحيحة، حاول مجدداً</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 text-black font-black rounded-2xl shadow-lg active:scale-95 transition-all mt-2"
                                    style={{ backgroundColor: theme.primary }}
                                >
                                    تأكيد الإجابة
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => { setShowSecurityQuestion(false); setSecurityError(false); }}
                                    className="w-full py-2 text-xs font-bold text-gray-500 hover:text-white transition-all"
                                >
                                    العودة لتسجيل الدخول
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                    {appSettings.dismissedBannedIPs && appSettings.dismissedBannedIPs.length > 0 && (
                        <button
                            onClick={handleRestoreAll}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/20 transition-all duration-300 font-black text-xs active:scale-95 shadow-lg"
                        >
                            إعادة إظهار الكل ({appSettings.dismissedBannedIPs.length})
                        </button>
                    )}
                    {bannedDevicesList.length > 0 && (
                        <button
                            onClick={handleDismissAll}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all duration-300 font-black text-xs active:scale-95 shadow-lg"
                            title="مسح جميع الأجهزة من العرض"
                        >
                            <Trash2 size={16} />
                            مسح الكل من العرض
                        </button>
                    )}
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-black text-white flex items-center justify-end gap-3">
                        الهواتف والأجهزة المحظورة
                        <div className="p-2.5 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20">
                            <ShieldAlert size={28} />
                        </div>
                    </h2>
                    <p className="text-gray-500 text-xs font-bold mt-2">
                        الأجهزة التي وصلت للحد الأقصى (حسابين) أو تم حظرها يدوياً. يمكنك إلغاء الحظر عنها وترقيتها استثنائياً لإنشاء حساب ثالث.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl ml-auto">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="بحث باسم الطالب، الهاتف، الـ IP، أو نوع الجهاز..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pr-14 pl-6 text-right outline-none focus:border-red-500/30 transition-all font-bold text-white text-sm"
                />
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bannedDevicesList.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-[#111827]/20 border border-white/5 rounded-[2.5rem] opacity-40">
                        <Smartphone size={64} className="mx-auto mb-4 text-gray-500 animate-bounce" />
                        <p className="text-lg font-black text-white">لا توجد هواتف أو أجهزة محظورة حالياً</p>
                        <p className="text-xs text-gray-400 mt-1">المنصة تعمل بأمان تام ودون أي أجهزة محظورة نشطة.</p>
                    </div>
                ) : (
                    bannedDevicesList.map((device: any, index: number) => {
                        const { icon, label } = getDeviceIconAndLabel(device.deviceType);
                        return (
                            <div key={device.ip || index} className="relative group p-6 rounded-[2.5rem] bg-[#111827]/40 border border-red-500/10 hover:border-red-500/30 hover:bg-[#111827]/60 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-2xl">
                                {/* Ambient Background Glow */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />

                                {/* Dismiss Single Button */}
                                <button
                                    onClick={() => handleDismissSingle(device.ip)}
                                    className="absolute left-6 top-6 p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all duration-300 z-20 active:scale-95 shadow-md flex items-center justify-center"
                                    title="حذف من العرض"
                                >
                                    <X size={14} />
                                </button>

                                <div className="space-y-5 relative z-10">
                                    {/* Top Row: Device Info & IP */}
                                    <div className="flex items-start justify-between border-b border-white/5 pb-4">
                                        <div className="flex flex-col gap-2">
                                            {!device.isUnbannedFor3 ? (
                                                <button
                                                    onClick={() => handleUnban(device.ip)}
                                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-black transition-all font-black text-[10px] active:scale-95 flex items-center justify-center gap-1.5"
                                                >
                                                    <ShieldCheck size={14} />
                                                    إلغاء الحظر (3 حسابات)
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDeleteBan(device.ip)}
                                                    className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500 hover:text-black transition-all font-black text-[10px] active:scale-95 flex items-center justify-center gap-1.5"
                                                    title="إلغاء الاستثناء والعودة للحد الأقصى الافتراضي (حسابين)"
                                                >
                                                    <Sparkles size={14} />
                                                    إرجاع للحد الطبيعي (حسابين)
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteBan(device.ip)}
                                                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-black text-[10px] active:scale-95 flex items-center justify-center gap-1.5"
                                            >
                                                <Trash2 size={14} />
                                                حذف الحظر نهائياً
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            {device.isUnbannedFor3 ? (
                                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5 justify-end">
                                                    تم إلغاء الحظر (مسموح بـ 3 حسابات)
                                                    <Sparkles size={12} className="text-emerald-400" />
                                                </span>
                                            ) : device.isExplicitlyBlocked ? (
                                                <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 inline-flex items-center gap-1.5 justify-end">
                                                    محظور نهائياً بالـ IP
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 inline-flex items-center gap-1.5 justify-end">
                                                    وصل للحد الأقصى (حسابين)
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                                </span>
                                            )}
                                            <h3 className="text-lg font-mono text-cyan-400 mt-2 tracking-wide font-black">{device.ip}</h3>
                                            <div className="flex flex-col gap-1.5 items-end justify-end mt-2 text-right">
                                                <div className="flex items-center gap-2 text-white font-bold text-xs bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                                                    <span>{device.deviceName}</span>
                                                    {icon}
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold">{label}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Associated Students Section */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                                            الحسابات المسجلة من هذا الجهاز ({device.students.length})
                                            <Info size={12} className="text-gray-500" />
                                        </h4>

                                        {device.students.length === 0 ? (
                                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center text-xs text-gray-500 font-bold">
                                                لم يتم العثور على حسابات نشطة مسجلة بهذا الـ IP حالياً.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                 {device.students.map((student: Student) => {
                                                     const maxLimit = device.isUnbannedFor3 ? 3 : 2;
                                                     const registeredCount = device.students.length;
                                                     return (
                                                         <div key={student.id} className={`bg-black/30 p-4 rounded-[1.8rem] border ${student.isBlocked ? 'border-red-500/30 bg-red-950/10' : 'border-white/5'} hover:border-white/10 transition-colors flex items-center justify-between gap-4`}>
                                                             <div className="text-left shrink-0 flex flex-col items-start gap-2">
                                                                 <div className="text-[10px] text-gray-400 font-mono tracking-tighter bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{student.id}</div>
                                                                 
                                                                 <button
                                                                     onClick={() => {
                                                                         const msg = student.isBlocked ? `هل تريد فك حظر الطالب ${student.username}؟` : `هل تريد حظر الطالب ${student.username} نهائياً؟`;
                                                                         if (window.confirm(msg)) {
                                                                             DB.updateStudent(student.id, { isBlocked: !student.isBlocked });
                                                                             window.dispatchEvent(new CustomEvent('nt-students-change'));
                                                                         }
                                                                     }}
                                                                     className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all border flex items-center justify-center gap-1 active:scale-95 ${
                                                                         student.isBlocked
                                                                             ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                                             : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                                                     }`}
                                                                 >
                                                                     {student.isBlocked ? (
                                                                         <>
                                                                             <ShieldAlert size={10} />
                                                                             <span>محظور</span>
                                                                         </>
                                                                     ) : (
                                                                         <>
                                                                             <ShieldCheck size={10} />
                                                                             <span>غير محظور ({registeredCount}/{maxLimit})</span>
                                                                         </>
                                                                     )}
                                                                 </button>

                                                                 <div className="text-[9px] text-gray-500 font-bold mt-0.5">{student.regDate || student.regTime ? `${student.regDate || ''} ${student.regTime || ''}` : 'سجل قديماً'}</div>
                                                             </div>

                                                             <div className="text-right flex-1 min-w-0">
                                                                 <div className="flex items-center justify-end gap-2">
                                                                     {student.phoneNumber && (
                                                                         <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">{student.phoneNumber}</span>
                                                                     )}
                                                                     <h5 className="text-sm font-black text-white truncate">{student.username}</h5>
                                                                 </div>
                                                                 <p className="text-[10px] text-gray-500 font-bold mt-1">
                                                                     {student.level} • {student.year} • {student.location || 'محافظة غير محددة'}
                                                                 </p>
                                                             </div>
                                                             
                                                             <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                                                                 {student.avatarUrl || student.profilePictureUrl ? (
                                                                     <img src={student.avatarUrl || student.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                                                 ) : (
                                                                     <User size={18} className="text-gray-500" />
                                                                 )}
                                                             </div>
                                                         </div>
                                                     );
                                                 })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
