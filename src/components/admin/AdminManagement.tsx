import React, { useState } from 'react';
import { ShieldCheck, Save, Eye, EyeOff } from 'lucide-react';
import { DB } from '../../services/db';

interface AdminManagementProps {
    appSettings: any;
    setAppSettings: (settings: any) => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ appSettings, setAppSettings }) => {
    const [username, setUsername] = useState(appSettings.adminCredentials?.username || 'admen');
    const [password, setPassword] = useState(appSettings.adminCredentials?.password || '01270500409');
    const [showPassword, setShowPassword] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const handleSave = () => {
        if (!username.trim() || !password.trim()) {
            alert('يرجى ملء جميع الحقول أولاً');
            return;
        }

        setSaveStatus('saving');
        const newSettings = {
            ...appSettings,
            adminCredentials: { username: username.trim().toLowerCase(), password: password.trim() }
        };

        DB.updateSettings(newSettings);
        setAppSettings(newSettings);

        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto py-4">
            <div className="bg-[#020617]/50 p-6 md:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -z-10 bg-emerald-500/20" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck size={28} className="text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">إدارة حساب الإدارة</h2>
                        <p className="text-sm text-gray-400 font-bold mt-1">تعديل بيانات دخول مشرف المنصة الأساسي</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-bold block text-right">اسم المستخدم (الأدمن)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-right font-black text-white outline-none focus:border-emerald-500/50 focus:bg-white/10"
                            placeholder="مثال: admin"
                            dir="auto"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-bold block text-right">كلمة المرور</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-left font-black text-white outline-none focus:border-emerald-500/50 focus:bg-white/10 tracking-widest"
                                placeholder="كلمة المرور المشفرة"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-yellow-500/80 font-bold mt-2">
                            ⚠️ تنبيه: يرجى الاحتفاظ بكلمة المرور في مكان آمن، عند فقدانها لن تتمكن من دخول لوحة التحكم.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving' || !username.trim() || !password.trim()}
                        className="w-full py-4 mt-4 bg-emerald-500 text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    >
                        {saveStatus === 'saving' ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : saveStatus === 'saved' ? (
                            <span>تم تحديث البيانات بنجاح!</span>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>حفظ التعديلات وتحديث البيانات</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
