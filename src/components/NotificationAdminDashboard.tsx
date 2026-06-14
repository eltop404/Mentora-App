import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { PushNotification, Content } from '../types';
import { Send, Image as ImageIcon, Link as LinkIcon, Trash2, Edit3, LogOut, Search, Bell } from 'lucide-react';
import { THEMES } from '../constants';

interface Props {
  onLogout: () => void;
  theme: any;
}

export const NotificationAdminDashboard: React.FC<Props> = ({ onLogout, theme }) => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [sections, setSections] = useState<Content[]>([]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetSection, setTargetSection] = useState('');

  // Targeting
  const [targetYear, setTargetYear] = useState('الكل');
  const [targetLevel, setTargetLevel] = useState('الكل');
  const [targetSemester, setTargetSemester] = useState('الكل');
  const [targetSpecialization, setTargetSpecialization] = useState('الكل');

  const [imageType, setImageType] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');

  const [isEditing, setIsEditing] = useState<string | null>(null);

  useEffect(() => {
    // Load existing notifications
    const loadData = () => {
      setNotifications(DB.getPushNotifications());
      // Get all unique sections from contents + app sections
      const allSections = DB.getSections();
      setSections(allSections);
    };

    loadData();
    window.addEventListener('nt-notifications-change', loadData);
    window.addEventListener('nt-sections-change', loadData);
    return () => {
      window.removeEventListener('nt-notifications-change', loadData);
      window.removeEventListener('nt-sections-change', loadData);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      alert('الرجاء كتابة عنوان ومحتوى الإشعار');
      return;
    }

    const notif: PushNotification = {
      id: isEditing || `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      targetSection,
      targetYear,
      targetLevel,
      targetSemester,
      targetSpecialization,
      image: imageUrl,
      date: new Date().toLocaleDateString('ar-EG'),
      time: new Date().toLocaleTimeString('ar-EG'),
    };

    if (isEditing) {
      DB.updatePushNotification(isEditing, notif);
      setIsEditing(null);
    } else {
      DB.addPushNotification(notif);
    }

    // Reset form
    setTitle('');
    setBody('');
    setTargetSection('');
    setTargetYear('الكل');
    setTargetLevel('الكل');
    setTargetSemester('الكل');
    setTargetSpecialization('الكل');
    setImageUrl('');
    alert('تم إرسال الإشعار بنجاح لجميع المستخدمين!');
  };

  const handleEdit = (n: PushNotification) => {
    setTitle(n.title);
    setBody(n.body);
    setTargetSection(n.targetSection || '');
    setTargetYear(n.targetYear || 'الكل');
    setTargetLevel(n.targetLevel || 'الكل');
    setTargetSemester(n.targetSemester || 'الكل');
    setTargetSpecialization(n.targetSpecialization || 'الكل');
    setImageUrl(n.image || '');
    if (n.image && n.image.startsWith('data:image')) {
      setImageType('upload');
    } else if (n.image) {
      setImageType('url');
    }
    setIsEditing(n.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإشعار؟ لن يظهر مجدداً في سجل المستخدمين.')) {
      DB.deletePushNotification(id);
    }
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto text-white font-cairo relative" style={{ backgroundColor: theme.bg || '#0a0802' }} dir="rtl">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden shadow-lg border-2 flex items-center justify-center shrink-0" style={{ borderColor: theme.primary }}>
            <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" alt="Mentora Logo" className="w-full h-full object-cover block" />
          </div>
          <span className="font-bold text-xs sm:text-sm bg-white/10 px-3 py-1 rounded-full border border-white/20" style={{ color: theme.primary }}>لوحة الإشعارات</span>
        </div>
        <h1 className="text-2xl font-black tracking-wider flex items-center gap-2">
          Mentora
        </h1>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-8 w-full max-w-4xl mx-auto space-y-8 pb-32">

        {/* Form Section */}
        <div className="bg-black/40 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden group backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ backgroundColor: `${theme.primary}20` }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" style={{ backgroundColor: `${theme.primary}10` }} />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Bell style={{ color: theme.primary }} size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل الإشعار' : 'إرسال إشعار جديد'}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">عنوان الإشعار</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: إشعار جديد 🔮"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none transition-all"
                  style={{ borderBottomColor: title ? theme.primary : undefined }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">محتوى الإشعار</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none transition-all resize-none"
                  style={{ borderBottomColor: body ? theme.primary : undefined }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">توجيه المستخدم عند الضغط (القسم)</label>
                <div className="relative">
                  <select
                    value={targetSection}
                    onChange={e => setTargetSection(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none transition-all appearance-none pr-10"
                    style={{ borderBottomColor: targetSection ? theme.primary : undefined }}
                  >
                    <option value="">-- بدون توجيه (يفتح التطبيق فقط) --</option>
                    <option value="home">الرئيسية</option>
                    <option value="sections">سكاشن</option>
                    <option value="booklets">ملخصات</option>
                    <option value="exams">الامتحانات</option>
                    <option value="studentCard">هويتي</option>
                    <option value="recharge">شحن</option>
                    <option value="receipts">إيصال</option>
                    <option value="ai">AI</option>
                    <option value="control">التحكم</option>
                    <option value="courses">كورسات</option>
                    <option value="explanations">شرح</option>
                    <option value="certificates">شهادتي</option>
                    <option value="achievements">انجازاتي</option>
                    <option value="referrals">الإحالات</option>
                    <option value="leaderboard">المتصدرون</option>
                    <option value="tanta_portal">منصة المعهد</option>
                    <option value="meeting">ميتنج</option>
                    <option value="developer">المطور</option>
                    <option value="support">الدعم</option>
                    <option value="themes">ثيمات</option>
                    <option value="share">مشاركه</option>
                    <option value="privacy">الخصوصيه</option>
                    <option value="profile">ملفي</option>
                    {sections.map(s => (
                      <option key={s.id} value={`section_${s.id}`}>محتوى مخصص: {s.title} ({s.stage})</option>
                    ))}
                  </select>
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                </div>
              </div>

              {/* Targeting Options */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <Search size={16} style={{ color: theme.primary }} />
                  تخصيص الإشعار لفئة محددة (اختياري)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">الفرقة</label>
                    <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all appearance-none">
                      <option value="الكل">الكل</option>
                      <option value="الفرقة الأولى">الفرقة الأولى</option>
                      <option value="الفرقة الثانية">الفرقة الثانية</option>
                      <option value="الفرقة الثالثة">الفرقة الثالثة</option>
                      <option value="الفرقة الرابعة">الفرقة الرابعة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">الشعبة</label>
                    <select value={targetLevel} onChange={e => setTargetLevel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all appearance-none">
                      <option value="الكل">الكل</option>
                      <option value="اعمال دوليه IB">اعمال دوليه IB</option>
                      <option value="نظم المعلومات BIS">نظم المعلومات BIS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">الفصل الدراسي</label>
                    <select value={targetSemester} onChange={e => setTargetSemester(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all appearance-none">
                      <option value="الكل">الكل</option>
                      <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                      <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">التخصص</label>
                    <select value={targetSpecialization} onChange={e => setTargetSpecialization(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all appearance-none">
                      <option value="الكل">الكل</option>
                      <option value="محاسبة">محاسبة</option>
                      <option value="تمويل">تمويل</option>
                      <option value="نظم المعلومات">نظم المعلومات</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">صورة الإشعار المرفقة (اختياري)</label>
                <div className="flex gap-2 mb-3 bg-black/40 p-1.5 rounded-xl border border-white/10 w-fit">
                  <button onClick={() => setImageType('url')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${imageType === 'url' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`} style={{ color: imageType === 'url' ? theme.primary : undefined }}>
                    <LinkIcon size={14} className="inline ml-1" /> رابط
                  </button>
                  <button onClick={() => setImageType('upload')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${imageType === 'upload' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`} style={{ color: imageType === 'upload' ? theme.primary : undefined }}>
                    <ImageIcon size={14} className="inline ml-1" /> رفع
                  </button>
                </div>

                {imageType === 'url' ? (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-left text-white placeholder-gray-500 focus:outline-none transition-all"
                    style={{ borderBottomColor: imageUrl ? theme.primary : undefined }}
                    dir="ltr"
                  />
                ) : (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-white/40 transition-all bg-black/20">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <div className="text-center">
                      <ImageIcon className="mx-auto text-gray-400 mb-2" size={24} />
                      <span className="text-sm text-gray-400">اضغط لرفع صورة</span>
                    </div>
                  </label>
                )}
              </div>

              {imageUrl && (
                <div className="mt-4 border border-white/10 rounded-xl p-2 bg-black/40">
                  <p className="text-xs text-gray-500 mb-2 px-2">معاينة الصورة:</p>
                  <img src={imageUrl} alt="Preview" className="max-h-48 rounded-lg mx-auto object-contain" />
                </div>
              )}

              <button
                onClick={handleSend}
                className="w-full py-4 mt-4 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-black"
                style={{ backgroundColor: theme.primary }}
              >
                <Send size={20} />
                {isEditing ? 'حفظ التعديلات وإرسال' : 'إرسال الإشعار لجميع المستخدمين الآن'}
              </button>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-6 rounded-full inline-block" style={{ backgroundColor: theme.primary }}></span>
            سجل الإشعارات المرسلة
          </h3>

          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/5 rounded-3xl">
              <Bell className="mx-auto text-gray-500 mb-3 opacity-50" size={32} />
              <p className="text-gray-400 font-medium">لم يتم إرسال أي إشعارات بعد.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.slice().reverse().map(n => (
                <div key={n.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                  {/* Preview Notification Style */}
                  <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm flex items-center gap-2">Mentora <span className="text-[10px] text-gray-500 font-normal mr-auto">الآن •</span></p>
                        <p className="text-white font-bold text-md mt-0.5 text-right">{n.title}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: theme.primary }}>
                        <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" alt="Mentora" className="w-full h-full object-cover block" />
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mt-1 mb-3 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                    {n.image && (
                      <div className="rounded-xl overflow-hidden mt-2 border border-white/10 w-full">
                        <img src={n.image} alt="Notification Media" className="w-full object-cover max-h-60" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between mt-2 pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-bold">{n.date} - {n.time}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {n.targetYear && n.targetYear !== 'الكل' && <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">{n.targetYear}</span>}
                        {n.targetLevel && n.targetLevel !== 'الكل' && <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">{n.targetLevel}</span>}
                        {n.targetSemester && n.targetSemester !== 'الكل' && <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">{n.targetSemester}</span>}
                        {n.targetSpecialization && n.targetSpecialization !== 'الكل' && <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">{n.targetSpecialization}</span>}
                        {(!n.targetYear || n.targetYear === 'الكل') && (!n.targetLevel || n.targetLevel === 'الكل') && (!n.targetSemester || n.targetSemester === 'الكل') && (!n.targetSpecialization || n.targetSpecialization === 'الكل') && (
                          <span className="text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">إلى الجميع</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button onClick={() => handleEdit(n)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1.5">
                        <Edit3 size={16} /> <span className="text-xs font-bold">تعديل</span>
                      </button>
                      <button onClick={() => handleDelete(n.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5">
                        <Trash2 size={16} /> <span className="text-xs font-bold">حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Logout Button */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onLogout}
          className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-red-500/30 transition-all backdrop-blur-xl shadow-2xl"
        >
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};



