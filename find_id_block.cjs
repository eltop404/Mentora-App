const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                                  </div>
                                )}
                                <div
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.id);
                                    setIsIDCopied(true);
                                    setTimeout(() => setIsIDCopied(false), 2000);
                                  }}
                                  className="mt-1 flex items-center justify-center gap-2 cursor-pointer group active:scale-95 transition-all"
                                >
                                  <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all",
                                    isIDCopied ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-white/[0.03] border-white/10 hover:border-white/20"
                                  )}>`;

// Wait, I don't see the full block. Let's find the full block.
