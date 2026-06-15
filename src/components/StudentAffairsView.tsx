import React, { useState, useEffect } from 'react';
import { PhoneCall, ShieldCheck, Loader2, Info } from 'lucide-react';

interface StudentAffairsViewProps {
  theme: any;
}

const StudentAffairsView: React.FC<StudentAffairsViewProps> = ({ theme }) => {
  const [callingNumber, setCallingNumber] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const contacts = [
    { id: 1, title: 'اتصال (1)', phone: '01149993043' },
    { id: 2, title: 'اتصال (2)', phone: '01146022266' }
  ];

  useEffect(() => {
    let timer: any;
    if (callingNumber) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        window.location.href = `tel:${callingNumber}`;
        setTimeout(() => {
          setCallingNumber(null);
          setCountdown(3);
        }, 500);
      }
    }
    return () => clearTimeout(timer);
  }, [callingNumber, countdown]);

  return (
    <div className="space-y-6 w-full animate-fadeIn" dir="rtl">
      <div className="flex flex-col items-center gap-4 mt-8">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => {
              setCallingNumber(contact.phone);
              setCountdown(3);
            }}
            className="w-full max-w-[260px] relative overflow-hidden group rounded-2xl p-3 flex items-center justify-center gap-4 border shadow-md transition-all active:scale-95 bg-white/5 hover:bg-white/10 backdrop-blur-md"
            style={{ borderColor: `${theme.primary}30` }}
          >
            <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            
            <div className="p-2 rounded-xl bg-black/30 border border-white/5" style={{ color: theme.primary }}>
              <PhoneCall size={20} className="group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide pl-2">{contact.title}</h3>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3">
        <Info size={20} className="text-gray-500 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed font-medium">
          يرجى التواصل خلال مواعيد العمل الرسمية لضمان سرعة الرد على استفساراتكم وحل أي مشكلات تواجهكم في المعهد.
        </p>
      </div>

      {/* Calling Modal */}
      {callingNumber && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm p-8 flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${theme.primary}, transparent 70%)` }} />
            
            <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/50 border-2" style={{ borderColor: theme.primary }}>
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: theme.primary }} />
              <PhoneCall size={40} className="animate-pulse" style={{ color: theme.primary }} />
            </div>

            <h3 className="text-xl font-black text-white text-center mb-6 z-10">جاري التحويل للاتصال...</h3>

            <div className="flex items-center justify-center gap-3 z-10 bg-black/40 px-6 py-3 rounded-full border border-white/5">
              <Loader2 size={18} className="animate-spin" style={{ color: theme.primary }} />
              <span className="text-xl font-black text-white">{countdown}</span>
              <span className="text-sm text-gray-400 font-bold">ثواني</span>
            </div>

            <button 
              onClick={() => {
                setCallingNumber(null);
                setCountdown(3);
              }}
              className="mt-8 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-6 py-2 rounded-full border border-red-500/20 transition-all z-10"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAffairsView;
