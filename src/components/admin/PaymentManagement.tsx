import React, { useState } from 'react';
import {
    CheckCircle, XCircle, Clock, Search, User, Eye, X,
    BookOpen, Coins, Calendar, Trash2, Video, Phone, Globe, Monitor, MessageCircle, Star
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
import { DB, logSecurityEvent } from '../../services/db';
import { PaymentOrder, PaymentStatus } from '../../types';

interface Props {
    paymentList: PaymentOrder[];
    setPaymentList: (list: PaymentOrder[]) => void;
}

export const PaymentManagement: React.FC<Props> = ({ paymentList, setPaymentList }) => {
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('pending_review');
    const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'booklet' | 'course' | 'lesson' | 'hybrid' | 'chat' | 'recharge' | 'ads_package'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReceipt, setSelectedReceipt] = useState<PaymentOrder | null>(null);

    const handleAction = (id: string, status: PaymentStatus) => {
        const order = paymentList.find(p => p.id === id);
        if (!order) return;
        const msg = status === 'approved' ? 'هل أنت متأكد من قبول هذا الطلب وفتح المحتوى للطالب؟' : 'هل أنت متأكد من رفض هذا الطلب؟';
        if (!window.confirm(msg)) return;

        DB.updatePaymentStatus(id, status);

        // Automatic Notification for the student
        DB.addNotification({
            id: Date.now().toString(),
            title: status === 'approved' ? 'تم قبول طلب الشراء ✅' : 'تم رفض طلب الشراء ❌',
            message: status === 'approved'
                ? (order.itemType === 'booklet'
                    ? `تهانينا ${order.studentName}، تم قبول طلبك لشراء ملخص "${order.bookletTitle}" وتم وصول الملخص إلى منزلك بنجاح شكراً ${order.studentName} نتمنى لك التوفيق.. ❤️`
                    : order.itemType === 'chat'
                        ? `تهانينا ${order.studentName}، تم قبول طلبك لترقية رصيد الدردشة بنجاح! تم إضافة النقاط لرصيدك الآن. نتمنى لك التوفيق.. ❤️`
                        : order.itemType === 'recharge'
                            ? `تهانينا ${order.studentName}، تم قبول طلبك لشحن نقاط تعليمية بنجاح! تم إضافة ${order.pointsToGained?.toLocaleString()} نقطة لرصيدك الآن. نتمنى لك التوفيق.. ❤️`
                            : order.itemType === 'ads_package'
                                ? `تهانينا ${order.studentName}، تم تفعيل عضويتك الذهبية بنجاح! ⭐ استمتع الآن بالمنصة بدون إعلانات. نتمنى لك التوفيق.. ❤️`
                                : `تهانينا ${order.studentName}، تم قبول طلبك لشراء "${order.courseTitle || order.lessonTitle}" بنجاح شكراً ${order.studentName} نتمنى لك التوفيق.. ❤️`)
                : `عذراً ${order.studentName}، تم رفض طلبك لـ "${order.courseTitle || order.bookletTitle || order.lessonTitle || (order.itemType === 'recharge' ? 'شحن نقاط' : order.itemType === 'ads_package' ? 'العضوية الذهبية' : 'ترقية الرصيد')}". يرجى مراجعة الدعم الفني إذا كنت تعتقد أن هناك خطأ.`,
            date: new Date().toLocaleDateString('ar-EG'),
            target: 'student',
            studentId: order.studentId
        });

        logSecurityEvent(status === 'approved' ? 'payment_approved' : 'payment_rejected', status === 'approved' ? 'info' : 'warning', {
            student: order.studentName,
            item: order.examTitle || order.courseTitle || order.bookletTitle || order.lessonTitle,
            price: order.discountedPrice || order.price
        });



        if (status === 'approved' && order.itemType === 'chat' && order.itemId?.includes('chat_')) {
            const student = DB.getStudents().find(s => s.id === order.studentId);
            if (student) {
                const points = parseInt(order.itemId.split('_')[1]);
                if (!isNaN(points)) {
                    const currentPoints = student.extraQuotaPoints ?? 0;
                    DB.updateStudent(student.id, {
                        extraQuotaPoints: currentPoints + points
                    });
                    // Trigger refresh
                    window.dispatchEvent(new CustomEvent('nt-students-change'));
                }
            }
        }

        if (status === 'approved' && order.itemType === 'recharge') {
            // Trigger refresh so points are updated in admin view immediately
            window.dispatchEvent(new CustomEvent('nt-students-change'));
        }

        // Activate Golden Membership
        if (status === 'approved' && order.itemType === 'ads_package') {
            const student = DB.getStudents().find(s => s.id === order.studentId);
            if (student && order.adsPackageId) {
                const packages = DB.getAdsPackages();
                const pkg = packages.find((p: any) => p.id === order.adsPackageId);
                if (pkg) {
                    const expiry = new Date();
                    expiry.setMonth(expiry.getMonth() + (pkg.durationMonths || 1));
                    DB.updateStudent(student.id, {
                        goldenMembershipActive: true,
                        goldenMembershipExpiry: expiry.toISOString().split('T')[0],
                        goldenMembershipPackageId: pkg.id,
                        goldenMembershipPendingPackageId: undefined,
                    });
                    window.dispatchEvent(new CustomEvent('nt-students-change'));
                }
            }
        }

        setPaymentList(DB.getPayments());
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف سجل هذا الطلب نهائياً؟')) return;
        DB.deletePayment(id);
        setPaymentList(DB.getPayments());
    };

    const filtered = paymentList.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesType = itemTypeFilter === 'all'
            ? true
            : itemTypeFilter === 'hybrid'
                ? p.hybridMode === true
                : p.itemType === itemTypeFilter && !p.hybridMode;
        const searchPool = `${p.studentName} ${p.bookletTitle || ''} ${p.courseTitle || ''} ${p.lessonTitle || ''}`.toLowerCase();
        const matchesSearch = searchPool.includes(searchTerm.toLowerCase());
        return matchesStatus && matchesType && matchesSearch;
    }).sort((a, b) => {
        const dateA = new Date((a.date || '').split('/').reverse().join('-') + ' ' + a.time).getTime();
        const dateB = new Date((b.date || '').split('/').reverse().join('-') + ' ' + b.time).getTime();
        return dateB - dateA;
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (window.confirm('⚠️ هل أنت متأكد من مسح جميع سجلات المدفوعات نهائياً؟')) {
                                    DB.deleteAllPayments();
                                    setPaymentList([]);
                                }
                            }}
                            className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 active:scale-95 group shadow-lg"
                            title="مسح كافة المدفوعات"
                        >
                            <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
                        </button>
                        <h2 className="text-3xl font-black text-white text-right">إدارة المدفوعات والطلبات</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                        {[
                            { id: 'pending_review', label: 'المعلقة', icon: <Clock size={14} />, color: 'amber' },
                            { id: 'approved', label: 'المقبولة', icon: <CheckCircle size={14} />, color: 'emerald' },
                            { id: 'rejected', label: 'المرفوضة', icon: <XCircle size={14} />, color: 'red' },
                            { id: 'all', label: 'الكل', icon: <Search size={14} />, color: 'gray' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id as any)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${filterStatus === tab.id
                                    ? `bg-${tab.color}-500/10 text-${tab.color}-500 border border-${tab.color}-500/20 shadow-lg`
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-2">
                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setItemTypeFilter('course')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black transition-all",
                                itemTypeFilter === 'course' ? "bg-cyan-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            طلبات الكورسات
                        </button>

                        <button
                            onClick={() => setItemTypeFilter('recharge')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                                itemTypeFilter === 'recharge' ? "bg-blue-500 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <Coins size={14} />
                            طلبات الشحن
                        </button>
                        <button
                            onClick={() => setItemTypeFilter('ads_package')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                                itemTypeFilter === 'ads_package' ? "bg-yellow-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            ⭐ العضوية الذهبية
                        </button>
                        <button
                            onClick={() => setItemTypeFilter('all')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black transition-all",
                                itemTypeFilter === 'all' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            الكل
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="بحث باسم الطالب أو المنتج..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 pl-6 text-right outline-none focus:border-cyan-500/50 transition-all font-bold"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <div className="p-20 text-center glass rounded-[3rem] border border-white/5 opacity-30">
                        <Coins size={60} className="mx-auto mb-4" />
                        <p className="text-xl font-bold">لا توجد طلبات دفع مدرجة</p>
                    </div>
                ) : (
                    filtered.map((order) => (
                        <div
                            key={order.id}
                            className="glass p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-colors"
                        >
                            {/* Actions */}
                            <div className="flex items-center gap-2 w-full md:w-auto order-2 md:order-1">
                                {order.status === 'pending_review' ? (
                                    <>
                                        <button
                                            onClick={() => setSelectedReceipt(order)}
                                            className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-all active:scale-95 shadow-sm"
                                            title="معاينة الإيصال"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleAction(order.id, 'approved')}
                                            className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            قبول الدفع
                                        </button>
                                        <button
                                            onClick={() => handleAction(order.id, 'rejected')}
                                            className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs hover:bg-red-500/20 transition-all"
                                        >
                                            رفض
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedReceipt(order)}
                                            className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all"
                                            title="معاينة الإيصال"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(order.id)}
                                            className="p-3 bg-white/5 text-gray-500 hover:text-red-500 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-right order-1 md:order-2">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-end gap-1">الطالب <User size={10} /></div>
                                    <div className="text-sm font-black text-white">{order.studentName}</div>
                                    <div className="text-[9px] font-bold text-gray-500">{order.studentLevel} • {order.studentYear}</div>
                                    <div className="flex flex-col items-end gap-0.5 mt-1">
                                        {order.studentPhone && (
                                            <div className="text-[9px] font-black text-emerald-500 flex items-center gap-1">
                                                {order.studentPhone} <Phone size={8} />
                                            </div>
                                        )}
                                        {order.transferPhoneNumber && (
                                            <div className="text-[9px] font-black text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full mt-1 w-fit ml-auto">
                                                التحويل من: {order.transferPhoneNumber} <Phone size={8} />
                                            </div>
                                        )}
                                        {order.studentEmail && (
                                            <div className="text-[9px] font-black text-cyan-500 flex items-center gap-1">
                                                {order.studentEmail} <Globe size={8} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-end gap-1">
                                        {order.hybridMode ? 'شراء هجين (بالكوينز)' : order.itemType === 'course' ? 'جاية من: الكورسات' : order.itemType === 'lesson' ? 'جاية من: الشرح' : order.itemType === 'chat' ? 'جاية من: الدردشة' : order.itemType === 'recharge' ? 'جاية من: شحن نقاط' : order.itemType === 'ads_package' ? '⭐ العضوية الذهبية' : 'جاية من: الملخصات'}
                                        {order.hybridMode ? <Coins size={10} className="text-yellow-500" /> : order.itemType === 'course' || order.itemType === 'lesson' ? <Video size={10} /> : order.itemType === 'chat' ? <MessageCircle size={10} /> : order.itemType === 'recharge' ? <Coins size={10} /> : order.itemType === 'ads_package' ? <Star size={10} /> : <BookOpen size={10} />}
                                    </div>
                                    <div className={`text-sm font-black truncate ${order.hybridMode ? 'text-yellow-400' : order.itemType === 'course' ? 'text-cyan-400' : order.itemType === 'lesson' ? 'text-purple-400' : order.itemType === 'chat' ? 'text-emerald-400' : order.itemType === 'recharge' ? 'text-blue-400' : order.itemType === 'ads_package' ? 'text-yellow-400' : 'text-amber-500'}`}>
                                        {order.itemType === 'course' ? order.courseTitle : order.itemType === 'lesson' ? order.lessonTitle : order.itemType === 'chat' ? (order.courseTitle || 'ترقية رصيد') : order.itemType === 'recharge' ? `باقة ${order.pointsToGained?.toLocaleString()} نقطة` : order.itemType === 'ads_package' ? 'عضوية ذهبية ⭐' : order.bookletTitle}
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5 mt-1">
                                        {order.hybridMode ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[10px] font-black flex items-center gap-1 bg-yellow-500/10 px-2 rounded text-yellow-500">
                                                    استخدم: {order.usedCoins} كوينز
                                                </div>
                                                <div className="text-[10px] font-black text-emerald-500">
                                                    المتبقي: {order.requiredCash} ج.م نقدي
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`text-[9px] font-bold ${order.discountedPrice !== undefined ? 'text-gray-500 line-through' : 'text-emerald-500'}`}>{order.price} ج.م</div>
                                                {order.discountedPrice !== undefined && (
                                                    <div className="flex items-center gap-1">
                                                        {order.appliedCoupon && <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-1 rounded uppercase tracking-tighter">{order.appliedCoupon}</span>}
                                                        <span className="text-[10px] font-black text-emerald-500">{order.discountedPrice} ج.م</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-end gap-1">التوقيت <Calendar size={10} /></div>
                                    <div className="text-sm font-black text-gray-300">{order.date}</div>
                                    <div className="text-[9px] font-bold text-gray-500">{order.time}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-end gap-1">الحالة <Clock size={10} /></div>
                                    <div className={`text-[10px] font-black inline-block px-3 py-1 rounded-lg ${order.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                        order.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                            'bg-amber-500/10 text-amber-500 animate-pulse'
                                        }`}>
                                        {order.status === 'approved' ? 'تم القبول' :
                                            order.status === 'rejected' ? 'مرفوض' :
                                                'قيد الانتظار'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* InstaPay Style Receipt Modal */}
            {selectedReceipt && (() => {
                const student = DB.getStudents().find(s => s.id === selectedReceipt.studentId);
                const semester = student?.semester || 'الأول';

                return (
                    <div className="fixed inset-0 z-[2000] flex items-start justify-center p-4 pt-10 pb-20 bg-black/90 backdrop-blur-md overflow-y-auto">
                        <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-200 my-auto">
                            {/* Receipt Container */}
                            <div className="bg-white rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
                                {/* Top Header Branding */}
                                <div className="bg-gradient-to-br from-blue-900 to-[#1e3a8a] p-8 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-10">
                                        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full border-[20px] border-white" />
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full border-[20px] border-white" />
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-20 h-20 bg-white rounded-2xl shadow-xl mb-4 overflow-hidden border-2 border-white">
                                            <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover" alt="Logo" />
                                        </div>
                                        <h3 className="text-white font-black text-xl mb-1 italic">Mentora</h3>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                            <div className={cn("w-1 h-1 rounded-full animate-pulse", selectedReceipt.status === 'approved' ? "bg-emerald-400" : selectedReceipt.status === 'rejected' ? "bg-red-400" : "bg-amber-400")} />
                                            <p className="text-white/80 text-[8px] font-bold tracking-[0.2em] uppercase">{selectedReceipt.status === 'approved' ? 'E-Receipt Verified' : selectedReceipt.status === 'rejected' ? 'E-Receipt Rejected' : 'E-Receipt Pending'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Cut-outs */}
                                <div className="relative h-6 bg-white shrink-0">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-8 h-8 rounded-full bg-black/95" />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-8 h-8 rounded-full bg-black/95" />
                                    <div className="mx-6 h-px border-t-2 border-dashed border-gray-100 mt-3" />
                                </div>

                                {/* Transaction Info Section */}
                                <div className="p-8 pt-2 space-y-5 text-right">
                                    <div className="text-center bg-blue-50/50 rounded-2xl py-4 border border-blue-100/50">
                                        <p className="text-[10px] font-black text-blue-400 mb-1">إيصال دفع شراء</p>
                                        <p className="text-[13px] font-black text-blue-900 leading-relaxed px-4">
                                            {selectedReceipt.itemType === 'course' ? selectedReceipt.courseTitle : selectedReceipt.itemType === 'lesson' ? selectedReceipt.lessonTitle : selectedReceipt.itemType === 'chat' ? (selectedReceipt.courseTitle || 'ترقية رصيد') : selectedReceipt.itemType === 'recharge' ? `شحن ${selectedReceipt.pointsToGained?.toLocaleString()} نقطة` : selectedReceipt.itemType === 'ads_package' ? 'عضوية ذهبية ⭐' : selectedReceipt.bookletTitle}
                                            <br />
                                            <span className="text-[11px] text-gray-500 font-bold block mt-1">من Mentora التعليمية</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex justify-between items-center text-right border-b border-gray-50 pb-2">
                                            <span className="text-[13px] font-black text-blue-950">{selectedReceipt.studentName}</span>
                                            <span className="text-[10px] font-bold text-gray-400">اسم الطالب :</span>
                                        </div>
                                        <div className="flex justify-between items-center text-right border-b border-gray-50 pb-2">
                                            <span className="text-[13px] font-black text-blue-950 text-left">{selectedReceipt.studentLevel} - {selectedReceipt.studentYear}</span>
                                            <span className="text-[10px] font-bold text-gray-400">المرحلة / السنة :</span>
                                        </div>
                                        <div className="flex justify-between items-center text-right border-b border-gray-50 pb-2">
                                            <span className="text-[13px] font-black text-blue-950">{semester}</span>
                                            <span className="text-[10px] font-bold text-gray-400">الفصل الدراسي :</span>
                                        </div>
                                        <div className="flex justify-between items-center text-right border-b border-gray-50 pb-2">
                                            <span className="text-[12px] font-black text-blue-700">{selectedReceipt.itemType === 'course' ? 'كورس تعليمي' : selectedReceipt.itemType === 'lesson' ? 'درس خصوصي' : selectedReceipt.itemType === 'chat' ? 'ترقية ذكاء اصطناعي' : selectedReceipt.itemType === 'recharge' ? 'شحن نقاط' : selectedReceipt.itemType === 'ads_package' ? 'عضوية ذهبية ⭐' : 'ملخص تعليمي'}</span>
                                            <span className="text-[10px] font-bold text-gray-400">الحاجة المشتراة :</span>
                                        </div>
                                        {selectedReceipt.transferPhoneNumber && (
                                            <div className="flex justify-between items-center text-right border-b border-gray-50 pb-2 bg-blue-50/30 p-2 rounded-xl">
                                                <span className="text-[13px] font-black text-blue-950">{selectedReceipt.transferPhoneNumber}</span>
                                                <span className="text-[10px] font-bold text-gray-400">رقم التحويل :</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-right">
                                            <div className="flex flex-col items-start">
                                                <span className="text-[12px] font-black text-blue-950">{selectedReceipt.date}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{selectedReceipt.time}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400">توقيت العملية :</span>
                                        </div>
                                    </div>

                                    {(() => {
                                        let purchasedItems: string[] = [];
                                        if (selectedReceipt.itemType === 'course') {
                                            const course = DB.getCourses().find(c => c.id === selectedReceipt.courseId);
                                            if (course?.videos) purchasedItems = course.videos.map(v => v.title);
                                        } else if (selectedReceipt.itemType === 'lesson') {
                                            const lesson = DB.getLessons().find(l => l.id === selectedReceipt.lessonId);
                                            if (lesson?.videos) purchasedItems = lesson.videos.map(v => v.title);
                                        }

                                        if (purchasedItems.length > 0) {
                                            return (
                                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 text-right mt-4 shadow-inner">
                                                    <p className="text-[11px] font-black text-blue-800 mb-2 border-b border-blue-100/50 pb-2">محتويات الشراء ({purchasedItems.length}):</p>
                                                    <ul className="list-disc list-inside text-[11px] font-bold text-blue-900 space-y-1.5 pr-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                        {purchasedItems.map((item, idx) => (
                                                            <li key={idx} className="truncate">{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Payment Amount */}
                                    <div className="mt-6 pt-6 border-t-2 border-gray-100 flex flex-col items-center gap-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">إجمالي المبلغ المدفوع</p>
                                        <div className="text-5xl font-black text-blue-950 flex items-baseline gap-2">
                                            <span className="text-lg">ج.م</span>
                                            {selectedReceipt.discountedPrice || selectedReceipt.price}
                                        </div>

                                        <div className={cn(
                                            "mt-4 px-8 py-2.5 rounded-full font-black text-xs flex items-center gap-2 shadow-sm",
                                            selectedReceipt.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                                                selectedReceipt.status === 'rejected' ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                                                    "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                        )}>
                                            <div className={cn("w-2 h-2 rounded-full",
                                                selectedReceipt.status === 'approved' ? "bg-emerald-500 animate-pulse" :
                                                    selectedReceipt.status === 'rejected' ? "bg-red-500" :
                                                        "bg-amber-500 animate-pulse"
                                            )} />
                                            {selectedReceipt.status === 'approved' ? 'قبول الدفع' :
                                                selectedReceipt.status === 'rejected' ? 'رفض الدفع' :
                                                    'قيد المراجعة'}
                                        </div>
                                    </div>

                                    {/* Manager Signature */}
                                    <div className="pt-6 border-t border-gray-100 flex flex-col items-center">
                                        <p className="text-[10px] font-bold text-gray-300 mb-1 tracking-tighter">مدير المنصة</p>
                                        <p className="text-[17px] font-black text-[#1e3a8a] font-cairo">م/ عمرو لطفي</p>
                                        <div className="w-12 h-0.5 bg-blue-900 mt-1 rounded-full opacity-10" />
                                    </div>
                                </div>

                                {/* Bottom Wave Pattern */}
                                <div className="bg-gray-50/50 p-4 border-t border-gray-100 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest"><span className="text-cyan-500 font-bold">MENTORA</span> <span className="text-gray-400/60">• Digital Secure Payment</span></p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="mt-6 w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-[2rem] font-black text-sm transition-all border border-white/5 active:scale-95 flex items-center justify-center gap-2 backdrop-blur-sm"
                            >
                                <X size={18} />
                                إغلاق المعاينة
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};


