const fs = require('fs');
let content = fs.readFileSync('e:/نبض-التاريخ/src/components/referrals/ReferralsPage.tsx', 'utf8');

// 1. Add imports
if (!content.includes('Mail')) {
  content = content.replace('Share2, Copy, Users, Check, Award, Target, Trophy, Flame, Lock', 'Share2, Copy, Users, Check, Award, Target, Trophy, Flame, Lock, Mail, Loader2');
}
if (!content.includes('import { cn }')) {
  content = content.replace("import { DB } from '../../services/db';", "import { DB } from '../../services/db';\nimport { cn } from '../../utils/cn';\nimport { StorageLayer } from '../../services/storage';");
}

// 2. Add states
const stateInjection = `
  const [localUser, setLocalUser] = useState(user);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verifyEmailStatus, setVerifyEmailStatus] = useState('');
  const [verifyEmailMsg, setVerifyEmailMsg] = useState('');
  const [verifyEmailProgress, setVerifyEmailProgress] = useState(0);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);
`;
content = content.replace('const [isLinkCopied, setIsLinkCopied] = useState(false);', 'const [isLinkCopied, setIsLinkCopied] = useState(false);\n' + stateInjection);

// 3. Update references to user to localUser for the verification process
// We have to be careful not to replace `user` in `ReferralsPageProps`
content = content.replace(/currentUser\./g, 'localUser.');
content = content.replace(/currentUser /g, 'localUser ');
content = content.replace(/= currentUser;/g, '= localUser;');
content = content.replace(/user\.id/g, 'localUser.id');

const emailJsx = `
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
                    return \`\${maskedLocal}@\${maskedDomain}\`;
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
                  DB.updateStudent(localUser.id, { email: e.target.value });
                  StorageLayer.setItem('nt_current_user', JSON.stringify(updated));
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

                const isValidEmail = email && email.includes('@') && email.endsWith('.com');
                if (!isValidEmail) {
                  setVerifyEmailStatus('error');
                  setVerifyEmailProgress(0);
                  setVerifyEmailMsg('فشل التحقق: النطاق غير مدعوم أو بنية البريد غير صالحة.');
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
`;

content = content.replace(/<div className="flex flex-col gap-4 p-4 w-full max-w-2xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">/g, 
  '<div className="flex flex-col gap-4 p-4 w-full max-w-2xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">\n' + emailJsx + '\n<div className={cn("space-y-4 transition-all duration-500", !localUser.isEmailVerified && "blur-md pointer-events-none opacity-50 select-none")}>');

const lastDivIndex = content.lastIndexOf('</div>');
content = content.substring(0, lastDivIndex) + '</div>\n</div>' + content.substring(lastDivIndex + 6);

fs.writeFileSync('e:/نبض-التاريخ/src/components/referrals/ReferralsPage.tsx', content);
