import React, { useState, useMemo } from 'react';
import {
    Search, User, ShieldAlert, ShieldCheck,
    Trash2, Coins, Calendar, Ban, CheckCircle,
    RefreshCw, Filter, UserMinus, UserPlus,
    Activity, Trophy, Copy
} from 'lucide-react';
import { DB } from '../../services/db';
import { Student } from '../../types';

interface Props {
    students: Student[];
    setStudents: (list: Student[]) => void;
    isDarkMode: boolean;
    theme: any;
}

export const StudentManagement: React.FC<Props> = ({ students, setStudents, isDarkMode, theme }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [filterYear, setFilterYear] = useState('all');

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (!s || !s.username) return false;
            const matchesSearch = s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.phoneNumber && s.phoneNumber.includes(searchTerm)) ||
                (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesLevel = filterLevel === 'all' || s.level === filterLevel;
            const matchesYear = filterYear === 'all' || s.year?.includes(filterYear);
            return matchesSearch && matchesLevel && matchesYear;
        }).sort((a, b) => {
            // Sort by original array index descending (newest first)
            const indexA = students.indexOf(a);
            const indexB = students.indexOf(b);
            return indexB - indexA;
        });
    }, [students, searchTerm, filterLevel, filterYear]);

    const handleToggleBlock = (student: Student) => {
        const msg = student.isBlocked ? `هل تريد فك حظر الطالب ${student.username}؟` : `هل تريد حظر الطالب ${student.username} نهائياً؟`;
        if (window.confirm(msg)) {
            DB.updateStudent(student.id, { isBlocked: !student.isBlocked });
            setStudents(DB.getStudents());
        }
    };

    const handleAddCoins = (student: Student) => {
        const amount = prompt(`أدخل عدد الكوينز المراد إضافتها لـ ${student.username}:`, '100');
        if (amount && !isNaN(parseInt(amount))) {
            const currentCoins = student.coins || 0;
            DB.updateStudent(student.id, { coins: currentCoins + parseInt(amount) });
            setStudents(DB.getStudents());
            alert(`تم إضافة ${amount} كوينز بنجاح.`);
        }
    };

    const handleDelete = (student: Student) => {
        if (window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف الطالب ${student.username} نهائياً؟ سيتم مسح كافة بياناته ولا يمكن التراجع.`)) {
            DB.deleteStudent(student.id);
            setStudents(DB.getStudents());
        }
    };

    const handleToggleIpBlock = (student: Student) => {
        if (!student.ip) return;
        const settings = DB.getSettings();
        const blockedIPs = settings.blockedIPs || [];
        const isBanned = blockedIPs.includes(student.ip);

        const msg = isBanned ? `هل تريد فك حظر الـ IP (${student.ip})؟` : `هل تريد حظر الـ IP الخاص بهذا الجهاز (${student.ip}) نهائياً؟`;
        if (window.confirm(msg)) {
            let newIps;
            if (isBanned) {
                newIps = blockedIPs.filter((ip: string) => ip !== student.ip);
            } else {
                newIps = [...blockedIPs, student.ip];
            }
            DB.updateSettings({ ...settings, blockedIPs: newIps });
            alert("تم تحديث قائمة الحظر بنجاح.");
            // Force re-render if needed, but since it's global state, it might not trigger student list update unless we do this:
            setStudents(DB.getStudents());
        }
    };

    const handleResetSurveyQuota = (student: Student) => {
        if (window.confirm(`هل تريد إعادة تعيين رصيد الدردشة لـ ${student.username}؟`)) {
            DB.updateStudent(student.id, {
                surveyQuota: 5,
                surveyResetTime: undefined,
                messageQuota: 10
            });
            setStudents(DB.getStudents());
            alert('تم إعادة التعيين بنجاح.');
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="بحث باسم الطالب، الهاتف، أو البريد الإلكتروني..."
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pr-14 pl-6 text-right outline-none focus:border-yellow-500/50 transition-all font-bold"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={filterLevel}
                        onChange={e => setFilterLevel(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm font-bold text-gray-300 outline-none focus:border-yellow-500/50"
                    >
                        <option value="all">كل المراحل</option>
                                                                    </select>
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm font-bold text-gray-300 outline-none focus:border-yellow-500/50"
                    >
                        <option value="all">كل السنين</option>
                                                <option value="تانية">تانية</option>
                                            </select>
                </div>
            </div>

            {/* Students Grid/Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30">
                        <Users size={64} className="mx-auto mb-4" />
                        <p className="text-xl font-bold">لم يتم العثور على طلاب مطابقين للبحث</p>
                    </div>
                ) : (
                    filteredStudents.map(student => {
                        const ipCount = student.ip && student.ip !== '127.0.0.1' && student.ip !== '192.168.1.1'
                            ? students.filter(s => s.ip === student.ip && !s.isDeleted).length
                            : 0;
                        const isUnbannedFor3 = DB.getSettings().unbannedIPs?.includes(student.ip);
                        const maxLimit = isUnbannedFor3 ? 3 : 2;

                        return (
                            <div key={student.id} className={`
                                relative group p-6 rounded-[2.5rem] border transition-all duration-300 overflow-hidden
                                ${student.isBlocked
                                    ? 'bg-red-500/5 border-red-500/20'
                                    : 'bg-[#111827]/40 border-white/5 hover:border-white/10'}
                            `}>
                                {/* Gradient Backdrops */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/5 rounded-full blur-[50px] pointer-events-none" />

                                {/* Main Info */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(student)}
                                            className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                            title="حذف الطالب"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleBlock(student)}
                                            className={`p-3 rounded-2xl transition-all shadow-lg ${student.isBlocked
                                                    ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                                }`}
                                            title={student.isBlocked ? 'فك الحظر' : 'حظر الحساب'}
                                        >
                                            {student.isBlocked ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                                        </button>
                                    </div>
                                    <div className="text-right flex-1 pr-4">
                                        <h3 className="text-lg font-black text-white truncate">{student.username}</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{student.level} • {student.year}</p>
                                        {student.isBlocked && (
                                            <div className="mt-1 flex items-center justify-end gap-1.5">
                                                <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse uppercase">Blocked Account</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                                        {student.avatarUrl || student.profilePictureUrl ? (
                                            <img src={student.avatarUrl || student.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-gray-600" />
                                        )}
                                    </div>
                                </div>

                                {/* Package Points Tracking - Compact & Chic UI */}
                                <div className="space-y-2 mb-4 bg-black/20 p-3 rounded-2xl border border-white/5 relative overflow-hidden">
                                    <div className="flex items-center justify-between text-[9px] font-black">
                                        <div className="flex items-center gap-1 font-mono">
                                            <span className="text-gray-500 tabular-nums">/ {
                                                student.plan === 'الباقة الماسية' ? '2,500' :
                                                    student.plan === 'الباقة الذهبية' ? '5,000' :
                                                        student.plan === 'الباقة البلاتينية' ? '7,500' : '0'
                                            }</span>
                                            <span className="text-emerald-400 tabular-nums">{(student.points || 0).toLocaleString()}</span>
                                        </div>
                                        <span className="text-gray-400 text-[8px] uppercase tracking-tighter">{student.plan || 'Free Plan'}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-1000 ease-out bg-emerald-500"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, (student.points || 0) / (
                                                    student.plan === 'الباقة الماسية' ? 2500 :
                                                        student.plan === 'الباقة الذهبية' ? 5000 :
                                                            student.plan === 'الباقة البلاتينية' ? 7500 : 1
                                                ) * 100))}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pt-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-blue-400 font-mono text-[9px] tabular-nums font-black">{student.messageQuota || 0}</span>
                                            <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-tighter">Quota</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-yellow-500 font-mono text-[9px] tabular-nums font-black">{student.coins || 0}</span>
                                            <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-tighter">Coins</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Info - Removed Phone */}
                                <div className="space-y-1.5 border-t border-white/5 pt-3">
                                    <div className="flex items-center justify-between text-[9px] font-black px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/60 tabular-nums">{student.regDate || 'بدون تاريخ'}</span>
                                            <span className="text-white/40 tabular-nums text-[8px]">{student.regTime || ''}</span>
                                        </div>
                                        <span className="text-gray-500 uppercase tracking-tighter">Joined</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-black px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-cyan-400 font-mono text-[10px] tabular-nums">{student.ip || '0.0.0.0'}</span>
                                            {DB.getSettings().blockedIPs?.includes(student.ip) && (
                                                <span className="text-red-500 text-[8px] animate-pulse">محظور (IP)</span>
                                            )}
                                        </div>
                                        <span className="text-gray-500 uppercase tracking-tighter">Device IP</span>
                                    </div>

                                    <div className="space-y-2 mt-2 pt-1">
                                        {/* Account Ban Button */}
                                        <button
                                            onClick={() => handleToggleBlock(student)}
                                            className={`w-full py-2 rounded-xl text-[9px] font-black transition-all border flex items-center justify-center gap-2 active:scale-95 ${student.isBlocked
                                                    ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                                }`}
                                        >
                                            {student.isBlocked ? (
                                                <>
                                                    <ShieldAlert size={12} />
                                                    <span>الحساب: محظور ❌</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={12} />
                                                    <span>الحساب: غير محظور ({ipCount}/{maxLimit}) 🟢</span>
                                                </>
                                            )}
                                        </button>

                                        {/* Device IP Ban Button */}
                                        {student.ip && student.ip !== '127.0.0.1' && student.ip !== '192.168.1.1' && (
                                            <button
                                                onClick={() => handleToggleIpBlock(student)}
                                                className={`w-full py-2 rounded-xl text-[9px] font-black transition-all border flex items-center justify-center gap-2 active:scale-95 ${DB.getSettings().blockedIPs?.includes(student.ip)
                                                        ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                                    }`}
                                            >
                                                {DB.getSettings().blockedIPs?.includes(student.ip) ? (
                                                    <>
                                                        <ShieldAlert size={12} />
                                                        <span>الجهاز: محظور بالـ IP ❌</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck size={12} />
                                                        <span>الجهاز: غير محظور ({ipCount}/{maxLimit}) 🟢</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Referral Info inside Admin Student Card */}
                                <div className="space-y-2 border-t border-white/5 pt-3 mt-3 text-right">
                                    <div className="flex items-center justify-between text-[9px] font-black px-2">
                                        <div className="flex items-center gap-1.5 font-mono text-cyan-400">
                                            <span>{student.referral_code || 'بدون كود'}</span>
                                            {student.referral_code && (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(student.referral_code || '');
                                                        alert('تم نسخ الكود');
                                                    }}
                                                    className="hover:text-white transition-colors"
                                                    title="نسخ كود الطالب"
                                                >
                                                    <Copy size={8} />
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-gray-500 font-bold">كود الإحالة</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-black px-2">
                                        <div className="flex items-center gap-2 text-white/80">
                                            <span>{student.referral_count || 0} طُلاب</span>
                                            <span className="text-gray-600 font-normal">|</span>
                                            <span className="text-amber-400">{student.referral_earnings || 0} عملة</span>
                                        </div>
                                        <span className="text-gray-500 font-bold">إحصائيات الدعوات</span>
                                    </div>
                                    {student.referred_by && (
                                        <div className="flex items-center justify-between text-[9px] font-black px-2 bg-white/[0.02] p-1.5 rounded-lg border border-white/5 mt-1">
                                            <div className="flex items-center gap-2 flex-row-reverse">
                                                <span className="text-white/80 font-mono text-[8px]">{student.referred_by}</span>
                                                <span className={student.referral_status === 'completed' ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}>
                                                    ({student.referral_status === 'completed' ? 'مكتمل' : 'قيد الانتظار'})
                                                </span>
                                            </div>
                                            <span className="text-gray-500 font-bold">مدعو بواسطة</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Row */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleAddCoins(student)}
                                        className="flex-1 py-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-lg text-[9px] font-black transition-all border border-yellow-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={12} />
                                        إضافة كوينز
                                    </button>
                                    <button
                                        onClick={() => handleResetSurveyQuota(student)}
                                        className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg text-[9px] font-black transition-all border border-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={12} />
                                        تصفير الباقة
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

const Plus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const Users = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

export default StudentManagement;
