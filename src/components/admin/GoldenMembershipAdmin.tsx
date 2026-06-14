import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Edit2, Save, X, Crown, Users, ShieldCheck, Calendar } from 'lucide-react';
import { DB } from '../../services/db';
import { Student } from '../../types';

interface Props {
    theme: any;
    students: Student[];
    setStudents: (s: Student[]) => void;
}

export const GoldenMembershipAdmin: React.FC<Props> = ({ theme, students, setStudents }) => {
    const [settings, setSettings] = useState(() => DB.getSettings());
    const [isGoldenMembershipEnabled, setIsGoldenMembershipEnabled] = useState<boolean>(settings.isGoldenMembershipEnabled ?? true);
    const [packages, setPackages] = useState<any[]>([]);
    const [editingPkg, setEditingPkg] = useState<any | null>(null);
    const [isAddingPkg, setIsAddingPkg] = useState(false);
    const [newPkg, setNewPkg] = useState({ title: '', price: '', coinPrice: '', durationMonths: '1', features: '' });
    const [activeTab, setActiveTab] = useState<'packages' | 'subscribers'>('packages');

    const loadPackages = () => {
        let pkgs = DB.getAdsPackages();
        let patched = false;
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
        const current = DB.getSettings();
        setSettings(current);
        setIsGoldenMembershipEnabled(current.isGoldenMembershipEnabled ?? true);
    };

    useEffect(() => {
        loadPackages();
        window.addEventListener('nt-ads-packages-change', loadPackages);
        window.addEventListener('nt-settings-change', loadPackages);
        return () => {
            window.removeEventListener('nt-ads-packages-change', loadPackages);
            window.removeEventListener('nt-settings-change', loadPackages);
        };
    }, []);

    const activeMembers = students.filter(s =>
        s.goldenMembershipActive && s.goldenMembershipExpiry && new Date(s.goldenMembershipExpiry) > new Date()
    );

    const handleSavePkg = () => {
        if (!newPkg.title || !newPkg.price) return alert('يرجى ملأ الاسم والسعر');
        const pkg = {
            id: 'pkg_' + Date.now(),
            title: newPkg.title,
            price: parseFloat(newPkg.price),
            coinPrice: parseInt(newPkg.coinPrice) || 0,
            durationMonths: parseInt(newPkg.durationMonths) || 1,
            features: newPkg.features.split('\n').map(f => f.trim()).filter(Boolean),
            isActive: true,
        };
        const updated = [...packages, pkg];
        DB.saveAdsPackages(updated);
        setPackages(updated);
        setNewPkg({ title: '', price: '', coinPrice: '', durationMonths: '1', features: '' });
        setIsAddingPkg(false);
    };

    const handleUpdatePkg = () => {
        if (!editingPkg) return;
        const updated = packages.map(p => p.id === editingPkg.id ? editingPkg : p);
        DB.saveAdsPackages(updated);
        setPackages(updated);
        setEditingPkg(null);
    };

    const handleDeletePkg = (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
        const updated = packages.filter(p => p.id !== id);
        DB.saveAdsPackages(updated);
        setPackages(updated);
    };

    const handleRevokeAccess = (student: Student) => {
        if (!window.confirm(`هل تريد حذف وإلغاء عضوية ${student.username}؟`)) return;

        const payments = DB.getPayments();
        const updatedPayments = payments.filter(p => !(p.studentId === student.id && p.itemType === 'ads_package'));
        if (updatedPayments.length !== payments.length) {
            DB.savePayments(updatedPayments);
        }

        DB.updateStudent(student.id, {
            goldenMembershipActive: false,
            goldenMembershipExpiry: undefined,
            goldenMembershipPackageId: undefined,
        });
        setStudents(DB.getStudents());
    };

    const handleExtendAccess = (student: Student, extraMonths: number) => {
        const current = student.goldenMembershipExpiry
            ? new Date(student.goldenMembershipExpiry)
            : new Date();
        current.setMonth(current.getMonth() + extraMonths);
        DB.updateStudent(student.id, {
            goldenMembershipActive: true,
            goldenMembershipExpiry: current.toISOString().split('T')[0],
        });
        setStudents(DB.getStudents());
    };

    return (
        <div className="space-y-6 text-right pb-20" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div />
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center justify-end gap-3">
                        <Crown size={26} className="fill-yellow-400 text-yellow-400" />
                        إدارة العضوية الذهبية
                    </h2>
                    <p className="text-xs text-gray-500 font-bold mt-1">إدارة الباقات والمشتركين النشطين</p>
                </div>
            </div>

            {/* Toggle Section */}
            <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="text-right flex flex-col items-start gap-2">
                        <h3 className="text-white font-black text-lg">تفعيل قسم العضوية الذهبية للطالب</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide border ${isGoldenMembershipEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {isGoldenMembershipEnabled ? 'ظاهر عند الطلاب' : 'مخفي من عند الطلاب'}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const newValue = !isGoldenMembershipEnabled;
                            setIsGoldenMembershipEnabled(newValue);
                            DB.updateSettings({ ...settings, isGoldenMembershipEnabled: newValue });
                        }}
                        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black ${isGoldenMembershipEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-300 ${isGoldenMembershipEnabled ? 'translate-x-1' : 'translate-x-7'}`} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-yellow-400">{activeMembers.length}</p>
                    <p className="text-xs text-gray-400 font-bold mt-1">مشترك نشط</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-emerald-400">{packages.length}</p>
                    <p className="text-xs text-gray-400 font-bold mt-1">باقة متاحة</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-blue-400">
                        {(DB.getPayments() as any[]).filter(p => p.itemType === 'ads_package' && p.status === 'approved' && students.some(s => s.id === p.studentId)).length}
                    </p>
                    <p className="text-xs text-gray-400 font-bold mt-1">اشتراك مؤكد</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit mr-auto">
                <button
                    onClick={() => setActiveTab('packages')}
                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'packages' ? 'text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    style={activeTab === 'packages' ? { backgroundColor: theme.primary } : {}}
                >
                    الباقات
                </button>
                <button
                    onClick={() => setActiveTab('subscribers')}
                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'subscribers' ? 'text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    style={activeTab === 'subscribers' ? { backgroundColor: theme.primary } : {}}
                >
                    المشتركون ({activeMembers.length})
                </button>
            </div>

            {/* Packages Tab */}
            {activeTab === 'packages' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setIsAddingPkg(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-black active:scale-95 transition-all shadow-lg mr-auto"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <Plus size={16} />
                        إضافة باقة جديدة
                    </button>

                    {/* Add Package Form */}
                    {isAddingPkg && (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                            <h3 className="text-base font-black text-white text-right">باقة جديدة</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="اسم الباقة"
                                    value={newPkg.title}
                                    onChange={e => setNewPkg(p => ({ ...p, title: e.target.value }))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all text-right"
                                />
                                <input
                                    type="number"
                                    placeholder="السعر (ج.م)"
                                    value={newPkg.price}
                                    onChange={e => setNewPkg(p => ({ ...p, price: e.target.value }))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all text-right"
                                />
                                <input
                                    type="number"
                                    placeholder="الكوينز (مطلوب)"
                                    value={newPkg.coinPrice}
                                    onChange={e => setNewPkg(p => ({ ...p, coinPrice: e.target.value }))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all text-right"
                                />
                                <input
                                    type="number"
                                    placeholder="المدة (شهور)"
                                    value={newPkg.durationMonths}
                                    onChange={e => setNewPkg(p => ({ ...p, durationMonths: e.target.value }))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all text-right"
                                />
                            </div>
                            <textarea
                                placeholder="المميزات (سطر لكل ميزة)"
                                value={newPkg.features}
                                onChange={e => setNewPkg(p => ({ ...p, features: e.target.value }))}
                                rows={4}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-500/50 transition-all resize-none text-right"
                            />
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setIsAddingPkg(false)} className="px-5 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-black hover:text-white transition-all">
                                    إلغاء
                                </button>
                                <button onClick={handleSavePkg} className="px-5 py-2 rounded-xl text-black text-xs font-black flex items-center gap-2 shadow-lg active:scale-95" style={{ backgroundColor: theme.primary }}>
                                    <Save size={14} /> حفظ الباقة
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Packages List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {packages.map(pkg => (
                            <div key={pkg.id} className="bg-white/5 border border-yellow-500/20 rounded-3xl p-5 space-y-3 relative">
                                {editingPkg?.id === pkg.id ? (
                                    <div className="space-y-3">
                                        <input
                                            value={editingPkg.title}
                                            onChange={e => setEditingPkg((p: any) => ({ ...p, title: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none text-right"
                                        />
                                        <div className="grid grid-cols-3 gap-3">
                                            <input
                                                type="number"
                                                value={editingPkg.price}
                                                onChange={e => setEditingPkg((p: any) => ({ ...p, price: parseFloat(e.target.value) }))}
                                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none text-right"
                                                placeholder="السعر"
                                            />
                                            <input
                                                type="number"
                                                value={editingPkg.coinPrice || ''}
                                                onChange={e => setEditingPkg((p: any) => ({ ...p, coinPrice: parseInt(e.target.value) || 0 }))}
                                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none text-right"
                                                placeholder="الكوينز"
                                            />
                                            <input
                                                type="number"
                                                value={editingPkg.durationMonths}
                                                onChange={e => setEditingPkg((p: any) => ({ ...p, durationMonths: parseInt(e.target.value) }))}
                                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none text-right"
                                                placeholder="المدة"
                                            />
                                        </div>
                                        <textarea
                                            value={(editingPkg.features || []).join('\n')}
                                            onChange={e => setEditingPkg((p: any) => ({ ...p, features: e.target.value.split('\n').map((f: string) => f.trim()).filter(Boolean) }))}
                                            rows={3}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none resize-none text-right"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingPkg(null)} className="px-4 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-black"><X size={12} /></button>
                                            <button onClick={handleUpdatePkg} className="px-4 py-1.5 rounded-lg text-black text-xs font-black flex items-center gap-1" style={{ backgroundColor: theme.primary }}><Save size={12} /> حفظ</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDeletePkg(pkg.id)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs"><Trash2 size={14} /></button>
                                                <button onClick={() => setEditingPkg({ ...pkg })} className="p-2 bg-white/5 text-gray-400 rounded-xl hover:text-white transition-all"><Edit2 size={14} /></button>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-white flex items-center justify-end gap-2">
                                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                                    {pkg.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 font-bold mt-0.5">{pkg.durationMonths} شهر — {pkg.price} ج.م {pkg.coinPrice > 0 ? `— ${pkg.coinPrice} كوينز` : ''}</p>
                                            </div>
                                        </div>
                                        <ul className="space-y-1.5 text-right">
                                            {(pkg.features || []).map((f: string, i: number) => (
                                                <li key={i} className="text-xs text-gray-300 font-bold flex items-center justify-end gap-2">
                                                    <span>{f}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Subscribers Tab */}
            {activeTab === 'subscribers' && (
                <div className="space-y-4">
                    {activeMembers.length === 0 ? (
                        <div className="py-20 text-center opacity-20">
                            <Users size={60} className="mx-auto mb-4" />
                            <p className="text-xl font-black">لا يوجد مشتركون نشطون حالياً</p>
                        </div>
                    ) : (
                        activeMembers.map(s => {
                            const expiry = new Date(s.goldenMembershipExpiry!);
                            const remaining = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000));
                            const pkg = packages.find(p => p.id === s.goldenMembershipPackageId);
                            return (
                                <div key={s.id} className="bg-white/5 border border-yellow-500/20 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex gap-2 w-full md:w-auto order-2 md:order-1">
                                        <button
                                            onClick={() => handleExtendAccess(s, 1)}
                                            className="px-4 py-2 rounded-xl text-xs font-black text-black flex items-center gap-1 active:scale-95 transition-all"
                                            style={{ backgroundColor: theme.primary }}
                                            title="تمديد شهر"
                                        >
                                            <Calendar size={12} /> +شهر
                                        </button>
                                        <button
                                            onClick={() => handleRevokeAccess(s)}
                                            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-black hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-1"
                                        >
                                            <Trash2 size={12} /> حذف
                                        </button>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-right w-full order-1 md:order-2">
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-black uppercase">الطالب</p>
                                            <p className="text-sm font-black text-white">{s.username}</p>
                                            <p className="text-[9px] text-gray-500">{s.level}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-black uppercase">الباقة</p>
                                            <p className="text-sm font-black text-yellow-400">{pkg?.title || 'ذهبية'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-black uppercase">تنتهي في</p>
                                            <p className="text-sm font-black text-white">{expiry.toLocaleDateString('ar-EG')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-black uppercase">المتبقي</p>
                                            <p className={`text-sm font-black ${remaining <= 7 ? 'text-red-400' : 'text-emerald-400'}`}>{remaining} يوم</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center order-3">
                                        <ShieldCheck size={18} className="text-yellow-400" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};
