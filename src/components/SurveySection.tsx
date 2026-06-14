
import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Send, Reply, Trash2, ChevronDown, ChevronUp, User, ShieldAlert, Sparkles, Lock } from 'lucide-react';
import { DB } from '../services/db';
import { SurveyPost, SurveyReply } from '../types';

interface SurveySectionProps {
    user: {
        id: string;
        username: string;
        level: string;
        year: string;
        avatarUrl?: string;
        profilePictureUrl?: string;
        isChatFree?: boolean;
        surveyQuota?: number;
        surveyResetTime?: number;
    };
    theme: any;
    onOpenStudentProfile?: (id: string) => void;
}

export const SurveySection: React.FC<SurveySectionProps> = ({ user, theme, onOpenStudentProfile }) => {
    const [posts, setPosts] = useState<SurveyPost[]>(() => DB.getSurveyPosts());
    const [newPostText, setNewPostText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [showBadWordWarning, setShowBadWordWarning] = useState(false);
    const [studentsList, setStudentsList] = useState<any[]>(() => DB.getStudents());

    // Quota Logic: Independent Survey Quota
    const surveyQuotaRem = user.surveyQuota ?? 3;
    const hasQuota = user.isChatFree || surveyQuotaRem > 0;
    const isSurveyResetting = !user.isChatFree && surveyQuotaRem <= 0 && user.surveyResetTime && user.surveyResetTime > Date.now();

    const [surveyTimerStr, setSurveyTimerStr] = useState<string>('');

    useEffect(() => {
        if (!isSurveyResetting || !user.surveyResetTime) {
            setSurveyTimerStr('');
            return;
        }
        const updateTimer = () => {
            const now = Date.now();
            const diff = user.surveyResetTime! - now;
            if (diff <= 0) {
                setSurveyTimerStr('');
                window.dispatchEvent(new CustomEvent('nt-students-change'));
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setSurveyTimerStr(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isSurveyResetting, user.surveyResetTime]);

    const consumeSurveyQuota = () => {
        if (user.isChatFree) return true;
        const res = DB.consumeSurveyQuota(user.id);
        if (res.allowed) {
            window.dispatchEvent(new CustomEvent('nt-students-change'));
            return true;
        }
        return false;
    };

    useEffect(() => {
        const refresh = () => {
            setPosts(DB.getSurveyPosts());
            setStudentsList(DB.getStudents());
        };
        const events = ['nt-surveys-change', 'nt-students-change', 'nt-data-sync'];
        events.forEach(ev => window.addEventListener(ev, refresh));
        return () => events.forEach(ev => window.removeEventListener(ev, refresh));
    }, []);

    const now = () => {
        const d = new Date();
        return {
            date: d.toLocaleDateString('ar-EG'),
            time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const checkModeration = (text: string): boolean => {
        const phoneRegex = /(010\d{8}|٠١٠[٠-٩]{8})/;
        const badWords = [
            'جنس', 'اباحي', 'سكس', 'نيك', 'شرموط', 'كسمك', 'متناك', 'خول', 'لبوة',
            'sex', 'porn', 'fuck', 'pussy', 'dick', 'كلب', 'حمار', 'غبي', 'شتم', 'سب', 'لعن', 'وسخ'
        ];
        if (phoneRegex.test(text) || badWords.some(word => text.toLowerCase().includes(word))) {
            const students = DB.getStudents();
            const studentIdx = students.findIndex((s: any) => s.id === user.id);
            if (studentIdx !== -1) {
                const newCount = (students[studentIdx].violationCount || 0) + 1;
                if (newCount >= 2) {
                    DB.updateStudent(user.id, { isBlocked: true, violationCount: newCount });
                    localStorage.removeItem('nt_logged_in_user');
                    alert('تم حظر حسابك نهائياً بسبب تكرار مخالفة شروط المنصة.');
                    window.location.reload();
                } else {
                    DB.updateStudent(user.id, { violationCount: newCount });
                    setShowBadWordWarning(true);
                }
            }
            return false;
        }
        return true;
    };

    const handlePost = () => {
        const text = newPostText.trim();
        if (!text || !checkModeration(text)) return;
        if (!consumeSurveyQuota()) {
            alert('لقد استنفذت رصيد الرسائل المتاحة لك دردشة.');
            return;
        }
        const { date, time } = now();
        DB.addSurveyPost({
            id: Date.now().toString(),
            studentId: user.id,
            studentName: user.username,
            level: user.level,
            year: user.year,
            content: text,
            date,
            time,
            replies: []
        });
        setNewPostText('');
    };

    const handleReply = (postId: string) => {
        const text = (replyTexts[postId] || '').trim();
        if (!text || !checkModeration(text)) return;
        if (!consumeSurveyQuota()) {
            alert('لقد استنفذت رصيد الرسائل المتاحة لك دردشة.');
            return;
        }
        const { date, time } = now();
        DB.addSurveyReply(postId, {
            id: Date.now().toString(),
            studentId: user.id,
            studentName: user.username,
            level: user.level,
            year: user.year,
            content: text,
            date,
            time
        });
        setReplyTexts(prev => ({ ...prev, [postId]: '' }));
        setReplyingTo(null);
        setExpandedReplies(prev => new Set([...prev, postId]));
    };

    const toggleReplies = (postId: string) => {
        setExpandedReplies(prev => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    return (
        <div className="space-y-4" dir="rtl">
            <div className="rounded-[1.5rem] border p-4 space-y-3" style={{ background: 'rgba(2,6,23,0.5)', backdropFilter: 'blur(20px)', borderColor: `${theme.primary}30` }}>
                <div className="flex items-center justify-between px-1 mb-2">
                    {user.isChatFree ? (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1.5 rounded-lg border border-emerald-400/20">
                            <Sparkles size={12} />
                            <span>مجاناً بلا حدود</span>
                        </div>
                    ) : surveyQuotaRem > 0 ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                <span>الرسائل المتبقية:</span>
                                <span className="text-emerald-400 font-black">{surveyQuotaRem}/3</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                            <Lock size={12} />
                            <span>رسالتك القادمة في <span className="font-mono">{surveyTimerStr}</span></span>
                        </div>
                    )}
                    <h2 className="text-lg font-black" style={{ color: theme.primary }}>دردشة</h2>
                </div>
                <textarea
                    value={newPostText}
                    onChange={e => setNewPostText(e.target.value)}
                    placeholder={hasQuota ? "اكتب تعليقك هنا..." : `استنفذت الرصيد.. المتبقي: ${surveyTimerStr}`}
                    disabled={!hasQuota}
                    rows={3}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-right outline-none focus:border-opacity-100 transition-all font-bold resize-none text-sm"
                    style={{ borderColor: `${theme.primary}20` }}
                />
                <div className="flex justify-end">
                    <button onClick={handlePost} disabled={!newPostText.trim() || !hasQuota} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-30 shadow-lg" style={{ backgroundColor: theme.primary, color: '#000' }}>
                        <Send size={16} /> إرسال الرسالة
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <MessageCircle size={48} className="mx-auto mb-3" />
                        <p className="font-bold">لا توجد تعليقات حتى الآن، كن أول من يشارك!</p>
                    </div>
                ) : (
                    [...posts].reverse().map(post => (
                        <div key={post.id} className="rounded-[1.5rem] border overflow-hidden" style={{ background: 'rgba(2,6,23,0.4)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    {post.studentId === user.id ? (
                                        <button onClick={() => { if (window.confirm('هل تريد حذف تعليقك؟')) DB.deleteSurveyPost(post.id) }} className="p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                    ) : (
                                        <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="px-4 py-1.5 rounded-lg text-xs font-black transition-all" style={{ color: theme.primary, background: `${theme.primary}15` }}><Reply size={14} className="inline ml-1" />رد</button>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="font-black text-sm text-white">{post.studentName}</div>
                                            <div className="text-[10px] text-gray-500 font-bold">{post.level} | {post.year}</div>
                                        </div>
                                        <div
                                            className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center cursor-pointer hover:border-white/30 transition-all"
                                            onClick={() => onOpenStudentProfile && onOpenStudentProfile(post.studentId)}
                                        >
                                            {(() => {
                                                const s = studentsList.find(x => x.id === post.studentId);
                                                return s?.profilePictureUrl || s?.avatarUrl ? <img src={s.profilePictureUrl || s.avatarUrl} className="w-full h-full object-cover" /> : <User size={20} className="text-white/40" />;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-200 text-right leading-relaxed bg-white/5 rounded-2xl px-4 py-3">{post.content}</p>
                                <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
                                    {post.replies.length > 0 && (
                                        <button onClick={() => toggleReplies(post.id)} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                            {expandedReplies.has(post.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {post.replies.length} ردود
                                        </button>
                                    )}
                                    <span className={post.replies.length === 0 ? 'mr-auto' : ''}>{post.date} • {post.time}</span>
                                </div>
                            </div>

                            {expandedReplies.has(post.id) && post.replies.length > 0 && (
                                <div className="border-t border-white/5 bg-black/20 p-4 space-y-4">
                                    {post.replies.map(reply => (
                                        <div key={reply.id} className="flex items-start gap-3 justify-end">
                                            <div className="flex-1 text-right space-y-1">
                                                <div className="flex items-center justify-end gap-2">
                                                    {reply.studentId === user.id && <button onClick={() => { if (window.confirm('هل تريد حذف الرد؟')) DB.deleteSurveyReply(post.id, reply.id) }} className="p-1 text-red-500/50 hover:text-red-500"><Trash2 size={12} /></button>}
                                                    <span className="text-[10px] text-gray-500 font-bold">{reply.date} • {reply.time}</span>
                                                    <span className="text-xs font-black" style={{ color: theme.primary }}>{reply.studentName}</span>
                                                </div>
                                                <div className="bg-white/5 rounded-xl px-3 py-2 text-xs font-bold text-gray-300">{reply.content}</div>
                                            </div>
                                            <div
                                                className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0 cursor-pointer hover:border-white/30 transition-all"
                                                onClick={() => onOpenStudentProfile && onOpenStudentProfile(reply.studentId)}
                                            >
                                                {(() => {
                                                    const s = studentsList.find(x => x.id === reply.studentId);
                                                    return s?.profilePictureUrl || s?.avatarUrl ? <img src={s.profilePictureUrl || s.avatarUrl} className="w-full h-full object-cover" /> : <User size={14} className="text-white/40" />;
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {replyingTo === post.id && (
                                <div className="border-t border-primary/20 bg-primary/5 p-3 flex gap-2" style={{ background: `${theme.primary}08` }}>
                                    <button onClick={() => handleReply(post.id)} disabled={!(replyTexts[post.id] || '').trim() || !hasQuota} className="px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-30" style={{ backgroundColor: theme.primary, color: '#000' }}><Send size={14} /></button>
                                    <input type="text" value={replyTexts[post.id] || ''} onChange={e => setReplyTexts(p => ({ ...p, [post.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleReply(post.id)} placeholder="اكتب ردك هنا..." className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-right text-xs font-bold outline-none" />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showBadWordWarning && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-[#1e293b] border border-red-500/30 rounded-3xl w-full max-w-sm p-8 text-center space-y-6 shadow-2xl">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/20"><ShieldAlert size={40} className="text-red-500" /></div>
                        <div>
                            <h3 className="text-xl font-black text-white mb-2">تحذير أمني</h3>
                            <p className="text-xs text-gray-300 font-bold leading-relaxed px-2">رصدت المنصة كلمات غير لائقة. هذا تحذير أول، في حال التكرار سيتم حظر الحساب تلقائياً.</p>
                        </div>
                        <button onClick={() => setShowBadWordWarning(false)} className="w-full py-3 bg-red-500 hover:bg-red-600 active:scale-95 transition-all rounded-xl text-white font-black">فهمت ذلك</button>
                    </div>
                </div>
            )}
        </div>
    );
};
