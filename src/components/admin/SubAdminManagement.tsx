import React, { useState, useEffect } from 'react';
import { DB } from '../../services/db';
import { Copy, Save, AlertCircle, Eye, EyeOff, User, Lock, LayoutGrid } from 'lucide-react';
import { SubAdminConfig } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const SubAdminManagement: React.FC = () => {
    const [subAdmins, setSubAdmins] = useState<SubAdminConfig[]>([]);
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSubAdmins(DB.getSubAdmins());
    }, []);

    const handleChange = (index: number, field: keyof SubAdminConfig, value: string) => {
        const updated = [...subAdmins];
        updated[index] = { ...updated[index], [field]: value };
        setSubAdmins(updated);
    };

    const togglePassword = (index: number) => {
        setVisiblePasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`تم نسخ ${label} بنجاح`);
    };

    const handleSave = () => {
        setIsSaving(true);
        DB.saveSubAdmins(subAdmins);
        setTimeout(() => {
            setIsSaving(false);
            alert('تم التحديث بنجاح. سيتم تسجيل خروج أي مشرف فرعي يستخدم بيانات قديمة.');
        }, 500);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-right flex-1">
                    <h2 className="text-3xl font-black text-white mb-2">لوحات التحكم</h2>
                    <p className="text-sm font-bold text-gray-500">إدارة حسابات المشرفين الفرعيين وكلمات المرور الخاصة بهم</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-yellow-500 text-black font-black rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                    <Save size={18} />
                    {isSaving ? 'جاري الحفظ...' : 'تحديث الحسابات'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subAdmins.map((admin, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-3xl p-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-6">
                                <button
                                    onClick={() => copyToClipboard(`اسم المستخدم: ${admin.user}\nكلمة المرور: ${admin.pass}`, 'البيانات')}
                                    className="p-2 bg-white/5 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-500 rounded-xl transition-colors"
                                    title="نسخ البيانات"
                                >
                                    <Copy size={16} />
                                </button>
                                <div className="text-right">
                                    <h3 className="font-black text-lg text-white mb-1">{admin.year}</h3>
                                    <div className="flex items-center justify-end gap-2 text-xs font-bold text-yellow-500">
                                        <LayoutGrid size={12} />
                                        <span>{admin.division} {admin.spec && `- ${admin.spec}`}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase flex items-center justify-end gap-1">
                                        اسم المستخدم <User size={10} />
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={admin.user}
                                                onChange={(e) => handleChange(idx, 'user', e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-right font-bold text-sm text-white focus:border-yellow-500/50 outline-none transition-colors"
                                            />
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(admin.user, 'اسم المستخدم')}
                                            className="p-3 bg-black/50 border border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-500 text-gray-400 rounded-xl transition-all shrink-0"
                                            title="نسخ اسم المستخدم"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase flex items-center justify-end gap-1">
                                        كلمة المرور <Lock size={10} />
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type={visiblePasswords[idx] ? "text" : "password"}
                                                value={admin.pass}
                                                onChange={(e) => handleChange(idx, 'pass', e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-right font-bold text-sm text-white focus:border-yellow-500/50 outline-none transition-colors"
                                            />
                                            <button
                                                onClick={() => togglePassword(idx)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white transition-colors"
                                            >
                                                {visiblePasswords[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(admin.pass, 'كلمة المرور')}
                                            className="p-3 bg-black/50 border border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-500 text-gray-400 rounded-xl transition-all shrink-0"
                                            title="نسخ كلمة المرور"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3 mt-6">
                <AlertCircle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-yellow-500/80 text-right leading-relaxed">
                    ملاحظة هامة: تغيير بيانات تسجيل الدخول لأي مشرفة أو مشرف فرعي سيؤدي فوراً لتسجيل خروجه من النظام إن كان متصلاً حالياً. تأكد من إبلاغه ببيانات الدخول الجديدة بعد التحديث لتجنب انقطاع العمل.
                </p>
            </div>
        </div>
    );
};
