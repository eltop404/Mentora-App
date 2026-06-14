-- 1. التأكد من وجود الجداول
CREATE TABLE IF NOT EXISTS public.site_data (
    key text PRIMARY KEY,
    value jsonb NOT NULL DEFAULT '{}',
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    severity text NOT NULL,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    user_name text NOT NULL,
    user_avatar text,
    stage text NOT NULL,
    message text,
    message_type text DEFAULT 'text',
    file_url text,
    reply_to uuid,
    created_at timestamptz DEFAULT now(),
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    status text DEFAULT 'sent',
    recipient_id text,
    deleted_for text[] DEFAULT '{}',
    is_view_once boolean DEFAULT false,
    caption text,
    has_viewed text[] DEFAULT '{}'
);

-- 2. تفعيل الحماية لكل الجداول
ALTER TABLE public.site_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. مسح القواعد القديمة (للأمان)
DROP POLICY IF EXISTS "allow_all_read" ON public.site_data;
DROP POLICY IF EXISTS "allow_all_insert" ON public.site_data;
DROP POLICY IF EXISTS "allow_all_update" ON public.site_data;
DROP POLICY IF EXISTS "allow_all_delete" ON public.site_data;
DROP POLICY IF EXISTS "logs_insert" ON public.security_logs;
DROP POLICY IF EXISTS "logs_read" ON public.security_logs;
DROP POLICY IF EXISTS "messages_read" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

-- 4. إضافة القواعد الجديدة
CREATE POLICY "allow_all_read" ON public.site_data FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.site_data FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.site_data FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON public.site_data FOR DELETE USING (true);
CREATE POLICY "logs_insert" ON public.security_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "logs_read" ON public.security_logs FOR SELECT USING (true);
CREATE POLICY "messages_read" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (true);

-- 5. تفعيل الـ Realtime
DO $$
BEGIN
    -- Realtime for site_data
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'site_data') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE site_data;
    END IF;
    -- Realtime for messages
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
END $$;

-- 6. تعليمات Storage (يجب عملها يدوياً في لوحة تحكم سوبا بيز)
-- Bucket Names: 'chat-images', 'chat-attachments'
-- Access: Public

SELECT 'Setup Complete! Cloud is ready.' as status;
