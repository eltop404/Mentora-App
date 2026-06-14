import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Smile, Paperclip, Check, Users, ShieldAlert, ArrowLeft, Camera, Trash2, ArrowRight, CornerUpRight, Star, CornerUpLeft, Copy, Edit, Trash, CheckCheck, User, Link, MessageCircle, Phone, Video, Mic, Ban, Search, Image as ImageIcon, Info, Share2, RefreshCcw, Pin } from 'lucide-react';
import { DB } from '../services/db';
import { GroupRoom, PrivateMessage, Student } from '../types';
import { supabase, isSupabaseConnected } from '../services/supabaseClient';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GroupChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: GroupRoom;
    currentUser: any;
    theme: any;
    onStartPrivateChat?: (userId: string, userName: string) => void;
}

export const GroupChatModal: React.FC<GroupChatModalProps> = ({
    isOpen, onClose, room, currentUser, theme, onStartPrivateChat
}) => {
    const [localRoom, setLocalRoom] = useState<GroupRoom>(room);
    const [messages, setMessages] = useState<PrivateMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [replyingTo, setReplyingTo] = useState<PrivateMessage | null>(null);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [selectedMemberContext, setSelectedMemberContext] = useState<string | null>(null);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [participantSearch, setParticipantSearch] = useState('');

    // New states for Advanced Features
    const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
    const [isSending, setIsSending] = useState(false);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [isChannelReady, setIsChannelReady] = useState(false);
    const queuedEvents = useRef<any[]>([]);
    const roomChannelRef = useRef<any>(null);
    const prevMsgCountRef = useRef(0);
    const [quota, setQuota] = useState<{ remaining: number; resetTime?: number; packagePoints?: number }>(() => {
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

    useEffect(() => {
        if (!quota.resetTime) return;
        const timer = setInterval(() => {
            const now = Date.now();
            const diff = quota.resetTime! - now;
            if (diff <= 0) {
                setQuota(prev => ({ ...prev, remaining: 10, resetTime: undefined }));
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

    const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    const appSettings = DB.getSettings();

    const CHAT_BACKGROUND_CATEGORIES = [
        {
            name: 'ألوان سادة',
            backgrounds: ['#0b141a', '#202c33', '#25D366', '#128C7E', '#34B7F1', '#ECE5DD', '#DCF8C6', '#101D25', '#FF7F50', '#8A2BE2']
        },
        {
            name: 'مزخرفة (WhatsApp)',
            backgrounds: [
                'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E") #2f3e46',
                `linear-gradient(rgba(11,20,26,0.92), rgba(11,20,26,0.92)), url('/images/whatsapp-bg.png')`
            ]
        }
    ];

    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const touchStartXY = useRef<{ x: number, y: number } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const playTypingSound = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') ctx.resume();

            const playPop = (freq: number, startTime: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
                gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + startTime);
                osc.stop(ctx.currentTime + startTime + 0.1);
            };

            playPop(400, 0);
            playPop(450, 0.15);
            playPop(500, 0.3);
        } catch (e) { }
    };

    const renderText = (txt: string) => {
        if (!txt) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
        const combinedRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

        return txt.split(combinedRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline hover:text-blue-300 break-all font-bold"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            } else if (part.match(emailRegex)) {
                return (
                    <a
                        key={i}
                        href={`mailto:${part}`}
                        className="text-emerald-400 underline hover:text-emerald-300 break-all font-bold"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return <span key={i} className="whitespace-pre-wrap">{part}</span>;
        });
    };

    // 1. Initial State & Basic States
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [selectedBg, setSelectedBg] = useState<string | null>(localStorage.getItem('nt_chat_bg_' + currentUser.id));
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showFeatureLocked, setShowFeatureLocked] = useState<'video' | 'voice' | false>(false);
    const [showMessageInfo, setShowMessageInfo] = useState<PrivateMessage | null>(null);
    const [showReactionDetails, setShowReactionDetails] = useState<PrivateMessage | null>(null);
    const [meData, setMeData] = useState<Student | null>(null);

    // 2. Play Receive Sound on new incoming messages
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
        if (!isOpen) return;

        const loadData = () => {
            try {
                const students = DB.getStudents();
                setAllStudents(students);
                const _me = students.find(s => s.id === currentUser.id);
                if (_me) setMeData(_me);

                const updatedRoom = DB.getGroupRooms().find(r => r.id === room.id);
                if (updatedRoom) setLocalRoom(updatedRoom);

                const allMsgs = DB.getPrivateMessages();
                const conversation = allMsgs.filter(m => m.receiverId === room.id)
                    .sort((a, b) => {
                        const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
                        const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
                        if (timeA !== timeB) return timeA - timeB;
                        return String(a.id).localeCompare(String(b.id));
                    });

                // Deduplicate and re-sort
                const uniqueMsgs = Array.from(new Map(conversation.map(m => [m.id, m])).values())
                    .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)) as PrivateMessage[];

                setMessages(uniqueMsgs);
                DB.markGroupMessagesAsRead(room.id, currentUser.id);

                // Auto-scroll on initial load
                requestAnimationFrame(() => {
                    if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                    }
                });
            } catch (err) { }
        };

        const updateTypingStatus = () => {
            const currentTypings: Record<string, number> = {};
            localRoom.members.forEach(memberId => {
                if (memberId !== currentUser.id && DB.getTypingStatus(memberId, localRoom.id)) {
                    currentTypings[memberId] = Date.now();
                }
            });
            setTypingUsers(currentTypings);
        };

        loadData();
        updateTypingStatus();

        if (isSupabaseConnected) {
            setIsChannelReady(false);
            roomChannelRef.current = supabase.channel(`room_${room.id}`, {
                config: { broadcast: { ack: false, self: false } }
            });

            roomChannelRef.current
                .on('broadcast', { event: 'group-message' }, ({ payload }: { payload: PrivateMessage }) => {
                    if (payload && payload.id) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === payload.id)) return prev;
                            const next = [...prev, payload].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                            return next;
                        });
                        DB.addPrivateMessage(payload, true);
                        if (isOpen) {
                            DB.markGroupMessagesAsRead(room.id, currentUser.id);
                        }
                    }
                })
                .on('broadcast', { event: 'room-typing' }, ({ payload }: { payload: { userId: string, isTyping: boolean } }) => {
                    if (payload?.userId) {
                        setTypingUsers(prev => {
                            const next = { ...prev };
                            if (payload.isTyping) {
                                next[payload.userId] = Date.now();
                                if (!prev[payload.userId]) playTypingSound();
                            } else {
                                delete next[payload.userId];
                            }
                            return next;
                        });
                    }
                })
                .on('broadcast', { event: 'group-delete' }, ({ payload }: { payload: { msgId: string, deleteType: string } }) => {
                    if (payload?.msgId) {
                        setMessages(prev => prev.map(m => m.id === payload.msgId ? { ...m, isDeletedForEveryone: true } : m));
                        DB.deletePrivateMessage(payload.msgId, 'for_everyone', 'REMOTE', true);
                    }
                })
                .on('broadcast', { event: 'group-edit' }, ({ payload }: { payload: { msgId: string, newText: string } }) => {
                    if (payload?.msgId) {
                        setMessages(prev => prev.map(m => m.id === payload.msgId ? { ...m, text: payload.newText, is_edited: true } : m));
                        DB.updatePrivateMessageText(payload.msgId, payload.newText, true);
                    }
                })
                .on('broadcast', { event: 'group-reaction' }, ({ payload }: { payload: { msgId: string, userId: string, emoji: string | null } }) => {
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
                        DB.updatePrivateMessageReactions(payload.msgId, payload.userId, payload.emoji, true);
                    }
                })
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        setIsChannelReady(true);
                        queuedEvents.current.forEach(evt => {
                            roomChannelRef.current?.send(evt).catch(() => { });
                        });
                        queuedEvents.current = [];
                    }
                });
        }

        const intervalPing = setInterval(() => {
            if (roomChannelRef.current && isChannelReady) {
                roomChannelRef.current.send({
                    type: 'broadcast',
                    event: 'presence-ping',
                    payload: { userId: currentUser.id }
                });
            }
        }, 15000);

        window.addEventListener('nt-students-change', loadData);
        window.addEventListener('nt-private-msgs-change', loadData);
        window.addEventListener('nt-group-rooms-change', loadData);
        window.addEventListener('nt-typing-change', updateTypingStatus);

        return () => {
            clearInterval(intervalPing);
            window.removeEventListener('nt-students-change', loadData);
            window.removeEventListener('nt-private-msgs-change', loadData);
            window.removeEventListener('nt-group-rooms-change', loadData);
            window.removeEventListener('nt-typing-change', updateTypingStatus);
            if (roomChannelRef.current) roomChannelRef.current.unsubscribe();
            DB.setTypingStatus(currentUser.id, room.id, false);
            setIsChannelReady(false);
        };
    }, [isOpen, room.id, currentUser.id]);

    useEffect(() => {
        if (!isOpen) return;
        const handleRoomChange = () => {
            const updatedRoom = DB.getGroupRooms().find(r => r.id === room.id);
            if (updatedRoom) setLocalRoom(updatedRoom);
        };
        window.addEventListener('nt-group-rooms-change', handleRoomChange);
        return () => window.removeEventListener('nt-group-rooms-change', handleRoomChange);
    }, [isOpen, room.id]);

    useEffect(() => {
        if (isOpen && (window as any).ntGlobalPendingForward) {
            const fw = (window as any).ntGlobalPendingForward;
            (window as any).ntGlobalPendingForward = null;

            const newMsg: PrivateMessage = {
                id: `fw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                senderId: currentUser.id,
                receiverId: room.id,
                text: fw.type === 'contact' ? `Contact: ${fw.contactName}` : (fw.text || ""),
                timestamp: Date.now(),
                isRead: false,
                isDelivered: true,
                isDeletedForSender: false,
                isDeletedForMe: false,
                isDeletedForEveryone: false,
                type: fw.type || 'text',
                isForwarded: true,
                contactId: fw.contactId,
                contactName: fw.contactName,
                contactAvatar: fw.avatarUrl || fw.contactAvatar
            };

            DB.addPrivateMessage(newMsg);
            setMessages(prev => [...prev, newMsg]);

            const broadcastEvent = {
                type: 'broadcast',
                event: 'group-message',
                payload: newMsg
            };

            if (roomChannelRef.current && isChannelReady) {
                roomChannelRef.current.send(broadcastEvent).catch(() => {
                    queuedEvents.current.push(broadcastEvent);
                });
            } else {
                queuedEvents.current.push(broadcastEvent);
            }

            playSendSound();
        }
    }, [isOpen, isChannelReady, room.id, currentUser.id]);

    useEffect(() => {
        setLocalRoom(room);
    }, [room]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !replyingTo) return;
        if (isSending) return;

        // Quota Check
        const qCheck = DB.consumeMessageQuota(currentUser.id);
        if (!qCheck.allowed) {
            setQuota({ remaining: 0, resetTime: qCheck.resetTime, packagePoints: 0 });
            return;
        }
        setQuota({ remaining: qCheck.remaining, resetTime: qCheck.resetTime, packagePoints: qCheck.packagePoints });

        setIsSending(true);
        try {
            const newMsg: PrivateMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                senderId: currentUser.id,
                receiverId: room.id,
                text: newMessage.trim(),
                timestamp: Date.now(),
                isRead: false,
                isDelivered: false,
                isDeletedForSender: false,
                isDeletedForMe: false,
                isDeletedForEveryone: false,
                type: 'text',
            };

            if (replyingTo) {
                newMsg.replyToId = replyingTo.id;
                newMsg.replyToText = replyingTo.text;
                newMsg.replyToSender = replyingTo.senderId;
            }

            DB.addPrivateMessage(newMsg);

            const broadcastEvent = {
                type: 'broadcast',
                event: 'group-message',
                payload: newMsg
            };

            if (roomChannelRef.current && isChannelReady) {
                roomChannelRef.current.send(broadcastEvent).catch(() => {
                    queuedEvents.current.push(broadcastEvent);
                });
            } else {
                queuedEvents.current.push(broadcastEvent);
            }

            setTimeout(() => {
                const container = document.getElementById('group-chat-scroll-container');
                if (container) container.scrollTop = container.scrollHeight;
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);

            playSendSound();
            setNewMessage('');
            setReplyingTo(null);
            setShowEmojiPicker(false);
            DB.setTypingStatus(currentUser.id, localRoom.id, false);
        } finally {
            setIsSending(false);
        }
    };

    const handleUpdateMsg = (msgId: string, newText: string) => {
        if (!newText.trim()) return;
        DB.updatePrivateMessageText(msgId, newText.trim());
        if (roomChannelRef.current && isChannelReady) {
            roomChannelRef.current.send({
                type: 'broadcast',
                event: 'group-edit',
                payload: { id: msgId, newText: newText.trim() }
            }).catch(() => { });
        }
        setEditingId(null);
    };

    const handleDeleteMsg = (msgId: string, deleteType: 'for_me' | 'for_everyone') => {
        DB.deletePrivateMessage(msgId, deleteType, currentUser.id);
        if (deleteType === 'for_everyone' && roomChannelRef.current && isChannelReady) {
            roomChannelRef.current.send({
                type: 'broadcast',
                event: 'group-delete',
                payload: { msgId, deleteType }
            }).catch(() => { });
        }
    };

    const handleUpdateReaction = (msgId: string, emoji: string | null) => {
        // Optimistic UI Update: update local state immediately
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
                const reactions = { ...(m.reactions || {}) };
                if (emoji) reactions[currentUser.id] = emoji;
                else delete reactions[currentUser.id];
                return { ...m, reactions };
            }
            return m;
        }));

        DB.updatePrivateMessageReactions(msgId, currentUser.id, emoji);

        if (roomChannelRef.current && isChannelReady) {
            roomChannelRef.current.send({
                type: 'broadcast',
                event: 'group-reaction',
                payload: { msgId, userId: currentUser.id, emoji }
            }).catch(() => { });
        }
        setLongPressedMsgId(null);
    };

    const handlePinMsg = (msgId: string) => {
        DB.pinGroupMessage(localRoom.id, msgId);
        setLongPressedMsgId(null);
    };

    const handleUnpinMsg = (msgId: string) => {
        DB.unpinGroupMessage(localRoom.id, msgId);
        setLongPressedMsgId(null);
    };

    const pinnedMessages = messages.filter(m => localRoom.pinnedMessageIds?.includes(m.id) && !m.isDeletedForEveryone);

    const handleTyping = (text: string) => {
        const wasTyping = newMessage.trim().length > 0;
        const isTypingNow = text.trim().length > 0;

        setNewMessage(text);

        if (wasTyping !== isTypingNow) {
            DB.setTypingStatus(currentUser.id, localRoom.id, isTypingNow);
            if (roomChannelRef.current && isChannelReady) {
                roomChannelRef.current.send({
                    type: 'broadcast',
                    event: 'room-typing',
                    payload: { userId: currentUser.id, isTyping: isTypingNow }
                }).catch(() => { });
            }
        }
    };

    const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) { touchStartXY.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
        pressTimer.current = setTimeout(() => {
            if ('touches' in e && touchStartXY.current) {
                const target = e.target as HTMLElement;
                const bubble = target.closest('[id^="bubble-"]');
                if (bubble) { const msgId = bubble.id.replace('bubble-', ''); setLongPressedMsgId(msgId); }
            }
        }, 500);
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

    const handleToggleBlock = (memberId: string) => {
        if (!meData) return;
        const currentBlocks = meData.blockedUsers || [];
        let newBlocks = [...currentBlocks];
        if (newBlocks.includes(memberId)) {
            newBlocks = newBlocks.filter(id => id !== memberId);
        } else {
            newBlocks.push(memberId);
        }
        DB.updateStudent(currentUser.id, { blockedUsers: newBlocks });
        setMeData({ ...meData, blockedUsers: newBlocks });
        const updatedStudents = DB.getStudents();
        setAllStudents(updatedStudents);
    };

    if (!isOpen) return null;

    const isAdmin = localRoom.admins.includes(currentUser.id);

    const chatBgStyle = React.useMemo(() => {
        const bg = selectedBg;
        if (!bg) {
            return {
                backgroundImage: `linear-gradient(rgba(11, 20, 26, 0.92), rgba(11, 20, 26, 0.92)), url('/images/whatsapp-bg.png')`,
                backgroundSize: 'cover'
            };
        }
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

    return createPortal(
        <div className="fixed inset-0 z-[999999] bg-[#0b141a] sm:bg-black/90 flex justify-center items-center" dir="rtl">
            <div className="w-full h-full sm:h-[95vh] sm:max-w-3xl sm:border border-white/10 sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-opacity-95" style={chatBgStyle}>
                {/* Header / Top Action Bar */}
                {longPressedMsgId ? (() => {
                    const selectedMsg = messages.find((m: any) => m.id === longPressedMsgId);
                    if (!selectedMsg) return null;
                    const isMe = selectedMsg.senderId === currentUser.id;
                    const isDeleted = selectedMsg.isDeletedForEveryone;

                    return (
                        <div className="flex items-center justify-between px-2 py-2 sm:px-4 sm:py-3 border-b border-white/10 relative z-30 min-h-[64px]" style={{ backgroundColor: '#0b141a' }}>
                            <div className="flex items-center gap-4 text-white">
                                <button onClick={() => setLongPressedMsgId(null)} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white">
                                    <ArrowRight size={22} className="sm:w-6 sm:h-6" />
                                </button>
                                <span className="font-bold text-[19px]">1</span>
                            </div>

                            <div className="flex items-center gap-0.5 sm:gap-2 text-white">
                                {!isDeleted && (
                                    <button onClick={() => { setReplyingTo(selectedMsg); setLongPressedMsgId(null); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="رد">
                                        <CornerUpRight size={22} className="opacity-80 sm:w-6 sm:h-6" />
                                    </button>
                                )}
                                <button onClick={() => { DB.togglePrivateMessageStar(selectedMsg.id); setLongPressedMsgId(null); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="تمييز بنجمة">
                                    <Star size={22} className={selectedMsg.isStarred ? "text-yellow-500 fill-current sm:w-6 sm:h-6" : "opacity-80 sm:w-6 sm:h-6"} />
                                </button>
                                {!isDeleted && (
                                    <button onClick={() => { localRoom.pinnedMessageIds?.includes(selectedMsg.id) ? handleUnpinMsg(selectedMsg.id) : handlePinMsg(selectedMsg.id); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title={localRoom.pinnedMessageIds?.includes(selectedMsg.id) ? "إلغاء التثبيت" : "تثبيت"}>
                                        <Pin size={21} className={localRoom.pinnedMessageIds?.includes(selectedMsg.id) ? "text-emerald-400 rotate-45 sm:w-6 sm:h-6" : "opacity-80 sm:w-6 sm:h-6"} />
                                    </button>
                                )}
                                <button onClick={() => { handleDeleteMsg(selectedMsg.id, 'for_me'); setLongPressedMsgId(null); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="حذف">
                                    <Trash2 size={22} className="opacity-80 sm:w-6 sm:h-6" />
                                </button>
                                {isMe && !isDeleted && (
                                    <button onClick={() => { setShowMessageInfo(selectedMsg); setLongPressedMsgId(null); }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="معلومات">
                                        <Info size={22} className="opacity-80 sm:w-6 sm:h-6" />
                                    </button>
                                )}
                                <button onClick={() => {
                                    window.dispatchEvent(new CustomEvent('nt-start-global-forward', { detail: selectedMsg }));
                                    setLongPressedMsgId(null);
                                    onClose();
                                }} className="p-2 rounded-full transition-all active:scale-90 hover:bg-white/10 text-white" title="تحويل">
                                    <CornerUpLeft size={22} className="opacity-80 sm:w-6 sm:h-6" />
                                </button>
                                { /* More menu removed */}

                            </div>
                        </div>
                    );
                })() : (
                    <div className="bg-[#202c33] shrink-0 p-2 sm:p-3 flex items-center justify-between border-b border-white/5 relative z-20 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-hidden cursor-pointer" onClick={() => setShowGroupInfo(true)}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="flex items-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-95 group shadow-lg border border-white/10 shrink-0"
                            >
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" style={{ color: theme.primary }} />
                                <span className="font-bold text-[10px]">رجوع</span>
                            </button>

                            <div
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#111b21] flex items-center justify-center relative shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (localRoom.avatarUrl) {
                                        window.dispatchEvent(new CustomEvent('nt-open-avatar', {
                                            detail: { url: localRoom.avatarUrl, name: localRoom.name }
                                        }));
                                    }
                                }}
                            >
                                {localRoom.avatarUrl ? (
                                    <img src={localRoom.avatarUrl} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <Users size={20} style={{ color: theme.primary }} />
                                )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 pr-1 text-right">
                                <span className="text-[#e9edef] font-bold text-[15px] sm:text-[17px] leading-tight truncate w-full flex items-center gap-2">
                                    {localRoom.name}
                                    <div className="flex items-center gap-1">
                                        {quota.packagePoints !== undefined && quota.packagePoints > 0 && (
                                            <span className="text-[8px] sm:text-[9.5px] font-black bg-amber-500/10 px-2 py-0.5 rounded-full text-amber-500 border border-amber-500/10 shadow-sm">{quota.packagePoints} باقة ✨</span>
                                        )}
                                        <span className={`text-[8px] sm:text-[9.5px] font-black ${quota.remaining > 0 ? 'bg-white/10 text-emerald-400' : 'bg-red-500/10 text-red-500'} px-2 py-0.5 rounded-full border border-white/5`}>{quota.remaining} رسائل</span>
                                    </div>
                                </span>
                                <span className="text-[11px] sm:text-[12px] font-normal text-gray-400 truncate mt-0.5 leading-tight w-full">
                                    {Object.keys(typingUsers).length > 0 ? (
                                        <span className="text-emerald-400 font-bold">
                                            {Object.keys(typingUsers).map(id => allStudents.find(s => s.id === id)?.username).join(', ')} يكتب الآن...
                                        </span>
                                    ) : (
                                        localRoom.members.map(m => currentUser.id === m ? 'أنت' : allStudents.find(s => s.id === m)?.username).join('، ')
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Call & Menu Buttons */}
                        <div className="flex items-center gap-1 sm:gap-2 text-white shrink-0 pl-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!appSettings.allowVideoCalls) { setShowFeatureLocked('video'); return; }
                                    window.dispatchEvent(new CustomEvent('nt-start-call', { detail: { userId: localRoom.id, userName: localRoom.name, isVideo: true, avatarUrl: localRoom.avatarUrl, isGroupCall: true, groupMembers: localRoom.members } }));
                                }}
                                className={cn("p-2 rounded-full hover:bg-white/10 transition-colors", !appSettings.allowVideoCalls ? "text-red-500 opacity-60" : "text-white")}
                                title="مكالمة فيديو المجموعات"
                            >
                                <Video size={20} className="sm:w-6 sm:h-6" />
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!appSettings.allowVoiceCalls) { setShowFeatureLocked('voice'); return; }
                                    window.dispatchEvent(new CustomEvent('nt-start-call', { detail: { userId: localRoom.id, userName: localRoom.name, isVideo: false, avatarUrl: localRoom.avatarUrl, isGroupCall: true, groupMembers: localRoom.members } }));
                                }}
                                className={cn("p-2 rounded-full hover:bg-white/10 transition-colors", !appSettings.allowVoiceCalls ? "text-red-500 opacity-60" : "text-white")}
                                title="مكالمة صوتية المجموعات"
                            >
                                <Phone size={19} className="sm:w-5 sm:h-5" />
                            </button>

                            {/* More menu removed as requested */}

                        </div>
                    </div>
                )}

                {showBgPicker && (
                    <div className="absolute inset-0 z-[999] bg-[#0b141a] flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-[#202c33] shadow-md relative z-10 shrink-0">
                            <button onClick={() => setShowBgPicker(false)} className="p-2 -mr-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-all">
                                <ArrowRight size={22} className="sm:w-6 sm:h-6" />
                            </button>
                            <h2 className="text-white font-bold text-lg">خلفية الروم</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto w-full no-scrollbar p-0 bg-[#111b21] pb-20 pointer-events-auto">
                            {CHAT_BACKGROUND_CATEGORIES.map(cat => (
                                <div key={cat.name} className="mt-4 px-4">
                                    <h3 className="text-emerald-500 font-bold text-[13px] mb-3 sticky top-0 py-2 bg-[#111b21]/90 z-10 w-full block shadow-sm border-b border-white/5">{cat.name}</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {cat.backgrounds.map((bg, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedBg(bg);
                                                    localStorage.setItem('nt_chat_bg_' + currentUser.id, bg);
                                                    DB._syncToSupabase('nt_chat_bg_' + currentUser.id, bg);
                                                    setShowBgPicker(false);
                                                }}
                                                className={`aspect-[9/16] rounded-xl overflow-hidden relative cursor-pointer hover:opacity-90 transition-all ${selectedBg === bg ? 'ring-2 ring-emerald-500 scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'ring-1 ring-white/10 opacity-80 border-2 border-transparent hover:border-white/20'}`}
                                                style={(() => {
                                                    const isImg = bg.includes('url');
                                                    const isSvg = bg.includes('svg');
                                                    if (!isImg) return { backgroundColor: bg };
                                                    const comps = bg.split(') ');
                                                    return { background: `${comps[0]}) center / ${isSvg ? 'auto' : 'cover'} ${isSvg ? 'repeat' : 'no-repeat'} ${comps[1] || '#1e293b'}` };
                                                })()}
                                            >
                                                {selectedBg === bg && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-in zoom-in">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center p-1">
                                                            <Check size={20} className="text-white drop-shadow-md" strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                )}
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
                    <div className="bg-[#202c33] border-b border-white/10 px-4 py-2 flex items-center gap-3 relative z-30 shadow-md">
                        <Pin size={14} className="text-emerald-500 rotate-45 shrink-0" />
                        <div className="flex-1 overflow-hidden" onClick={() => {
                            const el = document.getElementById(`bubble-${pinnedMessages[pinnedMessages.length - 1].id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}>
                            <div className="text-[11px] font-bold text-emerald-500 mb-0.5">رسالة مثبتة</div>
                            <div className="text-[12px] text-gray-300 truncate font-semibold">
                                {pinnedMessages[pinnedMessages.length - 1].text}
                            </div>
                        </div>
                        <button onClick={() => handleUnpinMsg(pinnedMessages[pinnedMessages.length - 1].id)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-500">
                            <X size={14} />
                        </button>
                    </div>
                )}

                {showSearch && (
                    <div className="flex items-center gap-2 p-2 bg-[#202c33] border-b border-white/5 relative z-20 shrink-0">
                        <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
                            <ArrowRight size={20} />
                        </button>
                        <input
                            autoFocus
                            type="text"
                            placeholder="بحث في المجموعة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-white outline-none border-none placeholder-gray-500 text-[14.5px] text-right"
                            dir="rtl"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* Messages Area */}
                <div
                    ref={messagesEndRef.current ? null : null} // Placeholder since it's a ref for scroll
                    id="group-chat-scroll-container"
                    className="flex-1 overflow-y-auto w-full max-w-full overflow-x-hidden flex flex-col p-4 sm:p-6 pb-8 sm:pb-10 gap-2 sm:gap-3 custom-scrollbar relative z-10"
                    dir="ltr"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehaviorY: 'contain',
                        overscrollBehaviorX: 'none',
                        touchAction: 'pan-y',
                        willChange: 'scroll-position',
                        contain: 'content',
                        ...(() => {
                            if (!selectedBg) return {};
                            const isImg = selectedBg.includes('url');
                            const isSvg = selectedBg.includes('svg');
                            if (!isImg) return { backgroundColor: selectedBg };
                            const comps = selectedBg.split(') ');
                            return { background: `${comps[0]}) center / ${isSvg ? 'auto' : 'cover'} ${isSvg ? 'repeat' : 'no-repeat'} ${comps[1] || '#111b21'}` };
                        })()
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
                    {messages.length === 0 && (
                        <div className="bg-[#1e293b]/50 text-gray-400 text-[11px] sm:text-xs text-center py-2 px-3 sm:px-4 rounded-xl mx-auto my-3 max-w-[85%] border border-white/5 font-bold leading-relaxed shadow-sm">
                            🔒 الرسائل والمكالمات الخاصة في هذه المجموعة مشفرة تماماً.
                        </div>
                    )}

                    {messages.filter(msg => !searchQuery || msg.text.toLowerCase().includes(searchQuery.toLowerCase())).map((msg, index) => {
                        if (msg.isDeletedForEveryone || (msg.senderId === currentUser.id && msg.isDeletedForSender)) return null;

                        const isMe = msg.senderId === currentUser.id;
                        const isSystem = msg.type === 'system';
                        const isReply = !!msg.replyToId;
                        const isCall = msg.isCall || msg.type === 'call' || msg.text?.includes('https://pulse-chat.com/call/');
                        const sender = allStudents.find(s => s.id === msg.senderId);

                        const colors = ['text-blue-400', 'text-pink-400', 'text-purple-400', 'text-orange-400', 'text-indigo-400', 'text-red-400'];
                        const senderColor = colors[(msg.senderId || '').charCodeAt(0) % colors.length];

                        const isDeleted = msg.isDeletedForEveryone;

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="w-full flex justify-center my-2 select-none">
                                    <div className="bg-[#1e293b]/80 border border-[#00a884]/20 py-1.5 px-5 rounded-full shadow-lg flex items-center justify-center gap-2 max-w-[90%]">
                                        <span className="text-[11px] font-black text-gray-200">{msg.text}</span>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={cn("message-animation mb-1 flex flex-col", isMe ? 'items-end' : 'items-start')} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                <div className={cn("flex flex-col relative", isMe ? 'items-end' : 'items-start')}>
                                    <div
                                        id={`bubble-${msg.id}`}
                                        onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
                                        onTouchStart={handlePressStart} onTouchMove={handleTouchMove} onTouchEnd={handlePressEnd} onTouchCancel={handlePressEnd}
                                        onContextMenu={(e) => { e.preventDefault(); setLongPressedMsgId(msg.id); }}
                                        className={cn(
                                            "p-2 sm:p-2.5 rounded-xl relative max-w-full text-white shadow-md border border-white/5",
                                            isDeleted ? 'opacity-50 italic border border-white/10 bg-transparent text-gray-400' : (isMe ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#2a2a2a] rounded-tl-none'),
                                            isCall ? "min-w-[240px]" : "min-w-[100px]"
                                        )}
                                    >
                                        {!isDeleted && (
                                            <div className={cn("absolute top-0 w-3 h-3", isMe ? "-right-2 text-[#005c4b]" : "-left-2 text-[#2a2a2a]")}>
                                                <svg viewBox="0 0 8 13" className="w-full h-full fill-current">
                                                    {isMe ? <path d="M0 0.5H5.5C6.12 0.5 6.46 1.48 5.76 1.94L0 6.5V0.5Z" /> : <path d="M8 0.5H2.5C1.88 0.5 1.54 1.48 2.24 1.94L8 6.5V0.5Z" />}
                                                </svg>
                                            </div>
                                        )}

                                        {!isDeleted && (
                                            <div className="flex items-center gap-1.5 mb-1 cursor-pointer transition-all hover:scale-[1.01]" onClick={(e) => { e.stopPropagation(); if (isMe) return; if (sender) window.dispatchEvent(new CustomEvent('nt-open-student-profile', { detail: { studentId: sender.id } })); }}>
                                                <span className={cn("text-[12px] font-black", isMe ? "text-emerald-400" : senderColor)}>
                                                    {isMe ? 'أنت' : (currentUser.nicknames?.[msg.senderId] || sender?.username || 'مستخدم')}
                                                </span>
                                                {localRoom.admins.includes(msg.senderId) && (
                                                    <span className="text-[9px] text-gray-400 border border-gray-600/50 px-1 rounded bg-black/20">المشرف</span>
                                                )}
                                            </div>
                                        )}

                                        {longPressedMsgId === msg.id && !isDeleted && (
                                            <div
                                                className={cn("absolute -top-12 z-[100] bg-[#233138] rounded-full border border-white/10 shadow-2xl flex items-center gap-2 p-1 px-3 max-w-[280px] overflow-x-auto no-scrollbar custom-emoji-scroll touch-pan-x", isMe ? 'right-0' : 'left-0')}
                                                style={{ WebkitOverflowScrolling: 'touch', pointerEvents: 'auto' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {REACTION_EMOJIS.map((emoji: string) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const currentReaction = msg.reactions?.[currentUser.id];
                                                            handleUpdateReaction(msg.id, currentReaction === emoji ? null : emoji);
                                                        }}
                                                        className={cn("text-xl p-1 shrink-0", msg.reactions?.[currentUser.id] === emoji ? 'bg-emerald-500/20 rounded-full' : '')}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {editingId === msg.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]" dir="rtl">
                                                <textarea autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-white/5 border-none outline-none text-inherit text-sm font-bold resize-none p-1 rounded min-h-[60px]" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdateMsg(msg.id, editValue); } if (e.key === 'Escape') setEditingId(null); }} />
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
                                                                if (msg.contactId && onStartPrivateChat) onStartPrivateChat(msg.contactId, msg.contactName || "");
                                                            }}
                                                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[11px] font-black transition-all active:scale-95 border border-white/5"
                                                        >
                                                            مراسلة
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex flex-col relative pb-4">
                                                    {isReply && !isDeleted && (
                                                        <div className="bg-black/20 border-r-4 p-2 mb-2 rounded w-full min-w-[120px]" style={{ borderColor: '#005c4b' }} dir="rtl">
                                                            <span className="text-[11px] font-bold block mb-1" style={{ color: '#005c4b' }}>
                                                                {msg.replyToSender === currentUser.id ? 'أنت' : allStudents.find(s => s.id === msg.replyToSender)?.username}
                                                            </span>
                                                            <span className="text-gray-300 text-[11px] truncate block font-bold">{msg.replyToText}</span>
                                                        </div>
                                                    )}

                                                    {isDeleted ? (
                                                        <span className="flex items-center gap-2 text-gray-500 italic"><Trash2 size={14} className="opacity-50" /> تم حذف هذه الرسالة</span>
                                                    ) : isCall ? (
                                                        <div className="flex items-center justify-start gap-3 select-none pt-1 pb-1 min-w-[220px] pr-1 cursor-pointer w-full group/call" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('nt-start-call', { detail: { userId: msg.senderId === currentUser.id ? msg.receiverId : msg.senderId, userName: localRoom.name, isVideo: msg.isVideoCall, avatarUrl: localRoom.avatarUrl, isGroupCall: true, groupMembers: localRoom.members } })); }}>
                                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors", (msg.callStatus === 'missed' && !isMe) ? 'bg-red-500/20' : (isMe ? 'bg-black/10' : 'bg-emerald-500/20'))}>
                                                                {msg.isVideoCall ? <Video size={18} className={(msg.callStatus === 'missed' && !isMe) ? 'text-red-500' : 'text-emerald-500'} /> : <Phone size={18} className={(msg.callStatus === 'missed' && !isMe) ? 'text-red-500' : 'text-emerald-500'} />}
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-center text-right border-l border-white/10 pl-3">
                                                                <span className={cn("font-black text-[13.5px] whitespace-nowrap", (msg.callStatus === 'missed' && !isMe) ? 'text-red-500' : 'text-white')}>
                                                                    {msg.isVideoCall ? 'مكالمة فيديو' : 'مكالمة صوتية'}
                                                                    {msg.callStatus === 'missed' ? ' فائتة' : (isMe ? ' صادرة' : ' واردة')}
                                                                </span>
                                                                {msg.callDuration ? <span className="text-[11px] font-bold opacity-75 mt-0.5 text-gray-300">{Math.floor(msg.callDuration / 60)}:{(msg.callDuration % 60).toString().padStart(2, '0')}</span> : null}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words pl-14 sm:pl-16 font-bold" dir="rtl">
                                                            {renderText(msg.text)} {msg.is_edited && <span className="text-[10px] opacity-40 ml-1.5 font-normal">(معدلة)</span>}
                                                        </p>
                                                    )}

                                                    <div className="absolute left-0 bottom-[-4px] flex items-center gap-1 opacity-70 pointer-events-none">
                                                        {msg.isStarred && <Star size={10} className="text-gray-400 opacity-80 fill-current" />}
                                                        <span className="text-[9.5px] font-bold" dir="ltr">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && !isDeleted && (
                                                            <CheckCheck size={13} className={msg.isRead ? "text-[#34b7f1]" : "text-gray-400"} />
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && !isDeleted && (
                                            <div
                                                className={cn("absolute -bottom-3 bg-[#202c33] rounded-full p-0.5 px-2 shadow-md border border-white/10 text-[10px] z-20 cursor-pointer flex items-center gap-1 min-w-[32px]", isMe ? "right-2" : "left-2")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowReactionDetails(msg);
                                                }}
                                            >
                                                <div className="flex -space-x-1 rtl:space-x-reverse">
                                                    {Array.from(new Set(Object.values(msg.reactions))).slice(0, 3).map((emoji, idx) => (
                                                        <span key={idx} className="relative z-10">{emoji as string}</span>
                                                    ))}
                                                </div>
                                                <span className="text-gray-400 font-black">{Object.keys(msg.reactions).length}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Input Area */}
                <div className="p-2 sm:p-3 bg-[#202c33] relative z-20 text-center pb-2 sm:pb-3 shrink-0">
                    {/* Emoji Picker Overlay */}
                    {showEmojiPicker && (
                        <div
                            className="absolute bottom-[calc(100%+8px)] sm:bottom-[calc(100%+10px)] right-2 left-2 sm:right-4 sm:left-4 bg-[#1e293b] border border-white/10 rounded-[2rem] h-[280px] sm:h-[320px] shadow-2xl overflow-hidden flex flex-col z-50 text-right overscroll-y-contain custom-emoji-scroll"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center text-sm font-black text-white px-5">
                                <span>الملصقات والإيموجي</span>
                                <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white p-1 rounded-full"><X size={16} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-7 sm:grid-cols-8 gap-2 p-3 content-start overscroll-y-contain">
                                {["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🤲", "👐", "🙌", "👏", "🤝", "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️", "🙏", "🦶", "🦵", "🦿", "💄", "💋", "👄", "🦷", "👅", "👂", "🦻", "👃", "👣", "👁", "👀", "🧠", "🗣", "👤", "👥"].map((emoji, i) => (
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

                    {replyingTo && (
                        <div className="flex items-start justify-between bg-[#1e293b] p-3 rounded-t-xl border-l-4 border-emerald-500 mb-[-10px] pb-4 ml-14 mr-1">
                            <div className="flex-1 pr-2 text-right">
                                <div className="text-xs font-black mb-1 text-emerald-500">{replyingTo.senderId === currentUser.id ? 'أنت' : allStudents.find(s => s.id === replyingTo.senderId)?.username}</div>
                                <div className="text-xs text-gray-300 line-clamp-1">{replyingTo.isDeletedForEveryone ? 'تم مسح هذه الرسالة' : replyingTo.text}</div>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:bg-white/10 hover:text-white rounded-full shrink-0">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col w-full gap-2 px-1 mb-2">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                    <span className={`text-[10px] font-black ${quota.remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{quota.remaining}</span>
                                    <span className="text-[9px] font-bold text-gray-400">يومي</span>
                                </div>
                                {quota.packagePoints !== undefined && quota.packagePoints > 0 && (
                                    <div className="flex items-center gap-1.5 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
                                        <span className="text-[10px] font-black text-amber-400">{quota.packagePoints}</span>
                                        <span className="text-[9px] font-bold text-amber-500/70">باقة</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 mx-4 h-1 bg-white/10 rounded-full overflow-hidden relative">
                                <div
                                    className={`absolute inset-y-0 right-0 ${quota.remaining > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: quota.remaining > 0 ? `${(quota.remaining / 10) * 100}%` : `${(Math.min(quota.packagePoints || 0, 50) / 50) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-end gap-1.5 w-full mx-auto" dir="ltr">
                        <button
                            className={`w-11 h-11 sm:w-[48px] sm:h-[48px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#00c99f] text-[#111b21] disabled:bg-[#00a884]/50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg mt-0.5 border-0`}
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() && !replyingTo}
                        >
                            <span className="text-black font-black text-[22px] sm:text-[24px] mb-0.5 leading-none transition-transform hover:-translate-x-0.5 select-none" style={{ fontFamily: 'monospace' }}>&lt;</span>
                        </button>
                        <div className="flex items-center justify-between gap-1.5 bg-[#2a3942] rounded-full px-1.5 py-1 relative z-10 w-full shadow-lg min-h-[46px]" dir="rtl">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-white transition-all text-2xl grayscale hover:grayscale-0"
                                title="ملصقات وايموجي"
                            >
                                😀
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => handleTyping(e.target.value)}
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
                </div>

                {/* Overlays */}

                {
                    showBgPicker && (
                        <div className="absolute inset-0 z-[9999999] bg-[#0b141a] sm:bg-[#111b21] flex flex-col">
                            <div className="bg-[#202c33] shrink-0 p-4 flex items-center gap-4 border-b border-white/5 shadow-sm">
                                <button onClick={() => setShowBgPicker(false)} className="text-gray-400 hover:text-white p-2">
                                    <X size={24} />
                                </button>
                                <span className="text-[#e9edef] font-bold text-lg">خلفية الدردشة</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
                                {CHAT_BACKGROUND_CATEGORIES.map((category, catIndex) => (
                                    <div key={catIndex}>
                                        <h3 className="text-white text-lg font-bold mb-4">{category.name}</h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                            {category.backgrounds.map((bg, bgIndex) => (
                                                <div
                                                    key={bgIndex}
                                                    className={`w-full aspect-square rounded-lg shadow-lg cursor-pointer relative overflow-hidden border-2 ${selectedBg === bg ? 'border-emerald-500' : 'border-transparent'}`}
                                                    style={bg.includes('url') ? { background: bg, backgroundSize: bg.includes('svg') ? 'auto' : 'cover', backgroundRepeat: bg.includes('svg') ? 'repeat' : 'no-repeat' } : { backgroundColor: bg }}
                                                    onClick={() => {
                                                        setSelectedBg(bg);
                                                        localStorage.setItem('nt_chat_bg_' + currentUser.id, bg);
                                                    }}
                                                >
                                                    {selectedBg === bg && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                            <Check size={32} className="text-emerald-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setSelectedBg(null);
                                        localStorage.removeItem('nt_chat_bg_' + currentUser.id);
                                    }}
                                    className="mt-6 px-6 py-3 bg-red-500/20 text-red-400 rounded-full font-bold hover:bg-red-500/30 transition-colors"
                                >
                                    إعادة تعيين الخلفية
                                </button>
                            </div>
                        </div>
                    )
                }

                {
                    showBlockModal && (
                        <div className="absolute inset-0 z-[9999999] bg-[#0b141a] sm:bg-[#111b21] flex flex-col">
                            <div className="bg-[#202c33] shrink-0 p-4 flex items-center gap-4 border-b border-white/5 shadow-sm">
                                <button onClick={() => setShowBlockModal(false)} className="text-gray-400 hover:text-white p-2">
                                    <X size={24} />
                                </button>
                                <span className="text-[#e9edef] font-bold text-lg">حظر / إلغاء حظر المشتركين</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
                                <p className="text-gray-400 text-sm mb-4">
                                    يمكنك حظر المشتركين لمنعهم من إرسال الرسائل إليك في هذه المجموعة.
                                </p>
                                {localRoom.members.filter(m => m !== currentUser.id).map(memberId => {
                                    const student = allStudents.find(s => s.id === memberId);
                                    if (!student) return null;
                                    const isBlocked = meData?.blockedUsers?.includes(memberId);
                                    return (
                                        <div key={memberId} className="flex items-center justify-between bg-[#2a3942] p-3 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 shrink-0">
                                                    {student.profilePictureUrl || student.avatarUrl ? <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-2 text-white/40" />}
                                                </div>
                                                <span className="text-white font-bold">{student.username}</span>
                                            </div>
                                            <button
                                                onClick={() => handleToggleBlock(memberId)}
                                                className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${isBlocked ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                                            >
                                                {isBlocked ? 'إلغاء الحظر' : 'حظر'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }

                {
                    showGroupInfo && (
                        <div className="absolute inset-0 z-[9999999] bg-[#0b141a] sm:bg-[#111b21] flex flex-col">
                            <div className="bg-[#202c33] shrink-0 p-4 flex items-center gap-4 border-b border-white/5 shadow-sm">
                                <button onClick={() => setShowGroupInfo(false)} className="text-gray-400 hover:text-white p-2">
                                    <X size={24} />
                                </button>
                                <span className="text-[#e9edef] font-bold text-lg">معلومات المجموعة</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center p-6 gap-6 relative">

                                <div className="relative">
                                    <div className="w-40 h-40 rounded-full bg-[#1e293b] border-2 shadow-2xl flex items-center justify-center transition-transform hover:scale-105 relative group overflow-hidden" style={{ borderColor: `${theme.primary}30` }}>
                                        {localRoom.avatarUrl ? (
                                            <img src={localRoom.avatarUrl} className="w-full h-full object-cover group-hover:scale-110" />
                                        ) : (
                                            <Users size={64} style={{ color: theme.primary }} className="opacity-80 group-hover:scale-110" />
                                        )}

                                        {isAdmin && (
                                            <div className="absolute inset-0 z-10">
                                                {!localRoom.avatarUrl && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity pointer-events-none">
                                                        <Camera size={28} className="text-white mb-2" />
                                                        <span className="text-white text-xs font-bold w-full text-center">تغيير الصورة</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const img = new Image();
                                                                img.onload = () => {
                                                                    const canvas = document.createElement('canvas');
                                                                    canvas.width = 150; canvas.height = 150;
                                                                    const ctx = canvas.getContext('2d');
                                                                    ctx?.drawImage(img, 0, 0, 150, 150);
                                                                    DB.updateGroupRoom(localRoom.id, { avatarUrl: canvas.toDataURL('image/jpeg', 0.8) });
                                                                };
                                                                img.src = reader.result as string;
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                    title="تغيير الصورة"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {isAdmin && (
                                        <div className="absolute z-30 cursor-pointer hover:scale-110 transition-transform bottom-0 right-2">
                                            <div className="bg-[#00a884] rounded-full p-2.5 shadow-lg border-2 border-[#111b21] relative">
                                                <Camera size={18} className="text-white relative z-10 pointer-events-none" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const img = new Image();
                                                                img.onload = () => {
                                                                    const canvas = document.createElement('canvas');
                                                                    canvas.width = 150; canvas.height = 150;
                                                                    const ctx = canvas.getContext('2d');
                                                                    ctx?.drawImage(img, 0, 0, 150, 150);
                                                                    DB.updateGroupRoom(localRoom.id, { avatarUrl: canvas.toDataURL('image/jpeg', 0.8) });
                                                                };
                                                                img.src = reader.result as string;
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                    title="تغيير الصورة"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center w-full px-4 border-b border-white/5 pb-4">
                                    <h2 className="text-2xl font-black text-white">{localRoom.name}</h2>
                                    <p className="text-sm text-gray-400 mt-2">مجموعة • {localRoom.members.length} عضو</p>
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            const link = `https://naabdellttarrekh.com/Amr_lotfy_${Math.floor(Math.random() * 100000)}/join/${localRoom.id}?ref=${currentUser.id}`;
                                            navigator.clipboard.writeText(link);
                                            alert("تم نسخ رابط الدعوة:\n" + link);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold border border-white/10 hover:bg-white/5 active:scale-95 transition-all"
                                        style={{ color: theme.primary }}
                                    >
                                        <Link size={18} />
                                        رابط الدعوة
                                    </button>
                                </div>

                                <div className="w-full bg-[#111b21] sm:bg-[#202c33] sm:rounded-xl shadow-sm p-4 w-full" dir="rtl">
                                    <div className="text-xs font-black mb-4 flex items-center justify-between" style={{ color: theme.primary }}>
                                        <span>{localRoom.members.length} أعضاء</span>
                                        <button
                                            onClick={() => setShowAddParticipant(true)}
                                            className="p-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                            style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
                                        >
                                            <Users size={14} /> إضافة أعضاء
                                        </button>
                                    </div>

                                    {isAdmin && localRoom.pendingRequests?.length > 0 && (
                                        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                            <div className="text-yellow-500 text-xs font-black mb-3">طلبات الانضمام المعلقة ({localRoom.pendingRequests.length})</div>
                                            <div className="flex flex-col gap-1" dir="rtl">
                                                {localRoom.pendingRequests.map(req => {
                                                    const student = allStudents.find(s => s.id === req.userId);
                                                    const inviter = allStudents.find(s => s.id === req.invitedBy);
                                                    if (!student) return null;
                                                    return (
                                                        <div key={req.userId} className="flex flex-col gap-1 bg-[#111b21] p-2 rounded-lg relative overflow-hidden">
                                                            {inviter && (
                                                                <div className="text-[10px] text-gray-400 w-full mb-1">دعوة من: <span className="text-white font-bold">{inviter.username}</span></div>
                                                            )}
                                                            <div className="flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-black/20 shrink-0">
                                                                        {student.profilePictureUrl || student.avatarUrl ? <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-1.5 text-white/40" />}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-white">{student.username}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            DB.updateGroupRoom(localRoom.id, {
                                                                                members: [...localRoom.members, req.userId],
                                                                                pendingRequests: localRoom.pendingRequests.filter(r => r.userId !== req.userId)
                                                                            });
                                                                            DB.addPrivateMessage({
                                                                                id: `sys_${Date.now()}`,
                                                                                senderId: 'SYSTEM',
                                                                                receiverId: localRoom.id,
                                                                                text: inviter ? `انضم ${student.username} بواسطة ${inviter.username}` : `تم قبول انضمام ${student.username} بواسطة المشرف ${currentUser.username}`,
                                                                                timestamp: Date.now(),
                                                                                isRead: false,
                                                                                isDelivered: false,
                                                                                isDeletedForSender: false,
                                                                                isDeletedForMe: false,
                                                                                isDeletedForEveryone: false,
                                                                                type: 'system'
                                                                            });
                                                                        }}
                                                                        className="w-7 h-7 bg-emerald-500/20 text-emerald-500 rounded-md flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
                                                                    >
                                                                        <Check size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            DB.updateGroupRoom(localRoom.id, {
                                                                                pendingRequests: localRoom.pendingRequests.filter(r => r.userId !== req.userId)
                                                                            });
                                                                        }}
                                                                        className="w-7 h-7 bg-red-500/20 text-red-500 rounded-md flex items-center justify-center hover:bg-red-500/30 transition-colors"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1 relative">
                                        {localRoom.members.map(memberId => {
                                            const student = allStudents.find(s => s.id === memberId);
                                            const isMemberAdmin = localRoom.admins.includes(memberId);

                                            return (
                                                <div key={memberId} className="relative">
                                                    <div
                                                        className={`flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors ${selectedMemberContext === memberId ? 'bg-white/10' : ''}`}
                                                        onClick={() => {
                                                            if (isAdmin && memberId !== currentUser.id) {
                                                                setSelectedMemberContext(selectedMemberContext === memberId ? null : memberId);
                                                            }
                                                        }}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            if (isAdmin && memberId !== currentUser.id) {
                                                                setSelectedMemberContext(memberId);
                                                            }
                                                        }}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-white/5 shrink-0 overflow-hidden relative">
                                                            {student?.profilePictureUrl || student?.avatarUrl ? (
                                                                <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={20} className="m-auto mt-2.5 text-white/40" />
                                                            )}
                                                            {memberId !== currentUser.id && DB.getOnlineStatus(memberId) && (
                                                                <div className="absolute -bottom-1 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0b141a] shadow-[0_0_8px_rgba(16,185,129,0.5)] z-20" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 flex flex-col pr-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[14px] font-bold text-[#e9edef]">
                                                                    {currentUser.nicknames?.[memberId] || student?.username} {memberId === currentUser.id && '(أنت)'}
                                                                </span>
                                                                {isMemberAdmin && <span className="text-[10px] font-black border px-2 py-0.5 rounded-lg shadow-sm" style={{ color: theme.primary, borderColor: `${theme.primary}50`, backgroundColor: `${theme.primary}10` }}>مشرف المجموعة</span>}
                                                            </div>
                                                        </div>
                                                        {memberId !== currentUser.id && onStartPrivateChat && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStartPrivateChat(memberId, student?.username || 'مستخدم');
                                                                }}
                                                                className="p-2 text-gray-400 rounded-full transition-colors flex shrink-0"
                                                                style={{
                                                                    ['--hover-color' as any]: theme.primary
                                                                }}
                                                                title="محادثة خاصة"
                                                            >
                                                                <MessageCircle size={18} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {selectedMemberContext === memberId && isAdmin && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#2b3943] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                                            {!isMemberAdmin ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (localRoom.admins.length >= 10) {
                                                                            alert('لا يمكن تعيين أكثر من 10 مشرفين للمجموعة.');
                                                                            return;
                                                                        }
                                                                        DB.updateGroupRoom(localRoom.id, { admins: [...localRoom.admins, memberId] });
                                                                        setSelectedMemberContext(null);
                                                                    }}
                                                                    className="px-4 py-3 text-sm text-white hover:bg-white/5 text-right font-bold transition-colors border-b border-white/5"
                                                                >
                                                                    تعيين مشرف
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        DB.updateGroupRoom(localRoom.id, { admins: localRoom.admins.filter(a => a !== memberId) });
                                                                        setSelectedMemberContext(null);
                                                                    }}
                                                                    className="px-4 py-3 text-sm text-[#e9edef] hover:bg-white/5 text-right font-bold transition-colors border-b border-white/5"
                                                                >
                                                                    إزالة من الإشراف
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    DB.updateGroupRoom(localRoom.id, { members: localRoom.members.filter(m => m !== memberId), admins: localRoom.admins.filter(a => a !== memberId) });

                                                                    DB.addPrivateMessage({
                                                                        id: `sys_${Date.now()}`,
                                                                        senderId: 'SYSTEM',
                                                                        receiverId: localRoom.id,
                                                                        text: `قام المشرف ${currentUser.username} بإزالة ${student?.username} من المجموعة`,
                                                                        timestamp: Date.now(),
                                                                        isRead: false,
                                                                        isDelivered: false,
                                                                        isDeletedForSender: false,
                                                                        isDeletedForMe: false,
                                                                        isDeletedForEveryone: false,
                                                                        type: 'system'
                                                                    });

                                                                    setSelectedMemberContext(null);
                                                                }}
                                                                className="px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 text-right font-bold transition-colors"
                                                            >
                                                                إزالة من الروم
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (confirm('هل أنت متأكد من رغبتك في مغادرة المجموعة؟')) {
                                            DB.updateGroupRoom(localRoom.id, { members: localRoom.members.filter(m => m !== currentUser.id), admins: localRoom.admins.filter(a => a !== currentUser.id) });
                                            DB.addPrivateMessage({
                                                id: `sys_${Date.now()}`,
                                                senderId: 'SYSTEM',
                                                receiverId: localRoom.id,
                                                text: `غادر(ت) ${currentUser.username} المجموعة`,
                                                timestamp: Date.now(),
                                                isRead: false,
                                                isDelivered: false,
                                                isDeletedForSender: false,
                                                isDeletedForMe: false,
                                                isDeletedForEveryone: false,
                                                type: 'system'
                                            });
                                            onClose();
                                        }
                                    }}
                                    className="w-full py-4 mt-4 text-orange-400 font-black flex items-center justify-center gap-2 bg-[#111b21] sm:bg-[#202c33] shadow-sm sm:rounded-xl hover:bg-orange-500/10 transition-colors border-t border-white/5"
                                >
                                    <ArrowRight size={20} />
                                    مغادرة المجموعة
                                </button>

                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            if (confirm('هل أنت متأكد من حذف هذه المجموعة نهائياً بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
                                                DB.deleteGroupRoom(localRoom.id);
                                                onClose();
                                            }
                                        }}
                                        className="w-full py-4 text-red-500 font-black flex items-center justify-center gap-2 bg-[#111b21] sm:bg-[#202c33] shadow-sm sm:rounded-xl hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                        حذف المجموعة
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Add Participant Modal Overlay */}
                {showAddParticipant && (
                    <div className="absolute inset-0 z-[99999999] bg-[#0b141a]/95 flex flex-col">
                        <div className="bg-[#202c33] shrink-0 p-4 flex items-center gap-4 border-b border-white/5 shadow-sm">
                            <button onClick={() => setShowAddParticipant(false)} className="text-gray-400 hover:text-white p-2">
                                <X size={24} />
                            </button>
                            <span className="text-[#e9edef] font-bold text-lg">إضافة أعضاء</span>
                        </div>
                        <div className="p-4 border-b border-white/5 bg-[#111b21]">
                            <input
                                type="text"
                                value={participantSearch}
                                onChange={e => setParticipantSearch(e.target.value)}
                                placeholder="ابحث عن طالب..."
                                className="w-full bg-[#202c33] text-white p-3 rounded-xl border border-transparent focus:border-[#00a884] outline-none placeholder-gray-500 font-bold"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto w-full flex flex-col p-2 gap-1 custom-scrollbar">
                            {allStudents
                                .filter(s => s.id !== currentUser.id && s.level === currentUser.level && !localRoom.members.includes(s.id) && !s.isDeleted)
                                .filter(s => s.username?.toLowerCase().includes(participantSearch.toLowerCase()))
                                .map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
                                        if (isAdmin) {
                                            DB.updateGroupRoom(localRoom.id, { members: [...localRoom.members, student.id] });
                                            DB.addPrivateMessage({
                                                id: `sys_${Date.now()}`,
                                                senderId: 'SYSTEM',
                                                receiverId: localRoom.id,
                                                text: `قام ${currentUser.username} بإضافة ${student.username}`,
                                                timestamp: Date.now(),
                                                isRead: false,
                                                isDelivered: false,
                                                isDeletedForSender: false,
                                                isDeletedForMe: false,
                                                isDeletedForEveryone: false,
                                                type: 'system'
                                            });
                                            setShowAddParticipant(false);
                                        } else {
                                            DB.updateGroupRoom(localRoom.id, { pendingRequests: [...localRoom.pendingRequests, { userId: student.id, invitedBy: currentUser.id, timestamp: Date.now() }] });
                                            alert('تم إرسال طلب إضافة للآدمن للموافقة.');
                                            setShowAddParticipant(false);
                                        }
                                    }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 shrink-0 border border-white/10">
                                                {student.profilePictureUrl || student.avatarUrl ? <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-2 text-white/40" />}
                                            </div>
                                            <span className="text-[14px] font-bold text-white">{student.username}</span>
                                        </div>
                                        <button className="text-[#00a884] text-xs font-black bg-[#00a884]/10 px-3 py-1.5 rounded-lg border border-[#00a884]/20 shadow-sm active:scale-95">اضافة</button>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Use global StudentProfileModal via event instead of local selectedStudentProfile */}

                {/* Quota Exceeded Screen - Chat GPT Style */}
                {quota.remaining <= 0 && (!quota.packagePoints || quota.packagePoints <= 0) && quota.resetTime && (
                    <div className="absolute inset-0 z-[2000000] bg-[#0b141a] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                        <div className="relative mb-12">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                <Users size={56} className="text-emerald-500" />
                            </div>
                            <div className="absolute -top-4 -right-4 bg-emerald-500 text-black font-black text-[10px] px-3 py-1 rounded-full shadow-lg">LIMIT REACHED</div>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-4 tracking-tight">لقد وصلت للحد الأقصى</h2>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 w-full">
                            <p className="text-sm font-bold text-gray-300 leading-relaxed">
                                نعتذر منك، لقد استهلكت جميع الرسائل المتاحة لك اليوم على <span className="text-emerald-400 font-black">Mentora</span>.
                                <br />
                                نحن نقوم بهذا لضمان جودة الخدمة وتركيز الطلاب.
                            </p>
                        </div>

                        <div className="space-y-2 mb-12">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">سيعود القسم للعمل خلال</p>
                            <div className="text-5xl font-black text-white font-mono tabular-nums tracking-tighter" style={{ color: theme.primary }}>
                                {timeLeft || '--:--:--'}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <p className="text-xs font-black text-emerald-400 italic">"العلم صيد والكتابة قيده.. فاجعل قيدك متيناً"</p>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold">يرجى العودة لاحقاً لمواصلة التعلم والتفاعل.</p>
                        </div>

                        <div className="absolute bottom-8 text-[11px] font-black text-gray-600 tracking-widest">
                            Mentora • AI SYSTEM
                        </div>
                    </div>
                )}
            </div>

            {/* Feature Locked Modal inside Group Chat */}
            {showFeatureLocked && (
                <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 bg-black/60" dir="rtl" onClick={() => setShowFeatureLocked(false)}>
                    <div className="bg-[#1e293b] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />

                        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border border-white/5 shadow-lg relative z-10 ${showFeatureLocked === 'video' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {showFeatureLocked === 'video' ? <Video size={32} /> : <Phone size={32} />}
                        </div>

                        <h3 className="text-xl font-black text-white mb-2 relative z-10" style={{ color: theme.primary }}>قريباً</h3>
                        <p className="text-xs font-bold leading-relaxed text-gray-300 relative z-10 mb-5 bg-black/20 p-3 rounded-xl border border-white/5">
                            ميزة {showFeatureLocked === 'video' ? 'مكالمات الفيديو للمجموعات' : 'المكالمات الصوتية للمجموعات'} تحت الإنشاء والتطوير بواسطة مطور المنصة "عمرو لطفي"، وسيتم فتح الأيقونة عند انتهاء التحديث.
                        </p>

                        <button
                            onClick={() => setShowFeatureLocked(false)}
                            className="w-full py-3 rounded-xl font-black text-white transition-all active:scale-95 shadow-lg border border-white/10"
                            style={{ backgroundColor: theme.primary }}
                        >
                            فهمت ذلك
                        </button>
                    </div>
                </div>
            )}

            {/* Message Info Modal */}
            {
                showMessageInfo && (
                    <div className="fixed inset-0 z-[1000000] bg-[#0b141a]/95 flex flex-col sm:items-center sm:justify-center" dir="rtl">
                        <div className="w-full h-full sm:h-[80vh] sm:max-w-md bg-[#111b21] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10">
                            {/* Header */}
                            <div className="bg-[#202c33] px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
                                <button onClick={() => setShowMessageInfo(null)} className="text-gray-400 hover:text-white p-2 rounded-full active:scale-95 transition-all">
                                    <ArrowRight size={24} />
                                </button>
                                <span className="text-[#e9edef] font-bold text-lg sm:text-xl">معلومات الرسالة</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#0b141a]">
                                {/* Message Preview */}
                                <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex flex-col justify-end">
                                    <div className="bg-[#005c4b] p-3 rounded-2xl rounded-tl-none w-fit max-w-[85%] self-end relative shadow-sm border border-white/5 text-white">
                                        <p className="text-[14px] sm:text-[15px] leading-relaxed break-words pl-14 whitespace-pre-wrap">{showMessageInfo.text}</p>
                                        <div className="absolute left-2 bottom-1.5 flex items-center gap-1 opacity-70">
                                            <span className="text-[10px] sm:text-[11px] font-medium" dir="ltr">
                                                {new Date(showMessageInfo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Read by section */}
                                <div className="mt-4 border-t border-white/5 pt-4 pb-4">
                                    <div className="px-4 sm:px-6 mb-3 flex items-center gap-2 text-[#00a884] font-black">
                                        <CheckCheck size={20} className="text-blue-400" /> تمت القراءة من قبل
                                    </div>
                                    <div className="flex flex-col">
                                        {showMessageInfo.readBy && showMessageInfo.readBy.length > 0 ? (
                                            showMessageInfo.readBy
                                                .slice()
                                                .sort((a, b) => b.timestamp - a.timestamp)
                                                .map((readRecord) => {
                                                    const student = allStudents.find(s => s.id === readRecord.userId);
                                                    if (!student) return null;
                                                    return (
                                                        <div key={readRecord.userId} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { if (student) window.dispatchEvent(new CustomEvent('nt-open-student-profile', { detail: { studentId: student.id } })); }}>
                                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-black/20 shrink-0 border border-white/10">
                                                                {student.profilePictureUrl || student.avatarUrl ? (
                                                                    <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User size={24} className="m-auto mt-3 text-white/40" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col">
                                                                <div className="text-white font-bold text-[15px] truncate">{student.username}</div>
                                                                <div className="text-gray-400 text-[11px] mt-1" dir="rtl">
                                                                    {new Date(readRecord.timestamp).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <div className="px-4 sm:px-6 py-6 text-center text-gray-500 font-bold">
                                                لم يقم أحد من المجموعة بقراءة هذه الرسالة بعد.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {showReactionDetails && (
                <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 bg-black/80 rtl" dir="rtl" onClick={() => setShowReactionDetails(null)}>
                    <div className="bg-[#111b21] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-white/5">
                            <h3 className="text-white font-black">تفاعلات الرسالة</h3>
                            <button onClick={() => setShowReactionDetails(null)} className="text-gray-400 hover:text-white p-2">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {Object.entries(showReactionDetails.reactions || {}).map(([userId, emoji]) => {
                                const student = allStudents.find(s => s.id === userId);
                                return (
                                    <div key={userId} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 border border-white/10">
                                                {student?.profilePictureUrl || student?.avatarUrl ? <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-2 text-white/40" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{userId === currentUser.id ? 'أنت' : (student?.username || 'مستخدم')}</span>
                                                <span className="text-[10px] text-gray-500">تفاعل بـ {emoji}</span>
                                            </div>
                                        </div>
                                        <div className="text-2xl">{emoji}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {showReactionDetails.reactions?.[currentUser.id] && (
                            <div className="p-4 bg-black/20">
                                <button
                                    onClick={() => {
                                        handleUpdateReaction(showReactionDetails.id, null);
                                        setShowReactionDetails(null);
                                    }}
                                    className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-all active:scale-95"
                                >
                                    إزالة تفاعلي
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
