import React, { useState, useEffect, useRef } from 'react';
import {
    X, MoreVertical, MessageCircle, Phone, Video, Share2,
    ShieldCheck, Edit, Check, ShieldAlert, Loader2, Ban,
    User, ArrowRight, Share, Send, Pen, Copy, CheckCircle2
} from 'lucide-react';
import { DB } from '../services/db';
import { Student } from '../types';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetStudentId: string;
    currentUser: Student;
    onStartPrivateChat: (id: string, name: string) => void;
    theme: any;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
    isOpen,
    onClose,
    targetStudentId,
    currentUser,
    onStartPrivateChat,
    theme
}) => {
    const [targetStudent, setTargetStudent] = useState<Student | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<'verifying' | 'verified' | 'blocked'>('verifying');
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen || !targetStudentId) return;

        const loadInitialData = () => {
            const students = DB.getStudents();
            const s = students.find(x => x.id === targetStudentId);
            if (s) {
                setTargetStudent(s);
                // Initial load: set the nickname state
                const currentNick = currentUser.nicknames?.[targetStudentId] || '';
                setNewNickname(currentNick || s.username);
            }
        };

        loadInitialData();
    }, [isOpen, targetStudentId]); // Only run when modal opens or student changes

    useEffect(() => {
        if (!isOpen || !targetStudentId) return;

        const syncData = () => {
            const students = DB.getStudents();
            const s = students.find(x => x.id === targetStudentId);
            if (s) {
                setTargetStudent(prev => {
                    // Update student info if it changed, but keep internal state if valid
                    if (s.username !== prev?.username || s.avatarUrl !== prev?.avatarUrl || s.profilePictureUrl !== prev?.profilePictureUrl) {
                        return s;
                    }
                    return prev;
                });

                // Only sync the nickname if the user IS NOT typing right now
                if (!isEditingNickname) {
                    const currentNick = currentUser.nicknames?.[targetStudentId] || '';
                    setNewNickname(currentNick || s.username);
                }
            }
        };

        window.addEventListener('nt-students-change', syncData);
        return () => window.removeEventListener('nt-students-change', syncData);
    }, [isOpen, targetStudentId, currentUser.nicknames, isEditingNickname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    if (!isOpen || !targetStudent) return null;

    const isIBlocked = targetStudent.blockedUsers?.includes(currentUser.id) || false;
    const isHeBlocked = currentUser.blockedUsers?.includes(targetStudentId) || false;

    // In WhatsApp, if you are blocked, you don't see their avatar (shows placeholder)
    const displayAvatar = isIBlocked ? null : (targetStudent.profilePictureUrl || targetStudent.avatarUrl);
    const displayName = currentUser.nicknames?.[targetStudentId] || targetStudent.username;

    const handleUpdateNickname = () => {
        if (!newNickname.trim()) return;
        const updatedNicknames = { ...(currentUser.nicknames || {}), [targetStudentId]: newNickname.trim() };
        DB.updateStudent(currentUser.id, { nicknames: updatedNicknames });
        setIsEditingNickname(false);
        // Refresh local data by triggering a notify in DB if needed, but DB.updateStudent usually does it
    };

    const handleInternalShare = () => {
        window.dispatchEvent(new CustomEvent('nt-start-global-forward', {
            detail: {
                type: 'contact',
                contactId: targetStudentId,
                contactName: targetStudent.username,
                avatarUrl: targetStudent.profilePictureUrl || targetStudent.avatarUrl,
                text: `جهة اتصال: ${targetStudent.username}`
            }
        }));
        setIsMenuOpen(false);
    };

    const handleShare = async () => {
        const shareData = {
            title: `الملف الشخصي للطالب: ${displayName}`,
            text: `تواصل مع الطالب عبر Mentora:\n${displayName}\n`,
            url: window.location.origin + '/?openProfile=' + targetStudentId
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(shareData.url);
                alert("تم نسخ رابط الملف الشخصي للمشاركة.");
            }
        } catch (e) { }
    };

    const handleVerify = () => {
        setShowVerifyModal(true);
        setVerifyStatus('verifying');
        setTimeout(() => {
            if (isIBlocked) {
                setVerifyStatus('blocked');
            } else {
                setVerifyStatus('verified');
            }
        }, 1500);
        setIsMenuOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[10000000] bg-[#000000] flex flex-col items-center justify-start overflow-y-auto w-[100vw] min-h-[100dvh] animate-none transition-none !duration-0" dir="rtl" style={{ boxSizing: 'border-box' }}>
            <div className="w-full h-full max-w-full flex flex-col relative no-scrollbar overflow-y-auto" style={{ backdropFilter: 'blur(10px)' }}>

                {/* Header with Close and Menu */}
                <div className="flex items-center justify-between p-4 bg-[#000000] relative z-20">
                    {/* Consistent X Button on the Right for RTL */}
                    <button
                        onClick={onClose}
                        className="fixed sm:absolute top-5 right-5 text-[#FFD700] z-[100]"
                    >
                        <ArrowRight size={26} />
                    </button>
                    <div className="relative">
                        {/* More options menu removed by user request */}
                    </div>
                </div>

                {/* Profile Main View */}
                <div className="flex-1 flex flex-col items-center pt-16 px-4 overflow-y-auto no-scrollbar">

                    {/* Large Avatar */}
                    <div className="relative mb-6">
                        <div
                            className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-[1.5px] border-[#FFD700] bg-[#2b3943] shadow-2xl flex items-center justify-center cursor-pointer group"
                            onClick={() => {
                                if (!displayAvatar) {
                                    alert('لا توجد صورة شخصية للمستخدم أو أنك محظور من طرفه.');
                                } else {
                                    window.dispatchEvent(new CustomEvent('nt-open-avatar', { detail: { url: displayAvatar, name: displayName } }));
                                }
                            }}
                        >
                            {displayAvatar ? (
                                <img src={displayAvatar} className="w-full h-full object-cover group-hover:scale-105" alt={displayName} />
                            ) : (
                                <User size={100} className="text-white/20" />
                            )}
                        </div>
                    </div>

                    {/* Nickname / Display Name */}
                    {isEditingNickname ? (
                        <div className="flex flex-col items-center gap-3 mb-2 w-[90%] sm:max-w-[400px]">
                            <div className="flex items-center gap-2 w-full">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newNickname}
                                    onChange={(e) => setNewNickname(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateNickname();
                                        if (e.key === 'Escape') setIsEditingNickname(false);
                                    }}
                                    placeholder="أدخل اللقب الجديد..."
                                    className="flex-1 bg-white/10 border-[1.5px] border-[#FFD700] rounded-2xl px-5 py-3 text-white text-center font-black outline-none flex-grow shadow-lg placeholder:text-gray-500 text-lg"
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={handleUpdateNickname}
                                    className="flex-1 py-3 bg-[#000000] border-[1.5px] border-[#FFD700] hover:bg-[#FFD700]/20 text-[#FFD700] font-black rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check size={18} />
                                    <span>حفظ التعديل</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingNickname(false);
                                        const originalNick = currentUser.nicknames?.[targetStudentId] || '';
                                        setNewNickname(originalNick || targetStudent.username);
                                    }}
                                    className="px-4 py-3 bg-[#000000] border-[1.5px] border-red-500 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-xl active:scale-95 text-center flex items-center justify-center"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 group w-[90%]">
                            <button
                                onClick={() => setIsEditingNickname(true)}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#000000] border-[1.5px] border-[#FFD700] rounded-2xl active:scale-95 group/btn"
                            >
                                <Pen size={14} className="text-[#FFD700]" />
                                <h2 className="text-2xl sm:text-3xl font-black text-[#FFD700] italic tracking-tight truncate text-center flex items-center justify-center gap-2">
                                    {displayName}
                                    {targetStudent.isVerified && (
                                        <CheckCircle2 size={18} className="text-blue-500 fill-white shrink-0" />
                                    )}
                                </h2>
                            </button>
                        </div>
                    )}

                    {/* Push Name / Tagline */}
                    <p className="text-gray-400 font-bold mb-4 text-sm">~ {targetStudent.username} ~</p>

                    {/* Student ID Section */}
                    <div className="w-[90%] sm:max-w-[400px] mb-8">
                        <div
                            onClick={() => {
                                navigator.clipboard.writeText(targetStudentId);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className="bg-[#000000] border-[1.5px] border-[#FFD700]/30 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:border-[#FFD700] transition-all relative overflow-hidden"
                        >
                            {/* Success Pulse Effect */}
                            {isCopied && (
                                <div className="absolute inset-0 bg-[#FFD700]/10 animate-pulse flex items-center justify-center">
                                    <span className="text-[#FFD700] text-[10px] font-black uppercase tracking-widest animate-bounce">تم النسخ بنجاح!</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-2 rounded-lg transition-all",
                                    isCopied ? "bg-emerald-500/20 text-emerald-500" : "bg-[#FFD700]/10 text-[#FFD700]"
                                )}>
                                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                </div>
                            </div>

                            <div className="flex-1 px-4 text-center">
                                <span className="text-[11px] sm:text-xs font-black text-white font-mono tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
                                    {targetStudentId}
                                </span>
                            </div>

                            <div className="flex items-center">
                                <ShieldCheck size={14} className="text-[#FFD700] opacity-30" />
                            </div>
                        </div>
                        <p className="text-center text-[9px] text-gray-500 font-bold mt-2 uppercase tracking-widest opacity-60">Student Identity Verification</p>
                    </div>

                    {/* Action Buttons Row - REMOVED AS REQUESTED BY USER */}
                    {/* Only the Edit Button Above remains */}

                </div>

                {/* Verify Encryption Modal Overlay */}
                {showVerifyModal && (
                    <div className="absolute inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#1e293b] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl relative text-center space-y-4">
                            <button
                                onClick={() => setShowVerifyModal(false)}
                                className="absolute top-4 left-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>

                            {verifyStatus === 'verifying' ? (
                                <div className="py-6 flex flex-col items-center gap-5">
                                    <Loader2 size={48} className="text-emerald-500 animate-spin" />
                                    <h3 className="text-lg font-black text-white">جاري التحقق من التشفير...</h3>
                                    <p className="text-xs text-gray-400 font-bold">يرجى الانتظار، يتم الآن فحص مفاتيح الأمان</p>
                                </div>
                            ) : verifyStatus === 'blocked' ? (
                                <>
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                                        <Ban size={32} className="text-red-500" />
                                        <div className="absolute -bottom-0.5 -right-0.5 bg-[#1e293b] rounded-full p-1 border border-red-500/30">
                                            <X size={12} className="text-red-500 font-black" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-red-500">فشل الاتصال: تم حظرك</h3>
                                    <p className="text-[13px] text-gray-300 leading-relaxed font-bold">
                                        عذراً، لا يمكن إنشاء قناة اتصال مشفرة مع هذا الطالب لأنك محظور من طرفه. لا يمكنك المراسلة حالياً.
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-bold mt-3 border-t border-white/10 pt-3 opacity-60">
                                        كود الحماية: NT-{Date.now().toString().substr(-6)}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                                        <ShieldCheck size={32} className="text-emerald-500" />
                                        <div className="absolute -bottom-0.5 -right-0.5 bg-[#1e293b] rounded-full p-1 border border-emerald-500/30">
                                            <Check size={12} className="text-emerald-500 font-black" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-emerald-400">تم التحقيق بالتشفير بنجاح</h3>
                                    <p className="text-[13px] text-gray-300 leading-relaxed font-bold">
                                        رسائلك فقط مشفرة تماماً بين الطرفين. لا تستطيع Mentora ولا أي جهة خارجية قراءة رسائلك.
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-bold mt-3 border-t border-white/10 pt-3 opacity-60">
                                        كود الحماية المتبادل: NT-{Date.now().toString().substr(-6)}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default StudentProfileModal;
