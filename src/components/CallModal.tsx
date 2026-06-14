import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, User, SwitchCamera, Volume2, UserPlus, UserMinus, Link, Copy, Maximize, Minimize, EyeOff, X, Users } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { supabase, isSupabaseConnected } from '../services/supabaseClient';
import { DB } from '../services/db';

let globalAudioCtx: AudioContext | null = null;
const initGlobalCtx = () => {
    try {
        if (!globalAudioCtx) {
            globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (globalAudioCtx.state === 'suspended') {
            globalAudioCtx.resume().catch(() => { });
        }
    } catch (e) { }
    return globalAudioCtx;
};

class AudioSynthesizer {
    audio: HTMLAudioElement | null = null;
    source: MediaElementAudioSourceNode | null = null;
    gain: GainNode | null = null;
    type: 'iphone' | 'whatsapp' | 'whatsapp_ring' | 'busy' | 'notification';
    private isPlaying = false;

    constructor(type: 'iphone' | 'whatsapp' | 'whatsapp_ring' | 'busy' | 'notification') {
        this.type = type;
        if (typeof window !== 'undefined') {
            const src = type === 'iphone' ? 'https://notificationsounds.com/storage/sounds/file-sounds-1152-pristine.mp3' :
                type === 'whatsapp' || type === 'whatsapp_ring' ? '/sounds/whatsapp_ringtone.mp3' :
                    type === 'notification' ? '/sounds/whatsapp_notification.mp3' : '/sounds/busy_tone.mp3';
            this.audio = new Audio(src);
            this.audio.loop = (type !== 'notification' && type !== 'busy');
            this.audio.crossOrigin = "anonymous";
        }
    }

    private setup() {
        const ctx = initGlobalCtx();
        if (!ctx || !this.audio || this.source) return;

        try {
            this.source = ctx.createMediaElementSource(this.audio);
            this.gain = ctx.createGain();
            this.gain.gain.value = 2.5;
            this.source.connect(this.gain);
            this.gain.connect(ctx.destination);
        } catch (e) {
            this.audio.volume = 1.0;
        }
    }

    set volume(val: number) {
        if (this.gain) this.gain.gain.value = val * 3.5; // Boosted for loudspeaker feel
        if (this.audio) this.audio.volume = Math.min(val * 1.5, 1.0);
    }

    play() {
        if (this.isPlaying && this.type !== 'notification') return;
        this.stop();
        this.isPlaying = true;

        const ctx = initGlobalCtx();
        if (!ctx) return;

        const loop = () => {
            if (!this.isPlaying) return;
            const now = ctx.currentTime;

            if (this.type === 'iphone' || this.type === 'whatsapp_ring') {
                this.genTone(1320, now, 0.1);
                this.genTone(1320, now + 0.15, 0.1);
                this.genTone(1320, now + 0.3, 0.4);
                this.vibrateInterval = setTimeout(loop, 1800);
            } else if (this.type === 'whatsapp') {
                this.genTone(400, now, 1.2, 0.1);
                this.genTone(450, now, 1.2, 0.1);
                this.vibrateInterval = setTimeout(loop, 3000);
            } else if (this.type === 'busy') {
                this.genTone(480, now, 0.3);
                this.genTone(620, now, 0.3);
                this.vibrateInterval = setTimeout(loop, 1000);
            } else if (this.type === 'notification') {
                this.genTone(880, now, 0.15);
                this.genTone(1320, now + 0.15, 0.2);
                this.isPlaying = false;
            }
        };
        loop();
    }

    private vibrateInterval: any = null;

    private genTone(freq: number, start: number, duration: number, volume = 0.8) {
        const ctx = initGlobalCtx();
        if (!ctx || !this.isPlaying) return;
        try {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            g.gain.setValueAtTime(0, start);
            g.gain.linearRampToValueAtTime(volume * (this.gain?.gain.value || 1.0), start + 0.05);
            g.gain.linearRampToValueAtTime(0, start + duration);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
        } catch (e) { }
    }

    stop() {
        this.isPlaying = false;
        if (this.vibrateInterval) {
            clearTimeout(this.vibrateInterval);
            this.vibrateInterval = null;
        }
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }
}

let callingAudio: AudioSynthesizer | null = null;
let incomingAudio: AudioSynthesizer | null = null;
let busyAudio: AudioSynthesizer | null = null;
let notifySynth: AudioSynthesizer | null = null;

if (typeof document !== 'undefined') {
    callingAudio = new AudioSynthesizer('whatsapp');
    incomingAudio = new AudioSynthesizer('whatsapp_ring');
    busyAudio = new AudioSynthesizer('busy');
    notifySynth = new AudioSynthesizer('notification');

    const unlock = () => {
        initGlobalCtx();
        [callingAudio, incomingAudio, busyAudio, notifySynth].forEach(a => {
            if (a?.audio) {
                a.audio.load();
                a.audio.play().then(() => {
                    a.audio?.pause();
                    a.audio!.currentTime = 0;
                }).catch(() => { });
            }
        });

        // Final attempt to resume ctx
        if (globalAudioCtx) {
            globalAudioCtx.resume().catch(() => { });
        }
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
}

const startCallingTone = () => callingAudio?.play();
let vibrateInterval: any = null;
const startIncomingRingtone = () => {
    if (incomingAudio) {
        incomingAudio.play();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            // Stop any existing vibration
            navigator.vibrate(0);
            if (vibrateInterval) clearInterval(vibrateInterval);

            const pattern = [1000, 500]; // 1s vibrate, 0.5s pause
            navigator.vibrate(pattern);
            vibrateInterval = setInterval(() => {
                navigator.vibrate(pattern);
            }, 1500);
        } catch (e) { }
    }
};

let lastRecNotifyTime = 0;
const playMessageNotificationSound = () => {
    if (notifySynth) notifySynth.play();
};

const speakNotification = (text: string) => {
    const now = Date.now();
    if (now - lastRecNotifyTime < 5000) return; // Ignore if spoken in last 5s
    lastRecNotifyTime = now;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'ar-SA';
        msg.rate = 1.0;
        msg.volume = 1.0;
        window.speechSynthesis.speak(msg);
    }
};

const startBusyTone = () => { if (busyAudio) { busyAudio.volume = 1.0; busyAudio.play(); setTimeout(() => busyAudio?.stop(), 2000); } };
const stopAllSounds = () => {
    if (callingAudio) { callingAudio.stop(); }
    if (incomingAudio) { incomingAudio.stop(); }
    if (busyAudio) { busyAudio.stop(); }
    if (vibrateInterval) {
        clearInterval(vibrateInterval);
        vibrateInterval = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(0); } catch (e) { }
    }
};

const clearCallNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            reg.getNotifications({ tag: 'incoming-call' }).then(notifs => notifs.forEach(n => n.close())).catch(() => { });
        });
    }
};

interface CallModalProps {
    currentUser: { id: string; username: string; avatarUrl?: string; profilePictureUrl?: string };
    theme: any;
}

export const CallModal: React.FC<CallModalProps> = ({ currentUser, theme }) => {
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'connecting' | 'failed' | 'disconnected'>('idle');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<Record<string, { stream: MediaStream | null, name: string, isVideo: boolean, avatarUrl: string }>>({});
    const [callData, setCallData] = useState<any>(null); // Incoming 1:1 ring
    const [activeCall, setActiveCall] = useState<any>(null); // Outgoing 1:1 ring
    const [rejectMessage, setRejectMessage] = useState('');
    const [showIncomingCall, setShowIncomingCall] = useState(false);
    const [callNotifs, setCallNotifs] = useState<{ id: string, text: string }[]>([]);
    const [showUnderConstruction, setShowUnderConstruction] = useState<'voice' | 'video' | 'group' | false>(false);

    const showToast = (text: string) => {
        const id = Math.random().toString(36);
        setCallNotifs(prev => [...prev, { id, text }]);
        setTimeout(() => setCallNotifs(prev => prev.filter(n => n.id !== id)), 3000);
    };

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // Group features
    const [showAddUser, setShowAddUser] = useState(false);
    const [joinCountdown, setJoinCountdown] = useState<number | null>(null);
    const [linkEnded, setLinkEnded] = useState(false);
    const [isMiniMode, setIsMiniMode] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [pipIsLocal, setPipIsLocal] = useState(true); // Toggle for maximizing screen
    const [mutedRemoteUsers, setMutedRemoteUsers] = useState<Record<string, boolean>>({});
    const [onlineUsersMap, setOnlineUsersMap] = useState<Record<string, boolean>>({});
    const [groupMembers, setGroupMembers] = useState<string[] | null>(null);
    const [syncTrigger, setSyncTrigger] = useState(0);
    const [dragPos, setDragPos] = useState({ x: 16, y: 70 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, px: 0, py: 0, moved: false });

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isMiniMode) return;
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY, px: dragPos.x, py: dragPos.y, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current || !isMiniMode) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragStartRef.current.moved = true;
            setDragPos({ x: dragStartRef.current.px + dx, y: dragStartRef.current.py + dy });
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleClickMiniMode = () => {
        if (isMiniMode && !dragStartRef.current.moved) {
            setIsMiniMode(false);
        }
    };
    const [students, setStudents] = useState<any[]>(() => DB.getStudents().filter((s: any) => s.id !== currentUser.id));

    const filteredStudents = React.useMemo(() => {
        if (groupMembers && groupMembers.length > 0) {
            return students.filter(s => groupMembers.includes(s.id));
        }
        return students;
    }, [students, groupMembers]);

    useEffect(() => {
        const handleSync = () => {
            setSyncTrigger(prev => prev + 1);
            setStudents(DB.getStudents().filter((s: any) => s.id !== currentUser.id));
        };
        window.addEventListener('nt-data-sync', handleSync);
        window.addEventListener('nt-students-change', handleSync);
        return () => {
            window.removeEventListener('nt-data-sync', handleSync);
            window.removeEventListener('nt-students-change', handleSync);
        };
    }, [currentUser.id]);

    // Recording features
    const [isRecording, setIsRecording] = useState(false);
    const [recordingWarningText, setRecordingWarningText] = useState("");
    const [hasSeenRecordingWarning, setHasSeenRecordingWarning] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('nt_rec_warn') === '1';
        }
        return false;
    });
    const [showRecordingWarningDialog, setShowRecordingWarningDialog] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const socketRef = useRef<any>(null); // We keep the name socketRef to avoid changing every emit call, but it'll be a polyfilled Supabase channel
    const callStatusRef = useRef(callStatus);
    const localStreamRef = useRef(localStream);
    const roomIdRef = useRef(roomId);
    const activeCallRef = useRef(activeCall);
    const callDataRef = useRef(callData);
    const callDurationRef = useRef(callDuration);

    // Ice queue
    const iceCandidateQueueRef = useRef<Record<string, RTCIceCandidateInit[]>>({});

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    };

    useEffect(() => {
        callStatusRef.current = callStatus;
        localStreamRef.current = localStream;
        roomIdRef.current = roomId;
        activeCallRef.current = activeCall;
        callDataRef.current = callData;
        callDurationRef.current = callDuration;
        const vol = isSpeakerOn ? 1.0 : 0.2;
        if (callingAudio) callingAudio.volume = vol;
        if (incomingAudio) incomingAudio.volume = vol;
        if (busyAudio) busyAudio.volume = vol;
    }, [callStatus, localStream, roomId, isSpeakerOn, activeCall, callData, callDuration]);

    const saveCallLog = (status: 'completed' | 'missed' | 'rejected', isOutgoing: boolean, partnerId: string, duration: number, isVideo: boolean) => {
        if (!partnerId) return;

        const msg = {
            id: `call-log-${roomIdRef.current || 'unknown'}-${status}-${Date.now().toString().slice(0, -5)}`, // Ensure deterministic-ish ID based on time block
            senderId: isOutgoing ? currentUser.id : partnerId,
            receiverId: isOutgoing ? partnerId : currentUser.id,
            text: '',
            timestamp: Date.now() - ((duration || 0) * 1000), // Place visually at the START of the call
            isRead: false,
            isDelivered: false,
            isDeletedForSender: false, // Ensure it always appears for the sender (caller) as Outgoing
            isDeletedForReceiver: false,
            isDeletedForEveryone: false,
            type: 'call',
            isCall: true,
            callStatus: status,
            callDuration: duration,
            isVideoCall: isVideo
        };
        DB.addPrivateMessage(msg as any);

        if (isSupabaseConnected) {
            const partnerChannel = supabase.channel(`user_${isOutgoing ? partnerId : currentUser.id}`);
            partnerChannel.subscribe((st) => {
                if (st === 'SUBSCRIBED') {
                    partnerChannel.send({ type: 'broadcast', event: 'private-message', payload: msg as any }).catch(() => { });
                    setTimeout(() => partnerChannel.unsubscribe(), 1500);
                }
            });
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nt-chat-msg-sent', {
                detail: {
                    msgType: 'private',
                    text: 'سجل مكالمة',
                    senderName: currentUser.username,
                    senderAvatar: currentUser.profilePictureUrl || currentUser.avatarUrl || '/pulse-logo.png',
                    receiverId: isOutgoing ? partnerId : currentUser.id,
                    stage: 'private'
                }
            }));
        }
    };

    useEffect(() => {
        if (callStatus === 'connected' && roomId) {
            localStorage.setItem('nt_call_room', roomId);
            localStorage.setItem('nt_call_isHost', isHost ? '1' : '0');
            localStorage.setItem('nt_call_ts', Date.now().toString());
            localStorage.setItem('nt_call_isVideo', (activeCall?.isVideo || callData?.isVideo) ? '1' : '0');
            if (!localStorage.getItem('nt_call_start')) {
                localStorage.setItem('nt_call_start', (Date.now() - callDuration * 1000).toString());
            }
        } else if (callStatus === 'idle' || callStatus === 'ended') {
            localStorage.removeItem('nt_call_room');
            localStorage.removeItem('nt_call_isHost');
            localStorage.removeItem('nt_call_ts');
            localStorage.removeItem('nt_call_start');
            localStorage.removeItem('nt_call_isVideo');
        }
    }, [callStatus, roomId, isHost, callDuration, activeCall, callData]);

    useEffect(() => {
        const savedRoom = localStorage.getItem('nt_call_room');
        const savedTs = localStorage.getItem('nt_call_ts');
        if (savedRoom && savedTs && callStatusRef.current === 'idle') {
            if (Date.now() - parseInt(savedTs) < 300000) {
                const sStart = localStorage.getItem('nt_call_start');
                setRoomId(savedRoom);
                roomIdRef.current = savedRoom;
                if (localStorage.getItem('nt_call_isHost') === '1') setIsHost(true);
                if (sStart) setCallDuration(Math.floor((Date.now() - parseInt(sStart)) / 1000));
                showToast('استعادة المكالمة...');
            }
        }
    }, []);

    useEffect(() => {
        if (showAddUser) {
            const fetchOnline = async () => {
                const now = Date.now();
                const { data } = await supabase.from('site_data').select('key, value').like('key', 'nt_presence_%');
                if (data) {
                    const mapped: Record<string, boolean> = {};
                    data.forEach(d => {
                        const uid = d.key.replace('nt_presence_', '');
                        const lastTime = parseInt(d.value || '0', 10);
                        if (now - lastTime <= 60000) mapped[uid] = true;
                    });
                    setOnlineUsersMap(mapped);
                }
            };
            fetchOnline();
            const interval = setInterval(fetchOnline, 10000);
            return () => clearInterval(interval);
        }
    }, [showAddUser]);

    const flushIceCandidateQueue = async (partnerId: string) => {
        const pc = peerConnections.current[partnerId];
        if (pc && pc.remoteDescription && iceCandidateQueueRef.current[partnerId]?.length > 0) {
            for (const candidate of iceCandidateQueueRef.current[partnerId]) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { }
            }
            iceCandidateQueueRef.current[partnerId] = [];
        }
    };

    useEffect(() => {
        const evts = ['incoming-call', 'call-accepted', 'accept-call', 'call-rejected', 'reject-call', 'call-failed', 'call-ended', 'end-call', 'offer', 'answer', 'ice-candidate', 'user-joined', 'user-left', 'invite-user', 'recording-started', 'user-came-online', 'user-already-here', 'force-kick', 'force-mute', 'force-unmute', 'chat-msg-push'];

        const channel = supabase.channel('napdtareekh_global_calls', {
            config: { broadcast: { self: false } }
        });

        const emitToSupabase = (event: string, data?: any) => {
            channel.send({
                type: 'broadcast',
                event: event,
                payload: data || {}
            }).catch(() => { });
        };

        // Polyfill the socket API so we don't have to rewrite everything below
        socketRef.current = {
            emit: emitToSupabase,
            disconnect: () => { supabase.removeChannel(channel); },
            off: () => { }
        };

        const handleMobileFocusReconnect = () => {
            if (channel && channel.state !== 'joined') {
                channel.subscribe();
            }
        };
        window.addEventListener('focus', handleMobileFocusReconnect);

        evts.forEach(evt => {
            channel.on('broadcast', { event: evt }, ({ payload }) => {
                const isForMe = payload.to === currentUser.id;
                const isForMyRoom = payload.roomId && roomIdRef.current && payload.roomId === roomIdRef.current;
                const isGlobalBroadcast = !payload.to && !payload.roomId;

                if (isForMe || isForMyRoom || isGlobalBroadcast) {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    handleIncomingEvent(evt, payload);
                }
            });
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                console.log("Supabase Call Channel Connected!");
                emitToSupabase('user-came-online', { userId: currentUser.id });

                if (roomIdRef.current && callStatusRef.current === 'idle' && localStorage.getItem('nt_call_room') === roomIdRef.current) {
                    setCallStatus('connecting');
                    navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                        video: localStorage.getItem('nt_call_isVideo') === '1' ? { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } } : false
                    }).then(stream => {
                        setLocalStream(stream);
                        localStreamRef.current = stream;
                        setCallStatus('connected');
                        emitToSupabase('user-joined', { roomId: roomIdRef.current, userId: currentUser.id });
                    }).catch(() => {
                        showToast("فشلت استعادة المكالمة. الأذونات مفقودة.");
                        setCallStatus('idle');
                        localStorage.removeItem('nt_call_room');
                    });
                }
            }
        });

        const handleIncomingEvent = async (eventName: string, data: any) => {
            if (eventName === 'user-came-online') {
                const { userId } = data;
                if (callStatusRef.current === 'calling' && activeCallRef.current?.id === userId) {
                    socketRef.current?.emit('incoming-call', {
                        to: userId,
                        from: currentUser.id,
                        fromName: currentUser.username,
                        avatarUrl: currentUser.profilePictureUrl || currentUser.avatarUrl,
                        isVideo: activeCallRef.current?.isVideo,
                        roomId: roomIdRef.current
                    });
                }
            }
            else if (eventName === 'user-joined') {
                const { userId } = data;
                if (userId === currentUser.id) return;

                if (peerConnections.current[userId]) {
                    const state = peerConnections.current[userId].connectionState;
                    if (state === 'connected' || state === 'connecting' || state === 'new') {
                        console.log("Ignored user-joined, peer already connecting or connected.");
                        return;
                    }
                    peerConnections.current[userId].close();
                    delete peerConnections.current[userId];
                }


                const pc = createPeerConnection(userId);

                // Deterministic offer creation to prevent glare!
                if (currentUser.id < userId) {
                    try {
                        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
                        await pc.setLocalDescription(offer);
                        socketRef.current?.emit('offer', { to: userId, offer, from: currentUser.id });
                    } catch (e) { }
                } else {
                    socketRef.current?.emit('user-already-here', { to: userId, from: currentUser.id });
                }
            }
            else if (eventName === 'user-already-here') {
                const { from } = data;
                if (from === currentUser.id) return;

                if (peerConnections.current[from]) {
                    const state = peerConnections.current[from].connectionState;
                    if (state === 'connected' || state === 'connecting' || state === 'new') {
                        console.log("Ignored user-already-here, peer already connected or connecting.");
                        return;
                    }
                    peerConnections.current[from].close();
                    delete peerConnections.current[from];
                }

                const pc = createPeerConnection(from);

                if (currentUser.id < from) {
                    try {
                        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
                        await pc.setLocalDescription(offer);
                        socketRef.current?.emit('offer', { to: from, offer, from: currentUser.id });
                    } catch (e) { }
                }
            }
            else if (eventName === 'user-left') {
                const { userId } = data;
                setRemoteUsers(prev => {
                    const leftUser = prev[userId]?.name;
                    if (leftUser && callStatusRef.current === 'connected') {
                        showToast(`غادر ${leftUser} المكالمة`);
                    }
                    const next = { ...prev };
                    delete next[userId];
                    return next;
                });

                if (peerConnections.current[userId]) {
                    peerConnections.current[userId].close();
                    delete peerConnections.current[userId];
                }

                if (callStatusRef.current === 'ringing' || callStatusRef.current === 'calling') {
                    if (activeCallRef.current?.id === userId || callDataRef.current?.from === userId) {
                        stopAllSounds();
                        setCallStatus('ended');

                        if (callDataRef.current) saveCallLog('missed', false, callDataRef.current.from, 0, !!callDataRef.current.isVideo);

                        setRejectMessage("تم الانهاء من الطرف الآخر");
                        setTimeout(() => cleanupCall(), 2000);
                    }
                } else if (callStatusRef.current === 'connected') {
                    if (activeCallRef.current?.id === userId || callDataRef.current?.from === userId) {
                        const isOut = !!activeCallRef.current;
                        const pId = activeCallRef.current?.id || callDataRef.current?.from;
                        const isV = activeCallRef.current?.isVideo || callDataRef.current?.isVideo;
                        if (pId) saveCallLog('completed', isOut, pId, callDurationRef.current, !!isV);
                    }

                    if (Object.keys(peerConnections.current).length === 0) {
                        stopAllSounds();
                        setCallStatus('ended');
                        setRejectMessage("تم إغلاق المكالمة");
                        setTimeout(() => cleanupCall(), 1500);
                    }
                }
            }
            else if (eventName === 'force-kick') {
                if (data.to === currentUser.id && callStatusRef.current !== 'idle') {
                    showToast("تم طردك من المكالمة بواسطة المضيف.");
                    cleanupCall();
                }
            }
            else if (eventName === 'force-mute') {
                if (data.to === currentUser.id && callStatusRef.current !== 'idle') {
                    showToast("تم كتم صوتك إجبارياً بواسطة المضيف.");
                    setIsMuted(true);
                    if (localStreamRef.current) {
                        const track = localStreamRef.current.getAudioTracks()[0];
                        if (track) track.enabled = false;
                    }
                }
            }
            else if (eventName === 'force-unmute') {
                if (data.to === currentUser.id && callStatusRef.current !== 'idle') {
                    showToast("تم فك قيود الكتم، يمكنك التحدث الآن.");
                    setIsMuted(false);
                    if (localStreamRef.current) {
                        const track = localStreamRef.current.getAudioTracks()[0];
                        if (track) track.enabled = true;
                    }
                }
            }
            else if (eventName === 'chat-msg-push') {
                if (data.to === currentUser.id && data.fullMsgObject) {
                    const existing = DB.getPrivateMessages();
                    if (!existing.some((m: any) => m.id === data.fullMsgObject.id)) {
                        existing.push(data.fullMsgObject);
                        localStorage.setItem('nt_private_msgs', JSON.stringify(existing));
                        if (typeof window !== 'undefined') window.dispatchEvent(new Event('nt-private-msgs-change'));
                    }
                }
            }
            else if (eventName === 'invite-user') {
                if (callStatusRef.current !== 'idle') return;
                setCallData({ from: data.from, fromName: data.fromName, avatarUrl: data.avatarUrl, isVideo: data.isVideo, roomId: data.roomId });
                setCallStatus('ringing');
                playMessageNotificationSound();

                // Auto-reject incoming call after 30 seconds if unanswered
                setTimeout(() => {
                    if (callStatusRef.current === 'ringing') {
                        stopAllSounds();
                        setCallStatus('ended');
                        setShowIncomingCall(false);
                        if (callDataRef.current) saveCallLog('missed', false, callDataRef.current.from, 0, !!callDataRef.current.isVideo);
                        cleanupCall();
                    }
                }, 30000);

                // Native Mobile Notification Ring (Highly robust across iOS/Android/Old browsers)
                const NotificationAPI = (window as any).Notification || (window as any).webkitNotification;
                if (typeof window !== 'undefined' && NotificationAPI && NotificationAPI.permission === 'granted') {
                    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                        navigator.serviceWorker.ready.then(reg => {
                            if (reg.showNotification) {
                                reg.showNotification(`دعوة للانضمام إلى مكالمة من ${data.fromName} 📞`, {
                                    body: 'انقر للرد على المكالمة الجماعية',
                                    icon: data.avatarUrl || '/pulse-logo.png',
                                    vibrate: [200, 100, 200],
                                    requireInteraction: true,
                                    tag: 'incoming-call'
                                } as any).catch(() => {
                                    // Fallback if SW showNotification fails
                                    try { const n = new NotificationAPI(`مكالمة واردة من ${data.fromName} 📞`, { body: 'انقر للرد على المكالمة', icon: data.avatarUrl || '/pulse-logo.png' }); n.onclick = () => window.focus(); } catch (e) { }
                                });
                            } else {
                                // Fallback SW doesn't support showNotification
                                try { const n = new NotificationAPI(`مكالمة واردة من ${data.fromName} 📞`, { body: 'انقر للرد على المكالمة', icon: data.avatarUrl || '/pulse-logo.png' }); n.onclick = () => window.focus(); } catch (e) { }
                            }
                        }).catch(() => { });
                    } else {
                        // Fallback completely (no SW found, meaning old browser or standard HTML5)
                        try { const n = new NotificationAPI(`مكالمة واردة من ${data.fromName} 📞`, { body: 'انقر للرد على المكالمة', icon: data.avatarUrl || '/pulse-logo.png' }); n.onclick = () => window.focus(); } catch (e) { }
                    }
                }
            }
            else if (eventName === 'offer') {
                const partnerId = data.from;
                let pc = peerConnections.current[partnerId];
                if (pc && (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed')) {
                    pc.close();
                    pc = null;
                }
                if (!pc) pc = createPeerConnection(partnerId);
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current?.emit('answer', { to: partnerId, answer, from: currentUser.id });
                flushIceCandidateQueue(partnerId);
            }
            else if (eventName === 'answer') {
                const pc = peerConnections.current[data.from];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    flushIceCandidateQueue(data.from);
                }
            }
            else if (eventName === 'ice-candidate') {
                const pc = peerConnections.current[data.from];
                try {
                    if (pc && pc.remoteDescription && data.candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } else if (data.candidate) {
                        if (!iceCandidateQueueRef.current[data.from]) iceCandidateQueueRef.current[data.from] = [];
                        iceCandidateQueueRef.current[data.from].push(data.candidate);
                    }
                } catch (err) { }
            }
            // Fallback old 1:1 call start protocol
            else if (eventName === 'incoming-call') {
                console.log("🔥 Incoming Call Received via Supabase!", data);
                if (callStatusRef.current !== 'idle' && callStatusRef.current !== 'ended') {
                    if (callStatusRef.current === 'ringing' && callDataRef.current?.from === data.from) {
                        console.log("Already ringing from this user. Ignoring duplicate incoming-call.");
                        return;
                    }
                    console.log("Busy: rejecting. Current status:", callStatusRef.current);
                    socketRef.current?.emit('call-rejected', { to: data.from, reason: 'busy' });
                    return;
                }
                const newRoom = data.roomId || "AmrLotfy-" + Math.random().toString(36).substr(2, 9).toUpperCase();
                setCallData({ ...data, roomId: newRoom });
                setCallStatus('ringing');
                setShowIncomingCall(true);

                // simulate showIncomingCallUI = true (it runs from callStatus = ringing)
                startIncomingRingtone();
                console.log("Ringing UI triggered for:", data.fromName);
            }
            else if (eventName === 'call-accepted' || eventName === 'accept-call') {
                stopAllSounds();
                setCallStatus('connecting' as any);
                if (activeCallRef.current && roomIdRef.current) {
                    socketRef.current?.emit('user-joined', { roomId: roomIdRef.current, userId: currentUser.id });
                }
            }
            else if (eventName === 'call-rejected' || eventName === 'reject-call' || eventName === 'call-failed') {
                stopAllSounds();
                startBusyTone();
                setCallStatus('ended');
                if (activeCallRef.current) {
                    saveCallLog(data.reason === 'offline' ? 'missed' : 'rejected', true, activeCallRef.current.id, 0, !!activeCallRef.current.isVideo);
                }
                setRejectMessage(data.reason === 'offline' ? "المستخدم غير متصل حالياً" : "تم رفض المكالمة");
                setTimeout(() => cleanupCall(), 2000);
            }
            else if (eventName === 'call-ended' || eventName === 'end-call') {
                stopAllSounds();
                startBusyTone();
                setCallStatus('ended');

                if (callStatusRef.current === 'calling' || callStatusRef.current === 'ringing') {
                    if (callDataRef.current) saveCallLog('missed', false, callDataRef.current.from, 0, !!callDataRef.current.isVideo);
                } else if (activeCallRef.current || callDataRef.current) {
                    const isOut = !!activeCallRef.current;
                    const pId = activeCallRef.current?.id || callDataRef.current?.from;
                    const isV = activeCallRef.current?.isVideo || callDataRef.current?.isVideo;
                    if (pId) saveCallLog('completed', isOut, pId, callDurationRef.current, !!isV);

                    socketRef.current?.emit('call-ended', { to: pId });
                }

                setRejectMessage("تم إنهاء المكالمة");
                setTimeout(() => cleanupCall(), 2000);
            }
            else if (eventName === 'recording-started') {
                playMessageNotificationSound();
                speakNotification("تحذير رسمي.. هذه المكالمه تسجل الان.");
            }
        };



        const handleStartCall = (e: any) => {
            const { userId, userName, isVideo, avatarUrl, groupMembers: members } = e.detail;
            setGroupMembers(members || null);
            const settings = DB.getSettings();
            if (isVideo && settings.isVideoCallEnabled === false) {
                setShowUnderConstruction('video');
                return;
            }
            if (!isVideo && settings.isVoiceCallEnabled === false) {
                setShowUnderConstruction('voice');
                return;
            }
            startCall(userId, userName, isVideo, avatarUrl);
        };
        window.addEventListener('nt-start-call', handleStartCall);

        const handleJoinGroupLink = async (e: any) => {
            const { roomId: newRoomId } = e.detail;
            if (DB.getSettings().isGroupCallEnabled === false) {
                setShowUnderConstruction('group');
                return;
            }
            const stream = await getMediaStream(true);
            if (!stream) return;
            setIsSpeakerOn(true);
            setRoomId(newRoomId);
            setCallStatus('connected');
            setIsHost(false);
            socketRef.current?.emit('user-joined', { roomId: newRoomId, userId: currentUser.id });

            // Validate that the call is actually still alive
            setTimeout(() => {
                if (callStatusRef.current === 'connected' && Object.keys(peerConnections.current).length === 0) {
                    alert('هذه المكالمة قد انتهت أو أن الرابط غير صالح حالياً.');
                    cleanupCall();
                }
            }, 8000);
        };
        window.addEventListener('nt-join-group-call-link', handleJoinGroupLink);

        const handleStartCallCountdown = (e: any) => {
            if (callStatusRef.current !== 'idle') {
                cleanupCall();
            }
            const { roomId: newRoomId } = e.detail;

            setJoinCountdown(3);
            let timerValue = 3;
            const timer = setInterval(() => {
                timerValue -= 1;
                setJoinCountdown(timerValue);
                if (timerValue <= 0) {
                    clearInterval(timer);
                    setJoinCountdown(null);
                    window.dispatchEvent(new CustomEvent('nt-join-group-call-link', { detail: { roomId: newRoomId } }));
                }
            }, 1000);
        };
        window.addEventListener('nt-start-call-countdown', handleStartCallCountdown);

        const handleChatMsg = (e: any) => {
            socketRef.current?.emit('chat-msg-push', e.detail);
        };
        window.addEventListener('nt-chat-msg-sent', handleChatMsg);

        const handleStartSoloCall = async () => {
            if (DB.getSettings().isGroupCallEnabled === false) {
                setShowUnderConstruction('group');
                return;
            }
            const stream = await getMediaStream(false);
            if (!stream) return;
            setIsSpeakerOn(true);
            const newRoomId = "AmrLotfy-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            setRoomId(newRoomId);
            setCallStatus('connected');
            setIsHost(true);
            socketRef.current?.emit('user-joined', { roomId: newRoomId, userId: currentUser.id });
        };
        window.addEventListener('nt-start-solo-call', handleStartSoloCall);

        return () => {
            evts.forEach(evt => socketRef.current?.off(evt));
            socketRef.current?.off('vapid-public-key');
            socketRef.current?.disconnect();
            socketRef.current = null;
            window.removeEventListener('nt-start-call', handleStartCall);
            window.removeEventListener('nt-join-group-call-link', handleJoinGroupLink);
            window.removeEventListener('nt-start-call-countdown', handleStartCallCountdown);
            window.removeEventListener('nt-chat-msg-sent', handleChatMsg);
            window.removeEventListener('nt-start-solo-call', handleStartSoloCall);
            window.removeEventListener('focus', handleMobileFocusReconnect);
            cleanupCall();
        };
    }, []);

    useEffect(() => {
        let timer: any;
        if (callStatus === 'connected') {
            timer = setInterval(() => setCallDuration(d => d + 1), 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [callStatus]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const getMediaStream = async (isVideo: boolean) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo ? { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } } : false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (e: any) {
            alert('فشل الوصول للكاميرا/المايك: يرجى إعطاء الصلاحية.');
            return null;
        }
    };

    const createPeerConnection = (partnerId: string) => {
        const pc = new RTCPeerConnection({
            ...configuration,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        });
        peerConnections.current[partnerId] = pc;

        const currentLocalStream = localStreamRef.current;
        if (currentLocalStream) {
            currentLocalStream.getTracks().forEach(track => {
                const sender = pc.addTrack(track, currentLocalStream);
                if (track.kind === 'video') {
                    try {
                        const params = sender.getParameters();
                        if (!params.encodings) params.encodings = [{}];
                        params.encodings[0].maxBitrate = 150000;
                        params.encodings[0].maxFramerate = 15;
                        sender.setParameters(params).catch(() => { });
                    } catch (e) { }
                }
            });
        }

        pc.onicecandidate = (event) => {
            console.log(`[WebRTC] ICE Candidate Generated for ${partnerId}`, event.candidate ? 'Valid' : 'End of candidates');
            if (event.candidate) socketRef.current?.emit('ice-candidate', { to: partnerId, candidate: event.candidate, from: currentUser.id });
        };

        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(t => {
                t.enabled = true;
                if (t.kind === 'audio') showToast("تم استلام صوت الطرف الآخر");
            });

            const hasVideoTrack = event.streams[0].getVideoTracks().length > 0;
            const intendedIsVideo = activeCallRef.current?.isVideo ?? hasVideoTrack;
            const isVideo = hasVideoTrack || intendedIsVideo;

            const partnerName = students.find(s => s.id === partnerId)?.username || activeCallRef.current?.name || callDataRef.current?.fromName || "مستخدم";
            const avatarUrl = students.find(s => s.id === partnerId)?.avatarUrl || activeCallRef.current?.avatarUrl || callDataRef.current?.avatarUrl || "";
            setRemoteUsers(prev => {
                if (!prev[partnerId] && callStatusRef.current === 'connected') {
                    showToast(`انضم ${partnerName} للمكالمة`);
                }
                return {
                    ...prev,
                    [partnerId]: { stream: event.streams[0], name: partnerName, avatarUrl, isVideo }
                };
            });
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state with ${partnerId} changed to:`, pc.connectionState);
            if (pc.connectionState === 'failed') {
                console.warn(`[WebRTC] ICE connection failed for ${partnerId}.`);
                setCallStatus('failed' as any);
                setRejectMessage("فشل الاتصال (Failed)");
                setTimeout(() => cleanupCall(), 3000);
            } else if (pc.connectionState === 'disconnected') {
                showToast("يرجى التأكد من استقرار شبكة الإنترنت لديك أو لدى الطرف الآخر..");
                setCallStatus('disconnected' as any);
                setRejectMessage("انقطع الاتصال (Disconnected)");
                setTimeout(() => cleanupCall(), 3000);
            } else if (pc.connectionState === 'connected') {
                setCallStatus('connected');
            } else if (pc.connectionState === 'connecting') {
                setCallStatus('connecting' as any);
            }
        };
        return pc;
    };

    const startCall = async (partnerId: string, partnerName: string, isVideo: boolean, avatarUrl: string) => {
        const stream = await getMediaStream(isVideo);
        if (!stream) return;

        console.log(`[WebRTC] Local stream loaded. Audio tracks: ${stream.getAudioTracks().length}, Video tracks: ${stream.getVideoTracks().length}`);

        setIsSpeakerOn(false);
        const newRoomId = "AmrLotfy-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        setRoomId(newRoomId);
        setActiveCall({ id: partnerId, name: partnerName, isVideo, avatarUrl });
        setCallStatus('calling');
        setIsHost(true);
        startCallingTone();

        console.log("📞 Sending call to:", partnerId);

        socketRef.current?.emit('incoming-call', {
            to: partnerId,
            from: currentUser.id,
            fromName: currentUser.username,
            avatarUrl: currentUser.profilePictureUrl || currentUser.avatarUrl,
            isVideo,
            roomId: newRoomId
        });

        setTimeout(() => {
            if (callStatusRef.current === 'calling') {
                endCall();
            }
        }, 25000);
    };

    const acceptCall = async () => {
        setShowIncomingCall(false);
        stopAllSounds();
        clearCallNotification();

        setCallStatus('connecting' as any);
        setIsMiniMode(false);

        const stream = await getMediaStream(callData?.isVideo);
        if (!stream) {
            rejectCall();
            return;
        }

        const joinedRoom = callData?.roomId;
        setRoomId(joinedRoom);
        // Do NOT set activeCall here. activeCall identifies the CALLER (outgoing). 
        // Receivers use callData.

        setCallStatus('connected');
        setIsSpeakerOn(false);
        socketRef.current?.emit('call-accepted', { to: callData?.from });
        socketRef.current?.emit('user-joined', { roomId: joinedRoom, userId: currentUser.id });
    };

    const rejectCall = () => {
        setShowIncomingCall(false);
        stopAllSounds();
        clearCallNotification();
        startBusyTone();
        if (callData) {
            socketRef.current?.emit('call-rejected', { to: callData.from, reason: 'busy' });
            saveCallLog('rejected', false, callData.from, 0, !!callData.isVideo);
        }
        setCallStatus('ended');
        setRejectMessage('تم الرفض');
        setTimeout(() => cleanupCall(), 2000);
    };

    const endCall = () => {
        stopAllSounds();
        startBusyTone();
        if (isRecording) stopRecording();
        if (activeCall && callStatus === 'calling') {
            socketRef.current?.emit('call-ended', { to: activeCall.id });
            saveCallLog('missed', true, activeCall.id, 0, !!activeCall.isVideo);
        } else if (activeCall || callData) {
            const isOut = !!activeCallRef.current;
            const pId = activeCallRef.current?.id || callDataRef.current?.from;
            const isV = activeCallRef.current?.isVideo || callDataRef.current?.isVideo;
            if (pId) saveCallLog('completed', isOut, pId, callDurationRef.current, !!isV);

            socketRef.current?.emit('call-ended', { to: pId });
        }
        if (roomIdRef.current) socketRef.current?.emit('user-left', { roomId: roomIdRef.current, userId: currentUser.id });
        setCallStatus('ended');
        setRejectMessage('تم إنهاء المكالمة');
        setTimeout(() => cleanupCall(), 1500);
    };

    const cleanupCall = () => {
        stopAllSounds();
        clearCallNotification();
        if (isRecording) stopRecording();
        setIsRecording(false);
        Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }
        setRemoteUsers({});
        setActiveCall(null);
        setCallData(null);
        setRoomId(null);
        setGroupMembers(null);
        setCallStatus('idle');
        setShowIncomingCall(false);
        setCallDuration(0);
        setIsMuted(false);
        setIsVideoOff(false);
    };

    const toggleSpeaker = () => setIsSpeakerOn(prev => !prev);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled); }
        }
    };

    const toggleCamera = async () => {
        if (!localStreamRef.current) return;
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (!videoTrack) return;
        try {
            const newMode = facingMode === 'user' ? 'environment' : 'user';

            videoTrack.stop();
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newMode, width: { ideal: 480 }, height: { ideal: 360 } }
            });
            const newVideoTrack = newStream.getVideoTracks()[0];

            localStreamRef.current.removeTrack(videoTrack);
            localStreamRef.current.addTrack(newVideoTrack);

            Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(newVideoTrack);
            });

            setFacingMode(newMode);
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        } catch (err) { }
    };

    const audioMixContextRef = useRef<any>(null);

    const startRecording = () => {
        try {
            recordedChunksRef.current = [];

            const mixedStream = new MediaStream();
            let hasVideo = false;

            try {
                let audioCtx = audioMixContextRef.current?.ctx;
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    audioMixContextRef.current = { ctx: audioCtx, nodes: [], hiddenAudios: [] };
                }

                // Keep trying to resume if suspended
                const tryResume = () => {
                    if (audioCtx.state === 'suspended') {
                        audioCtx.resume().then(() => console.log('AudioContext resumed via polling')).catch(() => setTimeout(tryResume, 1000));
                    }
                };
                tryResume();

                const dest = audioCtx.createMediaStreamDestination();

                if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
                    const localSource = audioCtx.createMediaStreamSource(localStreamRef.current);
                    localSource.connect(dest);
                    audioMixContextRef.current.nodes.push(localSource);
                }

                Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => {
                    const receivers = pc.getReceivers();
                    const audioTracks = receivers.map(r => r.track).filter(t => t?.kind === 'audio');
                    if (audioTracks.length > 0) {
                        try {
                            const tempStream = new MediaStream(audioTracks as MediaStreamTrack[]);

                            // Chrome fix: MUST play the stream in a hidden audio element for MediaStreamAudioSourceNode to receive data
                            // Do NOT use muted=true, as Chrome may optimize away decoding.
                            const hiddenAudio = document.createElement('audio');
                            hiddenAudio.srcObject = tempStream;
                            hiddenAudio.muted = false;
                            hiddenAudio.volume = 0.0; // Play silently
                            hiddenAudio.play().catch(e => console.warn('hidden audio play failed', e));
                            audioMixContextRef.current.hiddenAudios.push(hiddenAudio);

                            const remoteSource = audioCtx.createMediaStreamSource(tempStream);
                            remoteSource.connect(dest);
                            audioMixContextRef.current.nodes.push(remoteSource);
                        } catch (e) { }
                    }

                    const videoTracks = receivers.map(r => r.track).filter(t => t?.kind === 'video');
                    if (videoTracks.length > 0) {
                        videoTracks.forEach(t => {
                            if (t) {
                                mixedStream.addTrack(t);
                                hasVideo = true;
                            }
                        });
                    }
                });

                if (!hasVideo && localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
                    localStreamRef.current.getVideoTracks().forEach(t => mixedStream.addTrack(t));
                    hasVideo = true;
                }

                dest.stream.getAudioTracks().forEach(t => mixedStream.addTrack(t));
            } catch (e) {
                console.error("Audio mixing failed", e);
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(t => mixedStream.addTrack(t));
                }
                Object.values<RTCPeerConnection>(peerConnections.current).forEach(pc => {
                    pc.getReceivers().forEach(r => {
                        if (r.track) mixedStream.addTrack(r.track);
                    });
                });
            }

            if (mixedStream.getTracks().length === 0) return;

            // EVALUATE METADATA EXACTLY AT START TO PREVENT NULLING LATER
            const activeUserId = activeCallRef.current?.id || callDataRef.current?.from || '';
            const partnerName = students.find((s: any) => s.id === activeUserId)?.username || activeCallRef.current?.name || callDataRef.current?.fromName || 'مستخدم غير معروف';
            const participants = `(${currentUser.username}) مع (${partnerName})`;
            hasVideo = mixedStream.getVideoTracks().length > 0;
            const callType = hasVideo ? 'Video' : 'Audio';

            let mimeType = '';
            if (hasVideo) {
                if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) mimeType = 'video/webm; codecs=vp9,opus';
                else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
                else mimeType = 'video/webm';
            } else {
                if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) mimeType = 'audio/webm; codecs=opus';
                else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
                else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            }

            try {
                mediaRecorderRef.current = new MediaRecorder(mixedStream, mimeType ? { mimeType, videoBitsPerSecond: 2500000 } : { videoBitsPerSecond: 2500000 });
            } catch (mediaErr) {
                console.warn("Failed recording with mimeType", mimeType, "falling back natively.");
                mediaRecorderRef.current = new MediaRecorder(mixedStream);
            }

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const actualMimeType = mediaRecorderRef.current?.mimeType || mimeType || (callType === 'Video' ? 'video/webm' : 'audio/webm');
                const blob = new Blob(recordedChunksRef.current, { type: actualMimeType });

                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    if (!base64data) return;

                    const recId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                    const metadata = {
                        id: recId,
                        participants,
                        type: callType,
                        date: new Date().toLocaleDateString('ar-EG'),
                        time: new Date().toLocaleTimeString('ar-EG'),
                        timestamp: Date.now()
                    };

                    try {
                        const existingMeta = DB._getRecordingsMeta ? DB._getRecordingsMeta() : [];
                        existingMeta.push(metadata);

                        localStorage.setItem('nt_recordings_meta', JSON.stringify(existingMeta));
                        window.dispatchEvent(new CustomEvent('nt-recordings-meta-change'));

                        if (isSupabaseConnected) {
                            // Upload metadata IMMEDIATELY (Bypass debouncer)
                            // Use unique key to prevent array race conditions between multiple users!
                            await supabase.from('site_data').upsert({
                                key: `nt_rec_meta_${recId}`,
                                value: JSON.stringify(metadata),
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'key' });

                            // Upload the actual recording chunk
                            await supabase.from('site_data').upsert({
                                key: `nt_recordings_chunk_${recId}`,
                                value: base64data,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'key' });
                        }
                    } catch (e) {
                        console.error('Failed uploading recording:', e);
                    }
                };

                recordedChunksRef.current = [];
            };

            mediaRecorderRef.current.start(1000);
            setIsRecording(true);

            Object.keys(remoteUsers).forEach(partnerId => {
                socketRef.current?.emit('recording-started', { to: partnerId, from: currentUser.id });
            });
            // Automatically triggered, so no warning text is shown to not annoy the user since it's a silent administrative feature
        } catch (err) {
            alert('تعذر بدء التسجيل.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (audioMixContextRef.current) {
            audioMixContextRef.current.hiddenAudios?.forEach((a: HTMLAudioElement) => {
                a.pause();
                a.srcObject = null;
            });
            audioMixContextRef.current.hiddenAudios = [];
        }
        setIsRecording(false);
        setRecordingWarningText("");
    };

    useEffect(() => {
        if (callStatus === 'ended' && isRecording) {
            stopRecording();
        }
    }, [callStatus, isRecording]);

    const handleTryStartRecording = () => {
        if (!hasSeenRecordingWarning) {
            setShowRecordingWarningDialog(true);
        } else {
            startRecording();
        }
    };

    const inviteUser = (userId: string) => {
        const p = students.find(s => s.id === userId);
        if (p && roomId) {
            socketRef.current?.emit('invite-user', {
                to: userId,
                roomId: roomId,
                fromName: currentUser.username,
                avatarUrl: currentUser.profilePictureUrl || currentUser.avatarUrl,
                isVideo: !isVideoOff
            });

            const link = window.location.origin + "/call/" + roomId;
            const inviteMsg = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                senderId: currentUser.id,
                receiverId: userId,
                text: `انضم إليّ في المكالمة الجماعية الآن عبر هذا الرابط:\n${link}`,
                timestamp: Date.now(),
                isRead: false,
                isDelivered: false,
                isDeletedForSender: false,
                isDeletedForReceiver: false,
                isDeletedForEveryone: false
            };
            DB.addPrivateMessage(inviteMsg as any);

            alert(`تم دعوة ${p.username} بنجاح وإرسال الرابط في رسالة خاصة.`);
        }
        setShowAddUser(false);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        return `${m.toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
    };

    if (callStatus === 'idle' && joinCountdown === null && !linkEnded && !showIncomingCall) return null;

    let showCallUI = false;
    if (callStatus === "connected" || callStatus === "calling" || callStatus === "ended" || callStatus as string === "connecting") {
        showCallUI = true;
    }

    const isCallVideo = activeCall?.isVideo || callData?.isVideo;
    const numUsers = Object.keys(remoteUsers).length + 1; // Includes local
    const isOneOnOne = numUsers === 2 && Object.keys(remoteUsers).length === 1;

    let gridClass = "grid-cols-1";
    if (numUsers >= 3 && numUsers <= 4) gridClass = "grid-cols-2";
    else if (numUsers >= 5 && numUsers <= 9) gridClass = "grid-cols-3";
    else if (numUsers >= 10) gridClass = "grid-cols-4";

    return createPortal(
        <>
            {linkEnded && (
                <div className={`fixed inset-0 z-[2000000] bg-[#0b1121] flex flex-col items-center justify-center p-4 block`} dir="rtl">
                    <div className="w-full max-w-[320px] bg-[#1e293b] p-6 rounded-3xl border border-red-500/30 flex flex-col items-center gap-3 shadow-2xl relative overflow-hidden pt-10">
                        <button onClick={() => setLinkEnded(false)} className="absolute top-3 right-3 text-red-400 hover:text-red-500 bg-white/5 hover:bg-red-500/20 p-2 rounded-full transition-colors active:scale-95 flex items-center justify-center shadow-sm">
                            <X size={16} className="pointer-events-none" />
                        </button>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-1 bg-red-500/10 text-red-500 border border-red-500/20">
                            <PhoneOff size={28} />
                        </div>
                        <h2 className="text-white font-black text-[18px] text-center">تم انتهاء المكالمة</h2>
                        <p className="text-gray-400 text-sm font-bold text-center mt-1 w-full relative z-10 leading-snug">
                            عذراً، هذه المكالمة أُغلقت أو لم يعد بها أي شخص.
                        </p>
                    </div>
                </div>
            )}

            {joinCountdown !== null && (
                <div className={`fixed inset-0 z-[2000000] bg-[#0b1121] flex flex-col items-center justify-center p-4 block`} dir="rtl">
                    <div className="w-full max-w-[320px] bg-[#1e293b] p-6 rounded-3xl border flex flex-col items-center gap-3 shadow-2xl relative overflow-hidden" style={{ borderColor: theme.primary }}>
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: theme.primary }}></div>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-1 border" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary, borderColor: `${theme.primary}40` }}>
                            <Phone size={28} />
                        </div>
                        <h2 className="text-white font-black text-[18px] text-center w-full relative z-10">جاري الدخول...</h2>
                        <div className="text-6xl font-black mt-2 mb-2 relative z-10" style={{ color: theme.primary }}>
                            {joinCountdown}
                        </div>
                        <p className="text-gray-400 text-xs font-bold text-center w-full relative z-10 opacity-70">
                            بانتظار تجهيز الاتصال
                        </p>
                    </div>
                </div>
            )}

            {showIncomingCall && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999999999, background: 'rgba(11, 17, 33, 0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} dir="rtl">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full border-4 overflow-hidden shadow-2xl" style={{ borderColor: theme.primary }}>
                            {callData?.avatarUrl ? (
                                <img src={callData.avatarUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full bg-[#1e293b] flex items-center justify-center"><User size={48} className="text-white/50" /></div>
                            )}
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white/80 animate-spin" />
                    </div>

                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-white mb-2 tracking-wide">{callData?.fromName}</h2>
                        <p className="text-lg font-bold text-gray-300">مكالمة واردة...</p>
                    </div>

                    <div className="flex justify-center items-center gap-24 w-full">
                        <button onClick={rejectCall} className="w-[70px] h-[70px] flex-shrink-0 rounded-full bg-[#ef4444] hover:bg-[#dc2626] flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all outline-none">
                            <Phone size={32} className="rotate-[135deg]" />
                        </button>
                        <button onClick={acceptCall} className="w-[70px] h-[70px] flex-shrink-0 rounded-full bg-[#25D366] hover:bg-[#1fae54] flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,211,102,0.5)] active:scale-95 transition-all outline-none">
                            {callData?.isVideo ? <Video size={32} className="animate-pulse" /> : <Phone size={32} className="animate-pulse" />}
                        </button>
                    </div>
                </div>
            )}

            {showCallUI && !showIncomingCall && (
                <div
                    onClick={handleClickMiniMode}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={isMiniMode ? { position: 'fixed', top: `${dragPos.y}px`, left: `${dragPos.x}px`, width: '100px', height: '140px', zIndex: 9999998, background: 'rgba(11, 17, 33, 0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', cursor: 'grab', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none' } : { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999998, background: 'rgba(11, 17, 33, 0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    className={` ${isMiniMode ? 'p-0 hover:scale-[1.02]' : 'p-4'}`} dir="rtl">

                    {/* Event Toasts */}
                    <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[80000] flex flex-col gap-2 pointer-events-none transition-opacity ${isMiniMode ? 'opacity-0' : 'opacity-100'}`}>
                        {callNotifs.map(n => (
                            <div key={n.id} className="bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 shadow-xl">
                                {n.text}
                            </div>
                        ))}
                    </div>
                    {recordingWarningText && !isMiniMode && (
                        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[60000] bg-red-600 border border-red-500 text-white px-4 py-1.5 rounded-full shadow-lg font-bold text-sm animate-pulse flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white" /> {recordingWarningText}
                        </div>
                    )}

                    {!isMiniMode && (callStatus === 'connected' || callStatus === 'calling') && (
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[50000]">
                            <div className="flex gap-2">
                                <button onClick={() => setIsMiniMode(true)} className="flex items-center gap-1.5 bg-[#1e293b]/90 border border-white/10 text-white px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all shadow-lg hover:bg-white/10">
                                    <Minimize size={14} /> تصغير
                                </button>
                                {isHost && (
                                    <>
                                        <button onClick={() => setShowAddUser(true)} className="flex items-center gap-1.5 bg-emerald-600/90 text-white px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all shadow-lg hover:bg-emerald-500">
                                            <UserPlus size={14} /> إضافة شخص
                                        </button>
                                        <button onClick={() => {
                                            const link = window.location.origin + "/call/" + roomId;
                                            navigator.clipboard.writeText(link);
                                            alert("تم نسخ رابط المكالمة: " + link);
                                        }} className="flex items-center gap-1.5 bg-[#1e293b]/90 border border-white/10 text-white px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all shadow-lg hover:bg-white/10">
                                            <Link size={14} /> رابط دعوة
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="bg-black/50 px-3 py-1 rounded-full text-white font-bold text-xs border border-white/10 shadow-lg">
                                {callStatus === 'connected' ? formatTime(callDuration) : 'جاري الاتصال...'}
                            </div>
                        </div>
                    )}

                    {showAddUser && (
                        <div className="absolute inset-0 bg-[#0b1121]/80 z-[60000] flex justify-center items-center p-4">
                            <div className="bg-[#1e293b] w-full max-w-sm rounded-[2rem] p-4 flex flex-col border border-white/10 shadow-2xl h-[60vh]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-bold text-lg">إضافة أشخاص</h3>
                                    <button onClick={() => setShowAddUser(false)} className="text-gray-400 p-1 bg-white/5 rounded-full hover:bg-white/10"><Minimize size={20} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {filteredStudents.map(s => {
                                        const isOnline = DB.getOnlineStatus(s.id);
                                        return (
                                            <div key={s.id + syncTrigger} className="flex justify-between flex-row-reverse items-center bg-white/5 hover:bg-white/10 transition-colors p-2 rounded-xl">
                                                <div className="flex flex-row-reverse items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        {s.avatarUrl || s.profilePictureUrl ? (
                                                            <img src={s.avatarUrl || s.profilePictureUrl} className="w-10 h-10 object-cover rounded-full border border-white/10 bg-[#3b4a54]" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full border border-white/10 bg-[#3b4a54] flex items-center justify-center">
                                                                <User size={20} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                        {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-emerald-500 rounded-full border-[2.5px] border-[#1e293b] shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10" title="متصل الآن" />}
                                                    </div>
                                                    <span className="text-sm font-bold text-white text-right w-[150px] truncate">{s.username}</span>
                                                </div>
                                                <button onClick={() => inviteUser(s.id)} className="text-xs shrink-0 bg-emerald-500 text-black font-black px-4 py-2 rounded-lg active:scale-95 shadow-lg flex items-center gap-1.5"><UserPlus size={14} /> دعوة</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {showRecordingWarningDialog && (
                        <div className="absolute inset-0 bg-black/60 z-[70000] flex justify-center items-center p-4">
                            <div className="bg-[#1e293b] w-full max-w-sm rounded-[2rem] p-6 flex flex-col items-center border border-white/10 shadow-2xl relative text-center">
                                <button onClick={() => setShowRecordingWarningDialog(false)} className="absolute top-4 left-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400">
                                    <X size={18} />
                                </button>
                                <h3 className="text-xl font-black text-red-500 mb-3 border-b border-white/5 pb-2 w-full">إشعار خصوصية حساس</h3>
                                <p className="text-gray-300 text-sm font-bold leading-relaxed mb-6">
                                    يرجى العلم بأن تسجيل المكالمات محمي بقوانين الخصوصية والاستخدام. نحن بصفتنا المطوّرين والمنصة نُخلي مسؤوليتنا الكاملة عن أي سوء استخدام أو انتهاك ينتج عن تسجيل هذه المكالمة. يجب أن تكون لديك موافقة الطرف الآخر.<br /><br /><span className="text-red-400 text-[11px] font-black tracking-widest bg-red-500/10 px-2 py-1 rounded-md">تطوير 𝑨𝒎𝒓 𝒍𝒐𝒕𝒇𝒚</span>
                                </p>
                                <button onClick={() => {
                                    localStorage.setItem('nt_rec_warn', '1');
                                    setHasSeenRecordingWarning(true);
                                    setShowRecordingWarningDialog(false);
                                    startRecording();
                                }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 transition-all">
                                    أفهم وأتحمل المسؤولية، ابدأ التسجيل
                                </button>
                            </div>
                        </div>
                    )}

                    {(!isOneOnOne || !isCallVideo || (callStatus !== 'connected' && callStatus as string !== 'connecting')) && (callStatus === 'calling' || callStatus === 'connected' || callStatus === 'ended' || callStatus as string === 'failed' || callStatus as string === 'disconnected') ? (
                        <div className="flex flex-col items-center gap-4 absolute top-1/4 z-[50]">
                            <div className="relative">
                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 shadow-2xl overflow-hidden" style={{ borderColor: theme.primary }}>
                                    {(activeCall?.avatarUrl || callData?.avatarUrl) ? (
                                        <img src={activeCall?.avatarUrl || callData?.avatarUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full bg-[#1e293b] flex items-center justify-center"><User size={48} className="text-white/50" /></div>
                                    )}
                                </div>
                                {((callStatus === 'calling' || callStatus as string === 'connecting') || (callStatus === 'connected' && !isMuted)) && (
                                    <div className={`absolute inset-0 rounded-full border-4 border-transparent ${callStatus === 'connected' ? 'border-t-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-t-white/80'} animate-spin`} />
                                )}
                            </div>
                            <div className="text-center mt-2">
                                <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-wide drop-shadow-md">
                                    {activeCall?.name || callData?.fromName || 'المتصل'}
                                </h2>
                                <p className="text-lg sm:text-xl font-bold drop-shadow-sm" style={{ color: callStatus === 'connected' ? theme.primary : '#d1d5db' }}>
                                    {callStatus === 'calling' ? 'جاري الاتصال...' : callStatus as string === 'connecting' ? 'جاري تهيئة الاتصال...' : callStatus === 'connected' ? formatTime(callDuration) : (rejectMessage || 'تم إنهاء المكالمة')}
                                </p>
                            </div>


                        </div>
                    ) : null}

                    {(callStatus === 'connected' || callStatus as string === 'connecting') && (
                        <div className={isOneOnOne ? `absolute inset-0 w-full h-full z-0 bg-[#070b14] overflow-hidden rounded-xl` : `w-full max-w-6xl mt-16 sm:mt-12 relative flex-1 pb-24 overflow-y-auto grid gap-2 sm:gap-4 ${gridClass} items-center justify-center`}>
                            {callStatus as string === 'connecting' && isOneOnOne && (
                                <div className="absolute top-1/4 w-full flex flex-col items-center z-[100] drop-shadow-2xl">
                                    <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-wide text-center">
                                        {activeCall?.name || callData?.fromName || 'المتصل'}
                                    </h2>
                                    <p className="text-lg sm:text-xl font-bold animate-pulse text-white/70">
                                        جاري تهيئة الاتصال...
                                    </p>
                                </div>
                            )}

                            {(!isOneOnOne || isCallVideo) && (
                                <div onClick={() => { if (isOneOnOne) setPipIsLocal(true) }} className={isOneOnOne
                                    ? (pipIsLocal
                                        ? `absolute bottom-32 right-6 w-24 h-36 sm:w-32 sm:h-48 z-[500] bg-[#0f172a] rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl flex items-center justify-center transition-all cursor-pointer ${isMiniMode ? 'hidden' : ''}`
                                        : `absolute inset-0 z-0 bg-black flex items-center justify-center transition-all ${isMiniMode ? 'rounded-xl' : ''}`)
                                    : `relative w-full h-full min-h-[200px] bg-[#0f172a] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-xl flex items-center justify-center ${numUsers === 1 ? 'col-span-full row-span-full' : ''}`
                                }>
                                    {localStream && !isVideoOff && isCallVideo ? (
                                        <video ref={(el) => {
                                            if (el && el.srcObject !== localStream) {
                                                el.srcObject = localStream;
                                            }
                                        }} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0 z-0" style={{ transform: 'scaleX(-1)' }} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 z-10 relative">
                                            <div className={`${isOneOnOne ? 'w-12 h-12 border-2' : 'w-24 h-24 border-4'} rounded-full flex items-center justify-center overflow-hidden bg-[#1e293b] shadow-xl`} style={{ borderColor: theme.primary }}>
                                                {currentUser.profilePictureUrl || currentUser.avatarUrl ? <img src={currentUser.profilePictureUrl || currentUser.avatarUrl} className="w-full h-full object-cover" alt="" /> : <User size={isOneOnOne ? 20 : 40} className="text-white/20" />}
                                            </div>
                                        </div>
                                    )}
                                    {!isMiniMode && <div className={`absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded-full font-bold text-white z-20 ${isOneOnOne ? 'text-[10px]' : 'text-xs bottom-3 right-3 px-3 py-1'}`}>أنت</div>}
                                </div>
                            )}

                            {Object.entries(remoteUsers).map(([id, peer]: [string, any]) => (
                                <div key={id} onClick={() => { if (isOneOnOne) setPipIsLocal(false) }} className={isOneOnOne
                                    ? (!pipIsLocal
                                        ? `absolute bottom-32 right-6 w-24 h-36 sm:w-32 sm:h-48 z-[500] bg-[#0f172a] rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl flex items-center justify-center transition-all cursor-pointer ${isMiniMode ? 'hidden' : ''}`
                                        : `absolute inset-0 z-0 bg-black flex items-center justify-center transition-all ${isMiniMode ? 'rounded-xl' : ''}`)
                                    : `relative w-full h-full min-h-[200px] bg-[#0f172a] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-xl flex items-center justify-center`
                                }>
                                    <video autoPlay playsInline className={`w-full h-full object-cover absolute inset-0 z-0 ${(peer.stream?.getVideoTracks()?.length > 0 || peer.isVideo) ? '' : 'opacity-0 pointer-events-none'}`} ref={(el) => {
                                        if (el) {
                                            if (el.srcObject !== peer.stream) {
                                                el.srcObject = peer.stream;
                                                el.play().catch(() => { });
                                            }
                                            el.volume = 1.0; // Always full volume for the element, we control speaker gain via isSpeakerOn if we had a dedicated node, but here we just rely on system volume
                                        }
                                    }} />

                                    {isHost && (
                                        <div className="absolute top-3 left-3 flex flex-col gap-2 z-[90000]">
                                            <button onClick={() => {
                                                socketRef.current?.emit('force-kick', { to: id, roomId });
                                                showToast("تم طرد الطالب");
                                                setRemoteUsers(prev => {
                                                    const next = { ...prev };
                                                    delete next[id];
                                                    return next;
                                                });
                                                if (peerConnections.current[id]) {
                                                    peerConnections.current[id].close();
                                                    delete peerConnections.current[id];
                                                }
                                            }} className="p-2 bg-red-600/90 hover:bg-red-500 rounded-full text-white shadow-xl transition-all active:scale-90" title="طرد الطالب من المكالمة">
                                                <UserMinus size={14} />
                                            </button>
                                            <button onClick={() => {
                                                const isAlreadyMuted = mutedRemoteUsers[id];
                                                const event = isAlreadyMuted ? 'force-unmute' : 'force-mute';
                                                socketRef.current?.emit(event, { to: id, roomId });
                                                setMutedRemoteUsers(prev => ({ ...prev, [id]: !isAlreadyMuted }));
                                                showToast(isAlreadyMuted ? "تم إلغاء الكتم عن الطالب" : "تم أمر كتم صوت الطالب");
                                            }} className={`p-2 rounded-full text-white shadow-xl transition-all active:scale-90 ${mutedRemoteUsers[id] ? 'bg-emerald-600/90 hover:bg-emerald-500' : 'bg-amber-600/90 hover:bg-amber-500'}`} title={mutedRemoteUsers[id] ? "إلغاء كتم الطالب" : "كتم صوت الطالب إجبارياً"}>
                                                {mutedRemoteUsers[id] ? <Mic size={14} /> : <MicOff size={14} />}
                                            </button>
                                        </div>
                                    )}

                                    {(!peer.stream?.getVideoTracks()?.length && !peer.isVideo) && (!isOneOnOne || isCallVideo) && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21] z-10">
                                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 flex items-center justify-center mb-4 overflow-hidden bg-[#1e293b] shadow-2xl" style={{ borderColor: theme.primary }}>
                                                {peer.avatarUrl ? <img src={peer.avatarUrl} className="w-full h-full object-cover" /> : <User size={80} className="text-white/40" />}
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide drop-shadow-lg">{peer.name}</h2>
                                            <p className="text-emerald-500 font-bold mt-2 animate-pulse text-sm sm:text-base tracking-widest drop-shadow-md">00:{String(callDuration % 60).padStart(2, '0')}</p>
                                        </div>
                                    )}

                                    <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white z-20">
                                        {peer.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isMiniMode && (callStatus === 'connected' || callStatus === 'calling') ? (
                        <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-8 flex justify-center items-center w-full z-[50000]">
                            <div className="flex items-center justify-center gap-2 sm:gap-4 bg-[#1e293b]/80 p-2.5 sm:p-4 rounded-[2rem] border border-white/10 shadow-2xl">
                                <button onClick={toggleSpeaker} className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none ${isSpeakerOn ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                    <Volume2 size={20} fill={isSpeakerOn ? "currentColor" : "none"} />
                                </button>

                                <button onClick={toggleMute} className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none ${!isMuted ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} fill="currentColor" />}
                                </button>

                                {isCallVideo && (
                                    <button onClick={toggleCamera} className="flex w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl bg-white/10 hover:bg-white/20 items-center justify-center text-white shadow-lg active:scale-95 transition-all outline-none">
                                        <SwitchCamera size={20} />
                                    </button>
                                )}

                                <div className="flex bg-white/5 rounded-xl overflow-hidden border border-white/10">
                                    <button onClick={isRecording ? stopRecording : handleTryStartRecording} title="بدء التسجيل" className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center active:scale-95 transition-all outline-none ${isRecording ? 'bg-red-500' : 'hover:bg-white/20'}`}>
                                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'border-2 border-white'}`}></div>
                                    </button>
                                </div>

                                {isCallVideo && (
                                    <button onClick={toggleVideo} className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none ${!isVideoOff ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/90 hover:bg-red-500 text-white'}`} title="إيقاف الكاميرا نهائياً">
                                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} fill="currentColor" />}
                                    </button>
                                )}

                                <button onClick={endCall} className="w-[50px] h-[40px] sm:w-[70px] sm:h-[48px] flex-shrink-0 rounded-xl bg-[#ff4444] hover:bg-[#e03131] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all outline-none">
                                    <Phone size={22} className="rotate-[135deg]" fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
            {/* Under Construction Popup */}
            {showUnderConstruction && (
                <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 bg-black/70 pointer-events-auto" dir="rtl">
                    <div className="bg-[#0b1121] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />

                        <div className="w-20 h-20 bg-black/40 rounded-full mx-auto mb-6 flex items-center justify-center border border-white/5 shadow-lg relative z-10">
                            {showUnderConstruction === 'video' ? <Video className="w-10 h-10 text-cyan-400" /> : showUnderConstruction === 'group' ? <Users className="w-10 h-10 text-purple-400" /> : <Phone className="w-10 h-10 text-emerald-400" />}
                        </div>

                        <h3 className="text-2xl font-black text-white mb-4 relative z-10" style={{ color: theme?.primary }}>قريباً</h3>
                        <p className="text-sm font-bold leading-relaxed text-gray-300 relative z-10 mb-6 bg-black/30 p-4 rounded-xl border border-white/5">
                            ميزة {showUnderConstruction === 'video' ? 'مكالمات الفيديو' : showUnderConstruction === 'group' ? 'المكالمات الجماعية' : 'المكالمات الصوتية'} تحت الإنشاء والتطوير بواسطة مطور المنصة "عمرو لطفي"، وسيتم فتح الأيقونة عند انتهاء التحديث.
                        </p>

                        <button
                            onClick={() => setShowUnderConstruction(false)}
                            className="w-full py-3.5 rounded-xl font-black text-black transition-all active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)] relative z-10 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                            style={{ backgroundColor: theme?.primary || '#3b82f6' }}
                        >
                            حسناً، فهمت
                        </button>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};
