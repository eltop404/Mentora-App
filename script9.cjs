const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Globe to imports
code = code.replace(/import \{([\s\S]*?)Trophy/g, 'import {$1Trophy, Globe');

// 2. Add portalCountdown state
if(!code.includes('portalCountdown')) {
    code = code.replace(/const \[activeModal, setActiveModal\] = useState<string \| null>\(null\);/, 
        `const [activeModal, setActiveModal] = useState<string | null>(null);
  const [portalCountdown, setPortalCountdown] = useState<number>(3);

  useEffect(() => {
    if (activeModal === 'tanta_portal' && portalCountdown > 0) {
        const timer = setInterval(() => {
            setPortalCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    } else if (activeModal !== 'tanta_portal') {
        setPortalCountdown(3);
    }
  }, [activeModal, portalCountdown]);`);
}

// 3. Add to bottom nav
if(!code.includes(`id: 'tanta_portal'`)) {
    code = code.replace(/\{ id: 'achievements', icon: <Trophy size=\{20\} \/>, label: 'انجازاتي' \},/, 
        `{ id: 'achievements', icon: <Trophy size={20} />, label: 'انجازاتي' },
                    { id: 'tanta_portal', icon: <Globe size={20} />, label: 'منصة المنصة' },`);
}

// 4. Add modal title
code = code.replace(/activeModal === 'achievements' \? 'إنجازاتي التعليمية' :/, 
    `activeModal === 'tanta_portal' ? 'منصة المنصة' :
                    activeModal === 'achievements' ? 'إنجازاتي التعليمية' :`);

// 5. Add rendering block
const renderBlock = `{activeModal === 'tanta_portal' && (
                  <div className="w-full h-full min-h-[70vh] relative flex flex-col items-center justify-center bg-black/20 rounded-2xl overflow-hidden p-0 m-0">
                      {portalCountdown > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-500">
                              <div className="w-32 h-32 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.2)]">
                                  <span className="text-6xl font-black text-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">{portalCountdown}</span>
                              </div>
                              <div className="text-white font-black text-xl tracking-wide animate-pulse">جاري تجهيز المنصة...</div>
                          </div>
                      ) : (
                          <iframe
                              src="https://tanta-services.online/TantaPortal/"
                              className="w-full h-[75vh] border-none animate-in fade-in duration-1000"
                              title="Tanta Portal"
                          />
                      )}
                  </div>
                )}

                {activeModal === 'developer' && (`;

code = code.replace(/\{activeModal === 'developer' && \(/, renderBlock);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated with Tanta Portal');
