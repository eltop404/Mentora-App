
import React, { useState } from 'react';
import {
    Settings, Sparkles, Coins, Users, Shield,
    Save, AlertCircle, Info, Activity, ArrowDownCircle,
    Database, RefreshCw
} from 'lucide-react';
import { DB } from '../../services/db';

interface SystemControlProps {
    appSettings: any;
    setAppSettings: (val: any) => void;
    theme: any;
}

export const SystemControl: React.FC<SystemControlProps> = ({ appSettings, setAppSettings, theme }) => {
    const [localSettings, setLocalSettings] = useState({ ...appSettings });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        DB.updateSettings(localSettings);
        setAppSettings(DB.getSettings());
        setTimeout(() => {
            setIsSaving(false);
            alert('تم حفظ الإعدادات بنجاح! 🎉');
        }, 500);
    };


    return (
        <div className="space-y-8 text-right pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8 relative">
                <div className="text-right">
                    <h2 className="text-4xl font-black text-white flex items-center justify-end gap-3">
                        قسم التحكم بالنظام
                        <div className="p-2.5 bg-primary/10 rounded-2xl" style={{ color: theme.primary }}>
                            <Settings size={32} />
                        </div>
                    </h2>
                    <p className="text-gray-500 text-sm font-bold mt-2 pr-12">تحكم في الكوينز، المكافآت، والنظام الاحترافي</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-10 py-4 bg-emerald-500 text-black font-black rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-3 disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                    حفظ كافة التغييرات
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Settings Form */}
                <div className="space-y-8">

                    {/* Premium Analytics System Card */}
                    <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] -z-10" />

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${localSettings.premiumSystemEnabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {localSettings.premiumSystemEnabled ? 'System Active' : 'System Disabled'}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                نظام التحليل الاحترافي
                                <Sparkles size={20} className="text-amber-500" />
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => setLocalSettings({ ...localSettings, premiumSystemEnabled: !localSettings.premiumSystemEnabled })}
                                        className={`w-14 h-8 rounded-full transition-all relative ${localSettings.premiumSystemEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localSettings.premiumSystemEnabled ? 'right-7' : 'right-1'}`} />
                                    </button>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">تفعيل النظام</p>
                                        <p className="text-[9px] text-gray-500 font-bold">تفعيل/تعطيل التحليل الاحترافي للطلاب</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 block px-2">سعر فتح النظام (كوينز)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={localSettings.premiumUnlockPrice}
                                            onChange={(e) => setLocalSettings({ ...localSettings, premiumUnlockPrice: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-12 text-white font-black text-center outline-none focus:border-primary/50 transition-all shadow-inner"
                                        />
                                        <Coins size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 block px-2">معدل الاستهلاك اليومي (كوينز)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={localSettings.premiumConsumptionRate}
                                            onChange={(e) => setLocalSettings({ ...localSettings, premiumConsumptionRate: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-12 text-white font-black text-center outline-none focus:border-primary/50 transition-all shadow-inner"
                                        />
                                        <Activity size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                                    </div>
                                    <p className="text-[9px] text-gray-500 font-bold px-2 italic">يتم خصم هذا المبلغ يومياً من المشتركين</p>
                                </div>

                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                                    <Info size={16} className="text-amber-500 shrink-0 mt-1" />
                                    <p className="text-[10px] text-amber-200/60 font-medium leading-relaxed">
                                        عند تفعيل هذا النظام، يتطلب من الطالب الدفع لمرة واحدة لفتح الميزات، ثم يتم خصم مبلغ يومي لضمان استمرار الخدمة.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Referral System Card */}
                    <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -z-10" />

                        <h3 className="text-xl font-black text-white flex items-center justify-end gap-3 mb-8">
                            نظام المكافآت (Referral)
                            <Users size={20} className="text-emerald-500" />
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 block px-2">مكافأة الداعي (كوينز)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={localSettings.referralRewardAmount || 1000}
                                        onChange={(e) => setLocalSettings({ ...localSettings, referralRewardAmount: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-12 text-white font-black text-center outline-none focus:border-emerald-500/50 transition-all"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-black">R</div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 flex flex-col justify-center">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                                    <Shield size={16} className="text-emerald-500" />
                                    <span className="text-[10px] text-emerald-400/80 font-bold">يتم إضافة المكافأة تلقائياً عند التسجيل الناجح</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
