import React, { useState, useEffect, useRef } from 'react';
import {
  X, Facebook, Phone, Instagram, Send as Telegram,
  Mail, MessageSquare, Sparkles, Share2, ArrowRight, Check
} from 'lucide-react';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string | React.ReactNode;
  rawText?: string; // plain text for sharing
  timestamp: Date;
  isLast?: boolean;
}

interface QuickReply {
  id: string;
  text: string;
  response?: string | React.ReactNode;
  responseText?: string;
  category?: 'main' | 'teacher' | 'developer';
}

const StudentChatBot: React.FC<{ theme?: any; user?: any }> = ({ theme, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [answered, setAnswered] = useState(false); // true after first reply chosen
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const LOGO_URL = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';
  const PRIMARY = theme?.primary || '#D4AF37';

  // Animations disabled for Zero-Lag performance
  useEffect(() => {
  }, []);

  const getInitialMessages = (): Message[] => [
    {
      id: '1',
      type: 'bot',
      content: `أهلاً بك يا ${user?.username || 'بطل'} في Mentora! كيف يمكنني مساعدتك اليوم؟`,
      rawText: `أهلاً بك يا ${user?.username || 'بطل'} في Mentora! كيف يمكنني مساعدتك اليوم؟`,
      timestamp: new Date(),
    },
  ];

  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setMessages(getInitialMessages());
      setAnswered(false);
    }
  }, [isOpen]);

  /* ─────────────────────── data ─────────────────────── */
  const teacherLinksText =
    'تواصل مع الأستاذ محمد يوسف:\nفيسبوك: https://www.facebook.com/mido.mems\nهاتف: 01270800409';
  const developerLinksText =
    'تواصل مع المطور 𝑨𝒎𝒓 𝒍𝒐𝒕𝒇𝒚:\nواتساب: https://wa.me/201067941806\nفيسبوك: https://www.facebook.com/share/1CDtFCSPVD/\nانستجرام: https://www.instagram.com/eltopamr55\nتليجرام: https://t.me/elto47\nإيميل: amrloutfy2006@gmail.com';

  const mainReplies: QuickReply[] = [
    {
      id: 'price',
      text: 'كم سعر الشحن؟',
      response: `أهلاً بك يا ${user?.username || 'بطل'}! استثمر في مستقبلك مع باقات النقاط:\n\n1️⃣ الباقة البرونزية: 2500 نقطة بـ 80 ج.م.\n2️⃣ الباقة الفضية: 5000 نقطة بـ 150 ج.م.\n3️⃣ الباقة الذهبية: 7500 نقطة بـ 200 ج.م.\n\nاشحن الآن وافتح أبواب التفوق!`,
      responseText: `باقات النقاط:\n1️⃣ البرونزية: 2500 نقطة / 80 ج.م.\n2️⃣ الفضية: 5000 نقطة / 150 ج.م.\n3️⃣ الذهبية: 7500 نقطة / 200 ج.م.`,
    },
    {
      id: 'teacher_info',
      text: 'من هو الأستاذ محمد يوسف؟',
      response: 'منصة تعليمية متطورة. خبرة أكثر من 11 عاماً في بناء العقول وتحقيق الدرجات النهائية.',
      responseText: 'الأستاذ محمد يوسف — خبير الدراسات الاجتماعية والتاريخ، خبرة +11 سنة.',
    },
    {
      id: 'dev_info',
      text: 'من هو مؤسس المنصة؟',
      response: 'تم تطوير المنصة بواسطة المهندس 𝑨𝒎𝒓 𝒍𝒐𝒕𝒇𝒚 𝒐𝒔𝒎𝒂𝒏، خبير تطوير الويب (Full Stack) وتطبيقات الموبايل، بخبرة تزيد عن عامين في بناء الحلول البرمجية المتكاملة.',
      responseText: 'مؤسس المنصة: المهندس Amr Lotfy Osman — Full Stack Developer.',
    },
    {
      id: 'contact_teacher',
      text: 'التواصل مع المدرس',
      responseText: teacherLinksText,
    },
    {
      id: 'contact_dev',
      text: 'التواصل مع المطور',
      responseText: developerLinksText,
    },
  ];

  /* ─────────────────────── handlers ─────────────────────── */
  const handleShare = async (text: string, id: string) => {
    const shareText = `من Mentora:\n\n${text}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mentora', text: shareText }); return; } catch { }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { }
  };

  const handleQuickReply = (reply: QuickReply) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: reply.text,
      timestamp: new Date(),
    };

    setAnswered(true);

    let content: React.ReactNode;
    let rawText = reply.responseText || '';

    if (reply.id === 'contact_teacher') {
      content = renderTeacherLinks();
      rawText = teacherLinksText;
    } else if (reply.id === 'contact_dev') {
      content = renderDeveloperLinks();
      rawText = developerLinksText;
    } else {
      content = reply.response as string;
    }

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      type: 'bot',
      content,
      rawText,
      timestamp: new Date(),
      isLast: true,
    };

    setMessages(prev => {
      // mark previous as not-last
      const updated = prev.map(m => ({ ...m, isLast: false }));
      return [...updated, userMsg, botMsg];
    });
  };

  const handleBack = () => {
    setAnswered(false);
    setMessages(prev => prev.map(m => ({ ...m, isLast: false })));
  };

  /* ─────────────────────── link renderers ─────────────────────── */
  const renderTeacherLinks = () => (
    <div className="flex flex-col gap-2">
      <p className="text-xs mb-1 text-gray-400">يمكنك التواصل مع الأستاذ محمد يوسف عبر:</p>
      <a href="https://www.facebook.com/mido.mems?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 bg-blue-600/20 border border-blue-600/30 rounded-xl hover:bg-blue-600/40 transition-all text-blue-400 text-xs">
        <Facebook size={15} /><span className="font-bold">فيسبوك</span>
      </a>
      <a href="tel:01270800409"
        className="flex items-center gap-2 p-2 bg-green-600/20 border border-green-600/30 rounded-xl hover:bg-green-600/40 transition-all text-green-400 text-xs">
        <Phone size={15} /><span className="font-bold">01270800409</span>
      </a>
    </div>
  );

  const renderDeveloperLinks = () => (
    <div className="flex flex-col gap-2">
      <p className="text-xs mb-1 text-gray-400">يمكنك التواصل مع المطور عبر:</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { href: 'https://wa.me/201067941806', icon: <MessageSquare size={14} />, label: 'واتساب', cls: 'text-green-500 bg-green-500/10 border-green-500/20' },
          { href: 'https://www.facebook.com/share/1CDtFCSPVD/', icon: <Facebook size={14} />, label: 'فيسبوك', cls: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
          { href: 'https://www.instagram.com/eltopamr55?igsh=MWJ2MzJqaXBlZzRlaQ==', icon: <Instagram size={14} />, label: 'انستجرام', cls: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
          { href: 'https://t.me/elto47', icon: <Telegram size={14} />, label: 'تليجرام', cls: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
        ].map(({ href, icon, label, cls }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 p-2 border rounded-xl transition-all text-[11px] font-bold ${cls}`}>
            {icon}<span>{label}</span>
          </a>
        ))}
      </div>
      <a href="mailto:amrloutfy2006@gmail.com" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-red-400 text-[10px]">
        <Mail size={13} /><span className="font-bold">البريد الإلكتروني</span>
      </a>
    </div>
  );
  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className="fixed bottom-[90px] left-5 z-[99999]" dir="rtl">
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="relative w-full max-w-[420px] h-[75vh] max-h-[600px] bg-[#000000] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            style={{ transition: 'none' }}
          >
            {/* ── Header ── */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: `linear-gradient(135deg, ${PRIMARY}18, transparent)`, borderBottom: `1px solid ${PRIMARY}15` }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: `${PRIMARY}50` }}>
                  <img src={LOGO_URL} className="w-full h-full object-cover" alt="Logo" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-white/90 leading-tight">المساعد الذكي — Mentora</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[8px] text-green-400/80 font-bold tracking-widest uppercase">متصل الآن</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors" title="إغلاق">
                <X size={14} />
              </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 no-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.type === 'bot' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[87%] px-3.5 py-2.5 rounded-2xl text-[12.5px] font-semibold leading-relaxed ${msg.type === 'bot'
                      ? 'bg-white/5 border border-white/10 text-gray-200'
                      : 'text-black'
                      }`}
                    style={msg.type === 'user'
                      ? { backgroundColor: PRIMARY, boxShadow: `0 4px 15px ${PRIMARY}40` }
                      : { borderRight: `3px solid ${PRIMARY}` }
                    }
                  >
                    {typeof msg.content === 'string'
                      ? msg.content.split('\n').map((line, i, arr) => (
                        <React.Fragment key={i}>
                          {line}{i < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))
                      : msg.content
                    }
                  </div>

                  {/* Timestamp + Share (bot only) */}
                  {msg.type === 'bot' && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[9px] text-gray-600">
                        {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.rawText && (
                        <button
                          onClick={() => handleShare(msg.rawText!, msg.id)}
                          className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all active:scale-90"
                          style={{
                            color: PRIMARY,
                            borderColor: `${PRIMARY}40`,
                            backgroundColor: `${PRIMARY}10`,
                          }}
                          title="مشاركة"
                        >
                          {copiedId === msg.id
                            ? <><Check size={9} /><span>تم النسخ</span></>
                            : <><Share2 size={9} /><span>مشاركة</span></>
                          }
                        </button>
                      )}
                      {/* Back button on last bot message */}
                      {msg.isLast && answered && (
                        <button
                          onClick={handleBack}
                          className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all active:scale-90"
                          title="رجوع"
                        >
                          <ArrowRight size={9} />
                          <span>رجوع</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Replies ── */}
            {!answered && (
              <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/5 overflow-hidden">
                <div className="flex flex-col gap-2">
                  {mainReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-[11px] font-black text-black transition-all active:scale-[0.97] relative overflow-hidden group"
                      style={{
                        background: `linear-gradient(135deg, ${PRIMARY}FF, ${PRIMARY}BB)`,
                        boxShadow: `0 3px 12px ${PRIMARY}35`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <span className="relative z-10">{reply.text}</span>
                      <Sparkles size={12} className="text-black/50 relative z-10" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <div className="relative w-12 h-12">
        {/* glow ring */}
        <div
          className="absolute inset-0 rounded-full scale-110 pointer-events-none"
          style={{ backgroundColor: `${PRIMARY}20` }}
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden transition-none shadow-2xl active:scale-90 border-2"
          style={{
            borderColor: `${PRIMARY}60`,
            boxShadow: isOpen ? `0 0 25px ${PRIMARY}70` : `0 8px 30px ${PRIMARY}50, 0 4px 15px rgba(0,0,0,0.5)`,
            backgroundColor: isOpen ? PRIMARY : '#0f172a',
          }}
          title={isOpen ? 'إغلاق' : 'المساعد الذكي'}
        >
          {isOpen
            ? <X size={20} style={{ color: '#000' }} />
            : <img src={LOGO_URL} className="w-full h-full object-cover" alt="Logo" />
          }
        </button>
      </div>
    </div>
  );
};

export default StudentChatBot;



