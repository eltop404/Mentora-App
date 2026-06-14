import React, { useState, useEffect } from 'react';
import { Save, Smartphone, Link as LinkIcon, CreditCard, Lock, ShieldAlert } from 'lucide-react';
import { DB } from '../../services/db';

interface PaymentMethodsManagementProps {
    appSettings: any;
    setAppSettings: (settings: any) => void;
    theme: any;
}

export const PaymentMethodsManagement: React.FC<PaymentMethodsManagementProps> = ({ appSettings, setAppSettings, theme }) => {
    const [vodafoneCash, setVodafoneCash] = useState(appSettings.paymentMethods?.vodafoneCash || '01067941806');
    const [instaPayLink, setInstaPayLink] = useState(appSettings.paymentMethods?.instaPayLink || 'https://ipn.eg/S/amrlotfylotfyosmanosm/instapay/51a5Jh');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
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

    const handleSave = () => {
        if (!vodafoneCash.trim() || !instaPayLink.trim()) {
            alert('يرجى ملء جميع بيانات الدفع الأساسية!');
            return;
        }

        setSaveStatus('saving');
        const newSettings = {
            ...appSettings,
            paymentMethods: {
                vodafoneCash: vodafoneCash.trim(),
                instaPayLink: instaPayLink.trim()
            }
        };

        DB.updateSettings(newSettings);
        setAppSettings(newSettings);

        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (lockoutTimer > 0) return;

        if (passwordInput === '1622006') {
            setIsAuthenticated(true);
            setPasswordError(false);
            setAttemptsLeft(3); // reset on success
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
                                        يرجى إدخال رمز الحماية للوصول إلى بيانات وطرق الدفع الحساسة
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
        <div className="space-y-6 max-w-2xl mx-auto py-4 animate-in fade-in zoom-in-95 duration-300 relative text-right">
            <div className="bg-[#020617]/50 p-6 md:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -z-10" style={{ backgroundColor: theme.primary }} />

                <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0" style={{ color: theme.primary }}>
                        <CreditCard size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">طرق الدفع والتحويل</h2>
                        <p className="text-sm text-gray-400 font-bold mt-1">تعديل أرقام فودافون كاش وروابط انستا باي لتظهر لجميع الطلاب</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Vodafone Cash */}
                    <div className="space-y-3 bg-red-600/5 border border-red-600/10 p-5 rounded-2xl">
                        <label className="text-sm text-red-500 font-black flex items-center gap-2">
                            <Smartphone size={16} />
                            رقم محفظة فودافون كاش
                        </label>
                        <input
                            type="text"
                            value={vodafoneCash}
                            onChange={(e) => setVodafoneCash(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 flex-1 text-center font-black text-white outline-none focus:border-red-500/50 focus:bg-black/60 tracking-widest text-lg"
                            placeholder="010XXXXXXXX"
                            dir="ltr"
                        />
                        <p className="text-[10px] text-gray-500 font-bold">هذا الرقم سيظهر للطلاب عند اختيار طريقة الدفع بفودافون كاش، وسيتم تحويل المبالغ عليه تلقائياً عبر كود المحفظة.</p>
                    </div>

                    {/* InstaPay */}
                    <div className="space-y-3 bg-purple-600/5 border border-purple-600/10 p-5 rounded-2xl">
                        <label className="text-sm text-purple-400 font-black flex items-center gap-2">
                            <LinkIcon size={16} />
                            رابط الدفع المباشر (InstaPay)
                        </label>
                        <input
                            type="text"
                            value={instaPayLink}
                            onChange={(e) => setInstaPayLink(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 flex-1 text-right px-4 font-bold text-white outline-none focus:border-purple-500/50 focus:bg-black/60 text-sm"
                            placeholder="https://ipn.eg/S/..."
                            dir="ltr"
                        />
                        <p className="text-[10px] text-gray-500 font-bold">هذا هو الرابط المباشر للدفع الخاص بانستا باي. بمجرد الضغط عليه من الطالب سيفتح تطبيق انستا باي مباشرة.</p>
                    </div>
                    

                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving' || !vodafoneCash.trim() || !instaPayLink.trim()}
                        className="w-full py-4 mt-6 text-black font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 transition-all"
                        style={{ backgroundColor: saveStatus === 'saved' ? '#10b981' : theme.primary }}
                    >
                        {saveStatus === 'saving' ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : saveStatus === 'saved' ? (
                            <span>تم تحديث طرق الدفع بنجاح!</span>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>حفظ بيانات التحويل</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
