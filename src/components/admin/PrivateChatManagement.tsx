import React, { useState, useEffect, useMemo } from 'react';
import { DB } from '../../services/db';
import { PrivateMessage, Student } from '../../types';
import { MessageSquare, Trash2, ArrowRight, User } from 'lucide-react';

interface PrivateChatManagementProps {
    students: Student[];
    theme: any;
}

export const PrivateChatManagement: React.FC<PrivateChatManagementProps> = ({ students, theme }) => {
    const [messages, setMessages] = useState<PrivateMessage[]>(() => DB.getPrivateMessages());
    const [activeChat, setActiveChat] = useState<{ id1: string, id2: string, name1: string, name2: string } | null>(null);

    useEffect(() => {
        const refresh = () => setMessages(DB.getPrivateMessages());
        window.addEventListener('nt-private-msgs-change', refresh);
        return () => window.removeEventListener('nt-private-msgs-change', refresh);
    }, []);

    const conversations = useMemo(() => {
        const studentMap = new Map<string, string>(
            students.filter(s => !s.isDeleted).map(s => [s.id, s.username])
        );
        const map = new Map<string, {
            id1: string;
            id2: string;
            name1: string;
            name2: string;
            lastMessage: PrivateMessage;
            unreadCount: number;
        }>();

        messages.forEach(msg => {
            const users = [msg.senderId, msg.receiverId].sort();

            // Filter out conversations involving deleted students
            if (!studentMap.has(users[0]) || !studentMap.has(users[1])) return;

            const key = `${users[0]}_${users[1]}`;

            if (!map.has(key) || msg.timestamp > map.get(key)!.lastMessage.timestamp) {
                map.set(key, {
                    id1: users[0],
                    id2: users[1],
                    name1: studentMap.get(users[0])!,
                    name2: studentMap.get(users[1])!,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }
        });

        return Array.from(map.values()).sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    }, [messages, students]);

    const getChatMessages = (id1: string, id2: string) => {
        return messages.filter(m =>
            (m.senderId === id1 && m.receiverId === id2) ||
            (m.senderId === id2 && m.receiverId === id1)
        ).sort((a, b) => a.timestamp - b.timestamp);
    };

    const handleDeleteConversation = (id1: string, id2: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) return;
        const newMsgs = messages.filter(m =>
            !((m.senderId === id1 && m.receiverId === id2) || (m.senderId === id2 && m.receiverId === id1))
        );
        DB.savePrivateMessages(newMsgs);
        setMessages(newMsgs);
        if (activeChat && ((activeChat.id1 === id1 && activeChat.id2 === id2) || (activeChat.id1 === id2 && activeChat.id2 === id1))) {
            setActiveChat(null);
        }
    };

    const handleDeleteMessage = (msgId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
        const newMsgs = messages.filter(m => m.id !== msgId);
        DB.savePrivateMessages(newMsgs);
        setMessages(newMsgs);
    };

    const handleDeleteAll = () => {
        if (!window.confirm('⚠️ تحذير شديد: هل أنت متأكد من حذف جميع المحادثات الخاصة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        DB.savePrivateMessages([]);
        setMessages([]);
        setActiveChat(null);
    };

    return (
        <div className="flex h-[calc(100dvh-120px)] bg-[#020617]/50 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl dir-rtl">
            {/* Conversations List */}
            <div className={`w-full md:w-1/3 bg-[#0a0f1c] border-l border-white/5 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-5 border-b border-white/5 bg-[#050811] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={20} className="text-cyan-400" />
                        <h2 className="text-xl font-black text-white">المحادثات الخاصة</h2>
                    </div>
                    {conversations.length > 0 && (
                        <button onClick={handleDeleteAll} className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl group transition-all border border-transparent hover:border-red-500/20" title="حذف جميع المحادثات">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 opacity-40">
                            <MessageSquare size={40} className="mb-4 text-gray-400" />
                            <p className="font-bold text-sm text-center">لا توجد محادثات خاصة مسجلة حالياً</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={`${conv.id1}_${conv.id2}`}
                                onClick={() => setActiveChat({ id1: conv.id1, id2: conv.id2, name1: conv.name1, name2: conv.name2 })}
                                className={`w-full text-right p-4 rounded-2xl flex items-center justify-between gap-3 transition-all ${activeChat && activeChat.id1 === conv.id1 && activeChat.id2 === conv.id2 ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                            >
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-black text-[13px] text-white truncate">{conv.name1} & {conv.name2}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold truncate mt-1">
                                        {conv.lastMessage.isDeletedForEveryone ? '🚫 تم حذف الرسالة' : conv.lastMessage.text}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[9px] text-gray-500 font-bold bg-black/40 px-2 py-1 rounded-lg">
                                        {new Date(conv.lastMessage.timestamp).toLocaleDateString('ar-EG')}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat View */}
            <div className={`w-full md:w-2/3 bg-[#02040a] flex flex-col relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 h-full p-6 text-center">
                        <MessageSquare size={80} className="mb-6 text-gray-500" />
                        <h2 className="text-2xl font-black text-white mb-2">مراقبة الدردشة المشفرة</h2>
                        <p className="text-sm font-bold max-w-sm leading-relaxed">يرجى اختيار محادثة من القائمة لعرض الرسائل المتبادلة وإدارتها.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-white/5 bg-[#050811] flex items-center justify-between z-10 shadow-md">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                    <ArrowRight size={20} />
                                </button>
                                <div>
                                    <h3 className="text-lg font-black text-white flex gap-2 items-center">
                                        {activeChat.name1} <span className="text-cyan-500 text-sm">و</span> {activeChat.name2}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-bold">المحادثات الخاصة بين الطالبين</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteConversation(activeChat.id1, activeChat.id2)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded-xl text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                            >
                                <Trash2 size={14} /> مسح المحادثة
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                            {getChatMessages(activeChat.id1, activeChat.id2).map((msg, idx) => {
                                const isId1 = msg.senderId === activeChat.id1;
                                const senderName = isId1 ? activeChat.name1 : activeChat.name2;

                                return (
                                    <div key={msg.id} className={`flex flex-col w-full ${isId1 ? 'items-end' : 'items-start'}`}>
                                        <div className="text-[10px] text-gray-500 font-bold mb-1 px-2 flex items-center gap-1">
                                            <User size={10} /> {senderName}
                                        </div>
                                        <div className={`relative group max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl ${msg.isDeletedForEveryone ? 'bg-red-500/10 border-red-500/30' : (isId1 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/10')} border`}>
                                            <p className={`text-[13px] font-bold ${msg.isDeletedForEveryone ? 'text-red-400 italic' : 'text-gray-200'} whitespace-pre-wrap break-words leading-relaxed`}>
                                                {msg.isDeletedForEveryone ? '🚫 تم حذف الرسالة' : msg.text}
                                            </p>

                                            <div className="flex items-center justify-between mt-2 gap-4">
                                                <span className="text-[9px] text-gray-500 font-black">
                                                    {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.timestamp).toLocaleDateString('ar-EG')}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg"
                                                    title="حذف هذه الرسالة نهائياً"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
