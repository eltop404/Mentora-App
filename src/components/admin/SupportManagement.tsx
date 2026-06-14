import React, { useState } from 'react';
import { Trash2, MessageSquare, User, Clock, Calendar, Send, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { SupportTicket } from '../../types';
import { DB } from '../../services/db';
import { cn } from '../../utils/cn'; // Assuming utility exists or using standard approach

interface SupportManagementProps {
    tickets: SupportTicket[];
    setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
    theme: any;
    onDeleteAll?: () => void;
}

export const SupportManagement: React.FC<SupportManagementProps> = ({ tickets, setTickets, theme, onDeleteAll }) => {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) {
            DB.deleteTicket(id);
            setTickets(DB.getTickets());
        }
    };

    const handleReply = (id: string) => {
        if (!replyText.trim()) return;
        DB.updateTicketStatus(id, replyText);
        setTickets(DB.getTickets());
        setReplyingTo(null);
        setReplyText('');
        alert('تم إرسال الرد بنجاح');
    };

    return (
        <div className="space-y-6 text-right animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl border border-primary/20" style={{ color: theme.primary }}>
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">الدعم الفني والشكاوى</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-left">Support Ticket Management</p>
                    </div>
                </div>
                {tickets.length > 0 && onDeleteAll && (
                    <button
                        onClick={onDeleteAll}
                        className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 active:scale-95 group shadow-lg"
                        title="حذف جميع الطلبات"
                    >
                        <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                )}
            </div>

            {tickets.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center opacity-30 grayscale bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                    <MessageSquare size={64} className="mb-4" />
                    <p className="text-xl font-bold">لا توجد طلبات دعم حالياً</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 pb-20">
                    {tickets.map((ticket, index) => (
                        <div
                            key={ticket.id}
                            className={cn(
                                "group relative bg-[#0b141a]/40 border rounded-[2rem] p-4 transition-all duration-300 hover:border-primary/30",
                                ticket.status === 'responded' ? "border-emerald-500/20" : "border-white/5"
                            )}
                        >
                            {/* Ticket Number Badge */}
                            <div className="absolute -top-2 -left-2 w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[10px] font-black text-gray-500 backdrop-blur-md z-10">
                                #{index + 1}
                            </div>
                            <div className="flex flex-col md:flex-row-reverse gap-6">
                                {/* Student Info Sidebar */}
                                <div className="md:w-48 flex flex-col items-center md:items-end text-center md:text-right space-y-3 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                                    <div className="relative">
                                        <img
                                            src={ticket.studentPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.studentName}`}
                                            alt=""
                                            className="w-14 h-14 rounded-2xl border-2 border-white/10 shadow-2xl object-cover bg-black/40"
                                        />
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0b141a] flex items-center justify-center",
                                            ticket.status === 'responded' ? "bg-emerald-500" : "bg-yellow-500"
                                        )}>
                                            {ticket.status === 'responded' ? <ShieldCheck size={10} className="text-white" /> : <Clock size={10} className="text-white" />}
                                        </div>
                                    </div>

                                    <div className="space-y-0.5">
                                        <h3 className="font-black text-white text-base leading-none">{ticket.studentName}</h3>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">ID: {ticket.studentId.slice(0, 8)}</p>
                                    </div>

                                    <div className="flex flex-wrap justify-center md:justify-end gap-1.5">
                                        <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-black text-gray-400">
                                            {ticket.level}
                                        </span>
                                        <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-black text-gray-400">
                                            {ticket.year}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-2 w-full">
                                        <div className="flex items-center justify-center md:justify-end gap-1.5 text-gray-600">
                                            <span className="text-[9px] font-bold">{ticket.date}</span>
                                            <Calendar size={10} />
                                        </div>
                                        <div className="flex items-center justify-center md:justify-end gap-1.5 text-gray-600">
                                            <span className="text-[9px] font-bold">{ticket.time}</span>
                                            <Clock size={10} />
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Content */}
                                <div className="flex-1 flex flex-col gap-3">
                                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 min-h-[80px] relative">
                                        <div className="absolute top-0 left-0 p-2 opacity-5">
                                            <MessageSquare size={32} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-300 leading-relaxed relative z-10 whitespace-pre-wrap">{ticket.content}</p>
                                    </div>

                                    {ticket.status === 'responded' && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2 animate-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-center justify-end gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                                                <span>الرد المرسل</span>
                                                <Send size={12} />
                                            </div>
                                            <p className="text-[11px] font-bold text-emerald-100/70 leading-relaxed">{ticket.response}</p>
                                            <div className="text-[8px] text-emerald-500/40 font-black text-left">{ticket.responseDate}</div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-auto pt-2">
                                        <button
                                            onClick={() => setReplyingTo(replyingTo === ticket.id ? null : ticket.id)}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 text-center",
                                                ticket.status === 'responded' ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-primary text-black hover:brightness-110"
                                            )}
                                            style={ticket.status !== 'responded' ? { backgroundColor: theme.primary } : {}}
                                        >
                                            {replyingTo === ticket.id ? <X size={14} /> : <MessageSquare size={14} />}
                                            {ticket.status === 'responded' ? 'تعديل الرد' : 'الرد على الطالب'}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(ticket.id)}
                                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {replyingTo === ticket.id && (
                                        <div className="mt-4 space-y-3 animate-in zoom-in-95 duration-200">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="اكتب ردك هنا..."
                                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-primary/50 h-32 no-scrollbar resize-none shadow-inner"
                                            />
                                            <button
                                                onClick={() => handleReply(ticket.id)}
                                                disabled={!replyText.trim()}
                                                className="w-full py-4 rounded-2xl font-black text-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                                                style={{ backgroundColor: theme.primary }}
                                            >
                                                إرسال الرد الآن <Send size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
