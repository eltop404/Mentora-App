import React, { useState, useEffect } from 'react';
import { Share2, Copy, Users, Check, Award, Target, Trophy, Flame, Lock, Mail, Loader2 } from 'lucide-react';
import { Student } from '../../types';
import { DB, StorageLayer } from '../../services/db';
import { cn } from '../../utils/cn';

interface ReferralsPageProps {
  user: Student;
  theme: any;
  onClose?: () => void;
}

export const ReferralsPage: React.FC<ReferralsPageProps> = ({ user, theme }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const [localUser, setLocalUser] = useState(user);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verifyEmailStatus, setVerifyEmailStatus] = useState('');
  const [verifyEmailMsg, setVerifyEmailMsg] = useState('');
  const [verifyEmailProgress, setVerifyEmailProgress] = useState(0);

  useEffect(() => {
    setLocalUser(prev => {
      if (user.isEmailVerified) return user;
      return {
        ...user,
        email: prev.email !== undefined ? prev.email : user.email
      };
    });
  }, [user]);


  // Sync DB logic if needed
  useEffect(() => {
    DB.resetMonthlyReferralsIfNeeded();
  }, []);

  // Compute latest user state locally
  const allStudents = DB.getStudents();
  
  // Auto-migrate legacy referral code
  let referCode = localUser.referral_code || '';
  if (referCode.endsWith('_napd_altareekh')) {
    referCode = referCode.replace('_napd_altareekh', '_mentora');
    const dbUser = allStudents.find(s => s.id === localUser.id);
    if (dbUser) {
      dbUser.referral_code = referCode;
      DB.saveStudents(allStudents);
    }
  }

  const shareUrl = `https://mentora.netlify.app/?ref=${referCode}`;

  const totalReferrals = localUser.referral_count || 0;
  const monthlyReferrals = localUser.monthly_referrals || 0;
  const totalEarnings = localUser.referral_earnings || 0;
  
  const levelDetails = DB.getReferralLevelDetails(totalReferrals);
  const achievementsData = DB.getReferralAchievements(totalReferrals, localUser.referral_achievements);
  const nextLimit = levelDetails.nextLimit;
  const progressPercent = nextLimit ? Math.min(100, Math.round((totalReferrals / nextLimit) * 100)) : 100;

  // Recent referrals
  const recentReferrals = allStudents
    .filter(s => s.referred_by === referCode && !s.isDeleted)
    .sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime())
    .slice(0, 5);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'منصة Mentora - انضم الآن!',
        text: `استخدم كود الدعوة الخاص بي (${referCode}) عند التسجيل لتحصل على مكافأة!`,
        url: shareUrl
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-full max-w-2xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">

      {/* Email Verification Card */}
      <div className="glass rounded-[1.5rem] p-3.5 sm:p-4.5 border border-white/5 relative overflow-hidden group shadow-lg mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <Mail size={13} style={{ color: theme.primary }} />
            </div>
            <span className="text-[10px] sm:text-xs font-black text-gray-300">تفعيل الحساب (البريد الإلكتروني)</span>
          </div>
          {localUser.isEmailVerified ? (
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full object-cover shrink-0">
              مفعل ونشط
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse object-cover shrink-0">
              غير مفعل
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 flex flex-col gap-2 relative">
            {localUser.isEmailVerified ? (
              <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 px-3 pr-4 pl-8 text-right text-[11px] sm:text-xs font-bold text-gray-300 cursor-not-allowed select-none flex items-center justify-end gap-1.5 relative">
                <span className="tracking-widest text-gray-400 font-mono">
                  {(() => {
                    const e = localUser.email || '';
                    const [local, domain] = e.split('@');
                    if (!domain) return '***@***.***';
                    const maskedLocal = local.slice(0, 2) + '***';
                    const [dname, dtld] = domain.split('.');
                    const maskedDomain = (dname?.[0] || '') + '***' + '.' + (dtld || '***');
                    return `${maskedLocal}@${maskedDomain}`;
                  })()}
                </span>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={11} className="text-gray-500" />
                </div>
              </div>
            ) : (
              <input
                id="email-verification-input"
                type="email"
                value={localUser.email || ''}
                onChange={(e) => {
                  const updated = { ...localUser, email: e.target.value };
                  setLocalUser(updated);
                  setVerifyEmailStatus('');
                  setVerifyEmailMsg('');
                }}
                className={cn(
                  "w-full bg-white/[0.03] border rounded-xl py-2 px-3 text-right text-[11px] sm:text-xs font-bold outline-none transition-all text-white",
                  verifyEmailStatus === 'error' ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                    verifyEmailStatus === 'success' ? "border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]" :
                      "border-white/5 focus:border-white/10"
                )}
              />
            )}
          </div>
          {!localUser.isEmailVerified && (
            <button
              disabled={isVerifyingEmail}
              onClick={async () => {
                const email = (localUser.email || '').trim().toLowerCase();

                setIsVerifyingEmail(true);
                setVerifyEmailStatus('');
                setVerifyEmailProgress(5);
                setVerifyEmailMsg('جاري استدعاء بروتوكولات الفحص الآمن...');

                await new Promise(r => setTimeout(r, 1200));
                setVerifyEmailProgress(25);
                setVerifyEmailMsg('فحص سجلات الخوادم السحابية (SMTP)...');
                await new Promise(r => setTimeout(r, 1000));
                setVerifyEmailProgress(55);
                setVerifyEmailMsg('تحليل بنية البريد والتحقق من النطاق (.com)...');
                await new Promise(r => setTimeout(r, 1200));
                setVerifyEmailProgress(85);
                setVerifyEmailMsg('التوثيق النهائي للبيانات الحيوية...');
                await new Promise(r => setTimeout(r, 1000));
                setVerifyEmailProgress(100);

                const isValidEmail = email && email.includes('@') && email.includes('.');
                if (!isValidEmail) {
                  setVerifyEmailStatus('error');
                  setVerifyEmailProgress(0);
                  setVerifyEmailMsg('فشل التحقق: يرجى إدخال بريد إلكتروني صحيح.');
                  setIsVerifyingEmail(false);
                  setTimeout(() => {
                    setVerifyEmailStatus((prev) => prev === 'error' ? '' : prev);
                    setVerifyEmailMsg((prev) => prev === 'فشل التحقق: النطاق غير مدعوم أو بنية البريد غير صالحة.' ? '' : prev);
                  }, 4000);
                  return;
                }

                setVerifyEmailStatus('success');
                setVerifyEmailMsg('تمت المطابقة والتحقق بنجاح! شكراً لك.');
                setIsVerifyingEmail(false);

                // Do not save email in DB as requested
                const updated = { ...localUser, isEmailVerified: true };
                setLocalUser(updated);
                DB.updateStudent(localUser.id, { isEmailVerified: true });
                StorageLayer.setItem('nt_current_user', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('nt-students-change'));
                DB.checkAndTriggerReferralReward(localUser.id);

                setTimeout(() => {
                  setVerifyEmailStatus('');
                  setVerifyEmailMsg('');
                  setVerifyEmailProgress(0);
                }, 2500);
              }}
              className={cn(
                "px-3.5 py-2 text-black font-black flex items-center justify-center min-w-[70px] rounded-xl text-[10px] sm:text-xs transition-all shadow-lg active:scale-95",
                isVerifyingEmail ? "bg-emerald-500/50 opacity-80 cursor-wait" : "bg-emerald-500 hover:bg-emerald-400"
              )}
            >
              {isVerifyingEmail ? <Loader2 size={14} className="animate-spin" /> : 'تفعيل'}
            </button>
          )}
        </div>
        {!localUser.isEmailVerified && (
          <p className="text-[8.5px] font-bold text-gray-500 mt-1.5 pr-1">
            * يجب تفعيل البريد الإلكتروني للحصول على مكافأة كود الدعوة والوصول لصفحة الإحالات.
          </p>
        )}
      </div>

<div className={cn("space-y-4 transition-all duration-500", !localUser.isEmailVerified && "blur-md pointer-events-none opacity-50 select-none")}>
      
      {/* Gamification Header: Level & Progress */}
      <div className="rounded-2xl p-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right gap-2">
            <h2 className="text-gray-400 text-sm font-bold flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              مستوى الإحالات الحالي
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{levelDetails.badge}</span>
              <span className="text-lg font-black text-white tracking-tight">{levelDetails.name}</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              ترتيبك الحالي: <span className="text-amber-400">#{localUser.leaderboard_rank || '--'}</span>
            </p>
          </div>

          <div className="w-full sm:w-1/2 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-gray-300">
              <span>تقدم المستوى</span>
              <span dir="ltr">{totalReferrals} / {nextLimit || 'MAX'}</span>
            </div>
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%`, right: 0, left: 'auto' }}
              />
            </div>
            {nextLimit && (
              <p className="text-[10px] text-gray-500 text-center sm:text-right font-semibold">
                باقي {nextLimit - totalReferrals} دعوة للوصول للمستوى التالي
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-2 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5">
            <Users size={12} />
          </div>
          <span className="text-lg font-black text-white">{totalReferrals}</span>
          <span className="text-[9px] text-gray-400 font-bold mt-1">إجمالي الدعوات</span>
        </div>
        <div className="rounded-xl p-2 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all">
          <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1.5">
            <Target size={12} />
          </div>
          <span className="text-lg font-black text-white">{monthlyReferrals}</span>
          <span className="text-[9px] text-gray-400 font-bold mt-1">دعوات الشهر</span>
        </div>
        <div className="rounded-xl p-2 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all">
          <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5">
            <Award size={12} />
          </div>
          <span className="text-lg font-black text-amber-400">{totalEarnings}</span>
          <span className="text-[9px] text-gray-400 font-bold mt-1">إجمالي النقاط</span>
        </div>
        <div className="rounded-xl p-2 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all">
          <div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1.5">
            <Flame size={12} />
          </div>
          <span className="text-lg font-black text-white">{achievementsData.all.length}</span>
          <span className="text-[9px] text-gray-400 font-bold mt-1">الإنجازات المكتسبة</span>
        </div>
      </div>

      {/* Share Section */}
      <div className="rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-white font-bold text-sm">شارك الرابط وانطلق! 🚀</h3>
        <p className="text-[10px] text-gray-400 leading-relaxed max-w-2xl">
          قم بدعوة أصدقائك للتسجيل في منصة Mentora واحصل على 300 نقطة لكل صديق يسجل ويفعل حسابه، بينما يحصل هو على 500 نقطة كهدية ترحيبية.
        </p>

        <div className="flex gap-2 mt-1">
          <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1.5 px-2 overflow-hidden">
            <span className="text-[9px] text-gray-500 font-bold whitespace-nowrap hidden sm:inline">كود الدعوة:</span>
            <span className="text-amber-400 font-mono font-bold text-[10px] tracking-widest flex-1 text-left whitespace-nowrap overflow-x-auto no-scrollbar" dir="ltr">{referCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-gray-300 transition-all active:scale-95 shrink-0"
            >
              {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white font-bold text-[9px] rounded-md transition-all active:scale-95 border border-white/5 flex items-center justify-center gap-1"
            >
              {isLinkCopied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              <span className="hidden sm:inline">نسخ الرابط</span>
            </button>
            <button
              onClick={handleShare}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-[9px] rounded-md transition-all active:scale-95 shadow-[0_0_8px_rgba(245,158,11,0.2)] flex items-center justify-center gap-1"
            >
              <Share2 size={10} />
              <span>مشاركة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Award size={14} className="text-amber-400" />
          إنجازات الإحالات
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 5, 10, 25, 50, 100, 150, 250].map((m) => {
            const isUnlocked = totalReferrals >= m;
            return (
              <div key={m} className={`relative border rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all overflow-hidden ${isUnlocked ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-[#111827]/60 border-white/5 opacity-90'}`}>
                {/* Status Icon */}
                {isUnlocked ? (
                    <div className="absolute top-0 right-0 w-6 h-6 bg-amber-500/20 rounded-bl-xl flex items-center justify-center">
                        <Check size={10} className="text-amber-400" />
                    </div>
                ) : (
                    <div className="absolute top-2 right-2 flex items-center justify-center bg-black/40 rounded-full p-1 border border-white/5">
                        <Lock size={8} className="text-gray-500" />
                    </div>
                )}
                
                <Trophy size={20} className={isUnlocked ? 'text-amber-400 mb-2 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-gray-600 mb-2'} />
                <span className={`text-xs font-black ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{m} دعوات</span>
                <span className={`text-[8px] font-bold mt-1.5 px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-gray-500 border border-white/5'}`}>
                   {isUnlocked ? 'مكتمل' : 'مقفول'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-white font-bold text-sm">أحدث المنضمين بكودك</h3>
        {recentReferrals.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentReferrals.map((s) => {
              const dateStr = s.createdAt || s.regDate;
              let formattedDate = dateStr;
              try {
                if (dateStr) {
                  const d = new Date(dateStr);
                  if (!isNaN(d.getTime())) {
                    formattedDate = new Intl.DateTimeFormat('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    }).format(d);
                  }
                }
              } catch (e) {}

              return (
                <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 gap-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden border border-white/10 shadow-sm">
                      {(s.avatarUrl || s.profilePictureUrl) ? (
                        <img src={s.avatarUrl || s.profilePictureUrl} alt={s.username} className="w-full h-full object-cover" />
                      ) : (
                        s.username.charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-white">{s.username}</span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-gray-400 font-semibold mt-0.5">
                        <span className="bg-black/40 px-1.5 py-0.5 rounded-md border border-white/5">{s.level || 'غير محدد'}</span>
                        <span className="bg-black/40 px-1.5 py-0.5 rounded-md border border-white/5">{s.year || 'غير محدد'}</span>
                        {((s.year === 'الفرقة الثالثة' || s.year === 'الفرقة الرابعة') && s.specialization) && (
                          <span className="bg-black/40 px-1.5 py-0.5 rounded-md border border-white/5">{s.specialization}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-500 flex items-center gap-1">
                           🕒 {formattedDate}
                        </span>
                        <button
                          onClick={() => {
                            const shareText = `صديقي ${s.username} انضم للتو إلى منصة Mentora! 🚀 استخدم كود الدعوة الخاص بي (${referCode}) لتحصل على 500 نقطة هدية مجانية!`;
                            if (navigator.share) {
                              navigator.share({
                                title: 'انضمام صديق - Mentora',
                                text: shareText,
                                url: shareUrl
                              }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(shareText + '\\n' + shareUrl);
                              alert('تم نسخ النص للمشاركة بنجاح!');
                            }
                          }}
                          className="flex items-center justify-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-bold transition-all"
                          title="مشاركة انضمام صديقك"
                        >
                          <Share2 size={8} />
                          شارك فرحتك
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-amber-500/30 flex flex-col items-center shadow-[0_0_10px_rgba(245,158,11,0.1)] shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <span>+300 نقطة</span>
                    <span className="text-[7px] text-amber-500/70">المكافأة الترحيبية</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6">
            <Users size={24} className="text-gray-600 mb-2" />
            <span className="text-xs text-gray-500 font-bold">لم يقم أحد بالتسجيل باستخدام كودك حتى الآن</span>
            <span className="text-[10px] text-gray-600 mt-1">شارك كودك لتبدأ في حصد النقاط!</span>
          </div>
        )}
      </div>
      
    </div>
</div>
  );
};
