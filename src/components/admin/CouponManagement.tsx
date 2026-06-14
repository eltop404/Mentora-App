import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Ticket, Save, X, Calendar,
    Percent, Clock, CheckCircle, AlertCircle, RefreshCw, Copy, Check
} from 'lucide-react';
import { DB } from '../../services/db';
import { Coupon } from '../../types';

interface Props {
    theme: any;
}

export const CouponManagement: React.FC<Props> = ({ theme }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);

    const [form, setForm] = useState({
        code: '',
        discount: 10,
        days: 30,
        usageLimit: 0
    });
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        setCoupons(DB.getCoupons());
        const handleCh = () => setCoupons(DB.getCoupons());
        window.addEventListener('nt-coupons-change', handleCh);
        return () => window.removeEventListener('nt-coupons-change', handleCh);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim()) return;

        const now = new Date();
        const expiry = new Date();
        expiry.setDate(now.getDate() + form.days);

        if (isEditing) {
            DB.updateCouponData(isEditing, {
                code: form.code.toUpperCase(),
                discountPercentage: form.discount,
                daysValid: form.days,
                usageLimit: form.usageLimit,
                expiryDate: expiry.toISOString()
            });
            setIsEditing(null);
        } else {
            const newCoupon: Coupon = {
                id: Math.random().toString(36).substr(2, 9),
                code: form.code.toUpperCase(),
                discountPercentage: form.discount,
                daysValid: form.days,
                createdAt: now.toISOString(),
                expiryDate: expiry.toISOString(),
                usageCount: 0,
                usageLimit: form.usageLimit,
                isActive: true
            };
            DB.addCoupon(newCoupon);
            setIsAdding(false);
        }
        setForm({ code: '', discount: 10, days: 30, usageLimit: 0 });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الكود؟')) {
            DB.deleteCoupon(id);
        }
    };

    const toggleStatus = (id: string, current: boolean) => {
        DB.updateCouponData(id, { isActive: !current });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
                    style={{ backgroundColor: theme.primary, color: 'black' }}
                >
                    <Plus size={18} />
                    إضافة كود جديد
                </button>
                <h2 className="text-3xl font-black text-right">إدارة أكواد الخصم</h2>
            </div>

            {(isAdding || isEditing) && (
                <div
                    className="glass p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -z-10 group-hover:bg-cyan-500/10 transition-all duration-700" />

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1 text-right">
                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mr-2">كود الخصم</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                placeholder="مثال: OFF50"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-black"
                            />
                        </div>
                        <div className="space-y-1 text-right">
                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mr-2">نسبة الخصم (%)</label>
                            <input
                                type="number"
                                value={form.discount}
                                onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-black text-cyan-400"
                            />
                        </div>
                        <div className="space-y-1 text-right">
                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mr-2">عدد أيام الصلاحية</label>
                            <input
                                type="number"
                                value={form.days}
                                onChange={e => setForm({ ...form, days: Number(e.target.value) })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-black"
                            />
                        </div>
                        <div className="space-y-1 text-right">
                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mr-2">أقصى عدد استخدام (0 = بلا حدود)</label>
                            <input
                                type="number"
                                value={form.usageLimit}
                                onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-cyan-500/50 transition-all font-black"
                            />
                        </div>

                        <div className="md:col-span-3 flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setIsEditing(null); }}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 rounded-2xl font-black text-black shadow-xl"
                                style={{ backgroundColor: theme.primary }}
                            >
                                {isEditing ? 'تحديث الكود' : 'حفظ الكود الآن'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-[#020617]/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[11px] font-black uppercase tracking-widest text-gray-500">
                                <th className="px-8 py-6">الإجراءات</th>
                                <th className="px-8 py-6">الاستخدام</th>
                                <th className="px-8 py-6">الحالة</th>
                                <th className="px-8 py-6">تاريخ الانتهاء</th>
                                <th className="px-8 py-6">المدة</th>
                                <th className="px-8 py-6">الخصم</th>
                                <th className="px-8 py-6">الكود</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => {
                                const isExpired = new Date() > new Date(coupon.expiryDate);
                                return (
                                    <tr key={coupon.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(coupon.id);
                                                        setForm({
                                                            code: coupon.code,
                                                            discount: coupon.discountPercentage,
                                                            days: coupon.daysValid,
                                                            usageLimit: coupon.usageLimit || 0
                                                        });
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-black transition-all shadow-lg"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center">
                                                <div className="text-sm font-black text-white">
                                                    {coupon.usageLimit > 0 ? `${coupon.usageCount} / ${coupon.usageLimit}` : `${coupon.usageCount} (بلا حدود)`}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold mt-1">مرات الاستخدام</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button
                                                onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${isExpired
                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    : coupon.isActive
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}
                                            >
                                                {isExpired ? 'منتهي الصلاحية' : coupon.isActive ? 'نشط الآن' : 'معطل'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-gray-400">{new Date(coupon.expiryDate).toLocaleDateString('ar-EG')}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs font-bold">{coupon.daysValid} يوم</span>
                                                <div className="p-1.5 bg-white/5 rounded-lg text-gray-500"><Clock size={12} /></div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-lg font-black text-emerald-500 flex items-center justify-end gap-1">
                                                <span>%</span>
                                                <span>{coupon.discountPercentage}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">{coupon.code}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Coupon Code</div>
                                                </div>
                                                <button
                                                    onClick={() => handleCopy(coupon.code, coupon.id)}
                                                    type="button"
                                                    className="p-2.5 bg-cyan-500/10 rounded-2xl text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all shadow-lg"
                                                    title="نسخ الكود"
                                                >
                                                    {copiedId === coupon.id ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                                <div className="p-2.5 bg-cyan-500/10 rounded-2xl text-cyan-500"><Ticket size={20} /></div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center opacity-30">
                                        <div className="flex flex-col items-center">
                                            <RefreshCw size={48} className="mb-4" />
                                            <p className="text-xl font-bold">لا توجد أكواد خصم متاحة حالياً</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
