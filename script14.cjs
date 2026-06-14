const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldIframe = `<iframe
                              src="https://tanta-services.online/TantaPortal/"
                              className="w-full h-[75vh] border-none animate-in fade-in duration-1000"
                              title="Tanta Portal"
                          />`;

const newFallback = `<div className="flex flex-col items-center justify-center gap-6 p-8 animate-in fade-in duration-1000 text-center">
                              <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center mb-4">
                                  <Globe size={48} className="text-blue-400" />
                              </div>
                              <h3 className="text-2xl font-black text-white">بوابة المعهد العالي</h3>
                              <p className="text-gray-400 max-w-md font-bold text-sm leading-relaxed">
                                  لحماية بياناتك وضمان استقرار النظام، تتطلب منصة المعهد فتحها في نافذة آمنة ومنفصلة.
                              </p>
                              <a
                                  href="https://tanta-services.online/TantaPortal/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setActiveModal(null)}
                                  className="mt-4 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
                              >
                                  الدخول إلى المنصة الآن
                                  <Globe size={24} />
                              </a>
                          </div>`;

code = code.replace(oldIframe, newFallback);
fs.writeFileSync('src/App.tsx', code);
console.log('Updated Tanta Portal modal with secure external link fallback');
