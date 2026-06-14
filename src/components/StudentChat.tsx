import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabaseClient';
import {
  Send,
  MapPin,
  Smile,
  Image as ImageIcon,
  X,
  MoreVertical,
  Reply,
  Copy,
  Trash,
  Trash2,
  Pin,
  Volume2,
  VolumeX,
  Loader2,
  Search,
  MessageCircle,
  MessageSquare,
  Eye,
  Check,
  CheckCheck,
  EyeOff,
  Users,
  User,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Link,
  ShieldAlert,
  Edit
} from 'lucide-react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EMOJI_LIST } from '../emojiConstants';
import { DB } from '../services/db';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  stage: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  file_url?: string;
  is_deleted: boolean;
  reply_to?: string;
  created_at: string;
  is_edited?: boolean;
  status: 'sent' | 'delivered' | 'read';
  recipient_id?: string;
  deleted_for?: string[];
  is_view_once?: boolean;
  caption?: string;
  has_viewed?: string[]; // IDs of users who viewed (for view-once)
}

interface TypingStatus {
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

const BAD_WORDS = ['كلب', 'حمار', 'غبي', 'شتم', 'سب', 'لعن'];

export default function StudentChat({ user, theme, onBack }: { user: any, theme: any, onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [chatMode, setChatMode] = useState<'public' | 'private'>('public');
  const [privatePartner, setPrivatePartner] = useState<any>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showCallLogs, setShowCallLogs] = useState(false);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [privacyBreachAlert, setPrivacyBreachAlert] = useState<'screenshot' | 'video' | null>(null);

  const [studentsInSameLevel, setStudentsInSameLevel] = useState<any[]>(() =>
    DB.getStudents().filter((s: any) => s.id !== user.id && s.level === user.level && s.year === user.year && !s.isDeleted)
  );

  useEffect(() => {
    const syncList = () => {
      setStudentsInSameLevel(
        DB.getStudents().filter((s: any) => s.id !== user.id && s.level === user.level && s.year === user.year && !s.isDeleted)
      );
    };
    window.addEventListener('nt-students-change', syncList);
    window.addEventListener('nt-data-sync', syncList);
    return () => {
      window.removeEventListener('nt-students-change', syncList);
      window.removeEventListener('nt-data-sync', syncList);
    };
  }, [user.id, user.level, user.year]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [globalForwardMsg, setGlobalForwardMsg] = useState<any>(null);
  const [pendingForward, setPendingForward] = useState<any>(null);

  useEffect(() => {
    const handleForward = (e: Event) => {
      const msg = (e as CustomEvent).detail;
      setGlobalForwardMsg(msg);
      setChatMode('public');
      setShowContacts(true); // Automatically open the contacts list outside
    };
    const handleInject = (e: Event) => {
      setPendingForward((e as CustomEvent).detail);
      setInputText((e as CustomEvent).detail.text || '');
    };
    window.addEventListener('nt-start-global-forward', handleForward);
    window.addEventListener('nt-inject-forward', handleInject);
    return () => {
      window.removeEventListener('nt-start-global-forward', handleForward);
      window.removeEventListener('nt-inject-forward', handleInject);
    };
  }, []);

  const roomName = useMemo(() => user?.year || 'العامة', [user?.year]);

  useEffect(() => {
    const hasSeenChatOnboarding = localStorage.getItem(`chat_onboarding_v2_${user.id}`);
    if (!hasSeenChatOnboarding) {
      setShowOnboarding(true);
    }
  }, [user.id]);

  useEffect(() => {
    const fetchCalls = () => {
      const msgs = DB.getPrivateMessages();
      const calls = msgs.filter((m: any) => (m.isCall || m.type === 'call') && (m.senderId === user.id || m.receiverId === user.id) && !m.isDeletedForEveryone);
      const allStudentsMap = new Map();
      DB.getStudents().filter((s: any) => !s.isDeleted).forEach((s: any) => allStudentsMap.set(s.id, true));

      const validCalls = calls.filter((m: any) => {
        const partnerId = m.senderId === user.id ? m.receiverId : m.senderId;
        if (!allStudentsMap.has(partnerId)) return false;

        return !(m.senderId === user.id && m.isDeletedForSender) &&
          !(m.receiverId === user.id && m.isDeletedForReceiver) &&
          !(m.senderId === user.id && m.isHiddenFromLogForSender) &&
          !(m.receiverId === user.id && m.isHiddenFromLogForReceiver);
      });
      setCallLogs(validCalls.reverse());
    };
    fetchCalls();
    window.addEventListener('nt-private-msgs-change', fetchCalls);
    return () => window.removeEventListener('nt-private-msgs-change', fetchCalls);
  }, [user.id]);

  useEffect(() => {
    if (chatMode !== 'private' || !privatePartner?.user_id) return;

    let isBreachCooldown = false;
    const triggerBreach = async (type: 'screenshot' | 'video') => {
      if (isBreachCooldown) return;
      isBreachCooldown = true;
      setTimeout(() => { isBreachCooldown = false; }, 2000);

      const text = type === 'screenshot' ? `أخذ ${user.username || 'الطالب'} لقطة شاشة للمحادثة 📸` : `بدأ ${user.username || 'الطالب'} بتسجيل الشاشة 🔴`;

      const tempId = `temp-sys-${Date.now()}`;
      const sysMsg: Message = {
        id: tempId,
        user_id: user.id,
        user_name: 'النظام',
        user_avatar: '',
        message: text,
        stage: roomName,
        message_type: 'system' as any,
        recipient_id: privatePartner.user_id,
        status: 'read',
        is_deleted: false,
        created_at: new Date().toISOString()
      };

      setMessages(prev => {
        if (prev.find(m => m.id === sysMsg.id)) return prev;
        return [...prev, sysMsg];
      });

      await supabase.from('messages').insert({
        user_id: user.id,
        user_name: 'النظام',
        message: text,
        stage: roomName,
        message_type: 'system',
        recipient_id: privatePartner.user_id,
        status: 'read',
        is_deleted: false
      });
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
    };
  }, [chatMode, privatePartner, user.id, user.username, roomName]);

  const handleDeleteCall = (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    DB.hidePrivateMessageFromCallLog(msgId, 'me', user.id);
  };

  const handleDeleteAllCalls = () => {
    if (confirm('هل أنت متأكد من مسح جميع سجلات المكالمات؟')) {
      callLogs.forEach(c => DB.hidePrivateMessageFromCallLog(c.id, 'me', user.id));
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(`chat_onboarding_v2_${user.id}`, 'true');
    setShowOnboarding(false);
  };


  useEffect(() => {
    fetchMessages();
    const subscription = subscribeToMessages();
    const presenceChannel = setupPresence();

    return () => {
      subscription.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [roomName, chatMode, privatePartner?.user_id]);

  const fetchMessages = async (isMore = false) => {
    if (!isMore) setIsLoading(true);

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (isMore && messages.length > 0) {
      query = query.lt('created_at', messages[0].created_at);
    }

    if (chatMode === 'public') {
      query = query.eq('stage', roomName).is('recipient_id', null);
    } else {
      query = query.or(`and(user_id.eq.${user.id},recipient_id.eq.${privatePartner.user_id}),and(user_id.eq.${privatePartner.user_id},recipient_id.eq.${user.id})`);
    }

    const { data, error } = await query;
    if (!error && data) {
      const formattedData = data.reverse() as Message[];
      setMessages(prev => {
        const combined = isMore ? [...formattedData, ...prev] : formattedData;
        return DB.removeDuplicates(combined, 'id');
      });
      if (!isMore) scrollToBottom();

      if (chatMode === 'private') {
        const unreadIds = formattedData.filter(m => m.recipient_id === user.id && m.status !== 'read').map(m => m.id);
        if (unreadIds.length > 0) {
          supabase.from('messages').update({ status: 'read' }).in('id', unreadIds).then();
        }
      }
    }
    setIsLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase.channel(`chat_${roomName.replace(/\s/g, '_')}`);
    channel
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        const data = (payload.new || payload.old) as any;
        if (data.stage && data.stage !== roomName) return;

        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;

          if (chatMode === 'public' && newMessage.recipient_id) return;
          if (chatMode === 'private') {
            const isParticipant = (newMessage.user_id === user.id && newMessage.recipient_id === privatePartner.user_id) ||
              (newMessage.user_id === privatePartner.user_id && newMessage.recipient_id === user.id);
            if (!isParticipant) return;
          }

          if (chatMode === 'private' && newMessage.recipient_id === user.id && document.visibilityState === 'visible') {
            supabase.from('messages').update({ status: 'read' }).eq('id', newMessage.id).then();
            newMessage.status = 'read';
          }
          setMessages(prev => {
            // Handle optimistic UI replacements to avoid disappearing/reappearing glitches
            const existingTemp = prev.find(m => (String(m.id).startsWith('temp-') || String(m.id).startsWith('msg-')) && m.user_id === newMessage.user_id && m.message === newMessage.message);
            if (existingTemp) return prev.map(m => m.id === existingTemp.id ? newMessage : m);

            if (prev.find(m => m.id === newMessage.id)) return prev;

            // Final check: if message with same content and very close timestamp exists, treat as duplicate
            const isDuplicate = prev.some(m =>
              m.user_id === newMessage.user_id &&
              m.message === newMessage.message &&
              Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 3000
            );
            if (isDuplicate) return prev;

            return [...prev, newMessage];
          });
          if (!isMuted && newMessage.user_id !== user.id) {
            playNotification(false);
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const NotificationAPI = (window as any).Notification || (window as any).webkitNotification;
                const textBody = newMessage.message_type === 'text' ? newMessage.message : 'ملف وسائط 🖼️';
                const n = new NotificationAPI(chatMode === 'private' ? `💬 رسالة خاصة من ${newMessage.user_name}` : `💬 دردشة ${roomName} - ${newMessage.user_name}`, {
                  body: textBody,
                  icon: newMessage.user_avatar || '/pulse-logo.png',
                  silent: true // Supabase already plays the sound
                });
                n.onclick = () => { window.focus(); n.close(); };
              } catch (e) { }
            }
          }
          scrollToBottom();
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();
    return channel;
  };

  const setupPresence = () => {
    const channel = supabase.channel(`online_${roomName.replace(/\s/g, '_')}`);
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(prev => {
          const others = prev.filter(u => u.user_id !== payload.user_id);
          if (payload.is_typing) return [...others, payload];
          return others;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: user.username,
            online_at: new Date().toISOString(),
          });
        }
      });
    return channel;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    }, 100);
  };

  const playNotification = (isSent = false) => {
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

      if (!isSent) {
        // WhatsApp-like Receive Sound
        playTone(880, 0, 0.1, 0.4);
        playTone(660, 0.08, 0.15, 0.3);
      } else {
        // WhatsApp-like Send Sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) { }
  };

  const sendMessage = async (type: Message['message_type'] = 'text', content: string = inputText, fileUrl?: string, extraOptions: any = {}) => {
    if (!content.trim() && !fileUrl) return;

    const now = Date.now();
    if (now - lastMessageTime < 1000) return;
    setLastMessageTime(now);

    let filteredText = content;
    BAD_WORDS.forEach(word => {
      const reg = new RegExp(word, 'gi');
      filteredText = filteredText.replace(reg, '***');
    });

    const messageId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: Message = {
      id: messageId,
      user_id: user.id,
      user_name: user.username,
      user_avatar: 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg',
      stage: roomName,
      message: filteredText,
      message_type: type,
      file_url: fileUrl,
      reply_to: replyTo?.id,
      created_at: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
      status: 'sent',
      recipient_id: chatMode === 'private' ? privatePartner.user_id : undefined,
      deleted_for: [],
      is_view_once: extraOptions.is_view_once || false,
      caption: extraOptions.caption || '',
      has_viewed: []
    };

    setMessages(prev => [...prev, newMessage]);
    playNotification(true);
    setInputText('');
    setReplyTo(null);
    scrollToBottom();
    setTimeout(() => inputRef.current?.focus(), 10);

    setIsSending(true);
    try {
      const { error, data } = await supabase.from('messages').upsert({
        id: newMessage.id,
        user_id: user.id,
        user_name: user.username,
        user_avatar: newMessage.user_avatar,
        stage: roomName,
        message: filteredText,
        message_type: type,
        file_url: fileUrl,
        reply_to: replyTo?.id,
        created_at: newMessage.created_at,
        status: 'sent',
        recipient_id: chatMode === 'private' ? privatePartner.user_id : null,
        is_view_once: newMessage.is_view_once,
        caption: newMessage.caption
      }, { onConflict: 'id' }).select();

      if (error) console.error('❌ Send error:', error.message);
      else if (data && data.length > 0) {
        setMessages(prev => DB.removeDuplicates(prev.map(m => m.id === newMessage.id ? data[0] : m), 'id'));

        // Dispatch event for offline Web Push
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nt-chat-msg-sent', {
            detail: {
              msgType: chatMode,
              text: type === 'text' ? filteredText : (newMessage.caption || (type === 'image' ? 'صورة 🖼️' : type === 'video' ? 'فيديو 🎬' : 'مقطع صوتي 🎙️')),
              senderName: user.username,
              senderAvatar: user.profilePictureUrl || user.avatarUrl || '/pulse-logo.png',
              receiverId: chatMode === 'private' ? privatePartner?.user_id : null,
              stage: roomName
            }
          }));
        }
      }
    } catch (err) {
      console.error('❌ Send exception:', err);
    }
    setIsSending(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      supabase.channel(`online_${roomName.replace(/\s/g, '_')}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, user_name: user.username, is_typing: true }
      });
      setTimeout(() => {
        setIsTyping(false);
        supabase.channel(`online_${roomName.replace(/\s/g, '_')}`).send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: user.id, user_name: user.username, is_typing: false }
        });
      }, 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isVideo && !isAudio) {
      alert('عذراً، يمكنك إرسال الصور، الفيديوهات، أو المقاطع الصوتية فقط!');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('حجم الملف كبير جداً! الحد الأقصى هو 50 ميجابايت.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAndSend = async () => {
    if (!selectedFile) return;

    setIsSending(true);
    const file = selectedFile;
    const isImage = file.type.startsWith('image/');
    const type = isImage ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio';
    const fileName = `${user.id}_${Date.now()}_${file.name}`;

    try {
      // Changed bucket to 'chat-images' as requested
      const { data, error } = await supabase.storage.from('chat-images').upload(`${type}/${fileName}`, file);

      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(data.path);
        const caption = inputText.trim();
        await sendMessage(type, caption || (type === 'image' ? 'صورة' : type === 'video' ? 'فيديو' : 'مقطع صوتي'), publicUrl, {
          is_view_once: type === 'image' && isViewOnce,
          caption: caption
        });
        cancelPreview();
      } else if (error) {
        // Fallback to chat-attachments if chat-images failed (maybe doesn't exist yet)
        const { data: retryData, error: retryError } = await supabase.storage.from('chat-attachments').upload(`${type}/${fileName}`, file);
        if (retryData) {
          const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(retryData.path);
          const caption = inputText.trim();
          await sendMessage(type, caption || (type === 'image' ? 'صورة' : type === 'video' ? 'فيديو' : 'مقطع صوتي'), publicUrl, {
            is_view_once: type === 'image' && isViewOnce,
            caption: caption
          });
          cancelPreview();
        } else {
          alert('حدث خطأ أثناء رفع الملف: ' + (retryError?.message || error.message));
        }
      }
    } catch (err) {
      console.error('Upload catch:', err);
    }
    setIsSending(false);
  };

  const cancelPreview = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsViewOnce(false);
  };

  const deleteMessage = async (msgId: string, forEveryone: boolean) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      if (forEveryone) {
        await supabase.from('messages').delete().eq('id', msgId);
      } else {
        const msg = messages.find(m => m.id === msgId);
        if (msg) {
          const deletedFor = [...(msg.deleted_for || []), user.id];
          await supabase.from('messages').update({ deleted_for: deletedFor }).eq('id', msgId);
        }
      }
    } catch (err) { console.error('Delete exception:', err); }
  };

  const editMessage = async (msgId: string, newText: string) => {
    let filteredText = newText;
    BAD_WORDS.forEach(word => {
      const reg = new RegExp(word, 'gi');
      filteredText = filteredText.replace(reg, '***');
    });

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: filteredText, is_edited: true } : m));
    try {
      await supabase.from('messages').update({ message: filteredText, is_edited: true }).eq('id', msgId);
    } catch (err) { console.error('Edit exception:', err); }
  };

  const filteredMessages = useMemo(() => {
    let items = [...messages];
    if (chatMode === 'private' && privatePartner?.user_id) {
      const calls = DB.getPrivateMessages().filter((m: any) =>
        (m.isCall || m.type === 'call') &&
        ((m.senderId === user.id && m.receiverId === privatePartner.user_id && !m.isDeletedForSender && !m.isHiddenFromLogForSender) ||
          (m.senderId === privatePartner.user_id && m.receiverId === user.id && !m.isDeletedForReceiver && !m.isHiddenFromLogForReceiver))
      );
      const formattedCalls = calls.map((l: any) => ({
        id: l.id,
        user_id: l.senderId,
        user_name: l.senderId === user.id ? user.username : privatePartner.user_name,
        user_avatar: l.senderId === user.id ? user.profilePictureUrl || user.avatarUrl : '',
        message: l.text || '',
        stage: roomName,
        message_type: 'call' as any,
        created_at: new Date(l.timestamp).toISOString(),
        status: 'read' as any,
        is_deleted: false,
        call_data: l
      }));
      items = [...items, ...formattedCalls];
    }
    items.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    if (!searchQuery) return items;
    return items.filter(m => m.message.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, searchQuery, chatMode, privatePartner, user.id, roomName]);

  return (
    <div className="fixed inset-0 z-[5000] bg-[#0b141a]/80 flex flex-col overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-[#202c33] border-b border-white/5 p-3 px-4 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={chatMode === 'private' ? () => setChatMode('public') : onBack}
            className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-300"
          >
            <X size={22} />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#3b4a54] flex items-center justify-center overflow-hidden border border-white/10">
            <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover" alt="Mentora التعليمية" title="Mentora | منصة تعليمية متطورة" loading="lazy" />
          </div>
          <div className="flex flex-col text-right">
            <h2 className="text-[15px] font-bold text-[#e9edef] flex items-center gap-2">
              {chatMode === 'private' ? `دردشة: ${privatePartner?.user_name}` : roomName}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-gray-400">{chatMode === 'private' ? 'متصل' : `${onlineCount} متصل`}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {chatMode === 'private' && (
            <button onClick={() => window.dispatchEvent(new CustomEvent('nt-start-solo-call'))} className={`p-1.5 sm:px-3 sm:py-2 ml-1 mr-1 flex items-center justify-center ${DB.getSettings().isGroupCallEnabled === false ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95`} title="مكالمة جماعية">
              <Link size={14} className="hidden sm:block" /> {DB.getSettings().isGroupCallEnabled === false ? 'مغلق' : 'رابط دعوة'}
            </button>
          )}
          {chatMode === 'public' && (
            <>
              <button onClick={() => { setShowCallLogs(!showCallLogs); setShowContacts(false); setShowSearch(false); }} className={`p-2.5 rounded-full transition-all ${showCallLogs ? 'bg-emerald-500/20 text-emerald-500' : 'hover:bg-white/5 text-gray-400'}`} title="سجل المكالمات">
                <Phone size={22} />
              </button>
              <button onClick={() => { setShowContacts(!showContacts); setShowCallLogs(false); setShowSearch(false); }} className={`p-2.5 rounded-full transition-all ${showContacts ? 'bg-emerald-500/20 text-emerald-500' : 'hover:bg-white/5 text-gray-400'}`} title="زملاء الدراسة">
                <Users size={22} />
              </button>
            </>
          )}
          <button onClick={() => { setShowSearch(!showSearch); setShowContacts(false); setShowCallLogs(false); }} className="p-2.5 hover:bg-white/5 rounded-full text-gray-400">
            <Search size={22} />
          </button>
        </div>
      </div>

      <>
        {showCallLogs && chatMode === 'public' && (
          <div className="absolute bg-[#111b21] left-0 right-0 top-[65px] bottom-[72px] z-[4000] overflow-y-auto flex flex-col no-scrollbar shadow-inner pb-10 border-b border-white/5">
            <div className="p-4 bg-[#202c33] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-full shrink-0">
                  <Phone className="text-emerald-500" size={24} />
                </div>
                <div className="text-right flex-1">
                  <h3 className="text-white font-black text-base flex flex-wrap items-center gap-2">
                    سجل المكالمات <span className="bg-emerald-500 text-[#111b21] rounded-full px-2 py-0.5 text-[10px]">{callLogs.length} مكالمة</span>
                  </h3>
                </div>
              </div>
              {callLogs.length > 0 && (
                <button onClick={handleDeleteAllCalls} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 active:scale-95 transition-all text-xs font-bold flex items-center gap-1">
                  مسح السجل
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="flex-1 p-2 space-y-1">
              {callLogs.map(call => {
                const isIncoming = call.receiverId === user.id;
                const partnerId = isIncoming ? call.senderId : call.receiverId;
                const partner = DB.getStudents().find(s => s.id === partnerId);
                const partnerName = partner?.username || 'مستخدم غير معروف';
                const partnerAvatar = partner?.profilePictureUrl || partner?.avatarUrl;

                const callDate = new Date(call.timestamp);
                const timeFormatted = callDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                const dateFormatted = callDate.toLocaleDateString('ar-EG');

                return (
                  <div key={call.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-default transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 shrink-0 border border-white/10 flex items-center justify-center relative cursor-pointer" onClick={() => { if (partner) { setPrivatePartner({ user_id: partner.id, user_name: partnerName }); setChatMode('private'); setShowCallLogs(false); } }}>
                      {partnerAvatar ? (
                        <img src={partnerAvatar} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <User size={24} className="text-gray-500" />
                      )}
                      <OnlineDot userId={partnerId} />
                    </div>
                    <div className="flex-1 border-b border-white/5 pb-3">
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white font-bold text-[15px]">{partnerName}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => handleDeleteCall(e, call.id)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                            <Trash2 size={16} />
                          </button>
                          <button onClick={() => { if (partner) window.dispatchEvent(new CustomEvent('nt-start-call', { detail: { userId: partner.id, userName: partnerName, isVideo: call.isVideoCall, avatarUrl: partnerAvatar } })); }} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-colors">
                            {call.isVideoCall ? <Video size={18} /> : <Phone size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-start gap-1.5 mt-1 text-[10px] sm:text-[11px] text-gray-400">
                        {isIncoming ? (
                          <span className={call.callStatus === 'missed' ? "text-red-500 font-bold" : "text-emerald-400 font-bold"}>
                            {call.callStatus === 'missed' ? (call.isVideoCall ? 'مكالمة فيديو فائتة' : 'مكالمة صوتية فائتة') : call.callStatus === 'rejected' ? 'مكالمة مرفوضة' : 'مكالمة مستلمة'}
                          </span>
                        ) : (
                          <span className={call.callStatus === 'missed' ? "text-orange-400 font-bold" : "text-blue-400 font-bold"}>
                            {call.callStatus === 'missed' ? 'لم يتم الرد' : call.callStatus === 'rejected' ? 'مرفوضة من الطرف الآخر' : 'صادرة'}
                          </span>
                        )}
                        <span className="opacity-50">|</span>
                        <span className="font-bold">{timeFormatted}</span>
                        <span className="opacity-50">|</span>
                        <span className="font-bold">{dateFormatted}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {callLogs.length === 0 && (
                <div className="text-center p-8 text-gray-500 flex flex-col items-center gap-3">
                  <Phone size={48} className="opacity-20 mx-auto" />
                  <p className="font-bold">سجل المكالمات فارغ.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </>

      <>
        {showContacts && chatMode === 'public' && (
          <div className="absolute bg-[#111b21] left-0 right-0 top-[65px] bottom-[72px] z-[4000] overflow-y-auto flex flex-col no-scrollbar shadow-inner pb-10 border-b border-white/5">
            <div className="p-4 bg-[#202c33] border-b border-white/5 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-full shrink-0">
                <Users className="text-emerald-500" size={24} />
              </div>
              <div className="text-right flex-1">
                <h3 className="text-white font-black text-base flex flex-wrap items-center gap-2">
                  {globalForwardMsg ? 'اختر زميلاً لإرسال الرسالة المميزة إليه' : 'اكتشف زملاءك'} <span className="bg-emerald-500 text-[#111b21] rounded-full px-2 py-0.5 text-[10px]">{studentsInSameLevel.length} زميل</span>
                </h3>
                <p className="text-[10.5px] text-gray-400 mt-1 font-bold break-words">{globalForwardMsg ? 'اضغط على أي اسم لتوجيه الرسالة فوراً 🚀' : `${user.level} - ${user.year}`}</p>
              </div>
              {globalForwardMsg && (
                <button onClick={() => setGlobalForwardMsg(null)} className="p-2 bg-red-500 text-white rounded-lg font-black text-xs shrink-0 self-center shadow-md">إلغاء التوجيه</button>
              )}
            </div>
            <div className="flex-1 p-2 space-y-1">
              {studentsInSameLevel.map((student: any) => {
                const chatMsgs = DB.getPrivateMessages().filter((m: any) =>
                  !m.isDeletedForEveryone &&
                  ((m.senderId === user.id && m.receiverId === student.id && !m.isDeletedForSender) ||
                    (m.senderId === student.id && m.receiverId === user.id && !m.isDeletedForReceiver))
                );
                const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : null;

                let lastContent = (
                  <>
                    <span className="font-bold">{student.registrationDate}</span>
                    <span className="opacity-50">|</span>
                    <span className="text-emerald-400/90 font-bold">{student.registrationTime}</span>
                  </>
                );

                if (lastMsg) {
                  if ((lastMsg as any).isCall || lastMsg.type === 'call') {
                    const isIncoming = lastMsg.receiverId === user.id;
                    const isVideo = (lastMsg as any).isVideoCall;
                    const CallIcon = isVideo ? Video : Phone;

                    if (lastMsg.callStatus === 'missed') {
                      lastContent = <span className="text-red-500 font-bold flex items-center gap-1"><CallIcon size={12} className={isIncoming ? "rotate-[135deg]" : "-rotate-45"} /> {isVideo ? 'مكالمة فيديو فائتة' : 'مكالمة صوتية فائتة'}</span>;
                    } else if (lastMsg.callStatus === 'rejected') {
                      lastContent = <span className="text-gray-400 flex items-center gap-1"><CallIcon size={12} className={isIncoming ? "text-red-500 rotate-[135deg]" : "text-gray-500 -rotate-45"} /> {isIncoming ? 'مكالمة مرفوضة' : 'مرفوضة من الطرف الآخر'}</span>;
                    } else {
                      lastContent = <span className="text-gray-400 flex items-center gap-1"><CallIcon size={12} className={isIncoming ? "text-emerald-500 rotate-[135deg]" : "text-blue-500 -rotate-45"} /> {isVideo ? (isIncoming ? 'مكالمة فيديو واردة' : 'مكالمة فيديو صادرة') : (isIncoming ? 'مكالمة صوتية واردة' : 'مكالمة صوتية صادرة')}</span>;
                    }
                  } else {
                    lastContent = <span className="text-gray-400 truncate max-w-[200px] block font-bold text-[11px] sm:text-xs">
                      {lastMsg.senderId === user.id && <span className="text-emerald-500 mr-1">أنت:</span>}
                      {(lastMsg as any).text || 'ملف وسائط 🖼️'}
                    </span>;
                  }
                }

                const unreadCount = chatMsgs.filter(m => m.receiverId === user.id && !m.isRead && !(m as any).isCall && m.type !== 'call').length;

                return (
                  <div key={student.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors" onClick={() => {
                    setPrivatePartner({ user_id: student.id, user_name: student.username });
                    setChatMode('private');
                    setShowContacts(false);
                    if (globalForwardMsg) {
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('nt-inject-forward', { detail: globalForwardMsg }));
                      }, 50);
                      setGlobalForwardMsg(null);
                    }
                  }}>
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden bg-white/5 shrink-0 border border-white/10 flex items-center justify-center relative cursor-pointer group hover:border-[#00a884]/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = student.profilePictureUrl || student.avatarUrl;
                        if (url) window.dispatchEvent(new CustomEvent('nt-open-avatar', { detail: { url, name: student.username } }));
                      }}
                    >
                      {student.profilePictureUrl || student.avatarUrl ? (
                        <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="avatar" />
                      ) : (
                        <User size={24} className="text-gray-500" />
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Search size={16} className="text-white drop-shadow-md" />
                      </div>
                      <OnlineDot userId={student.id} />
                    </div>
                    <div className="flex-1 border-b border-white/5 pb-3">
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white font-bold text-[15px]">{student.username}</span>
                        <div className="flex flex-col items-end gap-1">
                          {lastMsg && <span className="text-[9px] font-bold text-gray-500">{new Date(lastMsg.timestamp).toLocaleDateString('ar-EG')}</span>}
                          {unreadCount > 0 ? (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-black shadow-md border border-[#111b21]">
                              {unreadCount}
                            </span>
                          ) : <MessageCircle className="text-emerald-500" size={16} />}
                        </div>
                      </div>
                      <div className="flex items-center justify-start gap-1.5 mt-1 text-[10px] sm:text-[11px] text-gray-400 w-full overflow-hidden">
                        {lastContent}
                      </div>
                      {student.location && (
                        <div className="flex items-center justify-start mt-1.5 w-full">
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-[9px] font-bold flex items-center gap-1">
                            <MapPin size={10} />
                            {student.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {studentsInSameLevel.length === 0 && (
                <div className="text-center p-8 text-gray-500 flex flex-col items-center gap-3">
                  <Users size={48} className="opacity-20 mx-auto" />
                  <p className="font-bold">لا يوجد طلاب مسجلين في نفس المرحلة والسنة حالياً.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </>

      {/* Search Bar */}
      <>
        {showSearch && (
          <div className="bg-[#1e293b] p-2 px-4 border-b border-white/5 overflow-hidden">
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث في الرسائل..." className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pr-10 pl-4 text-xs text-white outline-none focus:border-emerald-500/30" />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}

        {privacyBreachAlert && chatMode === 'private' && (
          <div className="absolute top-[85px] z-[99999] left-1/2 -translate-x-1/2 bg-red-600 border border-red-500 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.7)] px-5 py-3 w-[85%] max-w-[350px] flex items-center justify-center gap-3 text-white">
            <ShieldAlert size={26} className="flex-shrink-0" />
            <span className="font-black text-[13px] sm:text-[14px] leading-relaxed text-center">
              {privacyBreachAlert === 'screenshot'
                ? `لقد أخذ ${privatePartner?.user_name} لقطة شاشة (Screenshot)!`
                : `يُسجل ${privatePartner?.user_name} المحادثة بالفيديو (شاشة)!`}
            </span>
          </div>
        )}
      </>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const target = e.currentTarget;
          if (target.scrollTop === 0 && !isLoading && messages.length >= 50) {
            fetchMessages(true);
          }
        }}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 relative"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #53bdeb 0%, transparent 50%)' }} />
        {isLoading && (
          <div className="flex justify-center p-2">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        )}

        {!isLoading && filteredMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-30">
            <MessageSquare size={48} className="mb-2" />
            <p className="text-sm font-bold">لا توجد رسائل بعد.. ابدأ النقاش!</p>
          </div>
        )}

        {filteredMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.user_id === user.id}
            chatMode={chatMode}
            currentUserId={user.id}
            onReply={() => setReplyTo(msg)}
            onDelete={deleteMessage}
            onEdit={editMessage}
            onStartPrivateChat={(p: any) => { setPrivatePartner(p); setChatMode('private'); }}
            repliedMsg={msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null}
          />
        ))}

        {typingUsers.length > 0 && typingUsers.filter(u => u.user_id !== user.id).map(u => (
          <div key={u.user_id} className="text-[11px] text-emerald-400 font-bold bg-[#202c33]/80 p-1 px-3 rounded-full w-fit">
            {u.user_name} يكتب الآن...
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-[#202c33] p-2 md:p-3 relative z-20">
        <>
          {previewUrl && (
            <div className="absolute bottom-full left-0 right-0 bg-[#0b141a] p-4 flex flex-col items-center gap-4 z-[100] border-t border-white/10 shadow-2xl">
              <div className="relative max-w-md w-full">
                <button onClick={cancelPreview} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg z-10"><X size={18} /></button>
                {selectedFile?.type.startsWith('image/') ? (
                  <img src={previewUrl} className="w-full max-h-[300px] object-contain rounded-xl shadow-2xl border border-white/10" alt="preview" />
                ) : selectedFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="w-full max-h-[300px] rounded-xl shadow-2xl border border-white/10" controls />
                ) : (
                  <div className="bg-[#2a3942] p-8 rounded-xl flex flex-col items-center gap-3">
                    <Volume2 size={48} className="text-emerald-500" />
                    <span className="text-white text-sm font-bold">{selectedFile?.name}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-500 font-bold">يمكنك كتابة تعليق أدناه قبل الإرسال</p>
            </div>
          )}

          {replyTo && (
            <div className="bg-[#1d272d] border-r-4 border-emerald-500 rounded-t-xl p-3 mb-2 flex items-center justify-between">
              <div className="text-right">
                <p className="text-[11px] font-bold text-emerald-500">{replyTo.user_name}</p>
                <p className="text-xs text-gray-400 line-clamp-1">{replyTo.message}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/5 rounded-full"><X size={16} className="text-gray-400" /></button>
            </div>
          )}
        </>

        <div className="flex items-end gap-2 max-w-7xl mx-auto">
          <div className="flex-1 bg-[#2a3942] rounded-2xl flex items-end p-1 min-h-[48px]">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 text-gray-400 hover:text-[#e9edef] flex-shrink-0"><Smile size={24} /></button>
            <div className="flex-1 flex flex-col justify-center py-1">
              <textarea ref={inputRef as any} rows={1} value={inputText} onChange={handleTyping} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); selectedFile ? uploadAndSend() : sendMessage(); } }} placeholder={selectedFile ? "أضف تعليقاً..." : "اكتب رسالتك..."} className="w-full bg-transparent border-none text-[15px] text-[#e9edef] outline-none resize-none max-h-32 px-2 py-1 text-right" style={{ height: 'auto' }} />
            </div>
            <label className="p-2.5 text-gray-400 hover:text-[#e9edef] cursor-pointer" title="إرسال ملف">
              <ImageIcon size={24} />
              <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleFileUpload} />
            </label>
            <button
              onClick={() => setIsViewOnce(!isViewOnce)}
              className={cn(
                "p-2.5 transition-colors",
                isViewOnce ? "text-[#00a884]" : "text-gray-400 hover:text-[#e9edef]"
              )}
              title="يُرى مرة واحدة"
            >
              <Eye size={22} className={isViewOnce ? "fill-emerald-500/20 shadow-[0_0_10px_rgba(0,168,132,0.3)]" : ""} />
            </button>
          </div>

          <button onClick={() => selectedFile ? uploadAndSend() : sendMessage()} disabled={isSending || (!inputText.trim() && !replyTo && !selectedFile)} className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center text-[#e9edef] shadow-lg active:scale-95 disabled:opacity-50 shrink-0">
            {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={22} className="-rotate-45 -mr-1" fill="currentColor" />}
          </button>
        </div>

        <>
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-4 w-[320px] bg-[#233138] border border-white/5 rounded-2xl shadow-2xl z-50 flex flex-col h-[400px]">
              <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#1d272d]">
                <span className="text-xs font-black text-gray-400">اختر إيموجي</span>
                <button onClick={() => setShowEmojiPicker(false)}><X size={16} className="text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-7 gap-1 scrollbar-thin">
                {EMOJI_LIST.map(emoji => (
                  <button key={emoji} onClick={() => setInputText(p => p + emoji)} className="text-2xl p-1 hover:bg-white/5 rounded-lg active:scale-125">{emoji}</button>
                ))}
              </div>
            </div>
          )}
        </>
      </div>

      <>
        {showOnboarding && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60">
            <div className="bg-[#1d272d] border border-white/10 rounded-3xl w-full max-w-lg p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto"><MessageSquare className="text-emerald-500" size={32} /></div>
              <h3 className="text-xl font-black text-white">دليل استخدام دردشة النبض</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex gap-3"><Send size={16} className="text-blue-400 shrink-0" /><div><h4 className="text-[10px] font-black text-white">إرسال الرسائل</h4><p className="text-[9px] text-gray-400">اكتب رسالتك وابعثها، الصور والملفات متاحة أيضاً.</p></div></div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex gap-3"><Search size={16} className="text-orange-400 shrink-0" /><div><h4 className="text-[10px] font-black text-white">البحث السريع</h4><p className="text-[9px] text-gray-400">ابحث عن أي رسالة قديمة بسهولة.</p></div></div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex gap-3"><Reply size={16} className="text-purple-400 shrink-0" /><div><h4 className="text-[10px] font-black text-white">الرد والخيارات</h4><p className="text-[9px] text-gray-400">اضغط على الرسالة للرد أو الحذف.</p></div></div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex gap-3"><MessageCircle size={16} className="text-pink-400 shrink-0" /><div><h4 className="text-[10px] font-black text-white">محادثة خاصة</h4><p className="text-[9px] text-gray-400">اضغط على أيقونة الشات للتحدث مع طالب بعينه.</p></div></div>
              </div>
              <button onClick={completeOnboarding} className="w-full bg-emerald-600 font-black py-4 rounded-xl text-white">فهمت، ابدأ الآن</button>
            </div>
          </div>
        )}
      </>
    </div>
  );
}

function MessageBubble({ message, isMe, chatMode, currentUserId, onReply, onDelete, onEdit, onStartPrivateChat, repliedMsg }: any) {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.message);
  const [isViewed, setIsViewed] = useState(message.has_viewed?.includes(currentUserId));

  if (message.deleted_for?.includes(currentUserId)) return null;

  const getTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diff = (Date.now() - date.getTime());
    if (diff < 60000) return 'الآن';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewOnce = async () => {
    if (message.is_view_once && !isViewed) {
      setIsViewed(true);
      const updatedViewed = [...(message.has_viewed || []), currentUserId];
      await supabase.from('messages').update({ has_viewed: updatedViewed }).eq('id', message.id);
    }
  };

  if (message.message_type === 'system') {
    return (
      <div className="w-full flex justify-center my-4">
        <div className="bg-[#1e293b]/80 border border-red-500/20 py-1.5 px-5 rounded-full shadow-lg flex items-center justify-center gap-2 max-w-[90%]">
          <ShieldAlert size={16} className="text-red-400 shrink-0" />
          <span className="text-[11.5px] font-black text-gray-200">{message.message}</span>
        </div>
      </div>
    );
  }

  if (message.message_type === 'call' && message.call_data) {
    const isMissed = message.call_data.callStatus === 'missed' || message.call_data.callStatus === 'rejected';
    const isVideo = message.call_data.isVideoCall || message.message?.includes('فيديو');
    const isMissedIncoming = isMissed && !isMe;
    const Icon = isVideo ? (isMissedIncoming ? VideoOff : Video) : (isMissedIncoming ? PhoneOff : Phone);

    let title = "";
    if (isMissedIncoming) {
      title = isVideo ? "مكالمة فيديو فائتة" : "مكالمة صوتية فائتة";
    } else {
      title = isMe ? (isVideo ? "مكالمة فيديو صادرة" : "مكالمة صوتية صادرة") : (isVideo ? "مكالمة فيديو واردة" : "مكالمة صوتية واردة");
    }

    const durationText = message.call_data.callDuration ? `${Math.floor(message.call_data.callDuration / 60)}:${(message.call_data.callDuration % 60).toString().padStart(2, '0')}` : '';

    return (
      <div className={cn("flex w-full mb-1", isMe ? "justify-end" : "justify-start")}>
        <div className={cn("max-w-[85%] relative group flex flex-col", isMe ? "items-end" : "items-start")}>
          <div
            className={cn(
              "flex items-center justify-start gap-3 select-none pt-1 pb-1 min-w-[220px] pr-1 shadow-sm cursor-pointer transition-colors w-full group/call rounded-2xl",
              isMe ? "bg-[#005c4b] border border-[#005c4b]/30 text-[#e9edef] rounded-tl-none hover:bg-[#005c4b]/90" : "bg-[#202c33] border border-[#202c33]/30 text-[#e9edef] rounded-tr-none hover:bg-[#202c33]/90"
            )}
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('nt-start-call', {
                detail: {
                  userId: message.call_data.senderId === currentUserId ? message.call_data.receiverId : message.call_data.senderId,
                  userName: isMe ? (message.call_data.receiverId === currentUserId ? 'مستخدم' : 'مستخدم') : message.user_name,
                  isVideo: isVideo,
                  avatarUrl: message.user_avatar
                }
              }));
            }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isMissedIncoming ? 'bg-red-500/20' : (isMe ? 'bg-black/10 group-hover/call:bg-black/20' : 'bg-emerald-500/20 group-hover/call:bg-emerald-500/30')}`}>
              <Icon size={18} className={isMissedIncoming ? 'text-red-500' : (isMe ? 'text-white/70' : 'text-emerald-500')} />
            </div>
            <div className="flex-1 flex flex-col justify-center text-right border-l border-white/10 pl-3">
              <span className={`font-black text-[13.5px] whitespace-nowrap ${isMissedIncoming ? 'text-red-500' : ''}`}>{title}</span>
              {durationText ? <span className="text-[11px] font-bold opacity-75 mt-0.5">{durationText}</span> : (isMe && isMissed ? <span className="text-[10px] font-bold opacity-70 mt-0.5 text-white/70">لم يتم الرد</span> : null)}
            </div>
            <div className="shrink-0 flex items-center justify-center pl-1">
              <div className={`w-8 h-8 flex items-center justify-center transition-all opacity-70 group-hover/call:opacity-100 group-hover/call:scale-110 ${isVideo ? 'text-cyan-500' : 'text-emerald-500'}`}>
                {isVideo ? <Video size={18} /> : <Phone size={18} />}
              </div>
            </div>
            <div className="absolute -bottom-4 right-1 flex items-center justify-end gap-1 opacity-60">
              <span className="text-[9px] font-medium tracking-tight" dir="ltr">{getTime(message.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full mb-1", isMe ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] relative group flex flex-col",
        isMe ? "items-end" : "items-start"
      )}>
        {!isMe && (
          <span className="text-[11px] font-bold text-blue-400 mb-0.5 px-2">
            {DB.getStudents().find(s => s.id === message.user_id)?.username || message.user_name}
          </span>
        )}

        <div className="flex items-center gap-1">
          {isMe && (
            <button onClick={() => setShowOptions(!showOptions)} className="p-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all">
              <MoreVertical size={14} />
            </button>
          )}

          <div className={cn(
            "p-3 rounded-2xl relative max-w-full text-white shadow-sm border border-white/5",
            isMe
              ? "bg-[#005c4b] border-[#005c4b]/30 text-[#e9edef] rounded-tl-none shadow-sm"
              : "bg-[#202c33] border-[#202c33]/30 text-[#e9edef] rounded-tr-none shadow-sm"
          )}>
            {repliedMsg && (
              <div className="bg-black/20 border-r-4 border-emerald-500 p-2 mb-2 rounded-[0.4rem] text-[11px] opacity-90 min-w-[120px]">
                <p className="font-bold text-emerald-400 text-right">{repliedMsg.user_name}</p>
                <p className="truncate text-gray-300 text-right">{repliedMsg.message}</p>
              </div>
            )}

            {message.message_type === 'image' && (
              <div className="relative mb-1 rounded-lg overflow-hidden cursor-pointer group/img" onClick={handleViewOnce}>
                {message.is_view_once && isViewed ? (
                  <div className="bg-[#111b21] p-6 flex flex-col items-center gap-3 text-gray-500 min-w-[200px] border border-white/5 rounded-lg">
                    <EyeOff size={32} strokeWidth={1.5} />
                    <span className="text-[11px] font-bold">رسالة عرض لمرة واحدة مفتوحة</span>
                  </div>
                ) : (
                  <>
                    <img src={message.file_url} className="max-w-full rounded-lg max-h-80 object-cover transition-transform group-hover/img:scale-[1.02]" alt="attachment" />
                    {message.is_view_once && (
                      <div className="absolute top-2 right-2 bg-[#0b141a]/80 p-1 px-2 rounded-full flex items-center gap-1.5 border border-white/10">
                        <div className="w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        </div>
                        <span className="text-[10px] font-bold text-white">يُرى مرة واحدة</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {message.message_type === 'video' && (
              <video src={message.file_url} controls className="max-w-full rounded-lg mb-1 max-h-80 shadow-inner bg-black" />
            )}

            {message.message_type === 'audio' && (
              <audio src={message.file_url} controls className="max-w-full mb-1 h-10 scale-90 origin-right brightness-90 contrast-125" />
            )}

            {isEditing ? (
              <div className="flex flex-col gap-2 min-w-[200px]">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white outline-none resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      onEdit(message.id, editValue);
                      setIsEditing(false);
                    }}
                    className="p-1 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Check size={14} /> حفظ
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditValue(message.message);
                    }}
                    className="p-1 px-3 bg-red-500/20 text-red-500 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <X size={14} /> إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.message && (
                  <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-right">
                    {message.message}
                    {message.is_edited && <span className="text-[10px] text-gray-400 mr-2 opacity-60">(معدلة)</span>}
                  </p>
                )}
              </>
            )}

            <div className="flex items-center justify-end gap-1 mt-0.5 opacity-60">
              <span className="text-[9px] font-medium tracking-tight" dir="ltr">{getTime(message.created_at)}</span>
              {isMe && (
                <div className="flex items-center">
                  {message.status === 'read' ? (
                    <CheckCheck size={13} className="text-[#53bdeb]" />
                  ) : message.status === 'delivered' ? (
                    <CheckCheck size={13} className="text-gray-400" />
                  ) : (
                    <Check size={13} className="text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {!isMe && (
            <button onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }} className="p-1 opacity-100 text-gray-400 hover:text-white transition-all bg-white/5 rounded-full mb-1 order-2">
              <MoreVertical size={16} />
            </button>
          )}
        </div>

        <>
          {showOptions && createPortal(
            <div
              className="fixed inset-0 z-[999999] bg-black/40 flex items-center justify-center p-4 transition-all"
              onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
              onTouchStart={(e) => { e.stopPropagation(); setShowOptions(false); }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#2b3943] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col w-[300px] max-w-[85vw] overflow-hidden"
              >
                <button onClick={() => { onReply(); setShowOptions(false); }} className="flex items-center justify-between w-full px-5 py-4 hover:bg-white/5 text-[#e9edef] text-right border-b border-white/5 transition-colors">
                  <span className="text-[15.5px] font-bold">الرد</span>
                  <Reply size={20} className="opacity-70" />
                </button>

                {message.message_type !== 'call' && (
                  <button onClick={() => { navigator.clipboard.writeText(message.message); setShowOptions(false); }} className="flex items-center justify-between w-full px-5 py-4 hover:bg-white/5 text-[#e9edef] text-right border-b border-white/5 transition-colors">
                    <span className="text-[15.5px] font-bold">نسخ الرسالة</span>
                    <Copy size={20} className="opacity-70" />
                  </button>
                )}

                {isMe ? (
                  <>
                    <button onClick={() => { onDelete(message.id, false); setShowOptions(false); }} className="flex items-center justify-between w-full px-5 py-4 hover:bg-white/5 text-[#e9edef] text-right border-b border-white/5 transition-colors">
                      <span className="text-[15.5px] font-bold">حذف لدي</span>
                      <Trash size={20} className="opacity-70" />
                    </button>

                    <button onClick={() => { onDelete(message.id, true); setShowOptions(false); }} className="flex items-center justify-between w-full px-5 py-4 hover:bg-[#ef4444]/15 text-red-500 text-right border-b border-white/5 transition-colors">
                      <span className="text-[15.5px] font-bold">حذف للجميع</span>
                      <Trash2 size={20} />
                    </button>

                    {message.message_type !== 'call' && (Date.now() - new Date(message.created_at).getTime() < 20 * 60 * 1000) && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditValue(message.message);
                          setShowOptions(false);
                        }}
                        className="flex items-center justify-between w-full px-5 py-4 hover:bg-emerald-500/15 text-emerald-400 text-right transition-colors"
                      >
                        <span className="text-[15.5px] font-bold">تعديل</span>
                        <Edit size={20} />
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={() => { onDelete(message.id, false); setShowOptions(false); }} className="flex items-center justify-between w-full px-5 py-4 hover:bg-white/5 text-[#e9edef] text-right transition-colors">
                    <span className="text-[15.5px] font-bold">حذف لدي</span>
                    <Trash size={20} className="opacity-70" />
                  </button>
                )}
              </div>
            </div>,
            document.body
          )}
        </>
      </div>
    </div>
  );
}

function OnlineDot({ userId }: { userId: string }) {
  const [isOnline, setIsOnline] = useState(() => DB.getOnlineStatus(userId));
  useEffect(() => {
    const interval = setInterval(() => setIsOnline(DB.getOnlineStatus(userId)), 5000);
    const handleSync = () => setIsOnline(DB.getOnlineStatus(userId));
    window.addEventListener('nt-data-sync', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('nt-data-sync', handleSync);
    };
  }, [userId]);

  if (!isOnline) return null;
  return (
    <div
      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#25D366] rounded-full border-[2.5px] border-[#111b21] z-20 shadow-[0_0_8px_rgba(37,211,102,0.6)]"
      title="متصل الآن"
    />
  );
};
