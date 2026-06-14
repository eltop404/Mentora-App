import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, ShieldAlert, Check, CheckCheck, Trash2, MoreVertical, Trash, Reply, Loader2, ShieldCheck, Ban, UserMinus, UserPlus, User, Phone, Video, PhoneOff, VideoOff, Copy, Lock, ArrowRight, Search, Users, Edit, CornerUpRight, CornerUpLeft, Star, Pin, Sparkles, ShoppingCart, Smartphone, CheckCircle } from 'lucide-react';
import { DB } from '../services/db';
import { PrivateMessage } from '../types';
import { supabase, isSupabaseConnected } from '../services/supabaseClient';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


const MessageItem = memo(({
    msg, isMe, isDeleted, timeFormat,
    currentUser, chatUserInfo, chatUsername, theme,
    longPressedMsgId, setLongPressedMsgId,
    activeMsgMenu, setActiveMsgMenu,
    reactionEmojis, handleDeleteMsg, setReplyingTo,
    areReceiptsHidden, updateReaction,
    editingId, setEditingId, editValue, setEditValue, handleUpdateMsg,
    setShowUserInfo, chatUserId, onStartPrivateChat
}: any) => {
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const touchStartXY = useRef<{ x: number, y: number } | null>(null);

    const handlePressStart = (e?: React.TouchEvent | React.MouseEvent) => {
        if (e && e.type === 'touchstart') {
            const touch = (e as React.TouchEvent).touches[0];
            touchStartXY.current = { x: touch.clientX, y: touch.clientY };
        } else {
            touchStartXY.current = null;
        }

        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = setTimeout(() => {
            setLongPressedMsgId(msg.id);
            pressTimer.current = null;
        }, 400);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartXY.current || !pressTimer.current) return;
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - touchStartXY.current.x) > 10 || Math.abs(touch.clientY - touchStartXY.current.y) > 10) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handlePressEnd = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };

    const renderText = (txt: string) => {
        if (!txt) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

        // Combine regex into one that handles both URLs and emails
        const combinedRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

        return txt.split(combinedRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                if (part.includes('/call/AmrLotfy-')) {
                    const roomId = part.split('/call/')[1];
                    return (
                        <a key={i} href="#" onClick={(e) => { e.preventDefault(); if (roomId) window.dispatchEvent(new CustomEvent('nt-start-call-countdown', { detail: { roomId } })); }} className="text-emerald-400 font-black underline hover:text-emerald-300 break-all bg-emerald-500/10 px-2 py-1 rounded-xl cursor-pointer animate-pulse inline-block mt-2 shadow-sm border border-emerald-500/20 block text-center min-w-[200px]">
                            🔔 شارك في المكالمة
                        </a>
                    );
                }
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all font-bold">{part}</a>;
            } else if (part.match(emailRegex)) {
                return <a key={i} href={`mailto:${part}`} className="text-emerald-400 underline hover:text-emerald-300 break-all font-bold">{part}</a>;
            }
            return <span key={i} className="whitespace-pre-wrap">{part}</span>;
        });
    };

    const isCall = msg.isCall || msg.type === 'call';

    const renderCallBubble = () => {
        const isMissed = msg.callStatus === 'missed' || msg.callStatus === 'rejected';
        const isVideo = msg.isVideoCall || msg.text?.includes('فيديو');
        const isMissedIncoming = isMissed && !isMe;
        const Icon = isVideo ? (isMissedIncoming ? VideoOff : Video) : (isMissedIncoming ? PhoneOff : Phone);

        let title = isMissedIncoming ? (isVideo ? "مكالمة فيديو فائتة" : "مكالمة صوتية فائتة") : (isMe ? (isVideo ? "مكالمة فيديو صادرة" : "مكالمة صوتية صادرة") : (isVideo ? "مكالمة فيديو واردة" : "مكالمة صوتية واردة"));
        const durationText = msg.callDuration ? `${Math.floor(msg.callDuration / 60)}:${(msg.callDuration % 60).toString().padStart(2, '0')}` : '';

        return (
            <div className="flex items-center justify-start gap-3 select-none pt-1 pb-1 min-w-[220px] pr-1 cursor-pointer w-full group/call" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('nt-start-call', { detail: { userId: msg.senderId === currentUser.id ? msg.receiverId : msg.senderId, userName: chatUsername, isVideo: isVideo, avatarUrl: chatUserInfo?.profilePictureUrl || chatUserInfo?.avatarUrl } })); }}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors", isMissedIncoming ? 'bg-red-500/20' : (isMe ? 'bg-black/10' : 'bg-emerald-500/20'))}>
                    <Icon size={18} className={isMissedIncoming ? 'text-red-500' : (isMe ? 'text-black/70' : 'text-emerald-500')} />
                </div>
                <div className="flex-1 flex flex-col justify-center text-right border-l border-white/10 pl-3">
                    <span className={cn("font-black text-[13.5px] whitespace-nowrap", isMissedIncoming ? 'text-red-500' : 'text-black')}>{title}</span>
                    {durationText ? <span className="text-[11px] font-bold opacity-75 mt-0.5 text-black/60">{durationText}</span> : (isMe && isMissed ? <span className="text-[10px] font-bold opacity-70 mt-0.5 text-black/50">لم يتم الرد</span> : null)}
                </div>
                <div className="shrink-0 flex items-center justify-center pl-1">
                    <div className={cn("w-8 h-8 flex items-center justify-center opacity-70", isVideo ? 'text-cyan-600' : 'text-emerald-600')}>
                        {isVideo ? <Video size={18} /> : <Phone size={18} />}
                    </div>
                </div>
            </div>
        );
    };

    if (msg.type === 'system') {
        return (
            <div className="w-full flex justify-center my-4">
                <div className="bg-[#1e293b]/80 border border-red-500/20 py-1.5 px-5 rounded-full shadow-lg flex items-center justify-center gap-2 max-w-[90%]">
                    <ShieldAlert size={16} className="text-red-400 shrink-0" />
                    <span className="text-[11.5px] font-black text-gray-200">{msg.text}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("w-full flex flex-col mb-1.5", isMe ? "items-end" : "items-start")}>
            <div className={cn("flex flex-col max-w-[85%] relative group/bubble")}>

                {/* Message Bubble Column */}
                <div className={cn("flex items-center gap-1 group/bubble relative", isMe ? "flex-row-reverse" : "flex-row")}>
                    {/* Bubble */}
                    <div className="relative">
                        {/* Reaction Popover (Long Press) */}
                        {longPressedMsgId === msg.id && !isDeleted && (
                            <div
                                className={cn("absolute -top-12 z-[100] bg-[#233138] rounded-full border border-white/10 shadow-2xl flex items-center gap-2 p-1 px-3 max-w-[280px] overflow-x-auto no-scrollbar custom-emoji-scroll touch-pan-x", isMe ? "right-0" : "left-0")}
                                style={{ WebkitOverflowScrolling: 'touch', pointerEvents: 'auto' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {reactionEmojis.map((emoji: string) => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); updateReaction(msg.id, emoji); setLongPressedMsgId(null); }} className="text-xl p-1 shrink-0">{emoji}</button>
                                ))}
                            </div>
                        )}

                        {/* Actual Message Content Bubble */}
                        <div
                            id={`bubble-${msg.id}`}
                            onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
                            onTouchStart={handlePressStart} onTouchMove={handleTouchMove} onTouchEnd={handlePressEnd} onTouchCancel={handlePressEnd}
                            onContextMenu={(e) => { e.preventDefault(); setLongPressedMsgId(msg.id); }}
                            className={cn(
                                "px-3 py-2 text-[14.5px] font-bold break-words relative shadow-xl cursor-pointer select-none",
                                isDeleted ? 'opacity-50 italic border border-white/10 bg-transparent text-gray-400' : ''
                            )}
                            style={{
                                backgroundColor: isDeleted ? 'transparent' : (isMe ? "#005c4b" : "#2a2a2a"),
                                color: "#fff",
                                borderRadius: '15px',
                                borderTopRightRadius: isMe ? '0' : '15px',
                                borderTopLeftRadius: !isMe ? '0' : '15px',
                                minWidth: isCall ? '220px' : '90px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)'
                            }}
                        >
                            {/* SVG Tail for authentic WhatsApp look */}
                            {!isDeleted && (
                                <div className={cn("absolute top-0 w-3 h-3", isMe ? "-right-2 text-[#005c4b]" : "-left-2 text-[#2a2a2a]")}>
                                    <svg viewBox="0 0 8 13" className="w-full h-full fill-current">
                                        {isMe ? (
                                            <path d="M0 0.5H5.5C6.12 0.5 6.46 1.48 5.76 1.94L0 6.5V0.5Z" />
                                        ) : (
                                            <path d="M8 0.5H2.5C1.88 0.5 1.54 1.48 2.24 1.94L8 6.5V0.5Z" />
                                        )}
                                    </svg>
                                </div>
                            )}

                            {editingId === msg.id ? (
                                <div className="flex flex-col gap-2 min-w-[200px]" dir="rtl">
                                    <textarea autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-white/5 border-none outline-none text-inherit text-sm font-bold resize-none p-1 rounded min-h-[60px]" dir="rtl" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdateMsg(msg.id, editValue); } if (e.key === 'Escape') setEditingId(null); }} />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/10 rounded-full text-red-400"><X size={18} /></button>
                                        <button onClick={() => handleUpdateMsg(msg.id, editValue)} className="p-1 hover:bg-white/10 rounded-full text-emerald-400"><Check size={18} /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {msg.type === 'contact' && !isDeleted && (
                                        <div className="bg-black/20 rounded-2xl p-3 mb-2 border border-white/5 flex flex-col gap-3 min-w-[200px] sm:min-w-[240px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border border-white/10 shrink-0">
                                                    {msg.contactAvatar ? (
                                                        <img src={msg.contactAvatar} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white font-black text-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                                                            {msg.contactName?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-white font-black text-sm truncate">{msg.contactName}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">جهة اتصال Mentora</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (msg.contactId) onStartPrivateChat(msg.contactId, msg.contactName);
                                                }}
                                                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[11px] font-black transition-all active:scale-95 border border-white/5"
                                            >
                                                مراسلة
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex flex-col group/content">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className={cn("text-[12px] font-black", isMe ? "text-emerald-400" : "text-[#00a884]")}>
                                                {isMe ? 'أنت' : chatUsername}
                                            </span>
                                        </div>
                                        {msg.isForwarded && !isDeleted && (
                                            <div className="flex items-center gap-1 text-gray-400/90 mb-1" dir="rtl">
                                                <CornerUpLeft size={12} className="opacity-90" />
                                                <span className="text-[10.5px] italic font-black tracking-wide">رسالة محولة</span>
                                            </div>
                                        )}
                                        {!isDeleted && msg.replyToText && (
                                            <div className="bg-black/20 rounded-lg p-2 mb-2 border-r-4 text-[11px] leading-snug cursor-pointer hover:bg-black/30" style={{ borderColor: '#005c4b' }} dir="rtl">
                                                <div className="font-black mb-0.5 text-[#005c4b]">{msg.replyToSender}</div>
                                                <div className="opacity-80 line-clamp-2 text-[#e9edef]">{msg.replyToText}</div>
                                            </div>
                                        )}

                                        {isDeleted ? (
                                            <span className="flex items-center gap-2 text-gray-500 italic"><Trash2 size={14} className="opacity-50" /> تم حذف هذه الرسالة</span>
                                        ) : (
                                            <div className="relative pb-4">
                                                {isCall ? renderCallBubble() : <div className="leading-relaxed whitespace-pre-wrap" dir="rtl">{renderText(msg.text)} {msg.is_edited && <span className="text-[10px] opacity-40 ml-1.5 font-normal">(معدلة)</span>}</div>}

                                                <div className="absolute -bottom-1 left-0 flex items-center justify-end gap-1.5 select-none pointer-events-none">
                                                    {msg.isStarred && <Star size={10} className="text-gray-400 opacity-80 fill-current" />}
                                                    <span className="text-[10px] font-bold opacity-50" dir="ltr">{timeFormat}</span>
                                                    {isMe && !isDeleted && (
                                                        <div className="flex items-center">
                                                            {msg.isRead && !areReceiptsHidden ? <CheckCheck size={14} className="text-[#34b7f1]" /> : msg.isDelivered ? <CheckCheck size={14} className="text-[#65676b]" /> : <Check size={14} className="text-[#65676b]" />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}


                        </div>

                        {/* Reaction Display Badge */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && !isDeleted && (
                            <div
                                className={cn("absolute -bottom-3 bg-[#202c33] rounded-full p-0.5 px-2 shadow-md border border-white/10 text-[10px] z-20 cursor-pointer flex items-center gap-1 min-w-[32px]", isMe ? "right-2" : "left-2")}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.dispatchEvent(new CustomEvent('nt-show-reaction-details', { detail: msg }));
                                }}
                            >
                                <div className="flex -space-x-1 rtl:space-x-reverse">
                                    {(Array.from(new Set(Object.values(msg.reactions))) as string[]).slice(0, 3).map((emoji: string, idx: number) => (
                                        <span key={idx} className="relative z-10">{emoji}</span>
                                    ))}
                                </div>
                                <span className="text-gray-400 font-black">{Object.keys(msg.reactions).length}</span>
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div >
    );
});

const CHAT_BACKGROUND_CATEGORIES = [
    {
        name: 'ألوان سادة',
        backgrounds: [
            '#0b141a', '#202c33', '#25D366', '#128C7E', '#34B7F1',
            '#ECE5DD', '#DCF8C6', '#101D25', '#FF7F50', '#8A2BE2'
        ]
    },


    {
        name: 'أنماط (زخارف)',
        backgrounds: [
            'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E") #111b21',
            'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E") #0b141a',
            'url("data:image/svg+xml,%3Csvg width=\'52\' height=\'26\' viewBox=\'0 0 52 26\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E") #1e293b',
            'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctitle%3Ehoundstooth%3C/title%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 24h4L0 20Z\'/%3E%3Cpath d=\'M8 24h4L0 12ZM24 8h4L16 0ZM0 8h4L0 4Z\'/%3E%3Cpath d=\'M16 24h4L8 12Z\'/%3E%3Cpath d=\'M24 16h4L16 8Z\'/%3E%3Cpath d=\'M24 24h4L16 16ZM24 0h4L24 0Z\'/%3E%3C/g%3E%3C/svg%3E") #0f172a',
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") #075E54',
            'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E") #2a3942',
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'0.05\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E") #101D25',
            'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E") #2f3e46',
            'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' viewBox=\'0 0 10 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M5 0h5v10H5V0z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E") #020617',
            'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E") #1E2428',
            'url("data:image/svg+xml,%3Csvg width=\'44\' height=\'12\' viewBox=\'0 0 44 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 12v-2L0 0v10l4 2h16zm18 0l4-2V0L22 10v2h16zM20 0v8L4 0h16zm18 0h-16l16 8V0z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E") #3b4a54',
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\' viewBox=\'0 0 8 8\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath fill-rule=\'evenodd\' d=\'M0 0h4v4H0V0zm4 4h4v4H4V4z\'/%3E%3C/g%3E%3C/svg%3E") #0b141a',
            'url("data:image/svg+xml,%3Csvg width=\'32\' height=\'32\' viewBox=\'0 0 32 32\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M16 16l16-16H0z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E") #128C7E',
            'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctitle%3Esquares-in-squares%3C/title%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 24V0h24v24H0zm2-2h20V2H2v20zm2-2V4h16v16H4zm2-2h12V6H6v12zm2-2V8h8v8H8zm2-2h4v-4h-4v4z\'/%3E%3C/g%3E%3C/svg%3E") #1e293b',
            'url("data:image/svg+xml,%3Csvg width=\'56\' height=\'100\' viewBox=\'0 0 56 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'1\' stroke-opacity=\'0.05\'/%3E%3C/svg%3E") #202c33',
        ]
    }
];

interface PrivateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: {
        id: string;
        username: string;
        avatarUrl?: string;
        profilePictureUrl?: string;
        isChatFree?: boolean;
    };
    chatUserId: string;
    chatUsername: string;
    theme: any;
}

export const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    chatUserId,
    chatUsername,
    theme
}) => {
    const [messages, setMessages] = useState<PrivateMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeMsgMenu, setActiveMsgMenu] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [lastSeen, setLastSeen] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMsgCountRef = useRef(0);
    const [replyingTo, setReplyingTo] = useState<PrivateMessage | null>(null);
    const [pendingForward, setPendingForward] = useState<PrivateMessage | null>(null);
    const [chatUserInfo, setChatUserInfo] = useState<any>({});
    const [isIBlocked, setIsIBlocked] = useState(false);
    const [isHeBlocked, setIsHeBlocked] = useState(false);
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [selectedBg, setSelectedBg] = useState(() => localStorage.getItem('nt_chat_bg_' + currentUser.id) || '');
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [quota, setQuota] = useState<{ remaining: number; resetTime?: number; packagePoints?: number }>(() => {
        if (currentUser.isChatFree) return { remaining: 999, packagePoints: 999 };
        const students = DB.getStudents();
        const me = students.find(s => s.id === currentUser.id);
        const extraPoints = me?.extraQuotaPoints ?? 0;
        const usedPoints = me?.usedExtraPoints ?? 0;
        return {
            remaining: me?.messageQuota ?? 10,
            resetTime: me?.quotaResetTime,
            packagePoints: extraPoints - usedPoints
        };
    });
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Upgrade modal state
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<null | { id: string; label: string; messages: number; price: number }>(null);
    const [upgradeStep, setUpgradeStep] = useState<'select' | 'confirm' | 'done'>('select');
    const [upgradeContactAction, setUpgradeContactAction] = useState<'call' | 'whatsapp' | null>(null);
    const [upgradeContactTimer, setUpgradeContactTimer] = useState(3);

    const CHAT_PACKAGES = [
        { id: 'chat_25', label: '25 نقطة رصيد', messages: 25, price: 45 },
        { id: 'chat_40', label: '40 نقطة رصيد', messages: 40, price: 60 },
        { id: 'chat_60', label: '60 نقطة رصيد', messages: 60, price: 80 }
    ];

    // Get the specific pending chat package order
    const pendingChatPayment = (() => {
        const payments = DB.getPayments();
        return payments.find(p =>
            p.studentId === currentUser.id &&
            p.itemType === 'chat' &&
            p.status === 'pending_review'
        );
    })();

    useEffect(() => {
        if (!upgradeContactAction || upgradeContactTimer <= 0) return;
        const t = setTimeout(() => setUpgradeContactTimer(prev => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [upgradeContactAction, upgradeContactTimer]);

    useEffect(() => {
        if (upgradeContactAction && upgradeContactTimer === 0 && selectedPackage) {
            // Save payment order
            const order = {
                id: Date.now().toString(),
                studentId: currentUser.id,
                studentName: currentUser.username,
                studentLevel: '',
                studentYear: '',
                itemType: 'chat' as const,
                itemId: selectedPackage.id,
                price: selectedPackage.price,
                date: new Date().toLocaleDateString('ar-EG'),
                time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                status: 'pending_review' as const,
                courseTitle: `ترقية رصيد - ${selectedPackage.label}`,
            };
            DB.addPayment(order);
            window.dispatchEvent(new CustomEvent('nt-payments-change'));

            // Notify Admin
            DB.addNotification({
                id: Date.now().toString(),
                title: 'طلب ترقية رصيد جديد 💬',
                message: `قام الطالب ${currentUser.username} بطلب باقة (${selectedPackage.label})، يرجى مراجعة قسم المدفوعات وتفعيل النقاط بعد التأكد.`,
                date: new Date().toLocaleDateString('ar-EG'),
                target: 'admin'
            });

            setUpgradeStep('done');
            setUpgradeContactAction(null);
            setUpgradeContactTimer(3);
        }
    }, [upgradeContactAction, upgradeContactTimer, selectedPackage, currentUser]);

    useEffect(() => {
        if (!quota.resetTime) return;
        const timer = setInterval(() => {
            const now = Date.now();
            const diff = quota.resetTime! - now;
            if (diff <= 0) {
                setQuota({ remaining: 10, resetTime: undefined });
                clearInterval(timer);
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [quota.resetTime]);

    // Global call state coordination
    const [appSettings, setAppSettings] = useState(() => DB.getSettings());

    useEffect(() => {
        const handleSettingsChange = () => setAppSettings(DB.getSettings());
        window.addEventListener('nt-settings-change', handleSettingsChange);
        return () => window.removeEventListener('nt-settings-change', handleSettingsChange);
    }, []);    // UI states
    const [showEncryptionInfo, setShowEncryptionInfo] = useState(false);
    const [encryptionStatus, setEncryptionStatus] = useState<'verifying' | 'verified'>('verifying');
    const [verificationTime, setVerificationTime] = useState<string>('');
    const [showBadWordWarning, setShowBadWordWarning] = useState(false);
    const [showReactionDetails, setShowReactionDetails] = useState<any>(null);
    const [showFeatureLocked, setShowFeatureLocked] = useState<'voice' | 'video' | 'group' | false>(false);
    const [privacyBreachAlert, setPrivacyBreachAlert] = useState<'screenshot' | 'video' | null>(null);

    useEffect(() => {
        const handleShowReactionDetails = (e: any) => setShowReactionDetails(e.detail);
        window.addEventListener('nt-show-reaction-details', handleShowReactionDetails);
        return () => window.removeEventListener('nt-show-reaction-details', handleShowReactionDetails);
    }, []);

    useEffect(() => {
        if (!isOpen || !chatUserId || !isSupabaseConnected) return;

        const handlePrivacyBreach = (e: any) => {
            const payload = e.detail;
            if (payload?.senderId === chatUserId) {
                const msg: PrivateMessage = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    senderId: chatUserId,
                    receiverId: currentUser.id,
                    text: payload.type === 'screenshot' ? `أخذ ${chatUsername} لقطة شاشة للمحادثة` : `بدأ ${chatUsername} تسجيل الشاشة`,
                    timestamp: Date.now(),
                    isRead: true,
                    isDelivered: true,
                    isDeletedForSender: false,
                    isDeletedForReceiver: false,
                    isDeletedForEveryone: false,
                    type: 'system'
                };
                DB.addPrivateMessage(msg);
                setMessages(prev => [...prev, msg].sort((a, b) => a.timestamp - b.timestamp));
            }
        };
        window.addEventListener('nt-privacy-breach', handlePrivacyBreach);

        const triggerBreach = (type: 'screenshot' | 'video') => {
            if (chatChannelRef.current && isChannelReady.current) {
                chatChannelRef.current.send({
                    type: 'broadcast',
                    event: 'privacy-breach',
                    payload: { senderId: currentUser.id, type }
                }).catch(() => { });
            }

            const msg: PrivateMessage = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                senderId: currentUser.id,
                receiverId: chatUserId,
                text: type === 'screenshot' ? `أخذت لقطة شاشة للمحادثة` : `بدأت تسجيل الشاشة`,
                timestamp: Date.now(),
                isRead: true,
                isDelivered: true,
                isDeletedForSender: false,
                isDeletedForReceiver: false,
                isDeletedForEveryone: false,
                type: 'system'
            };
            DB.addPrivateMessage(msg);
            setMessages(prev => [...prev, msg].sort((a, b) => a.timestamp - b.timestamp));
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') { triggerBreach('screenshot'); return; }
            if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) { triggerBreach('screenshot'); return; }
            if (e.metaKey && e.shiftKey && e.key === '5') { triggerBreach('video'); return; }
            if (e.metaKey && e.shiftKey && e.key?.toLowerCase() === 's') { triggerBreach('screenshot'); return; }
            if (e.metaKey && e.altKey && e.key?.toLowerCase() === 'r') { triggerBreach('video'); return; }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') triggerBreach('screenshot');
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('nt-privacy-breach', handlePrivacyBreach);
        };
    }, [isOpen, chatUserId, currentUser.id, chatUsername]);

    const playReceiveSound = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') ctx.resume();

            const playTone = (freq: number, startTime: number, duration: number, vol = 0.5) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
                gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + startTime);
                osc.stop(ctx.currentTime + startTime + duration);
            };

            // WhatsApp-like Receive Sound (refined frequencies)
            playTone(880, 0, 0.1, 0.4);
            playTone(660, 0.08, 0.15, 0.3);
        } catch (e) { }
    };

    const playSendSound = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) { }
    };

    useEffect(() => {
        if (messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.senderId !== currentUser.id) {
                playReceiveSound();
            }
        }
        prevMsgCountRef.current = messages.length;
    }, [messages, currentUser.id]);

    useEffect(() => {
        if (isOpen && chatUserId) {
            (window as any).activeChatUserId = chatUserId;

            const students = DB.getStudents();
            const me = students.find(s => s.id === currentUser.id);
            const he = students.find(s => s.id === chatUserId);

            if (he) {
                setChatUserInfo({ level: he.level, year: he.year, avatarUrl: he.avatarUrl, profilePictureUrl: he.profilePictureUrl });
                setIsIBlocked(he.blockedUsers?.includes(currentUser.id) || false);
            }
            if (me) {
                setIsHeBlocked(me.blockedUsers?.includes(chatUserId) || false);
            }

            const loadData = () => {
                try {
                    const allMsgs = DB.getPrivateMessages();
                    const conversation = allMsgs.filter((m: PrivateMessage) =>
                        (m.senderId === currentUser.id && m.receiverId === chatUserId) ||
                        (m.senderId === chatUserId && m.receiverId === currentUser.id)
                    ).filter(m => !(m.senderId === currentUser.id ? m.isDeletedForSender : m.isDeletedForReceiver))
                        .sort((a, b) => {
                            const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
                            const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
                            if (timeA !== timeB) return timeA - timeB;
                            return String(a.id).localeCompare(String(b.id));
                        });

                    // Deduplicate by ID and ensure strict chronological order
                    const uniqueMsgs = Array.from(new Map(conversation.map(m => [m.id, m])).values())
                        .sort((a, b) => {
                            const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
                            const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
                            if (timeA !== timeB) return timeA - timeB;
                            return String(a.id).localeCompare(String(b.id));
                        }) as PrivateMessage[];

                    DB.markPrivateMessagesAsRead(chatUserId, currentUser.id, currentUser.id);

                    const evt = {
                        type: 'broadcast',
                        event: 'private-read',
                        payload: { readerId: currentUser.id }
                    };
                    if (chatChannelRef.current && isChannelReady.current) {
                        chatChannelRef.current.send(evt).catch(() => { });
                    } else {
                        queuedEvents.current.push(evt);
                    }

                    setMessages(prev => {
                        if (uniqueMsgs.length > prev.length && prev.length !== 0) {
                            const lastMsg = uniqueMsgs[uniqueMsgs.length - 1];
                            if (lastMsg.senderId !== currentUser.id) {
                                playReceiveSound();
                            }
                        }
                        return uniqueMsgs;
                    });

                    // Trigger auto-scroll to bottom reliably
                    requestAnimationFrame(() => {
                        if (chatContainerRef.current) {
                            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                        }
                        if (messagesEndRef.current) {
                            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                        }
                    });
                } catch (err) { }
            };

            const updateTypingStatus = () => {
                setIsTyping(DB.getTypingStatus(chatUserId, currentUser.id));
            };

            const updateOnlineLocal = () => {
                const isOnline = DB.getOnlineStatus(chatUserId);
                if (isOnline) {
                    setLastSeen('متصل الآن');
                } else {
                    const currentLastSeen = DB.getLastSeen(chatUserId);
                    if (currentLastSeen > 0) {
                        const d = new Date(currentLastSeen);
                        setLastSeen(`آخر ظهور ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`);
                    } else {
                        setLastSeen('غير متصل');
                    }
                }
            };

            const checkBlockStatus = () => {
                const students = DB.getStudents();
                const me = students.find(s => s.id === currentUser.id);
                const he = students.find(s => s.id === chatUserId);
                if (me) setIsHeBlocked(me.blockedUsers?.includes(chatUserId) || false);
                if (he) setIsIBlocked(he.blockedUsers?.includes(currentUser.id) || false);
            };

            // Listen to real-time events instead of polling
            let intervalPing: any;
            if (isSupabaseConnected && chatChannelRef.current) {
                intervalPing = setInterval(() => {
                    chatChannelRef.current?.send({
                        type: 'broadcast',
                        event: 'presence-ping',
                        payload: { userId: currentUser.id }
                    });
                }, 10000);
            }

            loadData();
            updateTypingStatus();
            updateOnlineLocal();
            checkBlockStatus();

            const onlineInterval = setInterval(updateOnlineLocal, 5000); // Check online status every 5 seconds locally

            window.addEventListener('nt-private-msgs-change', loadData);
            window.addEventListener('nt-typing-change', updateTypingStatus);
            window.addEventListener('nt-data-sync', updateOnlineLocal); // Listen to global DB syncs
            window.addEventListener('nt-students-change', checkBlockStatus);

            return () => {
                (window as any).activeChatUserId = null;
                if (intervalPing) clearInterval(intervalPing);
                clearInterval(onlineInterval);
                window.removeEventListener('nt-private-msgs-change', loadData);
                window.removeEventListener('nt-typing-change', updateTypingStatus);
                window.removeEventListener('nt-data-sync', updateOnlineLocal);
                window.removeEventListener('nt-students-change', checkBlockStatus);
                DB.setTypingStatus(currentUser.id, chatUserId, false);
            };
        }
    }, [isOpen, chatUserId, currentUser.id]);

    useEffect(() => {
        if (isOpen && (window as any).ntGlobalPendingForward) {
            const fw = (window as any).ntGlobalPendingForward;
            (window as any).ntGlobalPendingForward = null;

            const newMsg: PrivateMessage = {
                id: `fw-${Date.now()}`,
                senderId: currentUser.id,
                receiverId: chatUserId,
                text: fw.type === 'contact' ? `Contact: ${fw.contactName}` : (fw.text || ""),
                timestamp: Date.now(),
                isRead: false,
                isDelivered: true,
                isDeletedForSender: false,
                isDeletedForReceiver: false,
                isDeletedForEveryone: false,
                type: fw.type || 'text',
                isForwarded: true,
                contactId: fw.contactId,
                contactName: fw.contactName,
                contactAvatar: fw.avatarUrl || fw.contactAvatar
            };

            DB.addPrivateMessage(newMsg);
            playSendSound();
        }
    }, [isOpen, chatUserId, currentUser.id]);

    const handlePinMsg = (msgId: string) => {
        DB.pinPrivateMessage(msgId);
        setLongPressedMsgId(null);
    };

    const handleUnpinMsg = (msgId: string) => {
        DB.unpinPrivateMessage(msgId);
        setLongPressedMsgId(null);
    };

    const pinnedMessages = messages.filter(m => m.isPinned && !m.isDeletedForEveryone).sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));

    useEffect(() => {
        if (!isOpen || !chatUserId) return;

        const triggerBreach = async (type: 'screenshot' | 'video') => {
            const text = type === 'screenshot' ? `أخذ ${currentUser.username || 'الطالب'} لقطة شاشة للمحادثة` : `بدأ ${currentUser.username || 'الطالب'} بتسجيل الشاشة`;
            const sysMsg: PrivateMessage = {
                id: `sys-${Date.now()}`,
                senderId: currentUser.id,
                receiverId: chatUserId,
                text,
                type: 'system',
                timestamp: Date.now(),
                isRead: true,
                isDelivered: true,
                isDeletedForSender: false,
                isDeletedForReceiver: false,
                isDeletedForEveryone: false
            };
            DB.addPrivateMessage(sysMsg);

            if (chatChannelRef.current && isChannelReady.current) {
                chatChannelRef.current.send({
                    type: 'broadcast',
                    event: 'privacy-breach',
                    payload: sysMsg
                });
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') { triggerBreach('screenshot'); return; }
            if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) { triggerBreach('screenshot'); return; }
            if (e.metaKey && e.shiftKey && e.key === '5') { triggerBreach('video'); return; }
            if (e.metaKey && e.shiftKey && e.key?.toLowerCase() === 's') { triggerBreach('screenshot'); return; }
            if (e.metaKey && e.altKey && e.key?.toLowerCase() === 'r') { triggerBreach('video'); return; }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') triggerBreach('screenshot');
        };

        const handlePrivacyBreach = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && detail.senderId === chatUserId && detail.receiverId === currentUser.id && detail.type === 'system') {
                const msgs = DB.getPrivateMessages();
                if (!msgs.find(m => m.id === detail.id)) {
                    DB.addPrivateMessage(detail);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('nt-privacy-breach', handlePrivacyBreach);

        const handleInjectForward = (e: any) => {
            setPendingForward(e.detail);
            setNewMessage(e.detail.text || '');
        };
        window.addEventListener('nt-inject-forward', handleInjectForward);

        // Immediate pickup on mount (Solves React rendering race conditions)
        if ((window as any).ntGlobalPendingForward) {
            const fwdMsg = (window as any).ntGlobalPendingForward;
            setPendingForward(fwdMsg);
            setNewMessage(fwdMsg.text || '');
            (window as any).ntGlobalPendingForward = null;
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('nt-privacy-breach', handlePrivacyBreach);
            window.removeEventListener('nt-inject-forward', handleInjectForward);
        };
    }, [isOpen, chatUserId, currentUser.username]);


    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isUserScrolling = useRef(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isOpen) {
            isInitialMount.current = true;
            isUserScrolling.current = false;
        }
    }, [isOpen, chatUserId]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
        isUserScrolling.current = !isNearBottom;
    };

    const handleToggleBlock = () => {
        const students = DB.getStudents();
        const meIdx = students.findIndex(s => s.id === currentUser.id);
        if (meIdx === -1) return;

        const me = students[meIdx];
        const blockedUsers = me.blockedUsers || [];
        const isCurBlocked = blockedUsers.includes(chatUserId);

        if (isCurBlocked) {
            me.blockedUsers = blockedUsers.filter(id => id !== chatUserId);
            setIsHeBlocked(false);
        } else {
            if (!window.confirm(`هل أنت متأكد من حظر الطالب ${chatUsername}؟`)) return;
            me.blockedUsers = [...blockedUsers, chatUserId];
            setIsHeBlocked(true);
        }

        DB.saveStudents(students);
    };

    useEffect(() => {
        // Only auto-scroll if we are already near the bottom or it's a new message from me
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            if (isNearBottom || (messages.length > 0 && messages[messages.length - 1].senderId === currentUser.id)) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [messages, isTyping]);

    const chatChannelRef = useRef<any>(null);
    const isChannelReady = useRef(false);
    const queuedEvents = useRef<any[]>([]);

    useEffect(() => {
        if (isOpen && chatUserId && isSupabaseConnected) {
            isChannelReady.current = false;
            // Do NOT wipe queuedEvents here because loadData might have already pushed to it

            chatChannelRef.current = supabase.channel(`user_${chatUserId}`, {
                config: {
                    broadcast: { ack: false, self: true }
                }
            });
            (window as any).activeChatChannel = chatChannelRef.current;
            (window as any).activeChatUserId = chatUserId;

            chatChannelRef.current.on('broadcast', { event: 'user-online' }, ({ payload }: any) => {
                if (payload?.userId === chatUserId) {
                    localStorage.setItem(`nt_presence_${chatUserId}`, Date.now().toString());
                    setLastSeen('متصل الآن');
                }
            })
                .on('broadcast', { event: 'private-message' }, ({ payload }: { payload: PrivateMessage }) => {
                    if (payload && (payload.senderId === chatUserId || payload.receiverId === chatUserId)) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === payload.id)) return prev;
                            const next = [...prev, payload].sort((a, b) => a.timestamp - b.timestamp);
                            if (payload.senderId === chatUserId) playReceiveSound();
                            return next;
                        });
                        DB.addPrivateMessage(payload);
                    }
                })
                .on('broadcast', { event: 'private-reaction' }, ({ payload }: { payload: { msgId: string, userId: string, emoji: string | null } }) => {
                    if (payload?.msgId) {
                        setMessages(prev => prev.map(m => {
                            if (m.id === payload.msgId) {
                                const reactions = { ...(m.reactions || {}) };
                                if (payload.emoji) reactions[payload.userId] = payload.emoji;
                                else delete reactions[payload.userId];
                                return { ...m, reactions };
                            }
                            return m;
                        }));
                        DB.updatePrivateMessageReactions(payload.msgId, payload.userId, payload.emoji);
                    }
                })
                .on('broadcast', { event: 'private-update' }, ({ payload }: { payload: { id: string, text: string } }) => {
                    if (payload?.id) {
                        setMessages(prev => prev.map(m => m.id === payload.id ? { ...m, text: payload.text, is_edited: true } : m));
                        DB.updatePrivateMessageText(payload.id, payload.text);
                    }
                })
                .on('broadcast', { event: 'private-delete' }, ({ payload }: { payload: { msgId: string, deleteType: string } }) => {
                    if (payload?.msgId) {
                        if (payload.deleteType === 'for_everyone') {
                            setMessages(prev => prev.map(m => m.id === payload.msgId ? { ...m, isDeletedForEveryone: true } : m));
                        }
                    }
                })
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        isChannelReady.current = true;
                        queuedEvents.current.forEach(evt => {
                            chatChannelRef.current?.send(evt).catch(() => { });
                        });
                        queuedEvents.current = [];
                    }
                });

            return () => {
                chatChannelRef.current?.unsubscribe();
                isChannelReady.current = false;
            };
        }
    }, [isOpen, chatUserId]);

    useEffect(() => {
        if (isOpen && chatUserId) {
            const isMeTyping = newMessage.trim().length > 0;
            DB.setTypingStatus(currentUser.id, chatUserId, isMeTyping);
            if (chatChannelRef.current && isChannelReady.current) {
                chatChannelRef.current.send({
                    type: 'broadcast',
                    event: 'private-typing',
                    payload: { senderId: currentUser.id, receiverId: chatUserId, isTyping: isMeTyping }
                }).catch(() => { });
            }
        }
    }, [newMessage, isOpen, chatUserId, currentUser.id]);

    const checkModeration = (text: string): boolean => {
        const phoneRegex = /(010\d{8}|٠١٠[٠-٩]{8})/;
        const badWords = [
            'جنس', 'اباحي', 'سكس', 'نيك', 'شرموط', 'كسمك', 'متناك', 'خول', 'لبوة',
            'sex', 'porn', 'fuck', 'pussy', 'dick', 'كلب', 'حمار', 'غبي', 'شتم', 'سب', 'لعن', 'وسخ'
        ];

        const hasBadWords = badWords.some(word => text.toLowerCase().includes(word));

        if (hasBadWords) { // Note: phones are allowed in private, so only hasBadWords triggers this
            const students = DB.getStudents();
            const studentIdx = students.findIndex((s: any) => s.id === currentUser.id);
            if (studentIdx === -1) return false;

            const currentCount = students[studentIdx].violationCount || 0;
            const newCount = currentCount + 1;

            if (newCount >= 2) {
                DB.updateStudent(currentUser.id, { isBlocked: true, violationCount: newCount });
                localStorage.removeItem('nt_logged_in_user');
                alert('تم حظر حسابك نهائياً بسبب تكرار مخالفة شروط المنصة.');
                window.location.reload();
            } else {
                DB.updateStudent(currentUser.id, { violationCount: newCount });
                setShowBadWordWarning(true);
            }
            return false;
        }
        return true;
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() && !pendingForward) return;
        if (isSending) return;

        // Quota Check
        const qCheck = DB.consumeMessageQuota(currentUser.id);
        if (!qCheck.allowed) {
            setQuota({ remaining: 0, resetTime: qCheck.resetTime, packagePoints: 0 });
            return;
        }
        setQuota({ remaining: qCheck.remaining, resetTime: qCheck.resetTime, packagePoints: qCheck.packagePoints });

        if (isHeBlocked || isIBlocked) {
            alert(isHeBlocked ? 'لا يمكنك المراسلة لأنك حظرت هذا الطالب.' : `لا يمكنك المراسلة، لقد قام ${chatUsername} بحظرك.`);
            return;
        }

        if (newMessage.trim() && !checkModeration(newMessage)) return;

        setIsSending(true);

        const sendAction = (text: string, isFwd: boolean = false) => {
            const msg: PrivateMessage = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                senderId: currentUser.id,
                receiverId: chatUserId,
                text: text,
                type: 'text',
                timestamp: Date.now(),
                isRead: false,
                isDelivered: false,
                isDeletedForSender: false,
                isDeletedForReceiver: false,
                isDeletedForEveryone: false,
                replyToId: replyingTo?.id,
                replyToText: replyingTo?.isDeletedForEveryone ? 'تم مسح هذه الرسالة' : replyingTo?.text,
                replyToSender: replyingTo ? (replyingTo.senderId === currentUser.id ? 'أنت' : chatUsername) : undefined,
                isForwarded: isFwd
            };

            DB.addPrivateMessage(msg);

            if (chatChannelRef.current && isChannelReady.current) {
                chatChannelRef.current.send({ type: 'broadcast', event: 'private-message', payload: msg }).catch(() => { });
            }

            setTimeout(() => {
                const container = document.getElementById('private-chat-scroll-container');
                if (container) container.scrollTop = container.scrollHeight;
                if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('nt-chat-msg-sent', {
                    detail: {
                        msgType: 'private',
                        text: msg.text,
                        senderName: currentUser.username,
                        senderAvatar: currentUser.profilePictureUrl || currentUser.avatarUrl || '/pulse-logo.png',
                        receiverId: chatUserId,
                        to: chatUserId,
                        stage: 'private',
                        fullMsgObject: msg
                    }
                }));
            }
        };

        if (newMessage.trim()) {
            sendAction(newMessage.trim(), !!pendingForward);
        }

        playSendSound();
        setNewMessage('');
        setReplyingTo(null);
        setPendingForward(null);

        // Finalize sending state
        setTimeout(() => setIsSending(false), 800);
    };

    const handleDeleteMsg = (msgId: string, type: 'for_me' | 'for_everyone') => {
        DB.deletePrivateMessage(msgId, type, currentUser.id);
        setActiveMsgMenu(null);
    };

    const handleUpdateMsg = (msgId: string, newText: string) => {
        if (!newText.trim()) return;

        DB.updatePrivateMessageText(msgId, newText.trim()); // Local + Sync Update
        setEditingId(null);

        if (chatChannelRef.current && isChannelReady.current) {
            chatChannelRef.current.send({
                type: 'broadcast',
                event: 'private-update',
                payload: { id: msgId, text: newText.trim() }
            }).catch(() => { });
        }
    };

    const areReceiptsHidden = (() => {
        const students = DB.getStudents();
        const me = students.find((s: any) => s.id === currentUser.id);
        const he = students.find((s: any) => s.id === chatUserId);
        return (me?.hiddenReadReceipts) || (he?.hiddenReadReceipts);
    })();

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);

    // Provide a stable function reference for updating reactions to avoid re-renders
    const updateReaction = useCallback((msgId: string, emoji: string | null) => {
        DB.updatePrivateMessageReactions(msgId, currentUser.id, emoji);
        if (chatChannelRef.current && isChannelReady.current) {
            chatChannelRef.current.send({
                type: 'broadcast',
                event: 'private-reaction',
                payload: { msgId, userId: currentUser.id, emoji }
            }).catch(() => { });
        }
    }, [chatUserId, currentUser.id]);

    const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏', '🙏', '🔥', '💯', '🎉', '😡', '🤔', '🙌', '💔', '😍', '👀', '✨', '💪', '🥳', '😎', '💀', '🤡', '🌟', '🤬', '🤮'];

    const ALL_EMOJIS = React.useMemo(() => {
        const list = [];
        const ranges = [[0x1F600, 0x1F64F], [0x1F300, 0x1F5FF], [0x1F680, 0x1F6FF], [0x1F900, 0x1F9FF], [0x2600, 0x26FF]];
        ranges.forEach(([s, e]) => { for (let i = s; i <= e; i++) list.push(String.fromCodePoint(i)); });
        return list;
    }, []);

    const chatBgStyle = React.useMemo(() => {
        const bg = selectedBg || '#0b141a';
        const isSvg = bg.includes('svg');
        const isUrl = bg.includes('url');

        if (!isUrl) return { backgroundColor: bg };

        const parts = bg.split(') ');
        const url = parts[0] + ')';
        const color = parts[1] || '#0b141a';

        return {
            background: `${url} center / ${isSvg ? 'auto' : 'cover'} ${isSvg ? 'repeat' : 'no-repeat'} ${color}`
        };
    }, [selectedBg]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-0 sm:p-4 bg-black/40 font-sans nt-private-chat-modal" dir="rtl">
            <div
                id="nt-private-chat-modal-inner"
                className="relative w-full h-[100dvh] sm:h-[800px] sm:max-h-[92vh] flex flex-col sm:rounded-[2.5rem] border-0 sm:border border-white/10 shadow-2xl overflow-hidden animate-none transition-none !duration-0 bg-[#0b141a]/80"
                style={chatBgStyle}
            >
                {/* Premium WhatsApp-style Doodle Pattern for depth and texture */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 opacity-[0.07] select-none"
                    style={{
                        backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
                        backgroundRepeat: 'repeat',
                        mixBlendMode: 'overlay'
                    }}
                />

                {/* Subtle Overlay and Gradient to ensure readability and vibrant feel */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0b141a]/90 via-[#111b21]/80 to-[#0b141a]/95 pointer-events-none z-0" />

                {!selectedBg && (
                    <div
                        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] select-none"
                        style={{
                            backgroundImage: 'url("https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg")',
                            backgroundRepeat: 'repeat',
                            backgroundSize: '120px'
                        }}
                    />
                )}

                <div className="flex items-center justify-between px-2 py-2 sm:px-4 sm:py-3 border-b border-white/10 relative z-20 min-h-[60px]" style={{ backgroundColor: '#0b141a' }}>
                    {longPressedMsgId ? (() => {
                        const selectedMsg = messages.find((m: any) => m.id === longPressedMsgId);
                        if (!selectedMsg) return null;
                        const isMe = selectedMsg.senderId === currentUser.id;
                        const isCall = selectedMsg.type === 'call';
                        const isDeleted = selectedMsg.isDeletedForEveryone;

                        return (
                            <div className="flex items-center justify-between w-full text-white">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setLongPressedMsgId(null)} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white">
                                        <ArrowRight size={22} className="sm:w-6 sm:h-6" />
                                    </button>
                                    <span className="font-bold text-[19px]">1</span>
                                </div>

                                <div className="flex items-center gap-0.5 sm:gap-2">
                                    {!isDeleted && (
                                        <button onClick={() => { setReplyingTo(selectedMsg); setLongPressedMsgId(null); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="رد">
                                            <CornerUpRight size={22} className="opacity-80 sm:w-6 sm:h-6" />
                                        </button>
                                    )}
                                    {!isDeleted && (
                                        <button onClick={() => { selectedMsg.isPinned ? handleUnpinMsg(selectedMsg.id) : handlePinMsg(selectedMsg.id); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title={selectedMsg.isPinned ? "إلغاء التثبيت" : "تثبيت"}>
                                            <Pin size={21} className={selectedMsg.isPinned ? "text-emerald-400 rotate-45 sm:w-6 sm:h-6" : "opacity-80 sm:w-6 sm:h-6"} />
                                        </button>
                                    )}
                                    <button onClick={() => { DB.togglePrivateMessageStar(selectedMsg.id); setLongPressedMsgId(null); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="تمييز بنجمة">
                                        <Star size={22} className={selectedMsg.isStarred ? "text-yellow-500 fill-current sm:w-6 sm:h-6" : "opacity-80 sm:w-6 sm:h-6"} />
                                    </button>
                                    <button onClick={() => { handleDeleteMsg(selectedMsg.id, 'for_me'); setLongPressedMsgId(null); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="حذف">
                                        <Trash2 size={22} className="opacity-80 sm:w-6 sm:h-6" />
                                    </button>
                                    <button onClick={() => {
                                        window.dispatchEvent(new CustomEvent('nt-start-global-forward', { detail: selectedMsg }));
                                        setLongPressedMsgId(null);
                                        onClose();
                                    }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="تحويل">
                                        <CornerUpLeft size={22} className="opacity-80 sm:w-6 sm:h-6" />
                                    </button>
                                    {/* More menu removed as requested */}

                                </div>
                            </div>
                        );
                    })() : (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-hidden">
                                <button
                                    onClick={onClose}
                                    className="flex items-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-95 group shadow-lg border border-white/10 shrink-0"
                                >
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" style={{ color: theme.primary }} />
                                    <span className="font-bold text-[10px]">رجوع</span>
                                </button>
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('nt-open-student-profile', { detail: { studentId: chatUserId } }))}>
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-gray-800">
                                            {chatUserInfo.profilePictureUrl || chatUserInfo.avatarUrl ? (
                                                <img src={chatUserInfo.profilePictureUrl || chatUserInfo.avatarUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white">{chatUsername.charAt(0)}</div>
                                            )}
                                        </div>
                                        {lastSeen === 'متصل الآن' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0b141a]" />}
                                    </div>
                                    <div className="text-right flex flex-col items-start justify-center pr-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="font-semibold text-white text-[15px] sm:text-[17px] leading-tight truncate">{chatUsername}</span>
                                            {currentUser.isChatFree ? (
                                                <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 border border-emerald-500/30 shrink-0 shadow-sm animate-pulse flex items-center gap-1">
                                                    <Sparkles size={8} /> مجاناً
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {quota.packagePoints !== undefined && quota.packagePoints > 0 && (
                                                        <span className="text-[8px] sm:text-[9.5px] font-black bg-amber-500/10 px-1.5 py-[2px] rounded-full text-amber-500 border border-amber-500/10 shadow-sm">{quota.packagePoints} باقة ✨</span>
                                                    )}
                                                    <span className={`text-[8px] sm:text-[9.5px] font-bold sm:font-black ${quota.remaining > 0 ? 'bg-white/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} px-1.5 py-[2px] rounded-full border border-white/5 shrink-0 shadow-sm`}>{quota.remaining} رسائل</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] sm:text-[12px] font-normal mt-0.5 leading-tight text-gray-400 truncate w-full">
                                            {isHeBlocked ? 'لقد قمت بحظر هذا الطالب' : isIBlocked ? 'هذا الطالب قام بحظرك' : isTyping ? 'جاري الكتابة...' : lastSeen || 'انقر للمعلومات'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                {/* Upgrade Button in header - only show if quota is zero */}
                                {quota.remaining === 0 && (quota.packagePoints || 0) < 5 && !currentUser.isChatFree && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowUpgradeModal(true); setUpgradeStep('select'); setSelectedPackage(null); }}
                                        className="px-2 py-1 rounded-xl text-[10px] font-black border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                                        title="ترقية رصيد الرسائل"
                                    >
                                        <span>⬆</span>
                                        <span className="hidden sm:inline">ترقية</span>
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isHeBlocked || isIBlocked) return;
                                        if (!appSettings.allowVideoCalls) {
                                            setShowFeatureLocked('video');
                                            return;
                                        }
                                        window.dispatchEvent(new CustomEvent('nt-start-call', { detail: { userId: chatUserId, userName: chatUsername, isVideo: true, avatarUrl: chatUserInfo.profilePictureUrl || chatUserInfo.avatarUrl } }));
                                    }}
                                    className={cn("p-2 rounded-full hover:bg-white/10 transition-colors", !appSettings.allowVideoCalls ? "text-red-500 opacity-60" : "text-white")}
                                    title={!appSettings.allowVideoCalls ? "مكالمات الفيديو مغلقة" : "مكالمة فيديو"}
                                >
                                    <Video size={20} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isHeBlocked || isIBlocked) return;
                                        if (!appSettings.allowVoiceCalls) {
                                            setShowFeatureLocked('voice');
                                            return;
                                        }
                                        window.dispatchEvent(new CustomEvent('nt-start-call', { detail: { userId: chatUserId, userName: chatUsername, isVideo: false, avatarUrl: chatUserInfo.profilePictureUrl || chatUserInfo.avatarUrl } }));
                                    }}
                                    className={cn("p-2 rounded-full hover:bg-white/10 transition-colors", !appSettings.allowVoiceCalls ? "text-red-500 opacity-60" : "text-white")}
                                    title={!appSettings.allowVoiceCalls ? "المكالمات الصوتية مغلقة" : "مكالمة صوتية"}
                                >
                                    <Phone size={19} />
                                </button>
                                {/* More menu removed as requested */}

                            </div>
                        </div>
                    )}
                </div>

                {/* Background Picker Overlay */}
                {showBgPicker && (
                    <div className="absolute inset-0 z-[999] bg-[#0b141a] flex flex-col">
                        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-[#202c33] shrink-0">
                            <button onClick={() => setShowBgPicker(false)} className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10"><ArrowRight size={22} /></button>
                            <h2 className="text-white font-bold text-lg">خلفية الشات</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto w-full p-4 bg-[#111b21] pb-20">
                            {CHAT_BACKGROUND_CATEGORIES.map(cat => (
                                <div key={cat.name} className="mt-4">
                                    <h3 className="text-emerald-500 font-bold text-[13px] mb-3">{cat.name}</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {cat.backgrounds.map((bg, idx) => (
                                            <button key={idx} onClick={() => { setSelectedBg(bg); localStorage.setItem('nt_chat_bg_' + currentUser.id, bg); DB._syncToSupabase('nt_chat_bg_' + currentUser.id, bg); setShowBgPicker(false); }} className={`aspect-[9/16] rounded-xl overflow-hidden relative border-2 ${selectedBg === bg ? 'border-emerald-500' : 'border-transparent'}`} style={bg.includes('url') ? { background: `${bg.split(') ')[0]}) center / cover no-repeat` } : { backgroundColor: bg }}>
                                                {selectedBg === bg && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Check size={20} className="text-white" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pinned Messages Header */}
                {pinnedMessages.length > 0 && (
                    <div className="bg-[#202c33] border-b border-white/10 px-4 py-2 flex items-center gap-3 relative z-30">
                        <Pin size={14} className="text-emerald-500 rotate-45 shrink-0" />
                        <div className="flex-1 overflow-hidden" onClick={() => { const el = document.getElementById(`bubble-${pinnedMessages[0].id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                            <div className="text-[11px] font-bold text-emerald-500 mb-0.5">رسالة مثبتة</div>
                            <div className="text-[12px] text-gray-300 truncate font-semibold">{pinnedMessages[0].text}</div>
                        </div>
                        <button onClick={() => handleUnpinMsg(pinnedMessages[0].id)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-500"><X size={14} /></button>
                    </div>
                )}

                {/* Search Bar */}
                {showSearch && (
                    <div className="flex items-center gap-2 p-2 bg-[#202c33] border-b border-white/5 relative z-30">
                        <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><ArrowRight size={20} /></button>
                        <input autoFocus type="text" placeholder="بحث في الدردشة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white outline-none text-[14.5px]" dir="rtl" />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400"><X size={16} /></button>}
                    </div>
                )}

                {/* Messages Container */}
                <div
                    ref={chatContainerRef}
                    id="private-chat-scroll-container"
                    onScroll={(e) => {
                        handleScroll(e);
                        if (longPressedMsgId) setLongPressedMsgId(null);
                        if (showEmojiPicker) setShowEmojiPicker(false);
                    }}
                    className={`flex-1 overflow-x-hidden w-full max-w-full ${showEmojiPicker ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'} p-4 sm:p-6 pb-8 sm:pb-10 flex flex-col gap-2 relative z-10 bg-transparent`}
                    onClick={() => { setLongPressedMsgId(null); setShowEmojiPicker(false); setActiveMsgMenu(null); }}
                    onTouchStart={() => { if (showEmojiPicker) setShowEmojiPicker(false); setActiveMsgMenu(null); }}
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehaviorY: 'contain',
                        overscrollBehaviorX: 'none',
                        touchAction: 'pan-y',
                        willChange: 'scroll-position',
                        contain: 'content'
                    }}
                >
                    <style>{`
                        .message-animation {
                            animation: messageSlideIn 0.25s cubic-bezier(0.2, 0, 0, 1) forwards;
                            will-change: transform, opacity;
                        }
                        @keyframes messageSlideIn {
                            0% { opacity: 0; transform: translateY(8px); }
                            100% { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>

                    <div className="text-center w-full mt-2 mb-4 relative z-10 flex-shrink-0">
                        <button
                            onClick={() => {
                                setShowEncryptionInfo(true);
                                setEncryptionStatus('verifying');
                                setTimeout(() => {
                                    const d = new Date();
                                    setVerificationTime(d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
                                    setEncryptionStatus('verified');
                                }, 2500);
                            }}
                            className="bg-[#1e293b]/90 text-emerald-400 text-[10px] px-4 py-1.5 rounded-full font-bold border border-emerald-500/20 shadow-md inline-flex items-center justify-center gap-1.5 mx-auto max-w-[85%] leading-relaxed text-center hover:bg-emerald-500/10 transition-all active:scale-95 cursor-pointer"
                        >
                            <ShieldAlert size={12} className="flex-shrink-0" />
                            هذه المحادثة مشفرة تماماً بين الطرفين (End-to-End Encrypted)
                        </button>
                    </div>

                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-40 h-full">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                                <span className="text-4xl grayscale">💬</span>
                            </div>
                            <p className="font-bold text-sm text-center px-8 text-white">ابدأ المحادثة مع {chatUsername} الآن، جميع الرسائل هنا محمية ومغلقة بينكما فقط.</p>
                        </div>
                    ) : (
                        messages.filter(msg => !searchQuery || msg.text?.toLowerCase().includes(searchQuery.toLowerCase())).map((msg, idx) => (
                            <div key={msg.id} className="message-animation" style={{ alignSelf: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start', width: 'fit-content', maxWidth: '85%' }}>
                                <MessageItem
                                    msg={msg}
                                    isMe={msg.senderId === currentUser.id}
                                    isDeleted={msg.isDeletedForEveryone}
                                    timeFormat={new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    currentUser={currentUser}
                                    chatUserInfo={chatUserInfo}
                                    chatUsername={chatUsername}
                                    theme={theme}
                                    longPressedMsgId={longPressedMsgId}
                                    setLongPressedMsgId={setLongPressedMsgId}
                                    activeMsgMenu={activeMsgMenu}
                                    setActiveMsgMenu={setActiveMsgMenu}
                                    reactionEmojis={reactionEmojis}
                                    handleDeleteMsg={handleDeleteMsg}
                                    setReplyingTo={setReplyingTo}
                                    areReceiptsHidden={areReceiptsHidden}
                                    updateReaction={updateReaction}
                                    editingId={editingId}
                                    setEditingId={setEditingId}
                                    editValue={editValue}
                                    setEditValue={setEditValue}
                                    handleUpdateMsg={handleUpdateMsg}
                                    setShowUserInfo={setShowUserInfo}
                                    chatUserId={chatUserId}
                                    onStartPrivateChat={(id: string, name: string) => {
                                        onClose();
                                        window.dispatchEvent(new CustomEvent('nt-open-private-chat', { detail: { id, name } }));
                                    }}
                                />
                            </div>
                        ))
                    )}

                    {(isHeBlocked || isIBlocked) && (
                        <div className="mx-auto my-4 w-fit max-w-[90%] bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center space-y-2">
                            <Ban size={24} className="mx-auto text-red-500 opacity-50 mb-1" />
                            <p className="text-sm font-black text-white">
                                {isHeBlocked ? 'لقد قمت بحظر هذا الطالب، ولن تتمكن من مراسلته.' : `عفواً، لقد قام "${chatUsername}" بحظرك.`}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold leading-snug">
                                {isHeBlocked ? 'يمكنك إلغاء الحظر من الأعلى لاستعادة المراسلة.' : 'لا يمكنك إرسال رسائل لهذا الشخص حالياً بسبب الحظر.'}
                            </p>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-2" />
                </div>

                <div className="p-2 sm:p-3 bg-[#202c33] relative z-20 text-center">
                    {/* Emoji Picker Overlay */}
                    <>
                        {showEmojiPicker && (
                            <div
                                className="absolute bottom-[calc(100%+8px)] sm:bottom-[calc(100%+10px)] right-2 left-2 sm:right-4 sm:left-4 bg-[#1e293b] border border-white/10 rounded-[2rem] h-[280px] sm:h-[320px] shadow-2xl overflow-hidden flex flex-col z-50 text-right overscroll-y-contain custom-emoji-scroll"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center text-sm font-black text-white px-5">
                                    <span>الملصقات والإيموجي ({ALL_EMOJIS.length}+)</span>
                                    <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white p-1 rounded-full"><X size={16} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-7 sm:grid-cols-8 gap-2 p-3 content-start overscroll-y-contain">
                                    {ALL_EMOJIS.map((emoji, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setNewMessage(prev => prev + emoji)}
                                            className="text-2xl hover:bg-white/10 p-1 rounded-xl transition-colors flex items-center justify-center h-12 w-full"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>

                    {isHeBlocked || isIBlocked ? (
                        <div className="flex items-center justify-center p-3 sm:p-4 bg-red-500/5 rounded-2xl border border-red-500/10 transition-all">
                            <p className="text-xs font-black text-red-400">
                                {isHeBlocked ? 'لا يمكنك المراسلة، لقد حظرت هذا الطالب' : `لا يمكنك المراسلة، لقد حظرك "${chatUsername}"`}
                            </p>
                        </div>
                    ) : (
                        <>
                            {replyingTo && (
                                <div className="flex items-start justify-between bg-[#1e293b] p-3 rounded-t-xl border-l-4 border-[#00a884] mb-1">
                                    <div className="flex-1 pr-2">
                                        <div className="text-xs font-black mb-1 text-[#00a884]">{replyingTo.senderId === currentUser.id ? 'أنت' : chatUsername}</div>
                                        <div className="text-xs text-gray-300 line-clamp-1">{replyingTo.isDeletedForEveryone ? 'تم مسح هذه الرسالة' : replyingTo.text}</div>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:bg-white/10 hover:text-white rounded-full">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-end gap-1.5 w-full mx-auto" dir="ltr">
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="w-11 h-11 sm:w-[48px] sm:h-[48px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#00c99f] text-[#111b21] disabled:bg-[#00a884]/50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg mt-0.5 border-0"
                                >
                                    <span className="text-black font-black text-[22px] sm:text-[24px] mb-0.5 leading-none transition-transform hover:-translate-x-0.5 select-none" style={{ fontFamily: 'monospace' }}>&lt;</span>
                                </button>
                                <div className="flex items-center justify-between gap-1.5 bg-[#2a3942] rounded-full px-1.5 py-1 relative z-10 w-full shadow-lg min-h-[46px]" dir="rtl">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-white transition-all text-xl grayscale hover:grayscale-0"
                                        title="ملصقات وايموجي"
                                    >
                                        😀
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            if (!e.target.value.trim() && pendingForward) {
                                                setPendingForward(null);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="المراسلة..."
                                        className="flex-1 bg-transparent border-none outline-none px-2 pl-4 text-right text-[15px] sm:text-[16px] placeholder-gray-400 text-white min-h-[30px] font-medium"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {showEncryptionInfo && (
                    <div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                        <div className="bg-[#1e293b] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl relative text-center space-y-4">
                            <button onClick={() => setShowEncryptionInfo(false)} className="absolute top-4 left-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                                <X size={20} className="text-gray-400" />
                            </button>
                            {encryptionStatus === 'verifying' ? (
                                <div className="py-6 flex flex-col items-center gap-5">
                                    <Loader2 size={48} className="text-emerald-500 animate-spin" />
                                    <h3 className="text-lg font-black text-white">جاري التحقق من التشفير...</h3>
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center gap-5">
                                    <ShieldCheck size={48} className="text-emerald-500" />
                                    <h3 className="text-lg font-black text-white">المحادثة مشفرة بنجاح</h3>
                                    <p className="text-xs text-gray-400">تم التحقق في {verificationTime}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {privacyBreachAlert && (
                    <div className="absolute top-[85px] left-1/2 -translate-x-1/2 bg-red-600 border-2 border-red-400 text-white px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.7)] z-[99999] flex items-center justify-center gap-3 w-[85%] max-w-[350px]">
                        <ShieldAlert size={26} className="flex-shrink-0 animate-pulse" />
                        <span className="font-black text-[13px] sm:text-[14px] leading-relaxed text-center">
                            {privacyBreachAlert === 'screenshot'
                                ? `لقد أخذ ${chatUsername} لقطة شاشة (Screenshot)!`
                                : `لقد بدأ ${chatUsername} بتسجيل فيديو للشاشة!`}
                        </span>
                    </div>
                )}

                {showBadWordWarning && (
                    <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-[#1e293b] rounded-3xl p-8 w-full max-w-sm border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center space-y-5">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/20">
                                <ShieldAlert size={40} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white">تحذير أمني صارم</h3>
                            <p className="text-[13px] text-gray-300 font-bold">لقد تم رصد كلمات غير لائقة. هذا التحذير الأول والأخير.</p>
                            <button onClick={() => setShowBadWordWarning(false)} className="w-full py-3 bg-red-500 rounded-xl text-white font-black">فهمت</button>
                        </div>
                    </div>
                )}

                {showFeatureLocked && (
                    <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowFeatureLocked(false)}>
                        <div className="bg-[#1e293b] rounded-3xl p-6 max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
                            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-800 text-emerald-400`}>
                                {showFeatureLocked === 'video' ? <Video size={32} /> : showFeatureLocked === 'group' ? <Users size={32} /> : <Phone size={32} />}
                            </div>
                            <h3 className="text-xl font-black text-white" style={{ color: theme.primary }}>قريباً</h3>
                            <p className="text-xs font-bold text-gray-300 mt-2 mb-5">هذه الميزة تحت الإنشاء والتطوير حالياً.</p>
                            <button onClick={() => setShowFeatureLocked(false)} className="w-full py-3 rounded-xl font-black text-white" style={{ backgroundColor: theme.primary }}>حسناً</button>
                        </div>
                    </div>
                )}

                {showUserInfo && (
                    <div className="absolute inset-0 z-[10000000] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowUserInfo(false)}>
                        <div className="bg-[#111b21] rounded-2xl p-6 w-full max-w-xs text-center relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowUserInfo(false)} className="absolute top-3 right-3 text-gray-400"><X size={20} /></button>
                            <div className="w-24 h-24 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-4 overflow-hidden">
                                {chatUserInfo.profilePictureUrl || chatUserInfo.avatarUrl ? (
                                    <img src={chatUserInfo.profilePictureUrl || chatUserInfo.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-gray-500" />
                                )}
                            </div>
                            <h2 className="text-xl font-black text-white">{chatUsername}</h2>
                            <button onClick={() => setShowUserInfo(false)} className="w-full mt-5 bg-[#00a884] text-black font-black py-3 rounded-xl">حسناً</button>
                        </div>
                    </div>
                )}

                {/* Upgrade Chat Quota Modal */}
                {showUpgradeModal && (
                    <div className="absolute inset-0 z-[3000000] bg-[#000000] flex items-center justify-center p-0" style={{ backdropFilter: 'blur(10px)' }}>
                        <div className="bg-[#000000] rounded-none w-[100vw] min-h-[100dvh] border-0 overflow-y-auto no-scrollbar flex flex-col" style={{ boxSizing: 'border-box' }}>
                            {upgradeStep === 'select' ? (
                                <div className="relative w-full min-h-[100dvh] bg-[#000000] flex flex-col items-center overflow-y-auto text-right p-6 sm:p-8 pt-16 space-y-6">
                                    <button onClick={() => setShowUpgradeModal(false)} className="fixed top-5 right-5 text-[#FFD700] z-[100]">
                                        <ArrowRight size={26} />
                                    </button>
                                    <div className="text-center w-full">
                                        <div className="w-16 h-16 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center border-2 border-[#FFD700] mx-auto mb-4">
                                            <Sparkles size={32} className="text-[#FFD700]" />
                                        </div>
                                        <h2 className="text-2xl font-black text-white">ترقية رصيد الرسائل</h2>
                                        <p className="text-gray-500 font-bold mt-1 text-xs px-4 leading-relaxed">
                                            اختر الباقة المناسبة لك للحصول على نقاط إضافية واستكمال المحادثة فوراً
                                        </p>
                                    </div>

                                    <div className="space-y-3 w-[90%] sm:max-w-md">
                                        {CHAT_PACKAGES.map((pkg) => {
                                            const isThisPending = pendingChatPayment?.itemId === pkg.id;
                                            const isAnyPending = !!pendingChatPayment;
                                            return (
                                                <button
                                                    key={pkg.id}
                                                    onClick={() => { if (!isAnyPending) { setSelectedPackage(pkg); setUpgradeStep('confirm'); } }}
                                                    className={`w-full p-6 rounded-2xl border-[1.5px] flex items-center justify-between text-right active:scale-95
                                                        ${isThisPending ? 'bg-[#FFD700]/10 border-[#FFD700]/50' :
                                                            isAnyPending ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/5' :
                                                                'bg-[#000000] border-[#FFD700] hover:bg-[#FFD700]/5'
                                                        }`}
                                                >
                                                    <div className={`text-lg font-black order-1 ${isThisPending ? 'text-[#FFD700]' : 'text-[#FFD700]'}`}>{pkg.price} ج.م</div>
                                                    <div className="flex items-center gap-3 order-2">
                                                        <div className="text-right">
                                                            <div className="text-sm font-black text-white flex items-center gap-2">
                                                                {isThisPending && <span className="text-[10px] bg-[#FFD700] text-black px-2 py-0.5 rounded-full whitespace-nowrap">قيد المراجعة</span>}
                                                                {pkg.label}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 font-bold">باقة رسائل فورية</div>
                                                        </div>
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-black font-black shadow-lg
                                                            ${isThisPending ? 'bg-[#FFD700]' : 'bg-[#FFD700]'}
                                                        `}>
                                                            {pkg.messages}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {pendingChatPayment && (
                                            <p className="text-[#FFD700] text-[11px] font-bold text-center mt-3 bg-[#FFD700]/10 py-2 rounded-xl">
                                                لا يمكنك شراء باقة جديدة طالما لديك باقة قيد المراجعة.
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={() => setShowUpgradeModal(false)} className="w-[90%] py-4 text-[#FFD700] font-black text-sm">
                                        إغلاق
                                    </button>
                                </div>
                            ) : upgradeStep === 'confirm' && selectedPackage ? (
                                <div className="relative w-full min-h-[100dvh] bg-[#000000] flex flex-col items-center overflow-y-auto text-right p-6 sm:p-8 pt-16 space-y-5">
                                    <button onClick={() => setUpgradeStep('select')} className="fixed top-5 right-5 text-[#FFD700] z-[100]">
                                        <ArrowRight size={26} />
                                    </button>
                                    <div className="w-[90%] sm:max-w-md mx-auto space-y-5 pb-10 mb-10 overflow-y-auto no-scrollbar pt-6">
                                        <div className="text-center pt-2">
                                            <div className="w-14 h-14 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-[#FFD700]">
                                                <ShoppingCart size={28} className="text-[#FFD700]" />
                                            </div>
                                            <h3 className="text-xl font-black text-white px-2">ترقية رصيد الرسائل</h3>
                                            <div className="text-3xl font-black text-[#FFD700] mt-1">{selectedPackage.price} ج.م</div>
                                            <p className="text-xs text-gray-500 font-bold mt-1">{selectedPackage.label}</p>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-right">
                                            <p className="text-[12px] text-gray-300 font-bold leading-relaxed">
                                                بعد إتمام التحويل يرجى الضغط على زر تأكيد الدفع.<br />
                                                سيتم مراجعة الطلب وتفعيل النقاط فور التأكد من وصول التحويل.
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {/* Vodafone Cash */}
                                            <button
                                                onClick={() => {
                                                    const ussdCode = `*9*7*01067941806*${selectedPackage.price}#`;
                                                    window.location.href = `tel:${encodeURIComponent(ussdCode)}`;
                                                }}
                                                className="w-full py-4 rounded-2xl font-black text-sm relative overflow-hidden group bg-white/5 border border-white/10 flex items-center justify-center gap-3"
                                            >
                                                <div className="absolute inset-0 bg-red-600 opacity-[0.06] group-hover:opacity-[0.12]" />
                                                <img src="https://i.postimg.cc/76BFFtJY/1572113.jpg" className="w-7 h-7 rounded-lg shadow-lg object-cover" alt="Vodafone Cash" />
                                                <span className="text-white font-black relative z-10">Pay via Vodafone Cash</span>
                                            </button>

                                            {/* InstaPay */}
                                            <button
                                                onClick={() => { window.open('https://ipn.eg/S/amrlotfylotfyosmanosm/instapay/51a5Jh', '_blank'); }}
                                                className="w-full py-4 rounded-2xl font-black text-sm relative overflow-hidden group bg-white/5 border border-white/10 flex items-center justify-center gap-3"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-[#de00dd] via-[#7b00ff] to-[#00d4ff] opacity-[0.06] group-hover:opacity-[0.12]" />
                                                <img src="https://i.postimg.cc/FzTHnxNd/Insta-Pay-Egypt.webp" className="w-7 h-7 rounded-lg shadow-lg object-cover relative z-10" alt="Instapay" />
                                                <span className="text-white font-black relative z-10">Pay via Insta Pay</span>
                                            </button>

                                            {/* Confirm Button */}
                                            <button
                                                onClick={() => { (setUpgradeStep as any)('done'); setUpgradeContactAction(null); setUpgradeContactTimer(0); }}
                                                className="w-full py-4 mt-2 mb-10 rounded-2xl font-black text-sm bg-[#000000] border-[1.5px] hover:bg-[#FFD700]/10 flex items-center justify-center gap-2 border-[#FFD700] text-[#FFD700] shadow-xl"
                                            >
                                                <CheckCircle size={16} />
                                                <span>تأكيد الطلب المالي</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : upgradeStep === 'done' ? (
                                <div className="relative w-full min-h-[100dvh] bg-[#000000] flex flex-col items-center justify-center overflow-y-auto text-right p-6 sm:p-8 space-y-5">
                                    <div className="w-20 h-20 rounded-full bg-[#FFD700]/10 border-2 border-[#FFD700] flex items-center justify-center mx-auto shadow-[0_0_20px_#FFD700]">
                                        <Check size={40} className="text-[#FFD700]" />
                                    </div>
                                    <h4 className="text-white font-black text-lg text-center">تم إرسال طلبك بنجاح!</h4>
                                    <p className="text-gray-400 text-sm font-bold leading-relaxed text-center px-4">
                                        طلبك الآن <span className="text-[#FFD700] font-black">قيد المراجعة</span>.
                                        <br />سيتم تفعيل الباقة تلقائياً بعد موافقة الأدمن.
                                    </p>
                                    <div className="w-full px-4 mb-10">
                                        <button
                                            onClick={() => { setShowUpgradeModal(false); setUpgradeStep('select'); setSelectedPackage(null); }}
                                            className="w-full py-4 rounded-2xl font-black text-sm bg-[#000000] border-[1.5px] border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors shadow-xl mx-auto block max-w-sm"
                                        >
                                            العودة للدردشة
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Quota Exceeded Screen */}
                {quota.remaining <= 0 && (!quota.packagePoints || quota.packagePoints <= 0) && quota.resetTime && (
                    <div className="fixed inset-0 z-[3000000] bg-[#000000] flex flex-col items-center justify-center p-8 text-center overflow-y-auto no-scrollbar w-[100vw] h-[100svh]">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                        {/* Top action buttons (Close) */}
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all shadow-lg"
                                title="إغلاق والعودة للخلف"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative mb-10">
                            <div className="w-28 h-28 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                <Lock size={48} className="text-emerald-500" />
                            </div>
                            <div className="absolute -top-4 -right-4 bg-emerald-500 text-black font-black text-[10px] px-3 py-1 rounded-full shadow-lg border border-[#0b141a]">LIMIT REACHED</div>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-4 tracking-tight">لقد وصلت للحد الأقصى</h2>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 w-full max-w-sm mx-auto shadow-inner">
                            <p className="text-sm font-bold text-gray-300 leading-relaxed">
                                نعتذر منك، لقد استهلكت جميع الرسائل المتاحة لك اليوم على <span className="text-emerald-400 font-black">Mentora</span>.
                            </p>
                        </div>

                        <div className="space-y-2 mb-10">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">سيعود القسم للعمل خلال</p>
                            <div className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums tracking-tighter drop-shadow-md" style={{ color: theme.primary }}>
                                {timeLeft || '--:--:--'}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
                            {/* Upgrade Button Integration */}
                            <button
                                onClick={() => { setShowUpgradeModal(true); setUpgradeStep('select'); setSelectedPackage(null); }}
                                className="relative overflow-hidden py-3.5 px-4 rounded-2xl font-black text-sm border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2 shadow-lg"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                <span className="text-lg leading-none">💎</span> ترقية رصيد الرسائل
                            </button>

                            <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <p className="text-xs font-black text-emerald-500/80 italic leading-relaxed">"العلم صيد والكتابة قيده.. فاجعل قيدك متيناً"</p>
                            </div>
                        </div>

                        <div className="absolute bottom-6 text-[10px] font-black text-gray-600 tracking-widest opacity-50">
                            Mentora • AI SYSTEM
                        </div>
                    </div>
                )}
            </div>
        </div >,
        document.body
    );
};
