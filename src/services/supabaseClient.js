import { createClient } from '@supabase/supabase-js';

// ================================================================
// 🔐 Mentora - Supabase Client (JS version)
// Project: https://zcnomkgzlmdtccnnxawg.supabase.co
// ================================================================

const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

let _client = null;

if (supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20) {
    try {
        _client = createClient(supabaseUrl, supabaseAnonKey, {
            realtime: {
                params: { eventsPerSecond: 20 },
                heartbeatIntervalMs: 15000,
                reconnectAfterMs: (tries) => Math.min(500 * Math.pow(2, tries), 10000),
            },
            auth: { persistSession: false, autoRefreshToken: false },
        });
        console.log('📡 [Supabase JS] ✅ Connected →', supabaseUrl);
        window.dispatchEvent(new CustomEvent('nt-supabase-ready'));
    } catch (e) {
        console.error('❌ [Supabase JS] Failed to create client:', e);
    }
} else {
    console.warn('⚠️ [Supabase JS] Missing credentials in .env');
}

// Fluent dummy client for offline-safe usage
const dummyClient = {
    from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }), neq: () => Promise.resolve({ data: null, error: null }) }),
        not: function () { return this; },
        eq: function () { return this; },
        in: function () { return this; },
        or: function () { return this; },
        order: function () { return this; },
        limit: function () { return this; },
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
    }),
    channel: (_name) => ({
        on: function () { return this; },
        subscribe: () => ({ unsubscribe: () => { } }),
        unsubscribe: () => { },
        send: () => Promise.resolve({ error: null }),
        track: () => Promise.resolve({ error: null }),
        presenceState: () => ({}),
    }),
    removeChannel: () => Promise.resolve(),
    removeAllChannels: () => Promise.resolve(),
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: { path: '' }, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            remove: () => Promise.resolve({ data: null, error: null }),
        }),
    },
};

export const supabase = _client || dummyClient;
export const isSupabaseConnected = !!_client;
export const supabaseProjectUrl = supabaseUrl;
