import { supabase, isSupabaseConnected } from './supabaseClient';

/**
 * Realtime Presence and Broadcast Service
 * Specialized in low-latency features like typing indicators and online presence.
 */

export const RealtimeService = {
  /**
   * Updates current user's online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean) {
    if (!isSupabaseConnected) return;
    const value = isOnline ? 'متصل الآن' : `أخر ظهور: ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    
    // Using site_data as a presence store
    await supabase.from('site_data').upsert({
      key: `nt_presence_${userId}`,
      value: value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
  },

  /**
   * Broadcasts typing events for chat
   */
  async broadcastTyping(channelName: string, payload: { senderId: string, receiverId: string, isTyping: boolean }) {
    if (!isSupabaseConnected) return;
    const channel = supabase.channel(channelName);
    return channel.send({
      type: 'broadcast',
      event: 'typing',
      payload
    }).catch(() => {});
  },

  /**
   * Listens for specific broadcast events
   */
  listenToChannel(name: string, event: string, handler: (payload: any) => void) {
    if (!isSupabaseConnected) return null;
    return supabase.channel(name)
      .on('broadcast', { event }, (payload) => handler(payload.payload))
      .subscribe();
  }
};
