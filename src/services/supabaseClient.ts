import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ================================================================
// 🔐 SECURITY NOTE:
// - VITE_SUPABASE_ANON_KEY  → آمن في Frontend (Anon/Publishable)
// - Service Role Secret     → محفوظ فقط في Server/Edge Functions
// ================================================================

// ─── إعدادات الربط مع Supabase ──────────────────────────────────
// يتم جلب البيانات من ملف الـ .env محلياً أو من إعدادات Netlify أونلاين
// الكود يستخدم النمط القياسي لـ Vite (import.meta.env)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
const isValidKey = anonKey.length > 20;

let _client: SupabaseClient | null = null;

if (isValidUrl && isValidKey) {
    try {
        _client = createClient(supabaseUrl, anonKey, {
            realtime: {
                params: {
                    eventsPerSecond: 20,        // معدل الأحداث في الثانية
                },
                heartbeatIntervalMs: 15000,   // نبضة حية كل 15 ثانية
                reconnectAfterMs: (tries: number) =>
                    Math.min(500 * Math.pow(2, tries), 10000), // إعادة اتصال تدريجية
            },
            auth: {
                persistSession: false,  // لا نستخدم Auth الخاص بـ Supabase
                autoRefreshToken: false,
            },
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    'x-app-name': 'nabdaltarikh-platform',
                },
            },
        });

        console.log('📡 [Supabase] ✅ Connected to:', supabaseUrl);

        // إشعار باقي المكونات أن Supabase جاهز
        window.dispatchEvent(new CustomEvent('nt-supabase-ready'));

    } catch (e) {
        console.error('❌ [Supabase] Failed to create client:', e);
    }
} else {
    console.warn('⚠️ [Supabase] Missing or invalid credentials in .env');
}

// ─── Dummy Client (Fallback when offline) ─────────────────────
// يُستخدم بدلاً من null لتجنب أي أخطاء في بقية الكود
const dummyClient = {
    from: (_table: string) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }), neq: () => Promise.resolve({ data: null, error: null }) }),
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }), limit: () => Promise.resolve({ data: [], error: null }) }),
        not: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
    }),
    channel: (_name: string) => ({
        on: () => ({
            on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }),
            subscribe: () => ({ unsubscribe: () => { } }),
        }),
        subscribe: () => ({ unsubscribe: () => { } }),
        send: () => Promise.resolve({ error: null }),
        track: () => Promise.resolve({ error: null }),
        presenceState: () => ({}),
        unsubscribe: () => { },
    }),
    removeChannel: () => Promise.resolve(),
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: { path: '' }, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
    },
} as any;

export const supabase: SupabaseClient = (_client ?? dummyClient) as SupabaseClient;
export const isSupabaseConnected = !!_client;
