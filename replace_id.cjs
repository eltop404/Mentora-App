const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div\s+onClick=\{\(\) => \{\s*navigator\.clipboard\.writeText\(user\.id\);\s*setIsIDCopied\(true\);\s*setTimeout\(\(\) => setIsIDCopied\(false\),\s*2000\);\s*\}\}\s*className="mt-1 flex items-center justify-center gap-2 cursor-pointer group active:scale-95 transition-all"\s*>\s*<div className=\{cn\(\s*"flex items-center gap-2 px-3 py-1\.5 rounded-xl border transition-all",\s*isIDCopied \? "bg-emerald-500\/10 border-emerald-500\/30 shadow-\[0_0_15px_rgba\(16,185,129,0\.1\)\]" : "bg-white\/\[0\.03\] border-white\/10 hover:border-white\/20"\s*\)\}>\s*<span\s*className="text-\[9px\] font-mono font-black tracking-tight transition-colors"\s*style=\{\{ color: isIDCopied \? '#10b981' : theme\.primary \}\}\s*>\s*ID: \{user\.id\}\s*<\/span>\s*\{isIDCopied \? \(\s*<CheckCircle2 size=\{12\} className="text-emerald-400" \/>\s*\) : \(\s*<Copy size=\{12\} className="text-white\/40 group-hover:text-white transition-colors" \/>\s*\)\}\s*<\/div>\s*<\/div>/g;

const replacement = `
                                {user.universityEmail && (
                                  <div
                                    onClick={() => {
                                      navigator.clipboard.writeText(user.universityEmail);
                                      setIsIDCopied(true);
                                      setTimeout(() => setIsIDCopied(false), 2000);
                                    }}
                                    className="mt-2 flex items-center justify-center gap-2 cursor-pointer group active:scale-95 transition-all w-full max-w-[280px]"
                                  >
                                    <div className={cn(
                                      "flex items-center justify-between w-full gap-3 px-3 py-2 rounded-xl border transition-all",
                                      isIDCopied ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-white/[0.03] border-white/10 hover:border-white/20"
                                    )}>
                                      <div className="flex flex-col items-start overflow-hidden w-full">
                                        <span className="text-[10px] text-gray-400 font-bold mb-0.5">البريد الجامعي:</span>
                                        <span
                                          className="text-[11px] sm:text-xs font-mono font-bold tracking-tight transition-colors truncate w-full text-left"
                                          style={{ color: isIDCopied ? '#10b981' : '#fff', direction: 'ltr' }}
                                        >
                                          {user.universityEmail}
                                        </span>
                                      </div>
                                      <div className="shrink-0 p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                        {isIDCopied ? (
                                          <CheckCircle2 size={14} className="text-emerald-400" />
                                        ) : (
                                          <Copy size={14} className="text-white/60 group-hover:text-white transition-colors" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/App.tsx', content);
console.log('Successfully replaced ID with university email.');
