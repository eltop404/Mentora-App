import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, Star, Clock, Crown, ShieldCheck } from 'lucide-react';
import { DB } from '../services/db';

export const GoldenMembership = ({
    user,
    theme,
    onBack,
    onPurchase,
}: {
    user: any;
    theme: any;
    onBack: () => void;
    onPurchase: (pkg: any) => void;
}) => {
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
    const [pendingReceipt, setPendingReceipt] = useState<any>(null);

    const loadData = () => {
        let pkgs = DB.getAdsPackages();
        let patched = false;
        
        if (!pkgs || pkgs.length === 0) {
            pkgs = [{
                id: 'ads_monthly',
                title: 'الباقة الشهرية',
                price: 49,
                coinPrice: 2000,
                durationMonths: 1,
                features: ['إزالة جميع الإعلانات', 'ظهور شارة العضوية الذهبية بجوار اسم الطالب', 'أولوية ظهور التعليقات والمشاركات', 'تجربة استخدام أفضل بدون إزعاج']
            }];
            patched = true;
        }

        // Ensure 3-months package exists
        if (!pkgs.some((p: any) => p.id === 'ads_3months' || p.title === 'باقة 3 شهور')) {
            pkgs.push({
                id: 'ads_3months',
                title: 'باقة 3 شهور',
                price: 119,
                coinPrice: 3700,
                durationMonths: 3,
                features: ['إزالة جميع الإعلانات', 'ظهور شارة العضوية الذهبية بجوار اسم الطالب', 'أولوية ظهور التعليقات والمشاركات', 'تجربة استخدام أفضل بدون إزعاج', 'أولوية الدعم الفني']
            });
            patched = true;
        }

        pkgs = pkgs.map((p: any) => {
            let updatedP = { ...p };
            if (updatedP.title === 'باقة 3 شهور' && !updatedP.features.includes('أولوية الدعم الفني')) {
                patched = true;
                updatedP.features = [...updatedP.features, 'أولوية الدعم الفني'];
            }
            if ((updatedP.title.includes('شهرية') || updatedP.title === 'الباقة الشهرية') && !('coinPrice' in updatedP)) {
                patched = true;
                updatedP.coinPrice = 2000;
            }
            if (updatedP.title.includes('3 شهور') && !('coinPrice' in updatedP)) {
                patched = true;
                updatedP.coinPrice = 3700;
            }
            return updatedP;
        });
        if (patched) {
            DB.saveAdsPackages(pkgs);
        }
        setPackages(pkgs);

        const payments = DB.getPayments();
        const pending = payments.find(
            (p: any) =>
                p.studentId === user.id &&
                p.itemType === 'ads_package' &&
                p.status === 'pending_review'
        );
        setPendingReceipt(pending || null);
    };

    useEffect(() => {
        loadData();
        window.addEventListener('nt-payments-change', loadData);
        window.addEventListener('nt-students-change', loadData);
        return () => {
            window.removeEventListener('nt-payments-change', loadData);
            window.removeEventListener('nt-students-change', loadData);
        };
    }, [user.id]);

    if (!packages.length) return null;

    const selectedPkg = packages[selectedPkgIndex];

    // Compute membership status from the correct fields
    const expiryStr = user?.goldenMembershipExpiry;
    const isActive = user?.goldenMembershipActive && expiryStr && new Date(expiryStr) > new Date();

    const remainingDays = isActive
        ? Math.max(0, Math.ceil((new Date(expiryStr!).getTime() - Date.now()) / 86400000))
        : 0;

    const activePkg = isActive
        ? packages.find((p) => p.id === user?.goldenMembershipPackageId)
        : null;

    const handleCoinPurchase = (pkg: any) => {
        if (!user) return;
        const requiredCoins = pkg.coinPrice || 0;
        if (user.coins < requiredCoins) {
            alert(`عفواً، رصيدك غير كافٍ. تحتاج إلى ${requiredCoins} كوينز للاشتراك.`);
            return;
        }
        
        if (window.confirm(`سيتم خصم ${requiredCoins} كوينز من رصيدك. هل أنت متأكد؟`)) {
            const currentExpiry = (user.goldenMembershipActive && user.goldenMembershipExpiry && new Date(user.goldenMembershipExpiry) > new Date())
                ? new Date(user.goldenMembershipExpiry)
                : new Date();
                
            currentExpiry.setMonth(currentExpiry.getMonth() + (pkg.durationMonths || 1));
            
            const updatedUser = {
                ...user,
                coins: user.coins - requiredCoins,
                goldenMembershipActive: true,
                goldenMembershipExpiry: currentExpiry.toISOString().split('T')[0],
                goldenMembershipPackageId: pkg.id
            };
            
            DB.updateStudent(user.id, updatedUser);

            const order = {
                id: 'pay_' + Date.now(),
                studentId: user.id,
                studentName: user.username,
                studentLevel: user.level,
                studentYear: user.year,
                studentEmail: user.email,
                studentPhone: user.phoneNumber,
                itemType: 'ads_package',
                adsPackageId: pkg.id,
                price: 0,
                coinPayment: true,
                usedCoins: requiredCoins,
                status: 'approved',
                date: new Date().toLocaleDateString('ar-EG'),
                time: new Date().toLocaleTimeString('ar-EG'),
            };
            DB.addPayment(order);

            alert('تم تفعيل العضوية الذهبية بنجاح! 🎉');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #064e3b 0%, #065f46 40%, #047857 100%)' }}
            dir="rtl"
        >
            {/* Header */}
            <div className="p-5 flex items-center justify-between z-10 bg-black/10 backdrop-blur-sm border-b border-white/10">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95"
                >
                    <ArrowRight size={22} className="text-white" />
                </button>
                <h1 className="text-xl font-black flex items-center gap-2 text-white">
                    <Crown size={22} className="fill-yellow-400 text-yellow-400" />
                    العضوية الذهبية
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 flex flex-col items-center">

                {/* ADS Crossed Icon */}
                <div className="flex justify-center mt-2">
                    <div className="relative w-24 h-24 bg-red-600 rounded-full flex items-center justify-center border-[5px] border-emerald-300 shadow-2xl overflow-hidden">
                        <span className="text-3xl font-black text-white tracking-tighter z-10">ADS</span>
                        {/* Strike-through line */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="w-full h-[3px] bg-emerald-300 rotate-[-35deg] rounded-full shadow" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-2 w-full">
                    <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                        <Star className="fill-yellow-400 text-yellow-400" size={22} />
                        ماذا ستحصل عند اشتراكك؟
                    </h2>
                    <p className="text-base font-bold text-emerald-100/90">
                        استمتع بتجربة مميزة بدون إعلانات
                    </p>
                </div>

                {/* Features list */}
                <div className="space-y-3 text-right w-full max-w-sm">
                    {(selectedPkg?.features || []).map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="bg-white rounded-full p-0.5 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                                <Check className="text-yellow-500" size={16} strokeWidth={4} />
                            </div>
                            <span className="text-base font-bold text-white drop-shadow-sm">{f}</span>
                        </div>
                    ))}
                </div>

                {/* ===== Status Area ===== */}
                {isActive ? (
                    /* Active membership card */
                    <div className="w-[90%] max-w-[300px] mx-auto mt-4">
                        <div className="bg-gradient-to-br from-emerald-900/80 to-emerald-800/60 rounded-3xl p-5 text-center shadow-[0_15px_40px_-10px_rgba(16,185,129,0.4)] relative overflow-hidden backdrop-blur-xl border border-white/5">
                            <div className="absolute -right-6 -top-6 opacity-10 rotate-12 transition-transform duration-1000 hover:rotate-45">
                                <Crown size={120} className="fill-yellow-400 text-yellow-400" />
                            </div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
                            
                            <div className="flex items-center justify-center gap-1.5 text-yellow-400 mb-2 relative z-10">
                                <ShieldCheck size={18} strokeWidth={2.5} />
                                <h3 className="font-black text-base">عضويتك مفعّلة الآن</h3>
                            </div>
                            <h2 className="text-xl font-black text-white mb-4 relative z-10 drop-shadow-md">
                                {activePkg?.title || 'باقة شهرية'}
                            </h2>
                            
                            <div className="bg-black/20 rounded-2xl p-3 border border-white/5 space-y-2.5 relative z-10 backdrop-blur-sm">
                                <div className="flex justify-between items-center text-xs font-bold text-emerald-100">
                                    <span className="text-yellow-400 font-black text-sm">{remainingDays} يوم</span>
                                    <span>الأيام المتبقية:</span>
                                </div>
                                
                                {/* Progress bar simulating remaining time */}
                                <div className="w-full bg-black/40 rounded-full h-1 overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-full rounded-full transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, Math.max(0, (remainingDays / ((activePkg?.durationMonths || 1) * 30)) * 100))}%` }}
                                    ></div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-emerald-200/50">
                                    <span dir="ltr">{new Date(expiryStr!).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    <span>تنتهي في:</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : pendingReceipt ? (
                    /* Pending review card */
                    <div className="w-[85%] max-w-[280px] mx-auto mt-4">
                        <div className="bg-amber-800/30 border border-amber-400/50 rounded-2xl p-3 text-center shadow-lg">
                            <div className="flex items-center justify-center gap-1.5 text-amber-300 mb-1.5">
                                <Clock size={16} />
                                <h3 className="font-black text-sm">طلبك قيد المراجعة ⏳</h3>
                            </div>
                            <p className="text-amber-100/80 text-xs font-bold leading-relaxed">
                                جاري مراجعة طلب الاشتراك في{' '}
                                {packages.find((p) => p.id === pendingReceipt.adsPackageId)?.title || 'العضوية الذهبية'}..
                                يرجى الانتظار لحين تأكيد الدفع من الإدارة.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Subscribe area */
                    <div className="w-full max-w-sm mt-2 flex flex-col gap-4">
                        {/* Package tabs */}
                        <div className="flex gap-3">
                            {packages.map((pkg, idx) => (
                                <button
                                    key={pkg.id}
                                    onClick={() => setSelectedPkgIndex(idx)}
                                    className={`flex-1 py-3 px-2 rounded-xl text-sm font-black border-2 transition-all active:scale-95 ${
                                        selectedPkgIndex === idx
                                            ? 'border-yellow-400 bg-emerald-800/50 text-yellow-400 shadow-lg'
                                            : 'border-emerald-700/50 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-800/30'
                                    }`}
                                >
                                    {pkg.title}
                                </button>
                            ))}
                        </div>

                        {/* Subscribe button */}
                        <div className="flex flex-col items-center mt-6 gap-3">
                            <button
                                onClick={() => onPurchase(selectedPkg)}
                                className="w-[280px] py-3 rounded-2xl font-black text-base text-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                            >
                                <Crown size={18} className="fill-black" />
                                اشترك الآن — {selectedPkg.price} ج.م
                            </button>

                            {selectedPkg.coinPrice > 0 && (
                                <button
                                    onClick={() => handleCoinPurchase(selectedPkg)}
                                    className="w-[280px] py-3 rounded-2xl font-black text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">🪙</span>
                                    اشترك بالكوينز (مطلوب {selectedPkg.coinPrice})
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
