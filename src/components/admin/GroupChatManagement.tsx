import React, { useState, useEffect, useMemo } from 'react';
import { DB } from '../../services/db';
import { GroupRoom, PrivateMessage } from '../../types';
import { Users, Trash2, ArrowRight, ShieldAlert, Check, Lock, Unlock } from 'lucide-react';

interface GroupChatManagementProps {
    theme: any;
}

export const GroupChatManagement: React.FC<GroupChatManagementProps> = ({ theme }) => {
    const [rooms, setRooms] = useState<GroupRoom[]>(() => DB.getGroupRooms());
    const [messages, setMessages] = useState<PrivateMessage[]>(() => DB.getPrivateMessages());
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

    useEffect(() => {
        const refreshRooms = () => setRooms(DB.getGroupRooms());
        const refreshMsgs = () => setMessages(DB.getPrivateMessages());
        window.addEventListener('nt-group-rooms-change', refreshRooms);
        window.addEventListener('nt-private-msgs-change', refreshMsgs);
        return () => {
            window.removeEventListener('nt-group-rooms-change', refreshRooms);
            window.removeEventListener('nt-private-msgs-change', refreshMsgs);
        };
    }, []);

    const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId) || null, [rooms, activeRoomId]);

    const activeRoomMessages = useMemo(() => {
        if (!activeRoomId) return [];
        return messages.filter(m => m.receiverId === activeRoomId).sort((a, b) => a.timestamp - b.timestamp);
    }, [messages, activeRoomId]);

    const handleDeleteRoom = (roomId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الروم نهائياً؟ سيتم مسح الروم وجميع مسجاتها من النظام تماماً.')) return;

        // Delete the room
        DB.deleteGroupRoom(roomId);

        // Delete all messages associated with this room
        const newMsgs = DB.getPrivateMessages().filter(m => m.receiverId !== roomId);
        DB.savePrivateMessages(newMsgs);

        setRooms(prev => prev.filter(r => r.id !== roomId));
        setMessages(newMsgs);
        if (activeRoomId === roomId) setActiveRoomId(null);
    };

    const handleDeleteAllRooms = () => {
        if (!window.confirm('⚠️ تحذير شديد: هل أنت متأكد من مسح جميع الرومات وحذف رسائلها نهائياً؟ إجراء لا يمكن التراجع عنه.')) return;

        const currentRooms = DB.getGroupRooms();
        let newMsgs = DB.getPrivateMessages();

        currentRooms.forEach(r => {
            newMsgs = newMsgs.filter(m => m.receiverId !== r.id);
            DB.deleteGroupRoom(r.id);
        });

        DB.savePrivateMessages(newMsgs);
        setRooms([]);
        setMessages(newMsgs);
        setActiveRoomId(null);
    };

    const handleDeleteMessage = (msgId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة من الروم للجميع؟')) return;
        const newMsgs = messages.filter(m => m.id !== msgId);
        DB.savePrivateMessages(newMsgs);
        setMessages(newMsgs);
    };

    return (
        <div className="flex h-[calc(100dvh-120px)] bg-[#020617]/50 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl dir-rtl">
            {/* Rooms List */}
            <div className={`w-full md:w-1/3 bg-[#0a0f1c] border-l border-white/5 flex flex-col ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-5 border-b border-white/5 bg-[#050811] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Users size={20} className="text-emerald-400" />
                        <h2 className="text-xl font-black text-white">محادثات الروم</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const stgs = DB.getSettings();
                                DB.updateSettings({ isCreateRoomLocked: !stgs.isCreateRoomLocked });
                                // Force re-render locally by triggering an event if you don't use React state for settings here
                                window.dispatchEvent(new CustomEvent('nt-settings-change'));
                            }}
                            className={`p-2 rounded-xl transition-all border ${DB.getSettings().isCreateRoomLocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
                            title={DB.getSettings().isCreateRoomLocked ? 'فتح إنشاء روم' : 'قفل إنشاء روم'}
                        >
                            {DB.getSettings().isCreateRoomLocked ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                        {rooms.length > 0 && (
                            <button onClick={handleDeleteAllRooms} className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl group transition-all border border-transparent hover:border-red-500/20" title="حذف جميع الرومات">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                    {rooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 opacity-40">
                            <Users size={40} className="mb-4 text-gray-400" />
                            <p className="font-bold text-sm text-center">لا توجد رومات مسجلة حالياً</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <button
                                key={room.id}
                                onClick={() => setActiveRoomId(room.id)}
                                className={`w-full text-right p-4 rounded-2xl flex items-center justify-between gap-3 transition-all ${activeRoomId === room.id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                            >
                                <div className="flex flex-col overflow-hidden w-full">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-10 h-10 shrink-0 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center relative">
                                            {room.avatarUrl ? <img src={room.avatarUrl} className="w-full h-full object-cover" /> : <Users size={20} className="text-gray-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-[14px] text-white truncate">{room.name}</h3>
                                            <p className="text-[11px] text-gray-400 font-bold mt-1 max-w-full">
                                                الأعضاء: {room.members.length} • طلبات معلقة: {room.pendingRequests.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Room View */}
            <div className={`w-full md:w-2/3 bg-[#02040a] flex flex-col relative ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
                {!activeRoom ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 h-full p-6 text-center">
                        <Users size={80} className="mb-6 text-emerald-500 opacity-50" />
                        <h2 className="text-2xl font-black text-white mb-2">إدارة رومات المجموعات</h2>
                        <p className="text-sm font-bold max-w-sm leading-relaxed">اختر الروم من القائمة الجانبية لقراءة رسائلها وإدارتها والتحكم بها كمشرف أعلى.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-white/5 bg-[#050811] flex items-center justify-between z-10 shadow-md">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveRoomId(null)} className="md:hidden p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                    <ArrowRight size={20} />
                                </button>
                                <div className="w-10 h-10 shrink-0 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center">
                                    {activeRoom.avatarUrl ? <img src={activeRoom.avatarUrl} className="w-full h-full object-cover" /> : <Users size={20} className="text-gray-400" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">
                                        {activeRoom.name}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 font-bold max-w-xs truncate">تاريخ الإنشاء: {new Date(activeRoom.createdAt).toLocaleDateString('ar-EG')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteRoom(activeRoom.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded-xl text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                            >
                                <Trash2 size={14} /> مسح الروم نهائياً
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 p-4 bg-emerald-500/5 border-b border-emerald-500/10 text-emerald-400/80 text-[11px] font-bold text-center">
                            أنت تشاهد الرسائل والمحتويات بصفة مراقب (آدمن)، يمكنك مسح أي رسالة ترى أنها غير لائقة.
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                            {activeRoomMessages.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 font-bold text-sm">
                                    الروم لا تحتوي على أي رسائل للآن.
                                </div>
                            ) : (
                                activeRoomMessages.map((msg) => {
                                    return (
                                        <div key={msg.id} className="flex flex-col w-full items-start group relative">
                                            <div className="text-[10px] text-gray-500 font-bold mb-1 px-2 flex items-center gap-1 mt-2">
                                                {msg.senderId}
                                            </div>
                                            <div className={`relative max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl ${msg.isDeletedForEveryone ? 'bg-red-500/10 border-red-500/30' : 'bg-[#202c33] border-white/5 shadow'} border`}>
                                                <p className={`text-[13px] font-bold ${msg.isDeletedForEveryone ? 'text-red-400 italic' : 'text-gray-200'} whitespace-pre-wrap break-words leading-relaxed`}>
                                                    {msg.isDeletedForEveryone ? '🚫 تم حذف الرسالة' : msg.text}
                                                </p>

                                                <div className="flex items-center justify-between mt-2 gap-4">
                                                    <span className="text-[9px] text-gray-500 font-black">
                                                        {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.timestamp).toLocaleDateString('ar-EG')}
                                                    </span>
                                                    {!msg.isDeletedForEveryone && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg absolute -right-10 bottom-1"
                                                            title="حذف هذه الرسالة نهائياً للجميع"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
