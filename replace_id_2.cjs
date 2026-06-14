const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = content.indexOf('navigator.clipboard.writeText(user.id)');
if (startIdx !== -1) {
    // Look backwards for the start of the div
    const divStart = content.lastIndexOf('<div', startIdx);
    
    // Look forwards for the end of the div
    // It's a bit nested, so let's just find the closing tag manually or use a trick.
    // The snippet usually looks like this:
    /*
                                <div
                                  onClick={() => {
                                    navigator.clipboard.writeText(user.id);
                                    setIsIDCopied(true);
                                    setTimeout(() => setIsIDCopied(false), 2000);
                                  }}
                                  className="..."
                                >
                                  ...
                                </div>
    */
    // Let's just find `user.id}` and then the next `</div>\n                                </div>`
    const endIdx = content.indexOf('</div>', startIdx);
    // Find the second </div>
    const finalEndIdx = content.indexOf('</div>', endIdx + 5) + 6;

    const replacement = `
                                {user.universityEmail && (
                                  <div
                                    onClick={() => {
                                      navigator.clipboard.writeText(user.universityEmail);
                                      setIsIDCopied(true);
                                      setTimeout(() => setIsIDCopied(false), 2000);
                                    }}
                                    className="mt-2 flex items-center justify-center gap-2 cursor-pointer group active:scale-95 transition-all w-full max-w-[320px]"
                                  >
                                    <div className={cn(
                                      "flex items-center justify-between w-full gap-3 px-3 py-2 rounded-xl border transition-all",
                                      isIDCopied ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-white/[0.03] border-white/10 hover:border-white/20"
                                    )}>
                                      <div className="flex flex-col items-start overflow-hidden w-full" style={{ direction: 'rtl' }}>
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

    // Replace from divStart to finalEndIdx
    content = content.substring(0, divStart) + replacement.trim() + content.substring(finalEndIdx);
    fs.writeFileSync('src/App.tsx', content);
    console.log('Successfully replaced ID block.');
} else {
    console.log('ID block not found.');
}
