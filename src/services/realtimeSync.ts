/**
 * ================================================================
 * 🔴 REAL-TIME SYNC ENGINE — Mentora
 * ================================================================
 * يربط جداول Supabase مع الـ LocalStorage/IDB المحلي
 * بحيث يُحدَّث الـ UI فوراً عند أي تغيير من الأدمن أو الطالب
 * ================================================================
 */

import { supabase, isSupabaseConnected } from './supabaseClient';
import { StorageLayer } from './db';

// ─── Custom Event Names (طبق على بقية الكود) ────────────────────
const NT_EVENTS: Record<string, string> = {
    site_data: 'nt-data-sync',
    students: 'nt-students-change',
    content: 'nt-content-change',
    exams: 'nt-exams-change',
    booklets: 'nt-booklets-change',
    courses: 'nt-courses-change',
    lessons: 'nt-lessons-change',
    payments: 'nt-payments-change',
    support_tickets: 'nt-tickets-change',
    notifications: 'nt-notifications-change',
    certificates: 'nt-certificates-change',
    coupons: 'nt-coupons-change',
    app_settings: 'nt-settings-change',
    site_texts: 'nt-site-texts-change',
    ratings: 'nt-ratings-change',
    semester_status: 'nt-lock-change',
    recharge_packages: 'nt-data-sync',
};

// Tables that use the key-value store (site_data)
const SITE_DATA_TABLES = new Set(['site_data']);

// ─── Helper: fire browser event ──────────────────────────────────
const dispatch = (eventName: string) => {
    window.dispatchEvent(new CustomEvent(eventName));
    window.dispatchEvent(new CustomEvent('nt-data-sync'));
};

// ─── Subscriptions registry (for cleanup) ────────────────────────
const CHANNELS: ReturnType<typeof supabase.channel>[] = [];

// ─── Apply a site_data row to local storage ──────────────────────
const applySiteDataRow = (row: { key: string; value: any; updated_at?: string }) => {
    if (!row?.key) return;

    let val: string;
    if (row.key.startsWith('nt_presence_')) {
        // Special case: Presence data needs to preserve the timestamp
        val = JSON.stringify({
            status: typeof row.value === 'string' ? row.value : JSON.stringify(row.value),
            updated_at: row.updated_at || new Date().toISOString()
        });
    } else {
        val = typeof row.value === 'string'
            ? row.value
            : JSON.stringify(row.value ?? '');
    }

    if (!val) return;
    StorageLayer.setItem(row.key, val);

    // Dispatch matching event
    const eventMap: Record<string, string> = {
        nt_students: 'nt-students-change',
        nt_content: 'nt-content-change',
        nt_exams: 'nt-exams-change',
        nt_booklets: 'nt-booklets-change',
        nt_courses: 'nt-courses-change',
        nt_lessons: 'nt-lessons-change',
        nt_payments: 'nt-payments-change',
        nt_tickets: 'nt-tickets-change',
        nt_notifications: 'nt-notifications-change',
        nt_certificates: 'nt-certificates-change',
        nt_coupons: 'nt-coupons-change',
        nt_app_settings: 'nt-settings-change',
        nt_site_texts: 'nt-site-texts-change',
        nt_ratings: 'nt-ratings-change',
        nt_semester_status: 'nt-lock-change',
        nt_units: 'nt-units-change',
        nt_units_tracker: 'nt-units-change',
        nt_meeting_config: 'nt-meeting-change',
    };

    const ev = eventMap[row.key];
    if (ev) dispatch(ev);
    else dispatch('nt-data-sync');
};

// ================================================================
// 🚀 MAIN REALTIME SETUP
// ================================================================
export const setupRealtimeSync = () => {
    if (!isSupabaseConnected) {
        console.warn('[RT] Supabase not connected – skipping realtime setup');
        return;
    }

    // ─── Channel 1: site_data (existing key-value store) ──────────
    const siteDataChannel = supabase
        .channel('nt_master_sync_v2')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'site_data' },
            (payload: any) => {
                const row = payload.new ?? payload.old;
                if (row) applySiteDataRow(row);
            }
        )
        // ─── ميزة الـ Broadcast (أسرع وأضمن للطلاب) ──────────────────
        .on('broadcast', { event: 'data-sync' }, ({ payload }: { payload: any }) => {
            if (payload?.key) {
                console.log(`📡 [RT] Broadcast received for: ${payload.key}`);
                // عند استلام برودكاست، نقوم بسحب القيمة الأحدث من الجدول فوراً
                supabase
                    .from('site_data')
                    .select('key, value, updated_at')
                    .eq('key', payload.key)
                    .single()
                    .then(({ data: row }) => {
                        if (row) applySiteDataRow(row);
                    });
            }
        })
        .on('broadcast', { event: 'force-refresh' }, () => {
            window.location.reload();
        })
        .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
                console.log('🔴 [RT] Real-time engine SUBSCRIBED');
            }
        });

    CHANNELS.push(siteDataChannel);

    // ─── Channel 2: students ──────────────────────────────────────
    const studentsChannel = supabase
        .channel('nt_students_rt')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'students' },
            () => dispatch('nt-students-change')
        )
        .subscribe();

    CHANNELS.push(studentsChannel);

    // ─── Channel 3: notifications ─────────────────────────────────
    const notifChannel = supabase
        .channel('nt_notifications_rt')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            () => dispatch('nt-notifications-change')
        )
        .subscribe();

    CHANNELS.push(notifChannel);

    // ─── Channel 4: payments ─────────────────────────────────────
    const paymentsChannel = supabase
        .channel('nt_payments_rt')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'payments' },
            () => dispatch('nt-payments-change')
        )
        .subscribe();

    CHANNELS.push(paymentsChannel);

    // ─── Channel 5: support_tickets ──────────────────────────────
    const ticketsChannel = supabase
        .channel('nt_tickets_rt')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'support_tickets' },
            () => dispatch('nt-tickets-change')
        )
        .subscribe();

    CHANNELS.push(ticketsChannel);

    // ─── Channel 6: app_settings ─────────────────────────────────
    const settingsChannel = supabase
        .channel('nt_settings_rt')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'app_settings' },
            () => dispatch('nt-settings-change')
        )
        .subscribe();

    CHANNELS.push(settingsChannel);

    console.log('✅ [RT] All realtime channels initialized');
};

// ================================================================
// 🧹 CLEANUP (call on unmount/logout)
// ================================================================
export const teardownRealtimeSync = async () => {
    for (const ch of CHANNELS) {
        await supabase.removeChannel(ch);
    }
    CHANNELS.length = 0;
    console.log('[RT] All channels removed');
};

// ================================================================
// 📡 BROADCAST: Admin → All Students (force pull data)
// ================================================================
export const broadcastDataUpdate = async (key: string) => {
    if (!isSupabaseConnected) return;
    try {
        await supabase.channel('nt_master_sync_v2').send({
            type: 'broadcast',
            event: 'data-sync',
            payload: { key },
        });
    } catch (_) { }
};

// ================================================================
// 🔄 INITIAL PULL: Fetch all site_data on startup
// ================================================================
export const pullSiteData = async (retryCount = 0): Promise<void> => {
    if (!isSupabaseConnected) return;

    try {
        const { data, error } = await supabase
            .from('site_data')
            .select('key, value, updated_at')
            .not('key', 'like', 'nt_recordings_chunk_%')
            .limit(1000);

        if (error) throw error;

        if (data && data.length > 0) {
            data.forEach(row => applySiteDataRow(row));
            console.log(`✅ [Sync] Pulled ${data.length} rows from site_data`);
        }
    } catch (err) {
        const delay = Math.min(30000, 3000 * Math.pow(2, retryCount));
        console.warn(`⚠️ [Sync] Pull failed, retrying in ${delay}ms...`);
        setTimeout(() => pullSiteData(retryCount + 1), delay);
    }
};
