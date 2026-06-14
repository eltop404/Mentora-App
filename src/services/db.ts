import { Content, Exam, Student, Parent, Booklet, Course, PaymentOrder, PaymentStatus, Coupon, SemesterStatus, Certificate, SurveyPost, SurveyReply, SupportTicket, AITool, SiteTexts, MeetingConfig, GameExam, Lesson, Rating, PrivateMessage, GroupRoom } from '../types';
import { AI_TOOLS } from '../constants';
import { supabase, isSupabaseConnected } from './supabaseClient';
import { rtdb, ref, set, onValue } from './firebaseClient';

const KEYS = {
    CONTENT: 'nt_content',
    EXAMS: 'nt_exams',
    GAME_EXAMS: 'nt_game_exams',
    SEMESTER_STATUS: 'nt_semester_status',
    UNITS: 'nt_units',
    CERTIFICATES: 'nt_certificates',
    BOOKLETS: 'nt_booklets',
    PAYMENTS: 'nt_payments',
    STUDENTS: 'nt_students',
    VISITS: 'nt_visits',
    COUPONS: 'nt_coupons',
    SURVEYS: 'nt_surveys',
    TICKETS: 'nt_tickets',
    APP_SETTINGS: 'nt_app_settings',
    SITE_TEXTS: 'nt_site_texts',
    AI_TOOLS: 'nt_ai_tools',
    MEETING_CONFIG: 'nt_meeting_config',
    COURSES: 'nt_courses',
    NOTIFICATIONS: 'nt_notifications',
    LESSONS: 'nt_lessons',
    RATINGS: 'nt_ratings',
    DELETED_STUDENTS: 'nt_deleted_student_ids',
    GROUP_ROOMS: 'nt_group_rooms',
    PARENTS: 'nt_parents',
    SUBJECTS: 'nt_subjects',
    SECTIONS: 'nt_sections',
};

export const DEFAULT_SUBJECTS: any[] = [
    { id: 'sub1', year: 'الفرقة الأولى', stage: 'اعمال دوليه IB', specialization: '', name: 'مبادئ المحاسبة المالية' },
    { id: 'sub2', year: 'الفرقة الأولى', stage: 'اعمال دوليه IB', specialization: '', name: 'مبادئ الاقتصاد' },
    { id: 'sub3', year: 'الفرقة الأولى', stage: 'اعمال دوليه IB', specialization: '', name: 'مبادئ القانون' },
    { id: 'sub4', year: 'الفرقة الأولى', stage: 'اعمال دوليه IB', specialization: '', name: 'لغة أجنبية (1)' },
    { id: 'sub5', year: 'الفرقة الأولى', stage: 'اعمال دوليه IB', specialization: '', name: 'مبادئ إدارة الأعمال' },

    { id: 'sub6', year: 'الفرقة الأولى', stage: 'نظم المعلومات BIS', specialization: '', name: 'مبادئ الاقتصاد' },
    { id: 'sub7', year: 'الفرقة الأولى', stage: 'نظم المعلومات BIS', specialization: '', name: 'طرق ومهارات الاتصال' },
    { id: 'sub8', year: 'الفرقة الأولى', stage: 'نظم المعلومات BIS', specialization: '', name: 'التفكير الإبتكاري' },
    { id: 'sub9', year: 'الفرقة الأولى', stage: 'نظم المعلومات BIS', specialization: '', name: 'لغة أجنبية (1)' },
    { id: 'sub10', year: 'الفرقة الأولى', stage: 'نظم المعلومات BIS', specialization: '', name: 'مبادئ إدارة الأعمال' },
    { id: 'sub11', year: 'الفرقة الأولى', stage: 'نظم المعلومات BIS', specialization: '', name: 'أساسيات الحاسب وتكنولوجيا المعلومات' },

    { id: 'sub12', year: 'الفرقة الثانية', stage: 'اعمال دوليه IB', specialization: '', name: 'محاسبة التكاليف' },
    { id: 'sub13', year: 'الفرقة الثانية', stage: 'اعمال دوليه IB', specialization: '', name: 'مبادئ التسويق' },
    { id: 'sub14', year: 'الفرقة الثانية', stage: 'اعمال دوليه IB', specialization: '', name: 'قانون الأعمال' },
    { id: 'sub15', year: 'الفرقة الثانية', stage: 'اعمال دوليه IB', specialization: '', name: 'إدارة اللوجستيات وسلاسل الإمداد' },
    { id: 'sub16', year: 'الفرقة الثانية', stage: 'اعمال دوليه IB', specialization: '', name: 'مبادئ الاقتصاد الجزئي' },

    { id: 'sub17', year: 'الفرقة الثانية', stage: 'نظم المعلومات BIS', specialization: '', name: 'محاسبة الشركات' },
    { id: 'sub18', year: 'الفرقة الثانية', stage: 'نظم المعلومات BIS', specialization: '', name: 'إدارة الإنتاج والعمليات' },
    { id: 'sub19', year: 'الفرقة الثانية', stage: 'نظم المعلومات BIS', specialization: '', name: 'قانون الأعمال' },
    { id: 'sub20', year: 'الفرقة الثانية', stage: 'نظم المعلومات BIS', specialization: '', name: 'قواعد البيانات' },
    { id: 'sub21', year: 'الفرقة الثانية', stage: 'نظم المعلومات BIS', specialization: '', name: 'تصميم برامج الحاسب' },

    { id: 'sub22', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'محاسبة', name: 'المحاسبة المتوسطة (1)' },
    { id: 'sub23', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'محاسبة', name: 'التأمين وإدارة المخاطر' },
    { id: 'sub24', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'محاسبة', name: 'الإحصاء التطبيقي' },
    { id: 'sub25', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'محاسبة', name: 'مبادئ الاقتصاد الكلي' },
    { id: 'sub26', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'محاسبة', name: 'إدارة الموارد البشرية' },

    { id: 'sub27', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'تمويل', name: 'المحاسبة المتوسطة (1)' },
    { id: 'sub28', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'تمويل', name: 'التأمين وإدارة المخاطر' },
    { id: 'sub29', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'تمويل', name: 'الإحصاء التطبيقي' },
    { id: 'sub30', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'تمويل', name: 'مبادئ الاقتصاد الكلي' },
    { id: 'sub31', year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'تمويل', name: 'إدارة الموارد البشرية' },

    { id: 'sub32', year: 'الفرقة الثالثة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات', name: 'المحاسبة الضريبية' },
    { id: 'sub33', year: 'الفرقة الثالثة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات', name: 'محاسبة التكاليف' },
    { id: 'sub34', year: 'الفرقة الثالثة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات', name: 'الإحصاء التطبيقي' },
    { id: 'sub35', year: 'الفرقة الثالثة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات', name: 'قواعد البيانات المتقدمة' },
    { id: 'sub36', year: 'الفرقة الثالثة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات', name: 'الأعمال الإلكترونية' },
    { id: 'sub37', year: 'الفرقة الثالثة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات', name: 'دراسات إدارية باللغة الإنجليزية' },
];

/** Dispatch a browser CustomEvent for real-time sync across components */
const notify = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
};

const notifyByKey = (key: string) => {
    const keyMap: Record<string, string> = {
        [KEYS.CONTENT]: 'nt-content-change',
        [KEYS.EXAMS]: 'nt-exams-change',
        [KEYS.GAME_EXAMS]: 'nt-game-exams-change',
        [KEYS.BOOKLETS]: 'nt-booklets-change',
        [KEYS.COURSES]: 'nt-courses-change',
        [KEYS.LESSONS]: 'nt-lessons-change',
        [KEYS.NOTIFICATIONS]: 'nt-notifications-change',
        [KEYS.PAYMENTS]: 'nt-payments-change',
        [KEYS.COUPONS]: 'nt-coupons-change',
        [KEYS.STUDENTS]: 'nt-students-change',
        [KEYS.VISITS]: 'nt-visits-change',
        [KEYS.TICKETS]: 'nt-tickets-change',
        [KEYS.SURVEYS]: 'nt-surveys-change',
        [KEYS.SITE_TEXTS]: 'nt-site-texts-change',
        [KEYS.AI_TOOLS]: 'nt-ai-tools-change',
        [KEYS.MEETING_CONFIG]: 'nt-meeting-change',
        [KEYS.APP_SETTINGS]: 'nt-settings-change',
        [KEYS.UNITS]: 'nt-units-change',
        [KEYS.CERTIFICATES]: 'nt-certificates-change',
        [KEYS.SEMESTER_STATUS]: 'nt-lock-change',
        [KEYS.RATINGS]: 'nt-ratings-change',
        [KEYS.DELETED_STUDENTS]: 'nt-students-change', // Student-related
        'nt_units_tracker': 'nt-units-change',
        'nt_booklets': 'nt-booklets-change',
        [KEYS.PARENTS]: 'nt-parents-change',
        [KEYS.SECTIONS]: 'nt-sections-change',
    };

    const eventName = keyMap[key];
    if (eventName) {
        notify(eventName);
        notify('nt-data-sync');
    } else if (key.startsWith('nt_presence_')) {
        notify('nt-data-sync');
    }
};

export const normalizeSemester = (s: string) => {
    if (!s) return 'الفصل الدراسي الأول';
    if (s === 'الترم الأول') return 'الفصل الدراسي الأول';
    if (s === 'الترم الثاني') return 'الفصل الدراسي الثاني';
    return s;
};

export const normalizeStage = (s: string) => {
    if (!s) return 'اعمال دوليه IB';
    if (s.includes('نظم المعلومات') || s.includes('BIS')) return 'نظم المعلومات BIS';
    if (s.includes('اعمال دوليه') || s.includes('IB') || s.includes('اعمال دولية') || s.includes('أعمال')) return 'اعمال دوليه IB';
    // Legacy fallback: old stage values like "اعداديه" or "إعداديه" map to IB by default
    if (s.includes('اعداد') || s.includes('إعداد') || s.includes('ثانو') || s.includes('اعداديه')) return 'اعمال دوليه IB';
    return s;
};

export const normalizeYear = (y: string) => {
    if (!y) return 'الفرقة الأولى';
    if (y.includes('الفرقة الأولى') || y.includes('اولي') || y.includes('اول')) return 'الفرقة الأولى';
    if (y.includes('الفرقة الثانية') || y.includes('ثانيه') || y.includes('ثاني')) return 'الفرقة الثانية';
    if (y.includes('الفرقة الثالثة') || y.includes('تالته') || y.includes('ثالث')) return 'الفرقة الثالثة';
    if (y.includes('الفرقة الرابعة') || y.includes('رابعه') || y.includes('رابع')) return 'الفرقة الرابعة';
    return y;
};

const normalizeLevel = (s: string) => {
    if (!s) return 'اعمال دوليه IB';
    if (s.includes('نظم المعلومات') || s.includes('BIS')) return 'نظم المعلومات BIS';
    if (s.includes('اعمال دوليه') || s.includes('IB')) return 'اعمال دوليه IB';
    return s;
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const BIG_KEYS = [
    KEYS.STUDENTS, KEYS.PAYMENTS,
    KEYS.CONTENT, KEYS.SECTIONS, KEYS.EXAMS, KEYS.BOOKLETS, KEYS.COURSES, KEYS.LESSONS,
    KEYS.CERTIFICATES, KEYS.SURVEYS, KEYS.RATINGS, KEYS.NOTIFICATIONS,
    KEYS.TICKETS, 'nt_units_tracker', KEYS.PARENTS
];

// Memory cache for all keys to ensure synchronous performance throughout the app
const STORAGE_CACHE: Record<string, string | null> = {};

/** Native IndexedDB wrapper for large data structures (bypass 5MB LocalStorage limit) */
const IDB = {
    _db: null as IDBDatabase | null,
    async _getDB() {
        if (this._db) return this._db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open('nt_big_data', 1);
            req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('site_data')) req.result.createObjectStore('site_data'); };
            req.onsuccess = () => { this._db = req.result; resolve(req.result); };
            req.onerror = () => reject(req.error);
        });
    },
    async set(key: string, val: string) {
        try {
            const db = await this._getDB();
            const tx = db.transaction('site_data', 'readwrite');
            tx.objectStore('site_data').put(val, key);
        } catch (e) { }
    },
    async get(key: string): Promise<string | null> {
        try {
            const db = await this._getDB();
            const tx = db.transaction('site_data', 'readonly');
            return new Promise((resolve) => {
                const req = tx.objectStore('site_data').get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            });
        } catch (e) { return null; }
    }
};

/** Unified Storage Gateway: Transparent fallback from memory to IDB or LocalStorage */
const Storage = {
    getItem: (key: string): string | null => {
        if (STORAGE_CACHE[key] !== undefined) return STORAGE_CACHE[key];
        let val = null;
        try {
            val = localStorage.getItem(key);
        } catch (e) {
            console.warn(`[Storage] Failed to read ${key} from LocalStorage:`, e);
        }
        STORAGE_CACHE[key] = val;
        return val;
    },
    setItem: (key: string, value: string) => {
        STORAGE_CACHE[key] = value;
        if (BIG_KEYS.includes(key as any)) {
            // Write to IDB (Non-blocking async)
            IDB.set(key, value);
            // Also write to LocalStorage as backup if small enough
            if (value && value.length < 100000) {
                try { localStorage.setItem(key, value); } catch (e) { }
            } else {
                try { localStorage.removeItem(key); } catch (e) { } // Free up quota safely
            }
        } else {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                // If LocalStorage is full, offload to IDB immediately
                console.warn(`[Quota] LocalStorage full for ${key}, using IDB.`);
                IDB.set(key, value);
            }
        }
    },
    removeItem: (key: string) => {
        delete STORAGE_CACHE[key];
        try { localStorage.removeItem(key); } catch (e) { }
        IDB.set(key, '');
    },
    clear: () => {
        Object.keys(STORAGE_CACHE).forEach(key => delete STORAGE_CACHE[key]);
        try { localStorage.clear(); } catch (e) { }
        // We don't wipe IDB completely here as it contains critical data like students/exams
        // only transient session data is in LocalStorage
    }
};

export const StorageLayer = Storage;

const sanitizeData = (data: any): any => {
    try { return JSON.parse(JSON.stringify(data)); } catch { return data; }
};

const SYNC_QUEUE: Record<string, any> = {};
const LAST_SYNC_TIME: Record<string, number> = {};
const PENDING_TIMERS: Record<string, any> = {};
const IN_FLIGHT_REQUESTS = new Set<string>();

const scheduleSync = (key: string, immediate = false) => {
    // Extreme Scale Architecture:
    // Jitter prevents completely simultaneous "Thundering Herd" attacks on DB
    const jitter = Math.floor(Math.random() * 200);
    const delay = immediate ? 0 : (IN_FLIGHT_REQUESTS.has(key) ? 800 + jitter : 150 + jitter);

    if (PENDING_TIMERS[key]) clearTimeout(PENDING_TIMERS[key]);

    if (immediate) {
        (async () => {
            if (SYNC_QUEUE[key] !== undefined) {
                const data = SYNC_QUEUE[key];
                delete SYNC_QUEUE[key];
                LAST_SYNC_TIME[key] = Date.now();
                IN_FLIGHT_REQUESTS.add(key);
                try {
                    await DB._syncToSupabase(key, data);
                } finally {
                    IN_FLIGHT_REQUESTS.delete(key);
                }
            }
        })();
        return;
    }

    PENDING_TIMERS[key] = setTimeout(async () => {
        delete PENDING_TIMERS[key];

        if (SYNC_QUEUE[key] !== undefined) {
            const data = SYNC_QUEUE[key];
            delete SYNC_QUEUE[key];
            LAST_SYNC_TIME[key] = Date.now();

            IN_FLIGHT_REQUESTS.add(key);
            try {
                await DB._syncToSupabase(key, data);
            } finally {
                IN_FLIGHT_REQUESTS.delete(key);
            }
        }
    }, delay);
};

export const logSecurityEvent = async (type: string, severity: 'info' | 'warning' | 'critical', details: any) => {
    if (!isSupabaseConnected) return;
    try {
        await supabase.from('security_logs').insert({
            event_type: type,
            severity,
            details,
            user_agent: navigator.userAgent
        });
    } catch (e) {
    }
};

let cachedPrivateMessages: any[] | null = null;
let cachedStudents: any[] | null = null;
let cachedGroupRooms: any[] | null = null;
let cachedContent: any[] | null = null;
let cachedSections: any[] | null = null;
let cachedExams: any[] | null = null;

export const clearCache = () => {
    cachedStudents = null;
    cachedContent = null;
    cachedSections = null;
    cachedExams = null;
    cachedPrivateMessages = null;
    cachedGroupRooms = null;
};

export const DB = {
    clearCache,

    getAdsPackages: (): any[] => {
        const pkgs = safeParse(Storage.getItem('nt_ads_packages'), []);
        if (!pkgs || pkgs.length === 0) {
            return [
                { id: 'pkg_1', title: 'الباقة الشهرية', price: 49, durationMonths: 1, features: ['إزالة جميع الإعلانات', 'ظهور شارة العضوية الذهبية بجوار اسم الطالب', 'أولوية ظهور التعليقات والمشاركات', 'تجربة استخدام أفضل بدون إزعاج'], isActive: true }
            ];
        }
        return pkgs;
    },
    saveAdsPackages: (pkgs: any[]) => {
        Storage.setItem('nt_ads_packages', JSON.stringify(pkgs));
        notify('nt-ads-packages-change');
        DB._syncToServer('nt_ads_packages', pkgs);
    },
    getAds: (): any[] => safeParse(Storage.getItem('nt_ads'), []),
    saveAds: (ads: any[]) => {
        Storage.setItem('nt_ads', JSON.stringify(ads));
        notify('nt-ads-change');
        DB._syncToServer('nt_ads', ads);
    },

    getOnlineStatus: (userId: string): boolean => {
        const presence = safeParse<any>(Storage.getItem(`nt_presence_${userId}`), null);
        if (!presence || !presence.updated_at) return false;
        const statusVal = presence.status || presence.value;
        if (statusVal && statusVal !== 'متصل الآن') return false;
        const lastUpdate = new Date(presence.updated_at).getTime();
        return (Date.now() - lastUpdate) < 120000;
    },
    getLastSeen: (userId: string): number => {
        const presence = safeParse<any>(Storage.getItem(`nt_presence_${userId}`), null);
        return (presence && presence.updated_at) ? new Date(presence.updated_at).getTime() : 0;
    },
    getTypingStatus: (senderId: string, receiverId: string): boolean => {
        return !!(window as any)[`typing_${senderId}_${receiverId}`];
    },
    setTypingStatus: (senderId: string, receiverId: string, isTyping: boolean) => {
        (window as any)[`typing_${senderId}_${receiverId}`] = isTyping;
        notify('nt-typing-change');
    },

    consumeMessageQuota: (studentId: string) => {
        const student = DB.getStudents().find(s => s.id === studentId);
        if (!student) return { allowed: true, remaining: 50, resetTime: Date.now() + 3600000, packagePoints: 50 };

        const now = Date.now();
        const quotaKey = `nt_quota_${studentId}`;
        const quotaData = safeParse<any>(Storage.getItem(quotaKey), { count: 0, lastReset: now });

        const resetInterval = 86400000; // 24 hours for daily quota
        let count = quotaData.count;
        let lastReset = quotaData.lastReset;

        if (now - lastReset > resetInterval) {
            count = 0;
            lastReset = now;
        }

        const dailyLimit = student.messageQuota || 10;

        if (count < dailyLimit) {
            count++;
            Storage.setItem(quotaKey, JSON.stringify({ count, lastReset }));
            return {
                allowed: true,
                remaining: dailyLimit - count,
                resetTime: lastReset + resetInterval,
                packagePoints: student.packagePoints || 0
            };
        }

        // Use package points if daily quota is exceeded
        const currentPackage = student.packagePoints || 0;
        if (currentPackage > 0) {
            DB.updateStudent(studentId, { packagePoints: currentPackage - 1 });
            return {
                allowed: true,
                remaining: 0,
                resetTime: lastReset + resetInterval,
                packagePoints: currentPackage - 1
            };
        }

        return {
            allowed: false,
            remaining: 0,
            resetTime: lastReset + resetInterval,
            packagePoints: 0
        };
    },

    // ---- Private Messages ----
    getPrivateMessages: (u1?: string, u2?: string): PrivateMessage[] => {
        const all = safeParse<PrivateMessage[]>(StorageLayer.getItem('nt_private_messages'), []);
        if (!u1 || !u2) return all;
        return all.filter(m => (m.senderId === u1 && m.receiverId === u2) || (m.senderId === u2 && m.receiverId === u1));
    },
    savePrivateMessages: (msgs: PrivateMessage[]) => {
        StorageLayer.setItem('nt_private_messages', JSON.stringify(msgs));
        notify('nt-messages-change');
        DB._syncToServer('nt_private_messages', msgs);
    },
    addPrivateMessage: (msg: PrivateMessage, skipSync?: boolean) => {
        const all = DB.getPrivateMessages();
        all.push(msg);
        DB.savePrivateMessages(all);
    },

    // ---- Group Rooms ----
    getGroupRooms: (): GroupRoom[] => {
        return safeParse<GroupRoom[]>(Storage.getItem(KEYS.GROUP_ROOMS), []);
    },
    saveGroupRooms: (rooms: GroupRoom[]) => {
        Storage.setItem(KEYS.GROUP_ROOMS, JSON.stringify(rooms));
        notify('nt-group-rooms-change');
        DB._syncToServer(KEYS.GROUP_ROOMS, rooms);
    },
    addGroupRoom: (room: GroupRoom) => {
        const rooms = DB.getGroupRooms();
        rooms.push(room);
        DB.saveGroupRooms(rooms);
    },
    updateGroupRoom: (id: string, updated: Partial<GroupRoom>) => {
        const rooms = DB.getGroupRooms();
        const idx = rooms.findIndex(r => r.id === id);
        if (idx !== -1) {
            rooms[idx] = { ...rooms[idx], ...updated };
            DB.saveGroupRooms(rooms);
        }
    },
    deleteGroupRoom: (id: string) => {
        const rooms = DB.getGroupRooms();
        DB.saveGroupRooms(rooms.filter(r => r.id !== id));
    },
    markGroupMessagesAsRead: (roomId: string, userId: string) => {
        const all = DB.getPrivateMessages();
        let changed = false;
        all.forEach(m => {
            if (m.receiverId === roomId && m.senderId !== userId) {
                if (!m.readBy) m.readBy = [];
                if (!m.readBy.some(r => r.userId === userId)) {
                    m.readBy.push({ userId, timestamp: Date.now() });
                    changed = true;
                }
            }
        });
        if (changed) DB.savePrivateMessages(all);
    },
    hidePrivateMessageFromCallLog: (msgId: string, mode: 'me' | 'everyone', userId: string) => {
        const all = DB.getPrivateMessages();
        const idx = all.findIndex(m => m.id === msgId);
        if (idx !== -1) {
            if (mode === 'me') {
                if (all[idx].senderId === userId) all[idx].isHiddenFromLogForSender = true;
                else all[idx].isHiddenFromLogForReceiver = true;
            } else {
                all[idx].isDeletedForEveryone = true;
            }
            DB.savePrivateMessages(all);
        }
    },
    markPrivateMessagesAsRead: (senderId: string, receiverId: string, currentUserId: string) => {
        const all = DB.getPrivateMessages();
        let changed = false;
        all.forEach(m => {
            if (m.senderId === senderId && m.receiverId === receiverId) {
                if (!m.readBy) m.readBy = [];
                if (!m.readBy.some(r => r.userId === currentUserId)) {
                    m.readBy.push({ userId: currentUserId, timestamp: Date.now() });
                    m.isRead = true;
                    changed = true;
                }
            }
        });
        if (changed) DB.savePrivateMessages(all);
    },
    deletePrivateMessage: (id: string, mode: 'for_me' | 'for_everyone', source?: string, skipSync?: boolean) => {
        const all = DB.getPrivateMessages();
        const idx = all.findIndex(m => m.id === id);
        if (idx !== -1) {
            if (mode === 'for_me') all[idx].isDeletedForMe = true;
            else all[idx].isDeletedForEveryone = true;
            DB.savePrivateMessages(all);
        }
    },
    updatePrivateMessageText: (id: string, text: string, skipSync?: boolean) => {
        const all = DB.getPrivateMessages();
        const idx = all.findIndex(m => m.id === id);
        if (idx !== -1) {
            all[idx].text = text;
            all[idx].is_edited = true;
            DB.savePrivateMessages(all);
        }
    },
    updatePrivateMessageReactions: (id: string, userId: string, emoji: string | null, skipSync?: boolean) => {
        const all = DB.getPrivateMessages();
        const idx = all.findIndex(m => m.id === id);
        if (idx !== -1) {
            const reactions = { ...(all[idx].reactions || {}) };
            if (emoji) reactions[userId] = emoji;
            else delete reactions[userId];
            all[idx].reactions = reactions;
            DB.savePrivateMessages(all);
        }
    },
    pinPrivateMessage: (id: string) => {
        const all = DB.getPrivateMessages();
        all.forEach(m => { if (m.id === id) m.isPinned = true; });
        DB.savePrivateMessages(all);
    },
    unpinPrivateMessage: (id: string) => {
        const all = DB.getPrivateMessages();
        all.forEach(m => { if (m.id === id) m.isPinned = false; });
        DB.savePrivateMessages(all);
    },
    togglePrivateMessageStar: (id: string) => {
        const all = DB.getPrivateMessages();
        all.forEach(m => { if (m.id === id) m.isStarred = !m.isStarred; });
        DB.savePrivateMessages(all);
    },

    pinGroupMessage: (roomId: string, msgId: string) => {
        const rooms = DB.getGroupRooms();
        const idx = rooms.findIndex(r => r.id === roomId);
        if (idx !== -1) {
            rooms[idx].pinnedMessageIds = [...(rooms[idx].pinnedMessageIds || []), msgId];
            DB.saveGroupRooms(rooms);
        }
    },
    unpinGroupMessage: (roomId: string, msgId: string) => {
        const rooms = DB.getGroupRooms();
        const idx = rooms.findIndex(r => r.id === roomId);
        if (idx !== -1) {
            rooms[idx].pinnedMessageIds = (rooms[idx].pinnedMessageIds || []).filter(id => id !== msgId);
            DB.saveGroupRooms(rooms);
        }
    },

    // ---- Content ----
    getContent: (): Content[] => {
        if (cachedContent) return cachedContent;
        const items = safeParse<Content[]>(Storage.getItem(KEYS.CONTENT), []);
        cachedContent = items.map(c => ({
            ...c,
            stage: normalizeStage(c.stage),
            year: normalizeYear(c.year),
            semester: normalizeSemester(c.semester)
        }));
        return cachedContent;
    },
    saveContent: (contents: Content[]) => {
        cachedContent = contents;
        Storage.setItem(KEYS.CONTENT, JSON.stringify(contents));
        notify('nt-content-change');
        DB._syncToServer(KEYS.CONTENT, contents);
    },
    addContent: (content: Content) => {
        const contents = DB.getContent();
        contents.push(content);
        DB.saveContent(contents);
        if (content.unit) DB.markUnitUpdated(content.stage, content.year, content.semester, content.unit);
        DB.setLatestContentUpdate(`تم إضافة محتوى جديد: ${content.title}`, 'lessons');
    },
    updateContent: (id: string, updated: Partial<Content>) => {
        const contents = DB.getContent();
        const index = contents.findIndex(c => c.id === id);
        if (index !== -1) {
            contents[index] = { ...contents[index], ...updated };
            DB.saveContent(contents);
            if (contents[index].unit) DB.markUnitUpdated(contents[index].stage, contents[index].year, contents[index].semester, contents[index].unit);
        }
    },
    deleteContent: (id: string) => {
        DB.saveContent(DB.getContent().filter(c => c.id !== id));
    },


    // ---- Sections ----
    getSections: (): Content[] => {
        if (cachedSections) return cachedSections;
        const items = safeParse<Content[]>(Storage.getItem(KEYS.SECTIONS), []);
        cachedSections = items.map(c => ({
            ...c,
            stage: normalizeStage(c.stage),
            year: normalizeYear(c.year),
            semester: normalizeSemester(c.semester)
        }));
        return cachedSections;
    },
    saveSections: (sections: Content[]) => {
        cachedSections = sections;
        Storage.setItem(KEYS.SECTIONS, JSON.stringify(sections));
        notify('nt-sections-change');
        DB._syncToServer(KEYS.SECTIONS, sections);
    },
    addSection: (section: Content) => {
        const sections = DB.getSections();
        sections.push(section);
        DB.saveSections(sections);
        if (section.unit) DB.markUnitUpdated(section.stage, section.year, section.semester, section.unit);
        DB.setLatestContentUpdate('تم إضافة سكشن جديد: ' + section.title, 'lessons');
    },
    updateSection: (id: string, updated: Partial<Content>) => {
        const sections = DB.getSections();
        const index = sections.findIndex(c => c.id === id);
        if (index !== -1) {
            sections[index] = { ...sections[index], ...updated };
            DB.saveSections(sections);
            if (sections[index].unit) DB.markUnitUpdated(sections[index].stage, sections[index].year, sections[index].semester, sections[index].unit);
        }
    },
    deleteSection: (id: string) => {
        DB.saveSections(DB.getSections().filter(c => c.id !== id));
    },

    // ---- Exams ----
    getExams: (): Exam[] => {
        if (cachedExams) return cachedExams;
        const items = safeParse<Exam[]>(Storage.getItem(KEYS.EXAMS), []);
        cachedExams = items.map(e => ({
            ...e,
            stage: normalizeStage(e.stage),
            year: normalizeYear(e.year),
            semester: normalizeSemester(e.semester)
        }));
        return cachedExams;
    },
    saveExams: (exams: Exam[]) => {
        cachedExams = exams;
        Storage.setItem(KEYS.EXAMS, JSON.stringify(exams));
        notify('nt-exams-change');
        DB._syncToServer(KEYS.EXAMS, exams);
    },
    addExam: (exam: Exam) => {
        const exams = DB.getExams();
        exams.push(exam);
        DB.saveExams(exams);
        DB.setLatestContentUpdate(`تم إضافة امتحان جديد: ${exam.title}`, 'exams');
    },
    updateExam: (id: string, updated: Partial<Exam>) => {
        const exams = DB.getExams();
        const index = exams.findIndex(e => e.id === id);
        if (index !== -1) {
            exams[index] = { ...exams[index], ...updated };
            DB.saveExams(exams);
        }
    },
    deleteExam: (id: string) => {
        DB.saveExams(DB.getExams().filter(e => e.id !== id));
    },



    // ---- Game Exams ----
    getGameExams: (): GameExam[] => {
        const items = safeParse<GameExam[]>(Storage.getItem(KEYS.GAME_EXAMS), []);
        return items.map(e => ({
            ...e,
            stage: normalizeStage(e.stage),
            year: normalizeYear(e.year),
            semester: normalizeSemester(e.semester)
        }));
    },
    saveGameExams: (exams: GameExam[]) => {
        Storage.setItem(KEYS.GAME_EXAMS, JSON.stringify(exams));
        notify('nt-game-exams-change');
        DB._syncToServer(KEYS.GAME_EXAMS, exams);
    },
    addGameExam: (exam: GameExam) => {
        const exams = DB.getGameExams();
        exams.push(exam);
        DB.saveGameExams(exams);
        DB.setLatestContentUpdate(`تم إضافة لعبة تفاعلية جديدة: ${exam.title}`, 'game_exams');
    },
    updateGameExam: (id: string, updated: Partial<GameExam>) => {
        const exams = DB.getGameExams();
        const index = exams.findIndex((e: any) => e.id === id);
        if (index !== -1) {
            exams[index] = { ...exams[index], ...updated };
            DB.saveGameExams(exams);
        }
    },
    deleteGameExam: (id: string) => {
        DB.saveGameExams(DB.getGameExams().filter((e: any) => e.id !== id));
    },

    // ---- Semester Status ----
    getSemesterStatuses: (): SemesterStatus[] => {
        return safeParse<SemesterStatus[]>(Storage.getItem(KEYS.SEMESTER_STATUS), []);
    },
    setSemesterStatus: (stage: string, year: string, semester: string, isLocked: boolean) => {
        const statuses = DB.getSemesterStatuses();
        const id = `${normalizeStage(stage)}-${normalizeYear(year)}-${normalizeSemester(semester)}`;
        const index = statuses.findIndex(s => s.id === id);
        if (index !== -1) {
            statuses[index].isLocked = isLocked;
        } else {
            statuses.push({ id, isLocked });
        }
        Storage.setItem(KEYS.SEMESTER_STATUS, JSON.stringify(statuses));
        notify('nt-lock-change');
        DB._syncToServer(KEYS.SEMESTER_STATUS, statuses);
    },
    isSemesterLocked: (stage: string, year: string, semester: string): boolean => {
        const statuses = DB.getSemesterStatuses();
        const id = `${normalizeStage(stage)}-${normalizeYear(year)}-${normalizeSemester(semester)}`;
        return statuses.find(s => s.id === id)?.isLocked || false;
    },

    // ---- Subjects ----
    getSubjectsRaw: (): any[] => {
        const items = safeParse<any[]>(Storage.getItem(KEYS.SUBJECTS), []);
        return items.length > 0 ? items : DEFAULT_SUBJECTS;
    },
    getSubjects: (stage: string, year: string, specialization: string): string[] => {
        const all = DB.getSubjectsRaw();
        const normStage = normalizeStage(stage);
        const normYear = normalizeYear(year);
        const isUpperYear = normYear.includes('الثالثة') || normYear.includes('الرابعة');
        return all
            .filter(s => {
                const stageMatch = normalizeStage(s.stage) === normStage;
                const yearMatch = normalizeYear(s.year) === normYear;
                if (!stageMatch || !yearMatch) return false;
                // If student has no specialization but is in 3rd/4th year, show all subjects for that year
                if (isUpperYear && (!specialization || specialization === '')) return true;
                return s.specialization === specialization || !s.specialization || s.specialization === '';
            })
            .map(s => s.name);
    },
    saveSubjectsRaw: (subs: any[]) => {
        Storage.setItem(KEYS.SUBJECTS, JSON.stringify(subs));
        notify('nt-subjects-change');
        DB._syncToServer(KEYS.SUBJECTS, subs);
    },
    addSubjectRaw: (sub: any) => {
        const subs = DB.getSubjectsRaw();
        subs.push(sub);
        DB.saveSubjectsRaw(subs);
    },
    updateSubjectRaw: (id: string, updated: any) => {
        const subs = DB.getSubjectsRaw();
        const idx = subs.findIndex(s => s.id === id);
        if (idx !== -1) {
            subs[idx] = { ...subs[idx], ...updated };
            DB.saveSubjectsRaw(subs);
        }
    },
    deleteSubjectRaw: (id: string) => {
        DB.saveSubjectsRaw(DB.getSubjectsRaw().filter(s => s.id !== id));
    },
    // Save a flat name-list back as subject objects for a given stage/year/spec
    saveSubjects: (stage: string, year: string, specialization: string, names: string[]) => {
        const all = DB.getSubjectsRaw();
        const spec = specialization || '';
        const normStage = normalizeStage(stage);
        const normYear = normalizeYear(year);
        const rest = all.filter(s => !(normalizeStage(s.stage) === normStage && normalizeYear(s.year) === normYear && s.specialization === spec));
        const fresh = names.map((name, i) => ({
            id: `sub_${stage}_${year}_${spec}_${i}_${Date.now()}`,
            stage,
            year,
            specialization: spec,
            name,
        }));
        DB.saveSubjectsRaw([...rest, ...fresh]);
    },

    // Legacy units compat
    getUnits: (stage: string, year: string, semester: string, specialization: string = ''): string[] => {
        return DB.getSubjects(stage, year, specialization);
    },
    saveUnits: async (stage: string, year: string, semester: string, units: string[]) => {
        // Obsolete, left for compat
    },
    markUnitUpdated: (stage: string, year: string, semester: string, unitName: string) => {
        const tracker = safeParse<any>(Storage.getItem('nt_units_tracker'), {});
        const key = `${normalizeStage(stage)}-${normalizeYear(year)}-${normalizeSemester(semester)}-${unitName}`;
        tracker[key] = Date.now();
        Storage.setItem('nt_units_tracker', JSON.stringify(tracker));
        DB._syncToServer('nt_units_tracker', tracker);
    },
    getUnitUpdatedTime: (stage: string, year: string, semester: string, unitName: string): number => {
        const tracker = safeParse<any>(Storage.getItem('nt_units_tracker'), {});
        const key = `${normalizeStage(stage)}-${normalizeYear(year)}-${normalizeSemester(semester)}-${unitName}`;
        return tracker[key] || 0;
    },

    // ---- Certificates ----
    getCertificates: (studentId?: string): Certificate[] => {
        const all = safeParse<Certificate[]>(Storage.getItem(KEYS.CERTIFICATES), []);
        return studentId ? all.filter(c => c.studentId === studentId) : all;
    },
    saveCertificates: (certificates: Certificate[]) => {
        Storage.setItem(KEYS.CERTIFICATES, JSON.stringify(certificates));
        notify('nt-certificates-change');
        DB._syncToServer(KEYS.CERTIFICATES, certificates);
    },
    addCertificate: (cert: Certificate) => {
        const all = DB.getCertificates();
        const existingId = all.findIndex(c => String(c.examId).trim() === String(cert.examId).trim() && c.studentId === cert.studentId);
        if (existingId !== -1) {
            all[existingId] = cert;
        } else {
            all.push(cert);
        }
        DB.saveCertificates(all);
    },
    checkHasPassedExam: (studentId: string, examId: string): boolean => {
        const all = DB.getCertificates(studentId);
        return all.some(c => String(c.examId).trim() === String(examId).trim());
    },
    deleteCertificate: (id: string) => {
        const filtered = DB.getCertificates().filter(c => c.id !== id);
        DB.saveCertificates(filtered);
    },
    updateCertificate: (id: string, updated: any) => {
        const all = DB.getCertificates();
        const existingIdx = all.findIndex(c => c.id === id);
        if (existingIdx !== -1) {
            all[existingIdx] = { ...all[existingIdx], ...updated };
            DB.saveCertificates(all);
        }
    },

    // ---- Booklets ----
    getBooklets: (): Booklet[] => {
        const items = safeParse<Booklet[]>(Storage.getItem(KEYS.BOOKLETS), []);
        return items.map(c => ({
            ...c,
            stage: normalizeStage(c.stage),
            year: normalizeYear(c.year),
            semester: normalizeSemester(c.semester)
        }));
    },
    saveBooklets: (booklets: Booklet[]) => {
        Storage.setItem(KEYS.BOOKLETS, JSON.stringify(booklets));
        notify("nt-booklets-change");
        DB._syncToServer(KEYS.BOOKLETS, booklets);
    },
    addBooklet: (booklet: Booklet) => {
        const booklets = DB.getBooklets();
        booklets.push(booklet);
        DB.saveBooklets(booklets);
        if (booklet.unit) DB.markUnitUpdated(booklet.stage, booklet.year, booklet.semester, booklet.unit);
        DB.setLatestContentUpdate(`تم إضافة ملخص جديد: ${booklet.title}`, "booklets");
    },
    updateBooklet: (id: string, updated: Partial<Booklet>) => {
        const booklets = DB.getBooklets();
        const index = booklets.findIndex(b => b.id === id);
        if (index !== -1) {
            booklets[index] = { ...booklets[index], ...updated };
            DB.saveBooklets(booklets);
            if (booklets[index].unit) DB.markUnitUpdated(booklets[index].stage, booklets[index].year, booklets[index].semester, booklets[index].unit);
        }
    },
    deleteBooklet: (id: string) => {
        DB.saveBooklets(DB.getBooklets().filter(b => b.id !== id));
    },

    // ---- Students ----
    /**
     * Prevents data duplication in arrays of objects.
     * @param array The array to deduplicate.
     * @param key The unique key to identify duplicates (default: "id").
     */
    removeDuplicates: <T>(array: T[], key: keyof T = "id" as keyof T): T[] => {
        if (!Array.isArray(array)) return [];
        const seen = new Set();
        return array.filter(item => {
            const val = item[key];
            if (!val || seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    },

    getStudents: (): Student[] => {
        if (cachedStudents) return cachedStudents;

        const raw = Storage.getItem(KEYS.STUDENTS);
        const items = safeParse<Student[]>(raw, []);

        // GLOBAL PURGE ENGINE: Always filter out students in the blacklist
        const deletedIds = safeParse<string[]>(Storage.getItem(KEYS.DELETED_STUDENTS), []).map(id => String(id));
        const filtered = items.filter(s => {
            if (!s || !s.id) return false;
            const sid = String(s.id);
            const isGhost = s.username === "YYUYUUY" || s.username === "Student" || !s.username;
            return !deletedIds.includes(sid) && !s.isDeleted && !isGhost;
        });

        // START MIGRATION: Convert old IDs to MN-27 format
        let needsSave = false;
        filtered.forEach((s, index) => {
            if (s.id && (s.id.startsWith("NT-") || s.id.startsWith("ME-"))) {
                needsSave = true;
                const oldId = s.id;

                let gradeCode = "0";
                if (s.year && s.year.includes("الأولى")) gradeCode = "1";
                else if (s.year && s.year.includes("الثانية")) gradeCode = "2";
                else if (s.year && s.year.includes("الثالثة")) gradeCode = "3";
                else if (s.year && s.year.includes("الرابعة")) gradeCode = "4";

                const randomNum = Math.floor(1000 + Math.random() * 9000);
                const orderNum = index + 1;
                const newId = `MN-27-${gradeCode}-${randomNum}-${orderNum}`;

                s.id = newId;

                // Update references in other tables
                const updateRefs = (key, idField) => {
                    const rawData = Storage.getItem(key);
                    if (rawData) {
                        try {
                            const parsed = JSON.parse(rawData);
                            let changed = false;
                            parsed.forEach(item => {
                                if (item[idField] === oldId) {
                                    item[idField] = newId;
                                    changed = true;
                                }
                            });
                            if (changed) Storage.setItem(key, JSON.stringify(parsed));
                        } catch (e) { }
                    }
                };

                updateRefs(KEYS.PAYMENTS, "studentId");
                updateRefs(KEYS.CERTIFICATES, "studentId");
                updateRefs(KEYS.EXAMS_HISTORY, "studentId");
                updateRefs(KEYS.ACTIVITY_LOGS, "studentId");
            }
        });
        if (needsSave) {
            Storage.setItem(KEYS.STUDENTS, JSON.stringify(filtered));

            const curUserRaw = Storage.getItem("nt_current_user");
            if (curUserRaw) {
                try {
                    const cu = JSON.parse(curUserRaw);
                    const matching = filtered.find(s => s.username === cu.username);
                    if (matching && matching.id !== cu.id) {
                        Storage.setItem("nt_current_user", JSON.stringify(matching));
                        setTimeout(() => window.location.reload(), 100);
                    }
                } catch (e) { }
            }
        }
        // END MIGRATION

        cachedStudents = filtered.map(c => {
            let fixedEmail = c.universityEmail;
            if (fixedEmail && fixedEmail.includes(".user@")) {
                fixedEmail = fixedEmail.replace(".user@", "@");
            }
            let cCoins = Number(c.coins) || 0;
            let cPoints = Number(c.points) || 0;
            // Prevent huge concatenated numbers or string duplications
            if (cCoins > 1000000) cCoins = 0;
            if (cPoints > 1000000) cPoints = 0;
            
            // Just take the max instead of adding them, since they might be synced/duplicated
            const totalCoinsPoints = Math.max(cCoins, cPoints);

            return {
                ...c,
                level: normalizeLevel(c.level),
                year: normalizeYear(c.year),
                semester: normalizeSemester(c.semester),
                universityEmail: fixedEmail,
                coins: totalCoinsPoints,
                points: totalCoinsPoints
            };
        });
        return cachedStudents;
    },
    saveStudents: (students: Student[]) => {
        // PER USER REQUIREMENT: Absolute Hard Purge. 
        // We ensure no deleted student ever makes it into the storage/sync.
        const deletedIds = safeParse<string[]>(Storage.getItem(KEYS.DELETED_STUDENTS), []).map(id => String(id));
        const cleanList = (students || []).filter(s => {
            if (!s || !s.id) return false;
            const sid = String(s.id);
            const isGhost = s.username === "YYUYUUY" || s.username === "Student" || !s.username;
            return !deletedIds.includes(sid) && !s.isDeleted && !isGhost;
        });

        const finalCleanList = cleanList.map(s => ({
            ...s,
            achievements: DB.removeDuplicates(s.achievements || [], "id"),
            completedExams: Array.from(new Set(s.completedExams || []))
        }));

        cachedStudents = DB.removeDuplicates(finalCleanList, "id");
        Storage.setItem(KEYS.STUDENTS, JSON.stringify(cachedStudents));
        notify("nt-students-change");

        // Force sync for this critical operation
        DB._syncToServer(KEYS.STUDENTS, cachedStudents);
    },
    generateUniversityData: (student: Student, existingStudents: Student[]) => {
        if (student.universityEmail && student.universityId) return student;

        let dept = "GENERAL";
        if (student.level?.includes("IB")) dept = "IB";
        else if (student.level?.includes("BIS")) dept = "BIS";

        // If not IB or BIS, we can either skip or use GENERAL. The user asked for IB/BIS.
        // Lets generate it anyway for everyone, just to be safe.
        if (dept === "GENERAL" && !student.level?.includes("IB") && !student.level?.includes("BIS")) {
            if (student.level) dept = student.level.replace(/[^a-zA-Z]/g, "").toUpperCase() || "STU";
        }

        const arabicToEnglish = (str: string) => {
            const map: Record<string, string> = {
                "أ": "a", "ا": "a", "إ": "e", "آ": "a",
                "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h", "خ": "kh",
                "د": "d", "ذ": "z", "ر": "r", "ز": "z", "س": "s", "ش": "sh",
                "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh",
                "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
                "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "a", "ئ": "e", "ء": "a", "ؤ": "o"
            };
            return str.split("").map((char: string) => map[char] || char).join("").toLowerCase().replace(/[^a-z0-9]/g, "");
        };

        const parts = (student.username || "").trim().split(/\s+/);
        const first = parts[0] ? arabicToEnglish(parts[0]) : "student";
        const hasLast = parts.length > 1;
        const last = hasLast ? arabicToEnglish(parts[parts.length - 1]) : "";

        let baseEmail = hasLast ? `${dept}.${first}.${last}@mentora.edu.eg` : `${dept}.${first}@mentora.edu.eg`;
        let finalEmail = baseEmail;
        let counter = 1;

        while (existingStudents.some(s => s.universityEmail === finalEmail)) {
            finalEmail = hasLast
                ? `${dept}.${first}.${last}${counter.toString().padStart(2, "0")}@mentora.edu.eg`
                : `${dept}.${first}${counter.toString().padStart(2, "0")}@mentora.edu.eg`;
            counter++;
        }

        // Generate ID
        const deptStudents = existingStudents.filter(s => s.universityId && s.universityId.startsWith(dept));
        const nextIdNum = deptStudents.length + 1;
        // Format: IB250001
        const yearPrefix = new Date().getFullYear().toString().slice(-2);
        const finalId = `${dept}${yearPrefix}${nextIdNum.toString().padStart(4, "0")}`;

        return {
            ...student,
            department: dept,
            englishName: hasLast ? `${first} ${last}` : first,
            universityEmail: finalEmail,
            universityId: finalId
        };
    },
    addStudent: (student: Student) => {
        const students = DB.getStudents();
        const index = students.findIndex(s => s.id === student.id);

        let newUser: Student = {
            ...student,
            messageQuota: student.messageQuota || 10,
            extraQuotaPoints: student.extraQuotaPoints || 0,
            usedExtraPoints: student.usedExtraPoints || 0,
            coins: Number(student.coins) || 0,
            points: Number(student.points) || 0,
            completedExams: student.completedExams || [],
            achievements: student.achievements || [],
            isBlocked: student.isBlocked || false,
            isChatFree: student.isChatFree || false,
            regDate: student.regDate || (function(){try{return new Date().toLocaleDateString('ar-EG');}catch(e){return new Date().toISOString().split('T')[0];}})(),
            regTime: student.regTime || (function(){try{return new Date().toLocaleTimeString('ar-EG');}catch(e){return new Date().toISOString().split('T')[1].split('.')[0];}})(),
            referral_code: student.referral_code || DB.generateReferralCode(student.username),
            referred_by: student.referred_by || '',
            referral_count: student.referral_count || 0,
            referral_earnings: student.referral_earnings || 0,
            referral_status: student.referral_status || 'pending',
            isEmailVerified: student.isEmailVerified || false,
            isVerified: student.isVerified || false,
        };

        // Inject University Data for new students
        if (index === -1) {
            newUser = DB.generateUniversityData(newUser, students);
        }

        if (index !== -1) {
            students[index] = { ...students[index], ...newUser };
        } else {
            students.push(newUser);
        }
        DB.saveStudents(students);
        window.dispatchEvent(new Event('nt-students-change'));
    },
    updateStudent: (id: string, updated: Partial<Student>) => {
        const students = DB.getStudents();
        const index = students.findIndex(s => s.id === id);
        if (index !== -1) {
            let newStudent = { ...students[index], ...updated };
            
            // Ensure coins and points are strictly numbers
            if ('coins' in updated) newStudent.coins = Number(updated.coins) || 0;
            if ('points' in updated) newStudent.points = Number(updated.points) || 0;

            if ('coins' in updated && !('points' in updated)) newStudent.points = newStudent.coins;
            else if ('points' in updated && !('coins' in updated)) newStudent.coins = newStudent.points;
            else if ('coins' in updated && 'points' in updated) newStudent.points = newStudent.coins;
            
            students[index] = newStudent;
            DB.saveStudents(students);

            // Sync with current user if needed
            const curr = StorageLayer.getItem('nt_current_user');
            if (curr) {
                const user = JSON.parse(curr);
                if (user.id === id) {
                    StorageLayer.setItem('nt_current_user', JSON.stringify({ ...user, ...newStudent }));
                    window.dispatchEvent(new CustomEvent('nt-user-updated'));
                }
            }
        }
    },

    // ---- Parents ----
    getParents: (): Parent[] => {
        const raw = Storage.getItem(KEYS.PARENTS);
        return safeParse<Parent[]>(raw, []);
    },
    saveParents: (parents: Parent[]) => {
        Storage.setItem(KEYS.PARENTS, JSON.stringify(parents));
        notify('nt-parents-change');
        DB._syncToServer(KEYS.PARENTS, parents);
    },
    addParent: (parent: Parent) => {
        const parents = DB.getParents();
        const index = parents.findIndex(p => p.id === parent.id);
        if (index !== -1) {
            parents[index] = { ...parents[index], ...parent };
        } else {
            parents.push(parent);
        }
        DB.saveParents(parents);
    },
    updateParent: (id: string, updated: Partial<Parent>) => {
        const parents = DB.getParents();
        const index = parents.findIndex(p => p.id === id);
        if (index !== -1) {
            parents[index] = { ...parents[index], ...updated };
            DB.saveParents(parents);

            const curr = StorageLayer.getItem('nt_current_user');
            if (curr) {
                const user = JSON.parse(curr);
                if (user.id === id) {
                    StorageLayer.setItem('nt_current_user', JSON.stringify({ ...user, ...updated }));
                    window.dispatchEvent(new CustomEvent('nt-user-updated'));
                }
            }
        }
    },
    getParentByStudentId: (studentId: string): Parent | undefined => {
        return DB.getParents().find(p => p.studentId === studentId);
    },

    transliterateArabicToEnglish: (text: string): string => {
        const arabicToLatinMap: { [key: string]: string } = {
            'أ': 'a', 'إ': 'i', 'آ': 'a', 'ا': 'a',
            'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
            'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th',
            'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
            'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
            'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
            'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
            'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
            'ة': 'h', 'ئ': 'e', 'ؤ': 'o', 'ء': 'a',
            'لا': 'la'
        };

        let result = '';
        const cleanText = (text || '').trim().toLowerCase();
        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            if (arabicToLatinMap[char] !== undefined) {
                result += arabicToLatinMap[char];
            } else if (/[a-z0-9]/.test(char)) {
                result += char;
            } else if (char === ' ') {
                result += '_';
            }
        }
        return result.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    },
    generateReferralCode: (username: string): string => {
        const englishName = DB.transliterateArabicToEnglish(username);
        const baseName = englishName || 'student';

        let randomChars = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 12; i++) {
            randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return `${baseName}_${randomChars}_mentora`;
    },
    isReferralCodeClean: (code: string | undefined): boolean => {
        if (!code) return false;
        // Accept any non-empty existing code - never replace a code that already exists
        const parts = code.split('_');
        if (parts.length < 2) return false;
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];
        // Accept _mentora suffix
        if (lastPart === 'mentora') return true;
        // Accept legacy _napd_altareekh suffix
        if (secondLastPart === 'napd' && lastPart === 'altareekh') return true;
        // Accept any code with reasonable length (already assigned)
        return code.length >= 5;
    },

    incrementExamAttempt: (studentId: string, examId: string) => {
        const students = DB.getStudents();
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            const student = students[index];
            const examAttempts = { ...(student.examAttempts || {}) };
            const examLastAttemptTime = { ...(student.examLastAttemptTime || {}) };
            const examUnlockTimes = { ...(student.examUnlockTimes || {}) };

            const currentAttempts = (examAttempts[examId] || 0) + 1;
            examAttempts[examId] = currentAttempts;
            examLastAttemptTime[examId] = Date.now();

            // Set unlock time after finishing the 4th attempt (Original + 3 Retakes)
            if (currentAttempts >= 4) {
                const minM = 22;
                const maxM = 49;
                const randM = Math.random() * (maxM - minM) + minM;
                examUnlockTimes[examId] = Date.now() + (randM * 60 * 1000);
            }

            DB.updateStudent(studentId, {
                examAttempts,
                examLastAttemptTime,
                examUnlockTimes
            });
        }
    },

    getExamAttempts: (studentId: string, examId: string): number => {
        const students = DB.getStudents();
        const student = students.find(s => s.id === studentId);
        return student?.examAttempts?.[examId] || 0;
    },

    getExamLastAttemptTime: (studentId: string, examId: string): number => {
        const students = DB.getStudents();
        const student = students.find(s => s.id === studentId);
        return student?.examLastAttemptTime?.[examId] || 0;
    },

    getExamUnlockTime: (studentId: string, examId: string): number => {
        const students = DB.getStudents();
        const student = students.find(s => s.id === studentId);
        return student?.examUnlockTimes?.[examId] || 0;
    },

    consumeSurveyQuota: (studentId: string): { allowed: boolean; remaining: number; resetTime?: number } => {
        const students = DB.getStudents();
        const index = students.findIndex(s => s.id === studentId);
        if (index === -1) return { allowed: false, remaining: 0 };
        const student = students[index];

        const now = Date.now();
        // Independent 3 messages for Share Your Opinion
        let currentQuota = student.surveyQuota ?? 3;
        let currentResetTime = student.surveyResetTime;

        if (student.isChatFree) return { allowed: true, remaining: 999 };

        // Reset check
        if (currentQuota <= 0 && currentResetTime) {
            if (now >= currentResetTime) {
                currentQuota = 3;
                currentResetTime = undefined;
            }
        }

        if (currentQuota > 0) {
            const nextQuota = currentQuota - 1;
            let nextResetTime = currentResetTime;
            if (nextQuota === 0) {
                // RANDOM TIMER: 3 hours to 6.5 hours
                const minH = 3;
                const maxH = 6.5;
                const randH = Math.random() * (maxH - minH) + minH;
                nextResetTime = now + (randH * 60 * 60 * 1000);
            }
            DB.updateStudent(studentId, { surveyQuota: nextQuota, surveyResetTime: nextResetTime });
            return { allowed: true, remaining: nextQuota, resetTime: nextResetTime };
        }

        return { allowed: false, remaining: 0, resetTime: currentResetTime };
    },

    deleteStudent: (id: string) => {
        // 1. Add to Global Tombstone List (The Blacklist) - Use immediate sync for critical removal
        const deletedIds = safeParse<string[]>(Storage.getItem(KEYS.DELETED_STUDENTS), []);
        if (!deletedIds.includes(id)) {
            deletedIds.push(id);
            Storage.setItem(KEYS.DELETED_STUDENTS, JSON.stringify(deletedIds));
            DB._syncToServer(KEYS.DELETED_STUDENTS, deletedIds, true);
        }

        // 2. Perform Physical Purge from Current Array
        const items = safeParse<Student[]>(Storage.getItem(KEYS.STUDENTS), []);

        const deletedStudent = items.find(s => s.id === id);
        const name = deletedStudent?.username || 'Student';

        // Mark as deleted before saving to assist with merge tombstoning on other clients
        const markedItems = items.map(s => s.id === id ? { ...s, isDeleted: true } : s);
        const filtered = markedItems.filter(s => s.id !== id);

        DB.saveStudents(filtered);

        // 3. Deep clean chats/presence to remove their undead presence everywhere else
        DB.purgeStudentData(id, name);
    },

    purgeStudentData: (id: string, name?: string) => {
        const tId = id.trim();
        const tName = (name || '').trim();

        // 2. Survey Posts
        const surveys = DB.getSurveyPosts();
        let changedSurv = false;
        const newSurveys = surveys.filter(s => s.studentId !== tId && s.studentName !== tName);
        if (newSurveys.length !== surveys.length) changedSurv = true;
        newSurveys.forEach(s => {
            const initRep = (s.replies || []).length;
            s.replies = (s.replies || []).filter(r => r.studentId !== tId && r.studentName !== tName);
            if (s.replies.length !== initRep) changedSurv = true;
        });
        if (changedSurv) DB.saveSurveyPosts(newSurveys);

        // 3. Ratings
        const ratings = safeParse<any[]>(Storage.getItem(KEYS.RATINGS), []);
        const cleanRatings = ratings.filter(r => r.studentId !== tId && r.studentName !== tName);
        if (cleanRatings.length !== ratings.length) {
            Storage.setItem(KEYS.RATINGS, JSON.stringify(cleanRatings));
            DB._syncToServer(KEYS.RATINGS, cleanRatings);
        }

        // 4. Tickets
        const tickets = DB.getTickets();
        const cleanTickets = tickets.filter(t => t.studentId !== tId);
        if (cleanTickets.length !== tickets.length) {
            DB.saveTickets(cleanTickets);
        }
    },


    // ---- Payments ----
    getPayments: (): PaymentOrder[] => {
        return safeParse<PaymentOrder[]>(Storage.getItem(KEYS.PAYMENTS), []);
    },
    savePayments: (payments: PaymentOrder[]) => {
        Storage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
        notify('nt-payments-change');
        DB._syncToServer(KEYS.PAYMENTS, payments);
    },
    addPayment: (order: PaymentOrder) => {
        const payments = DB.getPayments();

        // Prevent duplicate orders for the same item from the same user while one is already pending
        const isDuplicate = order.status === 'pending_review' && payments.some(p =>
            p.studentId === order.studentId &&
            p.status === 'pending_review' &&
            p.itemType === order.itemType &&
            p.examId === order.examId &&
            p.courseId === order.courseId &&
            p.lessonId === order.lessonId &&
            p.bookletId === order.bookletId
        );

        if (isDuplicate) return;

        payments.push(order);
        DB.savePayments(payments);
    },
    updatePaymentStatus: (id: string, status: PaymentStatus) => {
        const payments = DB.getPayments();
        const index = payments.findIndex(p => p.id === id);
        if (index !== -1) {
            const order = payments[index];
            order.status = status;
            DB.savePayments(payments);

            if (status === 'approved') {
                const students = DB.getStudents();
                const studentIndex = students.findIndex(s => s.id === order.studentId);
                if (studentIndex !== -1) {
                    if (order.itemType === 'booklet' && order.bookletId) {
                        students[studentIndex].purchasedBooklets = [...(students[studentIndex].purchasedBooklets || []), order.bookletId];
                        students[studentIndex].pendingPurchaseBookletId = null;
                    } else if (order.itemType === 'course' && order.courseId) {
                        students[studentIndex].purchasedCourses = [...(students[studentIndex].purchasedCourses || []), order.courseId];
                        students[studentIndex].pendingPurchaseCourseId = null;
                    } else if (order.itemType === 'lesson' && order.lessonId) {
                        students[studentIndex].purchasedLessons = [...(students[studentIndex].purchasedLessons || []), order.lessonId];
                        students[studentIndex].pendingPurchaseLessonId = null;
                    } else if (order.itemType === 'recharge' && order.pointsToGained) {
                        students[studentIndex].points = (students[studentIndex].points || 0) + order.pointsToGained;
                    }
                    DB.saveStudents(students);
                    DB.checkAndTriggerReferralReward(order.studentId);
                }
            }
        }
    },
    deletePayment: (id: string) => {
        DB.savePayments(DB.getPayments().filter(p => p.id !== id));
    },
    deleteAllPayments: () => {
        DB.savePayments([]);
    },
    deletePaymentByStudent: (studentId: string) => {
        DB.savePayments(DB.getPayments().filter(p => !(p.studentId === studentId && p.status === 'pending_review')));
    },

    // ---- Coupons ----
    getCoupons: (): Coupon[] => {
        return safeParse<Coupon[]>(Storage.getItem(KEYS.COUPONS), []);
    },
    saveCoupons: (coupons: Coupon[]) => {
        Storage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
        notify('nt-coupons-change');
        DB._syncToServer(KEYS.COUPONS, coupons);
    },
    addCoupon: (coupon: Coupon) => {
        const coupons = DB.getCoupons();
        coupons.push(coupon);
        DB.saveCoupons(coupons);
    },
    updateCouponData: (id: string, updated: Partial<Coupon>) => {
        const coupons = DB.getCoupons();
        const index = coupons.findIndex(c => c.id === id);
        if (index !== -1) {
            coupons[index] = { ...coupons[index], ...updated };
            DB.saveCoupons(coupons);
        }
    },
    deleteCoupon: (id: string) => {
        DB.saveCoupons(DB.getCoupons().filter(c => c.id !== id));
    },
    validateCoupon: (code: string): { isValid: boolean; discount?: number; error?: string } => {
        const c = DB.getCoupons().find(x => x.code.toLowerCase() === code.toLowerCase());
        if (!c) return { isValid: false, error: 'كود الخصم غير موجود' };
        if (!c.isActive) return { isValid: false, error: 'كود الخصم غير فعال' };
        if (c.usageLimit && c.usageCount >= c.usageLimit) return { isValid: false, error: 'تم تجاوز الحد الأقصى لاستخدام الكوبون' };
        if (new Date(c.expiryDate) < new Date()) return { isValid: false, error: 'كود الخصم منتهي الصلاحية' };
        return { isValid: true, discount: c.discountPercentage };
    },
    incrementCouponUsage: (code: string) => {
        const coupons = DB.getCoupons();
        const i = coupons.findIndex(x => x.code.toLowerCase() === code.toLowerCase());
        if (i !== -1) {
            coupons[i].usageCount = (coupons[i].usageCount || 0) + 1;
            DB.saveCoupons(coupons);
        }
    },

    // ---- Payments Extras ----
    getStudentPaymentStatus: (studentId: string, itemId: string, itemType: 'booklet' | 'course' | 'lesson'): PaymentStatus | null => {
        const payments = DB.getPayments();
        let p;
        if (itemType === 'booklet') p = payments.find(x => x.studentId === studentId && x.itemType === 'booklet' && x.bookletId === itemId);
        else if (itemType === 'course') p = payments.find(x => x.studentId === studentId && x.itemType === 'course' && x.courseId === itemId);
        else p = payments.find(x => x.studentId === studentId && x.itemType === 'lesson' && x.lessonId === itemId);
        return p ? p.status : null;
    },

    // ---- Visits ----
    getVisits: (): any[] => safeParse(Storage.getItem(KEYS.VISITS), []),
    saveVisits: (visits: any[]) => {
        Storage.setItem(KEYS.VISITS, JSON.stringify(visits));
        notify('nt-visits-change');
        DB._syncToServer(KEYS.VISITS, visits);
    },
    addVisit: (visit: any) => {
        const visits = DB.getVisits();
        visits.push(visit);
        DB.saveVisits(visits);
    },
    deleteVisit: (id: string) => {
        DB.saveVisits(DB.getVisits().filter((v: any) => v.id !== id));
    },
    incrementVisits: () => {
        const d = new Date().toISOString().split('T')[0];
        let v = DB.getVisits();
        if (!Array.isArray(v)) v = [];
        const f = v.find((x: any) => x.date === d);
        if (f) {
            f.count = (f.count || 0) + 1;
            DB.saveVisits(v);
        } else {
            v.push({ id: Math.random().toString(36), date: d, count: 1 });
            DB.saveVisits(v);
        }
    },





    // ---- Survey Posts ----
    getSurveyPosts: (): SurveyPost[] => {
        return safeParse<SurveyPost[]>(Storage.getItem(KEYS.SURVEYS), []);
    },
    saveSurveyPosts: (posts: SurveyPost[]) => {
        Storage.setItem(KEYS.SURVEYS, JSON.stringify(posts));
        notify('nt-surveys-change');
        DB._syncToServer(KEYS.SURVEYS, posts);
    },
    addSurveyPost: (post: SurveyPost) => {
        const posts = DB.getSurveyPosts();
        posts.push(post);
        DB.saveSurveyPosts(posts);
    },
    addSurveyReply: (postId: string, reply: SurveyReply) => {
        const posts = DB.getSurveyPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index !== -1) {
            posts[index].replies.push(reply);
            DB.saveSurveyPosts(posts);
        }
    },
    deleteSurveyPost: (id: string) => {
        DB.saveSurveyPosts(DB.getSurveyPosts().filter(p => p.id !== id));
    },
    updateSurveyPost: (id: string, updated: Partial<SurveyPost>) => {
        const posts = DB.getSurveyPosts();
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            posts[index] = { ...posts[index], ...updated };
            DB.saveSurveyPosts(posts);
        }
    },
    deleteSurveyReply: (postId: string, replyId: string) => {
        const posts = DB.getSurveyPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index !== -1) {
            posts[index].replies = posts[index].replies.filter(r => r.id !== replyId);
            DB.saveSurveyPosts(posts);
        }
    },

    // ---- Tickets ----
    getTickets: (): SupportTicket[] => {
        return safeParse<SupportTicket[]>(Storage.getItem(KEYS.TICKETS), []);
    },
    saveTickets: (tickets: SupportTicket[]) => {
        Storage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
        notify('nt-tickets-change');
        DB._syncToServer(KEYS.TICKETS, tickets);
    },
    addTicket: (t: SupportTicket) => {
        const tx = DB.getTickets();
        tx.push(t);
        DB.saveTickets(tx);
    },
    updateTicketStatus: (id: string, response: string) => {
        const tx = DB.getTickets();
        const i = tx.findIndex(x => x.id === id);
        if (i !== -1) {
            tx[i].status = 'responded';
            tx[i].response = response;
            tx[i].responseDate = (function(){try{return new Date().toLocaleDateString('ar-EG');}catch(e){return new Date().toISOString().split('T')[0];}})();
            DB.saveTickets(tx);
        }
    },
    deleteTicket: (id: string) => {
        DB.saveTickets(DB.getTickets().filter(t => t.id !== id));
    },

    // ---- App Settings ----
    getSettings: (): any => {
        const defaults = {
            allowVoiceCalls: true,
            allowVideoCalls: false,
            isVideoCallEnabled: false,
            isVoiceCallEnabled: true,
            isCreateRoomLocked: false,
            blockedIPs: [],
            unbannedIPs: [],
            dismissedBannedIPs: [],
            adminCredentials: { username: 'admen', password: '01270500409' },
            subAdmins: [
                { id: 'sa1', user: 'admin', pass: 'euxsuwA468Sdj', config: { year: 'الفرقة الأولى', stage: 'اعمال دوليه IB', specialization: 'الكل' } },
                { id: 'sa2', user: 'admin', pass: 'qjxxhWucyccy4435sh', config: { year: 'الفرقة الأولى', stage: 'نظم المعلومات BIS', specialization: 'الكل' } },
                { id: 'sa3', user: 'admin', pass: 'Chdsjfj464dkdj', config: { year: 'الفرقة الثانية', stage: 'اعمال دوليه IB', specialization: 'الكل' } },
                { id: 'sa4', user: 'admin', pass: 'cjdhf644Awue', config: { year: 'الفرقة الثانية', stage: 'نظم المعلومات BIS', specialization: 'الكل' } },
                { id: 'sa5', user: 'admin', pass: 'QJXJFFH5674quayh', config: { year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'محاسبة' } },
                { id: 'sa6', user: 'admin', pass: 'vjddh434shsSf', config: { year: 'الفرقة الثالثة', stage: 'اعمال دوليه IB', specialization: 'تمويل' } },
                { id: 'sa7', user: 'admin', pass: 'Wugcud565fuxshs', config: { year: 'الفرقة الثالثة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات' } },
                { id: 'sa8', user: 'admin', pass: 'Mduzshd568zhsw', config: { year: 'الفرقة الرابعة', stage: 'اعمال دوليه IB', specialization: 'محاسبة' } },
                { id: 'sa9', user: 'admin', pass: 'vjsjd5656Sufudgc', config: { year: 'الفرقة الرابعة', stage: 'اعمال دوليه IB', specialization: 'تمويل' } },
                { id: 'sa10', user: 'admin', pass: 'Hjsjshs56868msjdd', config: { year: 'الفرقة الرابعة', stage: 'نظم المعلومات BIS', specialization: 'نظم المعلومات' } }
            ],
            // Premium System Defaults
            isParentRegistrationEnabled: true,
            isPremiumSystemEnabled: true,
            premiumUnlockPrice: 1000,
            premiumConsumptionRate: 10,
            referralRewardAmount: 500,
            isRechargeEnabled: true,
            isGoldenMembershipEnabled: true,
            isSectionsEnabled: true,
            rechargePackages: [
                { id: 'pkg1', points: 2500, price: 80, label: 'الباقة الماسية' },
                { id: 'pkg2', points: 5000, price: 150, label: 'الباقة الذهبية' },
                { id: 'pkg3', points: 7500, price: 200, label: 'الباقة البلاتينية' },
            ]
        };
        const s = safeParse(Storage.getItem(KEYS.APP_SETTINGS), null);
        if (!s) {
            Storage.setItem(KEYS.APP_SETTINGS, JSON.stringify(defaults));
            return defaults;
        }
        return {
            ...defaults,
            ...s,
            allowVoiceCalls: s.allowVoiceCalls ?? true,
            allowVideoCalls: s.allowVideoCalls ?? false,
            isPlatformLocked: s.isPlatformLocked ?? false,
            isBookletsEnabled: s.isBookletsEnabled ?? true,
            isCoursesEnabled: s.isCoursesEnabled ?? true,
            isLessonsEnabled: s.isLessonsEnabled ?? true,
            isExamsEnabled: s.isExamsEnabled ?? true,
            isCreateRoomLocked: s.isCreateRoomLocked ?? false,
            blockedIPs: s.blockedIPs ?? [],
            unbannedIPs: s.unbannedIPs ?? [],
            dismissedBannedIPs: s.dismissedBannedIPs ?? [],
            isRechargeEnabled: s.isRechargeEnabled ?? true,
            isGoldenMembershipEnabled: s.isGoldenMembershipEnabled ?? true,
            isSectionsEnabled: s.isSectionsEnabled ?? true,
            isPremiumSystemEnabled: s.isPremiumSystemEnabled ?? true,
            premiumUnlockPrice: s.premiumUnlockPrice ?? 1000,
            premiumConsumptionRate: s.premiumConsumptionRate ?? 10,
            referralRewardAmount: s.referralRewardAmount ?? 500,
            rechargePackages: s.rechargePackages || defaults.rechargePackages,
            subAdmins: s.subAdmins || defaults.subAdmins,
            isParentRegistrationEnabled: s.isParentRegistrationEnabled ?? true
        };
    },
    updateSettings: (newSettings: any) => {
        const s = { ...DB.getSettings(), ...newSettings };
        Storage.setItem(KEYS.APP_SETTINGS, JSON.stringify(s));
        notify('nt-settings-change');
        DB._syncToServer(KEYS.APP_SETTINGS, s);
    },

    getLatestContentUpdate: (): { id: string, message: string, section: string } | null => {
        const data = Storage.getItem('nt_latest_content_update');
        if (!data) return null;
        try { return JSON.parse(data); } catch { return null; }
    },
    setLatestContentUpdate: (message: string, section: string) => {
        const data = { id: Date.now().toString(), message, section };
        Storage.setItem('nt_latest_content_update', JSON.stringify(data));
        DB._syncToServer('nt_latest_content_update', data);
        notify('nt-latest-content-update');
    },


    // ---- Site Texts ----
    getSiteTexts: (): SiteTexts => {
        let t = safeParse(Storage.getItem(KEYS.SITE_TEXTS), {} as Partial<SiteTexts>);

        // --- OVERRIDE: Scrub old names dynamically from any cached user data ---
        const scrub = (val) => {
            if (typeof val === 'string') {
                return val.replace(/نبض التاريخ/g, 'Mentora')
                    .replace(/نبض-التاريخ/g, 'Mentora')
                    .replace(/منصة نبض التاريخ/g, 'Mentora')
                    .replace(/منصه نبض التاريخ/g, 'Mentora')
                    .replace(/Pulse of History/gi, 'Mentora')
                    .replace(/محمد يوسف/g, 'عمرو لطفي')
                    .replace(/أ: محمد/g, 'م/ عمرو')
                    .replace(/مستر محمد/g, 'م/ عمرو')
                    .replace(/الدراسات الاجتماعيه/g, 'تقنية المعلومات')
                    .replace(/ومدرس التاريخ للمرحله الثانويه/g, 'ومستشار تعليمي لنظام IB الدولي')
                    .replace(/للمرحله الإعداديه/g, 'لبرامج BIS')
                    .replace(/للمرحله الثانويه/g, 'لبرامج IB');
            }
            return val;
        };

        return {
            ...t,
            welcomeTitle: scrub(t.welcomeTitle) || 'أهلاً بك في Mentora',
            welcomeSubtitle: scrub(t.welcomeSubtitle) || 'نتمنى لك تجربة تعليمية ممتعة ومفيدة.',
            homeTitle: scrub(t.homeTitle) || 'Mentora',
            homeSubtitle: scrub(t.homeSubtitle) || 'تعلم بذكاء، تفوق بثقة!',
            marqueeText: scrub(t.marqueeText) || 'أهلاً وسهلاً بجميع الطلاب في Mentora! نتمنى لكم التوفيق والنجاح.',
            teacherName: scrub(t.teacherName) || 'م/ عمرو لطفي',
            teacherTitle1: scrub(t.teacherTitle1) || 'خبير تقنية المعلومات لبرامج BIS..',
            teacherTitle2: scrub(t.teacherTitle2) || 'ومستشار تعليمي لنظام IB الدولي.',
            teacherExperience: scrub(t.teacherExperience) || 'خبرة أكثر من 11 عام',

            bookingModalTitle: t.bookingModalTitle || 'احجز مذكرتك الآن',
            bookingModalSubtitle: t.bookingModalSubtitle || 'سيصلك الملخص في أسرع وقت',
            bookingContactTitle: t.bookingContactTitle || 'يرجى التواصل مع الإدارة',
            bookingContactSubtitle: t.bookingContactSubtitle || 'لإكمال عملية الحجز، أرسل الإيصال',
            paymentMethodText1: t.paymentMethodText1 || 'بعد الشراء يرجى الضغط على زر تأكيد الدفع.',
            paymentMethodText2: t.paymentMethodText2 || 'وسيتم مراجعة الطلب من قبل الإدارة وعند التأكد من الدفع يتم فتح المحتوى لك.',
            premiumLockMessage: t.premiumLockMessage || 'هذا المحتوى مقفول (مخصص فقط للطلاب المشتركين)',

            loginModalTitle: t.loginModalTitle || 'شاشة تسجيل الدخول',
            loginModalSubtitle: t.loginModalSubtitle || 'قم بالدخول إلى حسابك',
            registerModalTitle: t.registerModalTitle || 'شاشة إنشاء حساب',
            registerModalSubtitle: t.registerModalSubtitle || 'سجل كطالب جديد',

            examRetakeModalTitle: t.examRetakeModalTitle || 'إعادة الامتحان مره أخرى',
            examRetakeModalSubtitle: t.examRetakeModalSubtitle || 'هل ترغب في إعادة الامتحان؟',
            examRetakePricingText: t.examRetakePricingText || 'ستخصم رسوم الإعادة',

            unitsSectionTitle: t.unitsSectionTitle || 'وحداتي',
            unitsSectionSubtitle: t.unitsSectionSubtitle || 'هنا ستجد دروسك المتاحة',
            unitsEmptyMessage: t.unitsEmptyMessage || 'لم يتم إضافة وحدات دراسية بعد.',

            examsSectionTitle: t.examsSectionTitle || 'الامتحانات',
            examsSectionSubtitle: t.examsSectionSubtitle || 'اختبر مستواك باستمرار',
            examsEmptyMessage: t.examsEmptyMessage || 'لا توجد امتحانات متاحة الآن.',

            bookletsSectionTitle: t.bookletsSectionTitle || 'الملخصات',
            bookletsSectionSubtitle: t.bookletsSectionSubtitle || 'كل الملازم والملخصات الخاصة بك',
            bookletsEmptyMessage: t.bookletsEmptyMessage || 'لا توجد ملخصات متاحة الآن.',

            coursesSectionTitle: t.coursesSectionTitle || 'الكورسات الخاصة',
            coursesSectionSubtitle: t.coursesSectionSubtitle || 'ابنِ مستقبلك خطوة بخطوة',
            coursesEmptyMessage: t.coursesEmptyMessage || 'لا توجد كورسات متاحة الآن.',

            lessonsSectionTitle: t.lessonsSectionTitle || 'شرح المنهج',
            lessonsSectionSubtitle: t.lessonsSectionSubtitle || 'دروس تفصيلية بالفيديو',
            lessonsEmptyMessage: t.lessonsEmptyMessage || 'لا توجد دروس شرح متاحة الآن.',

            coinsInsufficientMessage: t.coinsInsufficientMessage || 'ليس لديك كوينز تكفي لفتح هذا المحتوى',
            unlockWithCoinsButtonText: t.unlockWithCoinsButtonText || 'شراء وفتح بالكوينز',
            earnMoreCoinsMessage: t.earnMoreCoinsMessage || 'احصل على كوينز أكثر عبر حل الامتحانات!',
            examEarnCoinsMessage: t.examEarnCoinsMessage || 'لقد ربحت كوينز',
            platformLockedMessage: t.platformLockedMessage || 'عفواً، المنصة مقفلة حالياً لأعمال الصيانة، جرب لاحقاً.',

            paymentSuccessTitle: t.paymentSuccessTitle || 'تم إرسال الطلب بنجاح',
            paymentSuccessMessage: t.paymentSuccessMessage || 'نحن نراجع طلبك الآن، سيتم تفعيله خلال دقائق.',
            paymentPendingTitle: t.paymentPendingTitle || 'طلبك قيد المراجعة',
            paymentPendingMessage: t.paymentPendingMessage || 'شكراً لصبرك، تتم مراجعة الإيصال يدوياً حالياً.',
            paymentErrorTitle: t.paymentErrorTitle || 'خطأ في عملية الدفع',
            paymentErrorMessage: t.paymentErrorMessage || 'حدث خطأ، يرجى مراجعة بيانات التحويل وإعادة المحاولة.',

            loginWelcomeBack: t.loginWelcomeBack || 'أهلاً بك مجدداً يا بطل',
            registerCreateAccount: t.registerCreateAccount || 'ابدأ مسيرة التفوق معنا الآن',

            coursePricePrefix: t.coursePricePrefix || 'سعر الكورس:',
            bookletPricePrefix: t.bookletPricePrefix || 'سعر الملخص:',
            buyNowButton: t.buyNowButton || 'شراء الآن',
            pendingReviewButton: t.pendingReviewButton || 'قيد المراجعة...',
            unlockedButton: t.unlockedButton || 'تم الشحن/تفعيل',

            supportSectionTitle: t.supportSectionTitle || 'الدعم الفني والشكاوى',
            supportSectionSubtitle: t.supportSectionSubtitle || 'نحن هنا لمساعدتكم في أي وقت',
            supportSendButton: t.supportSendButton || 'إرسال الرسالة للإدارة',

            chatWelcomeMessage: t.chatWelcomeMessage || 'مرحباً بكم في شات الدفعة، يرجى الالتزام بالأدب.',
            chatRulesTitle: t.chatRulesTitle || 'قوانين الدردشة والمنصة',
            chatRulesText: t.chatRulesText || 'يمنع التحدث في مواضيع خارج الدراسة أو التطاول على الآخرين.',

            confirmDeleteTitle: t.confirmDeleteTitle || 'هل أنت متأكد من الحذف النهائي؟',
            confirmDeleteButton: t.confirmDeleteButton || 'نعم، حذف نهائياً',
            cancelButton: t.cancelButton || 'إلغاء',

            loginButtonLabel: t.loginButtonLabel || 'دخول',
            registerButtonLabel: t.registerButtonLabel || 'سجّل الآن',
            noAccountText: t.noAccountText || 'ليس لديك حساب؟ إنشاء حساب جديد',
            alreadyHaveAccountText: t.alreadyHaveAccountText || 'لدي حساب بالفعل؟ تسجيل دخول',
            usernameLabel: t.usernameLabel || 'اسم الطالب',
            passwordLabel: t.passwordLabel || 'كلمة المرور الآمنة',
            genderLabel: t.genderLabel || 'النوع',
            stageLabel: t.stageLabel || 'المرحلة',
            yearLabel: t.yearLabel || 'السنة الدراسية',
            semesterLabel: t.semesterLabel || 'الفصل الدراسي',
            locationLabel: t.locationLabel || 'المحافظة',
            captchaSliderText: t.captchaSliderText || 'اسحب السهم للمتابعة',
            captchaVerifiedText: t.captchaVerifiedText || 'تم التحقق بنجاح',

            platformMaintenanceTitle: t.platformMaintenanceTitle || 'المنصة قيد الصيانة',
            adminLoginButton: t.adminLoginButton || 'دخول الإدارة',
            preparingPlatformText: t.preparingPlatformText || 'جاري تحضير المنصة...',
            loadingSystemText: t.loadingSystemText || 'Mentora System',
            syncingText: t.syncingText || 'جاري المزامنة...',
            blessingText: t.blessingText || 'متنساش تصلي على النبي ﷺ',

            headerGreetingAr: t.headerGreetingAr || 'مرحبا يـ',
            headerGreetingEn: t.headerGreetingEn || 'Welcome,'
        } as SiteTexts;

    },
    saveSiteTexts: (t: SiteTexts) => {
        Storage.setItem(KEYS.SITE_TEXTS, JSON.stringify(t));
        notify('nt-site-texts-change');
        DB._syncToServer(KEYS.SITE_TEXTS, t);
    },

    // ---- AI Tools ----
    getAiTools: (): AITool[] => {
        const items = safeParse<AITool[]>(Storage.getItem(KEYS.AI_TOOLS), null as any);
        if (!items) return AI_TOOLS.map(t => ({ ...t, id: String(t.id) })); // fallback if null
        return items;
    },
    saveAiTools: (tools: AITool[]) => {
        Storage.setItem(KEYS.AI_TOOLS, JSON.stringify(tools));
        notify('nt-ai-tools-change');
        DB._syncToServer(KEYS.AI_TOOLS, tools);
    },
    addAiTool: (t: AITool) => {
        const tx = DB.getAiTools();
        tx.push(t);
        DB.saveAiTools(tx);
    },
    deleteAiTool: (id: string) => {
        DB.saveAiTools(DB.getAiTools().filter(t => String(t.id) !== String(id)));
    },

    // ---- Meeting Config ----
    getMeetingConfig: (): MeetingConfig => safeParse(Storage.getItem(KEYS.MEETING_CONFIG), { isActive: false, url: '' }),
    saveMeetingConfig: (c: MeetingConfig) => {
        Storage.setItem(KEYS.MEETING_CONFIG, JSON.stringify(c));
        notify('nt-meeting-change');
        DB._syncToServer(KEYS.MEETING_CONFIG, c);
    },

    // ---- Notifications ----
    getNotifications: (): any[] => safeParse(Storage.getItem(KEYS.NOTIFICATIONS), []),
    saveNotifications: (n: any[]) => {
        Storage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(n));
        notify('nt-notifications-change');
        DB._syncToServer(KEYS.NOTIFICATIONS, n);
    },
    addNotification: (n: any) => {
        const tx = DB.getNotifications();
        tx.unshift(n);
        DB.saveNotifications(tx);
    },
    deleteNotification: (id: string) => {
        DB.saveNotifications(DB.getNotifications().filter(t => t.id !== id));
    },
    deleteAllNotifications: () => {
        DB.saveNotifications([]);
    },

    // ---- Push Notifications ----
    getPushNotifications: (): any[] => safeParse(Storage.getItem('nt_push_notifications'), []),
    savePushNotifications: (n: any[]) => {
        Storage.setItem('nt_push_notifications', JSON.stringify(n));
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('nt-notifications-change'));
        DB._syncToServer('nt_push_notifications', n);
    },
    addPushNotification: (n: any) => {
        const tx = DB.getPushNotifications();
        tx.unshift(n);
        DB.savePushNotifications(tx);
    },
    updatePushNotification: (id: string, updated: any) => {
        const tx = DB.getPushNotifications();
        const idx = tx.findIndex(x => x.id === id);
        if (idx !== -1) {
            tx[idx] = { ...tx[idx], ...updated };
            DB.savePushNotifications(tx);
        }
    },
    deletePushNotification: (id: string) => {
        DB.savePushNotifications(DB.getPushNotifications().filter(t => t.id !== id));
    },

    // ---- Courses ----
    getCourses: (): Course[] => {
        const items = safeParse<Course[]>(Storage.getItem(KEYS.COURSES), []);
        return items.map(c => ({
            ...c,
            stage: normalizeStage(c.stage),
            year: normalizeYear(c.year),
            semester: normalizeSemester(c.semester)
        }));
    },
    saveCourses: (c: Course[]) => {
        Storage.setItem(KEYS.COURSES, JSON.stringify(c));
        notify('nt-courses-change');
        DB._syncToServer(KEYS.COURSES, c);
    },
    addCourse: (c: Course) => {
        const tx = DB.getCourses();
        tx.push(c);
        DB.saveCourses(tx);
    },
    updateCourse: (id: string, updated: Partial<Course>) => {
        const tx = DB.getCourses();
        const idx = tx.findIndex(x => x.id === id);
        if (idx !== -1) {
            tx[idx] = { ...tx[idx], ...updated };
            DB.saveCourses(tx);
        }
    },
    deleteCourse: (id: string) => {
        DB.saveCourses(DB.getCourses().filter(t => t.id !== id));
    },

    // ---- Lessons ----
    getLessons: (): Lesson[] => {
        const items = safeParse<Lesson[]>(Storage.getItem(KEYS.LESSONS), []);
        return items.map(c => ({
            ...c,
            stage: normalizeStage(c.stage),
            year: normalizeYear(c.year),
            semester: normalizeSemester(c.semester)
        }));
    },
    saveLessons: (c: Lesson[]) => {
        Storage.setItem(KEYS.LESSONS, JSON.stringify(c));
        notify('nt-lessons-change');
        DB._syncToServer(KEYS.LESSONS, c);
    },
    addLesson: (c: Lesson) => {
        const tx = DB.getLessons();
        tx.push(c);
        DB.saveLessons(tx);
    },
    updateLesson: (id: string, updated: Partial<Lesson>) => {
        const tx = DB.getLessons();
        const idx = tx.findIndex(x => x.id === id);
        if (idx !== -1) {
            tx[idx] = { ...tx[idx], ...updated };
            DB.saveLessons(tx);
        }
    },
    deleteLesson: (id: string) => {
        DB.saveLessons(DB.getLessons().filter(t => t.id !== id));
    },

    // ---- Ratings ----
    getRatings: (): Rating[] => {
        return safeParse<Rating[]>(Storage.getItem(KEYS.RATINGS), []);
    },
    saveRatings: (ratings: Rating[]) => {
        Storage.setItem(KEYS.RATINGS, JSON.stringify(ratings));
        notify('nt-ratings-change');
        DB._syncToServer(KEYS.RATINGS, ratings);
    },
    addRating: (rating: Rating) => {
        const ratings = DB.getRatings();
        ratings.push(rating);
        DB.saveRatings(ratings);
    },
    deleteRating: (id: string) => {
        DB.saveRatings(DB.getRatings().filter(r => r.id !== id));
    },
    deleteAllRatings: () => {
        DB.saveRatings([]);
    },

    // ---- Recordings Meta ----
    _getRecordingsMeta: (): any[] => {
        return safeParse(Storage.getItem('nt_recordings_meta'), []);
    },
    _saveRecordingsMeta: (data: any[]) => {
        Storage.setItem('nt_recordings_meta', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('nt-recordings-meta-change'));
        DB._syncToServer('nt_recordings_meta', data);
    },

    // ====================================================
    // SERVER SYNC: Write local change → Supabase
    // ====================================================
    _syncToServer: (key: string, data: any, immediate = false) => {
        // Only queue if it's potentially newer than what's in flight
        SYNC_QUEUE[key] = data;
        scheduleSync(key, immediate);
    },

    _syncToSupabase: async (key: string, data: any) => {
        const sanitized = sanitizeData(data);

        // FIREBASE SYNC (REMOVED)

        // --- 2. LOCAL SERVER SYNC (Secondary Backup) ---
        try {
            fetch(`http://127.0.0.1:4001/api/data/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitized)
            }).catch(() => { });
        } catch (e) { }

        // --- 3. SUPABASE SYNC (Primary for Content/Students) ---
        if (!isSupabaseConnected) return;
        const valueStr = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
        try {
            const { error } = await supabase
                .from('site_data')
                .upsert({
                    key,
                    value: valueStr,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (!error) {
                console.log(`🟢 [Cloud] Synced [${key}]`);
                supabase.channel('nt_master_sync_v2').send({
                    type: 'broadcast',
                    event: 'data-sync',
                    payload: { key, timestamp: Date.now() }
                }).catch(() => { });
            }
        } catch (err) { }
    },

    _initSync: () => {
        if ((window as any)._nt_sync_init) return;
        (window as any)._nt_sync_init = true;

        console.log('☁️ [Sync] System Booting...');

        const currentUser = safeParse(Storage.getItem('nt_current_user'), null as any);

        const triggerNativePush = (cloudData: any[], localDataStr: string | null, type: 'notification' | 'message') => {
            if (!('Notification' in window) || Notification.permission !== 'granted') return;
            if (!currentUser) return;

            const localData = safeParse(localDataStr, []);
            const newItems = cloudData.filter(c => !localData.some((l: any) => l.id === c.id));

            newItems.forEach(item => {
                let title = 'إشعار جديد 🔔';
                let body = '';

                if (type === 'notification') {
                    if (item.target === 'all' ||
                        (item.target === 'level' && item.level === currentUser.level) ||
                        (item.target === 'student' && item.studentId === currentUser.id)) {
                        title = item.title || 'Mentora';
                        body = item.message || '';
                    } else return;
                } else return;

                if (body.trim() !== '') {
                    try {
                        if (document.hidden || type === 'notification') {
                            const notifOptions: any = {
                                body,
                                icon: 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg',
                                badge: 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg',
                                vibrate: [200, 100, 200, 100, 200],
                                dir: 'rtl',
                                requireInteraction: true
                            };

                            if ('serviceWorker' in navigator) {
                                navigator.serviceWorker.ready.then(registration => {
                                    registration.showNotification(title, notifOptions);
                                });
                            } else {
                                const notif = new Notification(title, notifOptions);
                                notif.onclick = () => {
                                    window.focus();
                                    notif.close();
                                };
                            }
                        }
                    } catch (e) { console.error('Push error:', e); }
                }
            });
        };

        const applyCloudRow = (row: { key: string; value: any }) => {
            if (!row.key || row.value === undefined) return;
            try {
                // Scale-Proof Merging Logic for Array-Based Keys (Students, Payments, etc.)
                const MERGE_KEYS = [
                    KEYS.STUDENTS,
                    KEYS.PAYMENTS,
                    KEYS.TICKETS,
                    KEYS.NOTIFICATIONS,
                    KEYS.RATINGS,
                    KEYS.SURVEYS
                ];

                // Custom merge for DELETED_STUDENTS (The Blacklist) - MUST be a Union
                if (row.key === KEYS.DELETED_STUDENTS) {
                    const localIds = safeParse<string[]>(Storage.getItem(row.key), []);
                    const cloudIds = Array.isArray(row.value) ? row.value : safeParse<string[]>(row.value, []);
                    const union = [...new Set([...localIds, ...cloudIds])];
                    Storage.setItem(row.key, JSON.stringify(union));
                    notifyByKey(row.key);
                    return;
                }

                if (MERGE_KEYS.includes(row.key)) {
                    const localItems = safeParse<any[]>(Storage.getItem(row.key), []);
                    const cloudItems = Array.isArray(row.value) ? row.value : safeParse<any[]>(row.value, []);

                    // Load latest tombstone list to filter during merge
                    const globalDeletedIds = safeParse<string[]>(Storage.getItem(KEYS.DELETED_STUDENTS), []);

                    const mergedMap = new Map();
                    // Load all items, lets cloud take precedence for updates
                    [...localItems, ...cloudItems].forEach(item => {
                        if (!item || !item.id) return;

                        // Tombstone Pattern: Keep deleted items as tombstones so they aren't resurrected during merge
                        if (item.isDeleted === true || globalDeletedIds.includes(String(item.id))) {
                            mergedMap.set(String(item.id), { id: item.id, isDeleted: true });
                            return;
                        }

                        const existing = mergedMap.get(String(item.id));
                        if (!existing) {
                            mergedMap.set(String(item.id), item);
                        } else {
                            // Smart merge for student progress
                            const combined = { ...existing, ...item };
                            if (row.key === KEYS.STUDENTS) {
                                combined.completedExams = Array.from(new Set([...(existing.completedExams || []), ...(item.completedExams || [])]));
                                combined.achievements = DB.removeDuplicates([...(existing.achievements || []), ...(item.achievements || [])], 'id');
                            }
                            mergedMap.set(String(item.id), combined);
                        }
                    });

                    let mergedArr = Array.from(mergedMap.values());
                    const mergedRaw = JSON.stringify(mergedArr);
                    const localRaw = Storage.getItem(row.key);

                    if (mergedRaw !== localRaw) {
                        Storage.setItem(row.key, mergedRaw);
                        DB.clearCache();
                        notifyByKey(row.key);
                        console.log(`🔄 [Sync-Merged] Updated: ${row.key} (${mergedArr.length} items)`);
                    }
                    return;
                }

                // Prevent downloading raw 50MB webm video chunks into localStorage!!
                if (row.key.startsWith('nt_recordings_chunk_')) return;

                let cloudRaw: string;
                if (row.key.startsWith('nt_presence_')) {
                    cloudRaw = JSON.stringify({
                        status: typeof row.value === 'string' ? row.value : JSON.stringify(row.value),
                        updated_at: (row as any).updated_at || new Date().toISOString()
                    });
                } else {
                    cloudRaw = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
                }
                const localRaw = Storage.getItem(row.key);

                if (localRaw !== cloudRaw) {
                    try {
                        if (row.key === KEYS.NOTIFICATIONS && typeof window !== 'undefined') {
                            triggerNativePush(row.value, localRaw, 'notification');
                        }
                    } catch (err) { console.error('Failed pushing native', err); }

                    Storage.setItem(row.key, cloudRaw);
                    DB.clearCache(); // Force refresh all caches
                    notifyByKey(row.key);
                    console.log(`🔄 [Sync-Overwrite] Received: ${row.key}`);
                }
            } catch (e) {
                console.error(`❌ [Sync] Apply Error [${row.key}]:`, e);
            }
        };

        const pullAll = async (retryCount = 0) => {
            // --- 1. FIREBASE REAL-TIME SUBSCRIPTION (Chat & Rooms Only) ---
            // Real-time Listeners (CHAT REMOVED)

            // --- 2. SUPABASE CONTENT PULL (Everything Else) ---
            if (isSupabaseConnected) {
                try {
                    const { data, error } = await supabase
                        .from('site_data')
                        .select('key, value, updated_at')
                        .not('key', 'like', 'nt_recordings_chunk_%')
                        .limit(1000);

                    if (error) {
                        console.error("Supabase pull error:", error);
                        throw error;
                    }
                    if (data && data.length > 0) {
                        data.forEach(row => {
                            applyCloudRow(row);
                        });
                    }
                } catch (err) {
                    const nextRetry = Math.min(30000, 5000 * Math.pow(2, retryCount));
                    setTimeout(() => pullAll(retryCount + 1), nextRetry);
                }
            }
        };

        // --- PHASE 1: BOOTSTRAP FROM INDEXEDDB ---
        (async () => {
            console.log('🚀 [Boot] Loading from IndexedDB...');
            for (const key of BIG_KEYS) {
                const val = await IDB.get(key);
                if (val) {
                    STORAGE_CACHE[key] = val;
                    DB.clearCache(); // Force refresh in-memory cache
                    notifyByKey(key);
                }
            }
            // --- PHASE 2: TRIGGER LIVE CLOUD PULL ---
            pullAll();
        })();

        // --- 3. PRIVATE LOCAL SERVER FALLBACK (Events) ---
        try {
            const evtSource = new EventSource('http://127.0.0.1:4001/api/events');
            evtSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'update' && data.key) {
                    fetch(`http://127.0.0.1:4001/api/data/${data.key}`)
                        .then(r => r.json())
                        .then(val => applyCloudRow({ key: data.key, value: val }))
                        .catch(() => { });
                }
            };
            evtSource.onerror = () => {
                evtSource.close();
                setTimeout(() => DB._initSync(), 10000);
            };
        } catch (e) { }

        // --- 4. CLOUD BROADCAST CHANNEL ---
        if (isSupabaseConnected) {
            try {
                supabase.channel('nt_master_sync_v2')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_data' }, (payload: any) => {
                        if (payload.new && payload.new.key) applyCloudRow(payload.new);
                    })
                    .on('broadcast', { event: 'data-sync' }, ({ payload }: { payload: any }) => {
                        if (payload?.key) {
                            supabase.from('site_data').select('key, value').eq('key', payload.key).single()
                                .then(({ data: row }) => { if (row) applyCloudRow(row); });
                        }
                    })
                    .subscribe();
            } catch (e) { }
        }
    },

    /** Load from local backup (localhost:3001) as last resort */
    loadLocalBackup: async () => {
        try {
            console.log('🔄 [Recovery] Attempting local backup fetch...');
            const res = await fetch('http://127.0.0.1:4001/api/all');
            const data = await res.json();

            Object.keys(data).forEach(k => {
                if (data[k]) {
                    localStorage.setItem(k, JSON.stringify(data[k]));
                    // Trigger events for each key to update UI
                    const eventMap: any = {
                        'nt_students': 'nt-students-change',
                        'nt_booklets': 'nt-booklets-change',
                        'nt_courses': 'nt-courses-change',
                        'nt_lessons': 'nt-lessons-change',
                        'nt_exams': 'nt-exams-change',
                        'nt_content': 'nt-content-change',
                        'nt_payments': 'nt-payments-change'
                    };
                    if (eventMap[k]) window.dispatchEvent(new CustomEvent(eventMap[k]));
                }
            });

            localStorage.setItem('nt_cloud_init_done', 'false'); // Allow re-syncING TO cloud
            console.log('✅ [Recovery] Successfully restored data from local backup!');
            setTimeout(() => window.location.reload(), 1000);
            return true;
        } catch (e) {
            console.error('❌ [Recovery] Local backup fetch failed:', e);
            return false;
        }
    },

    /** Perform total cleanup as requested by admin */

    performEmergencyPurge: async () => {
        console.log('🚨 [Purge] Starting Database Wipe...');
        const allKeys = Object.values(KEYS);
        allKeys.forEach(k => localStorage.removeItem(k));
        if (isSupabaseConnected) {
            try {
                await supabase.from('site_data').delete().neq('key', 'SYSTEM_INTERNAL_DO_NOT_DELETE');
                await logSecurityEvent('DATABASE_PURGE', 'critical', { authorized: true });
            } catch (e) { console.error('Purge error:', e); }
        }
        localStorage.setItem('nt_cloud_init_done', 'true');
        console.log('✅ [Purge] Complete. Restarting...');
        window.location.reload();
    },

    // ---- Smart Student Dashboard Methods ----
    getCompletedLessons: (studentId: string): string[] => {
        const key = `nt_lessons_completed_${studentId}`;
        return safeParse(Storage.getItem(key), []);
    },
    saveCompletedLessons: (studentId: string, lessonIds: string[]) => {
        const key = `nt_lessons_completed_${studentId}`;
        Storage.setItem(key, JSON.stringify(lessonIds));
        DB._syncToServer(key, lessonIds);
    },
    getStudyTimeLogs: (studentId: string): Record<string, { activeSeconds: number; lessonSeconds: number }> => {
        const key = `nt_study_logs_${studentId}`;
        return safeParse(Storage.getItem(key), {});
    },
    saveStudyTimeLogs: (studentId: string, logs: Record<string, { activeSeconds: number; lessonSeconds: number }>) => {
        const key = `nt_study_logs_${studentId}`;
        Storage.setItem(key, JSON.stringify(logs));
        DB._syncToServer(key, logs);
    },
    getActivityLogs: (studentId: string): string[] => {
        const key = `nt_activity_logs_${studentId}`;
        return safeParse(Storage.getItem(key), []);
    },
    addActivityLog: (studentId: string, log: string) => {
        const key = `nt_activity_logs_${studentId}`;
        const logs = safeParse<string[]>(Storage.getItem(key), []);
        const trimmed = [`${new Date().toLocaleString('ar-EG')} - ${log}`, ...logs].slice(0, 50);
        Storage.setItem(key, JSON.stringify(trimmed));
        DB._syncToServer(key, trimmed);
    }
    ,

    getReferralLevelDetails: (totalReferrals: number) => {
        if (totalReferrals >= 250) return { name: 'أسطورة الإحالات', badge: '🔥', nextLimit: null, min: 250 };
        if (totalReferrals >= 180) return { name: 'سفير المنصة', badge: '👑', nextLimit: 250, min: 180 };
        if (totalReferrals >= 130) return { name: 'خبير', badge: '🚀', nextLimit: 180, min: 130 };
        if (totalReferrals >= 80) return { name: 'محترف', badge: '💎', nextLimit: 130, min: 80 };
        if (totalReferrals >= 40) return { name: 'متميز', badge: '🥇', nextLimit: 80, min: 40 };
        if (totalReferrals >= 15) return { name: 'نشط', badge: '🥈', nextLimit: 40, min: 15 };
        if (totalReferrals >= 5) return { name: 'مبتدئ', badge: '🥉', nextLimit: 15, min: 5 };
        return { name: 'عضو جديد', badge: '🌱', nextLimit: 5, min: 0 };
    },
    getReferralAchievements: (totalReferrals: number, userAchievements: any[]) => {
        const milestones = [1, 5, 10, 25, 50, 100, 150, 250];
        const all = milestones.map(m => ({
            required: m,
            isUnlocked: totalReferrals >= m,
            achievedAt: userAchievements?.find((a: any) => a.required === m)?.achievedAt || (totalReferrals >= m ? new Date().toISOString() : null)
        }));
        return { all, unlocked: all.filter(a => a.isUnlocked) };
    },
    resetMonthlyReferralsIfNeeded: () => {
        const lastReset = StorageLayer.getItem('nt_last_monthly_reset');
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (lastReset !== currentMonth) {
            const students = DB.getStudents();
            let changed = false;
            students.forEach(s => {
                if (s.monthly_referrals && s.monthly_referrals > 0) {
                    s.monthly_referrals = 0;
                    changed = true;
                }
            });
            if (changed) {
                StorageLayer.setItem(KEYS.STUDENTS, JSON.stringify(students));
                DB._syncToServer(KEYS.STUDENTS, students);
            }
            StorageLayer.setItem('nt_last_monthly_reset', currentMonth);
        }
    },
    checkAndTriggerReferralReward: (newUserId: string) => {
        const students = DB.getStudents();
        const user = students.find(s => s.id === newUserId);
        if (!user || !user.isEmailVerified || !user.referred_by || user.referral_reward_claimed) return;

        const referrer = students.find(s => s.referral_code === user.referred_by);
        if (referrer) {
            referrer.points = (referrer.points || 0) + 300;
            referrer.referral_count = (referrer.referral_count || 0) + 1;
            referrer.monthly_referrals = (referrer.monthly_referrals || 0) + 1;
            referrer.referral_earnings = (referrer.referral_earnings || 0) + 300;
            referrer.last_referral_date = new Date().toISOString();
            DB.updateLeaderboardRanks(students);

            user.points = (user.points || 0) + 500;
            user.referral_reward_claimed = true;

            StorageLayer.setItem(KEYS.STUDENTS, JSON.stringify(students));
            DB._syncToServer(KEYS.STUDENTS, students);
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('nt-students-change'));
        }
    },
    updateLeaderboardRanks: (studentsList: any[] = null) => {
        const students = studentsList || DB.getStudents();
        students.forEach(s => {
            const lvl = DB.getReferralLevelDetails(s.referral_count || 0);
            s.referral_level = lvl.name;
            s.referral_badge = lvl.badge;
        });

        students.sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0));
        students.forEach((s, idx) => {
            s.leaderboard_rank = idx + 1;
        });

        if (!studentsList) {
            StorageLayer.setItem(KEYS.STUDENTS, JSON.stringify(students));
            DB._syncToServer(KEYS.STUDENTS, students);
        }
    }

};

// 🚀 Database Initialization
DB._initSync();
