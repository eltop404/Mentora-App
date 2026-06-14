-- ============================================================
-- 🏛️ نبض التاريخ — النواة البرمجية الجديدة (Supabase)
-- الإصدار: 2.0 (Clean Build)
-- الوظيفة: تصفية شاملة + بناء هيكلي جديد + تفعيل المزامنة الفورية
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │ 1. التصفية الكاملة (Cleanup) - حذف كل الهياكل القديمة     │
-- └──────────────────────────────────────────────────────────┘
DROP TABLE IF EXISTS public.ratings          CASCADE;
DROP TABLE IF EXISTS public.private_messages CASCADE;
DROP TABLE IF EXISTS public.group_room_members CASCADE;
DROP TABLE IF EXISTS public.group_rooms      CASCADE;
DROP TABLE IF EXISTS public.support_tickets  CASCADE;
DROP TABLE IF EXISTS public.survey_replies   CASCADE;
DROP TABLE IF EXISTS public.survey_posts     CASCADE;
DROP TABLE IF EXISTS public.payment_orders   CASCADE;
DROP TABLE IF EXISTS public.coupons          CASCADE;
DROP TABLE IF EXISTS public.certificates     CASCADE;
DROP TABLE IF EXISTS public.exam_results     CASCADE;
DROP TABLE IF EXISTS public.content_files    CASCADE;
DROP TABLE IF EXISTS public.content          CASCADE;
DROP TABLE IF EXISTS public.lessons          CASCADE;
DROP TABLE IF EXISTS public.courses          CASCADE;
DROP TABLE IF EXISTS public.exams            CASCADE;
DROP TABLE IF EXISTS public.booklets         CASCADE;
DROP TABLE IF EXISTS public.students         CASCADE;
DROP TABLE IF EXISTS public.security_logs    CASCADE;
DROP TABLE IF EXISTS public.messages         CASCADE;
DROP TABLE IF EXISTS public.site_data        CASCADE;
DROP TABLE IF EXISTS public.actions          CASCADE;
DROP TABLE IF EXISTS public.chat             CASCADE;
DROP TABLE IF EXISTS public.payments         CASCADE;

-- ┌──────────────────────────────────────────────────────────┐
-- │ 2. إنشاء الهيكل الجديد (Fresh Schema Build)               │
-- └──────────────────────────────────────────────────────────┘

-- [1] جدول الطلاب (Students)
CREATE TABLE public.students (
    id            text        PRIMARY KEY, -- الـ ID من الكود أو Supabase Auth
    username      text        NOT NULL UNIQUE,
    phone         text,
    account_status text        NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'blocked', 'pending')),
    role          text        NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    join_date     timestamptz NOT NULL DEFAULT now(),
    password_hash text        NOT NULL,
    metadata      jsonb       DEFAULT '{}' -- لأي بيانات إضافية مستقبلاً
);

-- [2] جدول الدروس (Lessons)
CREATE TABLE public.lessons (
    id            text        PRIMARY KEY,
    title         text        NOT NULL,
    description   text,
    video_url     text, -- رابط الفيديو التعليمي
    price         numeric     DEFAULT 0,
    thumbnail     text, -- صورة غلاف الدرس
    is_visible    boolean     DEFAULT true,
    created_at    timestamptz DEFAULT now()
);

-- [3] جدول المدفوعات (Payments)
CREATE TABLE public.payments (
    id                 text        PRIMARY KEY,
    student_id         text        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    package_name       text        NOT NULL, -- اسم الباقة أو اسم الكورس
    amount             numeric     NOT NULL,
    status             text        DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    screenshot_url     text, -- رابط صورة التحويل
    order_date         timestamptz DEFAULT now(),
    notes              text
);

-- [4] جدول المحادثات (Chat)
CREATE TABLE public.chat (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    text        NOT NULL, -- قد يكون ID الطالب أو كلمة 'admin'
    receiver_id  text        NOT NULL, -- قد يكون ID الطالب أو كلمة 'admin'
    message      text        NOT NULL,
    msg_type     text        DEFAULT 'text' CHECK (msg_type IN ('text', 'image', 'file')),
    file_url     text,
    is_read      boolean     DEFAULT false,
    created_at   timestamptz DEFAULT now()
);

-- ┌──────────────────────────────────────────────────────────┐
-- │ 3. سياسات الأمان (RLS - Row Level Security)              │
-- └──────────────────────────────────────────────────────────┘

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat     ENABLE ROW LEVEL SECURITY;

-- سياسات الطلاب: يشوفوا بياناتهم فقط
CREATE POLICY "Students see their own data" ON public.students 
    FOR SELECT USING (id = auth.uid()::text OR role = 'admin');

CREATE POLICY "Students can update their own data" ON public.students 
    FOR UPDATE USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);

-- سياسات الدروس: الجميع يرى الدروس الظاهرة
CREATE POLICY "Lessons visibility" ON public.lessons 
    FOR SELECT USING (is_visible = true OR EXISTS (SELECT 1 FROM public.students WHERE id = auth.uid()::text AND role = 'admin'));

-- سياسات المدفوعات: الطالب يرى مدفوعاته فقط
CREATE POLICY "Students see their own payments" ON public.payments 
    FOR SELECT USING (student_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.students WHERE id = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Students can insert payments" ON public.payments 
    FOR INSERT WITH CHECK (student_id = auth.uid()::text);

-- سياسات الشات: الطالب يرى رسائله فقط (المرسلة والمستقبلة)
CREATE POLICY "Chat privacy" ON public.chat 
    FOR SELECT USING (sender_id = auth.uid()::text OR receiver_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.students WHERE id = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Chat insert" ON public.chat 
    FOR INSERT WITH CHECK (sender_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.students WHERE id = auth.uid()::text AND role = 'admin'));

-- سياسة الإدمن المطلقة: تحكم كامل في كل شيء
-- ملاحظة: الـ Policies أعلاه تضمنت بالفعل شرط الـ admin لتبسيط الكود.

-- ┌──────────────────────────────────────────────────────────┐
-- │ 4. تفعيل المزامنة الفورية (Real-time Publication)        │
-- └──────────────────────────────────────────────────────────┘

-- تأكد من وجود الـ Publication الافتراضي أو إنشاؤه
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- إضافة الجداول للـ Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat;

-- تفعيل الـ Replication Identity لضمان وصول Update/Delete بالكامل
ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.lessons  REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.chat     REPLICA IDENTITY FULL;

-- 5. جدول البيانات العامة (K/V Store)
CREATE TABLE IF NOT EXISTS public.site_data (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول سجلات الأمان
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT,
    severity TEXT,
    details JSONB,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل الـ RLS
ALTER TABLE public.site_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- سياسات site_data
CREATE POLICY "Public Read Access" ON public.site_data FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON public.site_data FOR ALL USING (true); -- User will manage auth later

-- سياسات security_logs
CREATE POLICY "Public Insert Access" ON public.security_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Select Access" ON public.security_logs FOR SELECT USING (true);

-- تفعيل المزامنة الفورية لـ site_data
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_data;
ALTER TABLE public.site_data REPLICA IDENTITY FULL;

-- ┌──────────────────────────────────────────────────────────┐
-- │ ✅ تم التجهيز بنجاح! جاهز للتشغيل في SQL Editor          │
-- └──────────────────────────────────────────────────────────┘
SELECT 'Success! Your new Nabd Eltareekh core is ready.' as status;
