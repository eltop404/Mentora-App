import { supabase, isSupabaseConnected } from './supabaseClient';

/**
 * Supabase Service
 * 
 * Provides centralized helper methods for Supabase interactions
 * ensuring error handling and safety.
 */

export const SupabaseService = {
  /**
   * Health Check: Verifies if the connection is active and responding
   */
  async checkConnection(): Promise<boolean> {
    if (!isSupabaseConnected) return false;
    try {
      const { error } = await supabase.from('site_data').select('key').limit(1);
      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Realtime Helper: Subscribes to changes in any table
   */
  subscribeToTable(tableName: string, callback: (payload: any) => void) {
    if (!isSupabaseConnected) return null;
    return supabase.channel(`public_${tableName}_realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, callback)
      .subscribe();
  },

  /**
   * Generic Storage Upload
   */
  async uploadFile(bucketName: string, path: string, file: File | Blob) {
    if (!isSupabaseConnected) throw new Error('Supabase not connected');
    return await supabase.storage.from(bucketName).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
  },

  /**
   * Fetching Public Settings specifically
   */
  async getSettings() {
    if (!isSupabaseConnected) return null;
    const { data, error } = await supabase.from('site_data').select('*').eq('key', 'nt_settings').maybeSingle();
    return error ? null : data?.value;
  }
};
