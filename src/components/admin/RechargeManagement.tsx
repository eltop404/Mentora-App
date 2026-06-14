import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, CheckCircle2, XCircle, Package } from 'lucide-react';
import { DB } from '../../services/db';

export const RechargeManagement = () => {
    const [settings, setSettings] = useState(() => DB.getSettings());
    const [packages, setPackages] = useState<any[]>(settings.rechargePackages || []);
    const [isRechargeEnabled, setIsRechargeEnabled] = useState<boolean>(settings.isRechargeEnabled ?? true);
    const [editingPkg, setEditingPkg] = useState<any | null>(null);

    useEffect(() => {
        const handleSync = () => {
            const current = DB.getSettings();
            setSettings(current);
            setPackages(current.rechargePackages || []);
            setIsRechargeEnabled(current.isRechargeEnabled ?? true);
        };
        window.addEventListener('nt-settings-change', handleSync);
        return () => window.removeEventListener('nt-settings-change', handleSync);
    }, []);

    const toggleRechargeSection = () => {
        const newValue = !isRechargeEnabled;
        setIsRechargeEnabled(newValue);
        DB.updateSettings({ ...settings, isRechargeEnabled: newValue });
    };

    const savePackage = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const newPkg = {
            id: editingPkg?.id || `pkg_${Date.now()}`,
            label: formData.get('label') as string,
            points: Number(formData.get('points')),
            price: Number(formData.get('price'))
        };

        let updatedPackages;
        if (editingPkg?.id) {
            updatedPackages = packages.map(p => p.id === editingPkg.id ? newPkg : p);
        } else {
            updatedPackages = [...packages, newPkg];
        }

        setPackages(updatedPackages);
        DB.updateSettings({ ...settings, rechargePackages: updatedPackages });
        setEditingPkg(null);
    };

    const deletePackage = (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
        const updatedPackages = packages.filter(p => p.id !== id);
        setPackages(updatedPackages);
        DB.updateSettings({ ...settings, rechargePackages: updatedPackages });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded-3xl border border-white/5 shadow-inner cv-section relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Package size={32} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white glow-text">إدارة باقات الشحن</h2>
                    <p className="text-gray-400 font-bold mt-1 text-sm">تحكم في باقات الشحن وإمكانية ظهور القسم للطلاب</p>
                </div>
            </div>

            <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 space-y-6 shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="text-right">
                        <h3 className="text-white font-black text-lg">تفعيل قسم الشحن للطالب</h3>
                        <p className="text-gray-500 text-xs font-bold mt-1">عند إيقاف هذا الخيار، سيختفي قسم الشحن تماماً من صفحة الطالب</p>
                    </div>
                    <button
                        onClick={toggleRechargeSection}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${isRechargeEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-300 ${isRechargeEnabled ? 'translate-x-1' : 'translate-x-7'}`} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-black text-lg">الباقات الحالية</h3>
                        <button
                            onClick={() => setEditingPkg({})}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            <span>إضافة باقة جديدة</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {packages.map(pkg => (
                            <div key={pkg.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-3 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                        <Package size={20} className="text-purple-400" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingPkg(pkg)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all border border-white/5 hover:border-blue-500/30">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => deletePackage(pkg.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right mt-2 space-y-1">
                                    <h4 className="text-white font-black text-lg">{pkg.label}</h4>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-emerald-400 font-black" dir="ltr">{pkg.price} EGP</span>
                                        <span className="text-gray-400 font-bold text-sm">{pkg.points.toLocaleString()} نقطة</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {packages.length === 0 && (
                            <div className="col-span-full py-10 flex flex-col items-center justify-center opacity-50 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                                <Package size={40} className="mb-2" />
                                <p className="font-bold">لا يوجد باقات شحن حالياً</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Edit/Add */}
            {editingPkg !== null && (
                <div className="fixed inset-0 z-[1000] flex flex-col pt-14 pb-16 p-2 sm:p-6 bg-black/80 backdrop-blur-sm overflow-hidden items-center justify-center" onClick={() => setEditingPkg(null)}>
                    <div className="w-full h-auto max-h-full max-w-md relative flex flex-col bg-[#13161c] rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                            <button onClick={() => setEditingPkg(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white active:scale-95 transition-all">
                                <XCircle size={20} />
                            </button>
                            <h2 className="text-lg font-black text-white">{editingPkg?.id ? 'تعديل الباقة' : 'باقة جديدة'}</h2>
                        </div>
                        <form onSubmit={savePackage} className="p-6 space-y-4 flex-1 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 block text-right">اسم الباقة (مثال: الباقة الذهبية)</label>
                                <input name="label" defaultValue={editingPkg.label} required type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-right font-bold focus:border-purple-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 block text-right">عدد النقاط</label>
                                <input name="points" defaultValue={editingPkg.points} required type="number" min="1" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-right font-bold focus:border-purple-500 outline-none" dir="ltr" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 block text-right">السعر (EGP)</label>
                                <input name="price" defaultValue={editingPkg.price} required type="number" min="0" step="1" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-right font-bold focus:border-purple-500 outline-none" dir="ltr" />
                            </div>
                            <button type="submit" className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all mt-4">
                                حفظ الباقة
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RechargeManagement;
