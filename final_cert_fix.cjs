const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// ======== Build Certificate 1 (viewingCertificate) ========
const cert1Lines = [
  `                  <div`,
  `                    id="certificate-to-download"`,
  `                    className="w-full max-w-[95vw] sm:max-w-[800px] relative flex flex-col bg-[#0d1117] shadow-[0_20px_60px_rgba(0,0,0,0.9)] mx-auto overflow-hidden"`,
  `                    style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: 'rtl', minHeight: '600px' }}`,
  `                  >`,
  // Gold border frame
  `                    {/* Gold Border Frame */}`,
  `                    <div className="absolute inset-3 border border-[#d4af37] pointer-events-none z-10" />`,
  `                    <div className="absolute inset-4 border-2 border-double border-[#b8860b40] pointer-events-none z-10" />`,
  // Corner accents
  `                    {/* Corner Accents */}`,
  `                    <div className="absolute top-1 right-1 w-12 h-12 border-t-2 border-r-2 border-[#d4af37] pointer-events-none z-20" />`,
  `                    <div className="absolute top-1 left-1 w-12 h-12 border-t-2 border-l-2 border-[#d4af37] pointer-events-none z-20" />`,
  `                    <div className="absolute bottom-1 right-1 w-12 h-12 border-b-2 border-r-2 border-[#d4af37] pointer-events-none z-20" />`,
  `                    <div className="absolute bottom-1 left-1 w-12 h-12 border-b-2 border-l-2 border-[#d4af37] pointer-events-none z-20" />`,
  // Bg glow
  `                    <div className="absolute inset-0 z-0 bg-gradient-radial from-[#d4af3708] to-[#0d1117]" />`,
  // Top decorative banner
  `                    <div className="relative z-20 bg-gradient-to-b from-[#1a1200] to-transparent py-6 sm:py-8 flex flex-col items-center border-b border-[#d4af3740]">`,
  `                      <h2 className="text-[#d4af37] text-lg sm:text-xl font-black tracking-[0.2em] uppercase mb-3">منصة Mentora التعليمية</h2>`,
  `                      <div className="w-40 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />`,
  `                      <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-black mt-4 mb-1" style={{ textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>شهادة تقدير وتفوق</h1>`,
  `                      <p className="text-[#d4af3790] text-xs sm:text-sm font-bold tracking-widest uppercase mt-2">وثيقة أكاديمية رسمية معتمدة</p>`,
  `                    </div>`,
  // Main content
  `                    <div className="relative z-20 flex flex-col items-center px-8 sm:px-14 py-6">`,
  // Student name
  `                      <p className="text-gray-400 text-sm sm:text-base font-bold mb-3">تشهد إدارة المنصة بأن الطالب/ة المتميز/ة:</p>`,
  `                      <h2 className="text-[#d4af37] text-2xl sm:text-3xl md:text-4xl font-black py-3 whitespace-normal break-words text-center leading-tight border-b border-t border-[#d4af3740] w-full mb-6" style={{ textShadow: '0 0 20px rgba(212,175,55,0.25)' }}>`,
  `                        {certFullName || viewingCertificate?.studentName}`,
  `                      </h2>`,
  // Details grid
  `                      <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 mb-6">`,
  `                        <div className="flex flex-col items-center p-3 bg-white/5 border border-[#d4af3730] rounded-lg">`,
  `                          <span className="text-[#888] text-xs sm:text-sm font-bold mb-1">الفرقة</span>`,
  `                          <span className="text-white text-sm sm:text-base font-black">{user?.level || 'الصف الثالث الثانوي'}</span>`,
  `                        </div>`,
  `                        <div className="flex flex-col items-center p-3 bg-white/5 border border-[#d4af3730] rounded-lg">`,
  `                          <span className="text-[#888] text-xs sm:text-sm font-bold mb-1">الشعبة</span>`,
  `                          <span className="text-white text-sm sm:text-base font-black">{user?.department || 'أدبي'}</span>`,
  `                        </div>`,
  `                        <div className="flex flex-col items-center p-3 bg-white/5 border border-[#d4af3730] rounded-lg">`,
  `                          <span className="text-[#888] text-xs sm:text-sm font-bold mb-1">المادة</span>`,
  `                          <span className="text-white text-sm sm:text-base font-black">التاريخ</span>`,
  `                        </div>`,
  `                        <div className="flex flex-col items-center p-3 bg-white/5 border border-[#d4af3730] rounded-lg text-center">`,
  `                          <span className="text-[#888] text-xs sm:text-sm font-bold mb-1">الامتحان</span>`,
  `                          <span className="text-white text-sm sm:text-base font-black line-clamp-2">{viewingCertificate?.examTitle}</span>`,
  `                        </div>`,
  `                        <div className="flex flex-col items-center p-3 bg-white/5 border border-[#d4af3730] rounded-lg">`,
  `                          <span className="text-[#888] text-xs sm:text-sm font-bold mb-1">النسبة</span>`,
  `                          <span className="text-white text-base sm:text-lg font-black">{viewingCertificate?.percentage}%</span>`,
  `                        </div>`,
  `                        <div className="flex flex-col items-center p-3 bg-white/5 border border-[#d4af3730] rounded-lg">`,
  `                          <span className="text-[#888] text-xs sm:text-sm font-bold mb-1">التقدير</span>`,
  `                          <span className="text-[#d4af37] text-base sm:text-lg font-black">{viewingCertificate?.grade}</span>`,
  `                        </div>`,
  `                      </div>`,
  // Praise text
  `                      <p className="text-gray-400 text-xs sm:text-sm text-center font-bold mb-6 max-w-xs">`,
  `                        متمنين له/لها دوام التفوق والنجاح في مسيرته/ها العلمية.`,
  `                      </p>`,
  `                    </div>`,
  // Footer
  `                    <div className="relative z-20 w-full flex justify-between items-center border-t border-[#d4af3740] bg-gradient-to-t from-[#1a1200] to-transparent py-5 px-6 sm:px-10 mt-auto">`,
  // Left: manager
  `                      <div className="text-center">`,
  `                        <span className="text-[#888] text-xs font-bold block mb-1">مسئول المنصة</span>`,
  `                        <span className="text-white text-base font-black block">م/عمرو لطفي</span>`,
  `                        <div className="w-28 h-px bg-[#d4af37] mt-2 mx-auto" />`,
  `                      </div>`,
  // Center: seal
  `                      <div className="flex flex-col items-center">`,
  `                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-double border-[#d4af37] p-1 flex items-center justify-center bg-[#0d1117] shadow-[0_0_25px_rgba(212,175,55,0.4)] object-cover shrink-0">`,
  `                          <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover rounded-full shrink-0 mentora-logo" alt="Mentora Seal" />`,
  `                          <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-dashed border-[#d4af3760] pointer-events-none" />`,
  `                        </div>`,
  `                        <span className="text-[#d4af37] font-black text-xs mt-1.5 border border-[#d4af3750] rounded-full px-3 py-0.5">معتمد</span>`,
  `                      </div>`,
  // Right: date
  `                      <div className="text-center">`,
  `                        <span className="text-[#888] text-xs font-bold block mb-1">تاريخ الإصدار</span>`,
  `                        <span className="text-white text-sm font-black" dir="ltr">{viewingCertificate?.date}</span>`,
  `                        <div className="w-28 h-px bg-[#d4af37] mt-2 mx-auto" />`,
  `                      </div>`,
  `                    </div>`,
  `                  </div>`,
];

// ======== Build Certificate 2 (downloadingCert) ========
const cert2Lines = cert1Lines
  .map(l => l.replace(/viewingCertificate/g, 'downloadingCert')
              .replace('id="certificate-to-download"', 'id="hidden-cert-capture"'));

// Fix the style for hidden cert
const hiddenStyle = `                    style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', width: '800px', height: '1200px', fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: 'rtl', zIndex: -1000, visibility: 'visible' }}`;
const visibleStyle = `                    style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: 'rtl', minHeight: '600px' }}`;

for (let i = 0; i < cert2Lines.length; i++) {
  if (cert2Lines[i].includes("direction: 'rtl', minHeight:")) {
    cert2Lines[i] = hiddenStyle;
    break;
  }
}

// ======== Replace in App.tsx ========

// Find and replace cert 1 (inside the min-h-full wrapper)
const minHFullIdx = lines.findIndex(l => l.includes('className="min-h-full w-full flex items-center justify-center py-10"'));
let closeBtnIdx = -1;
if (minHFullIdx !== -1) {
  for (let i = minHFullIdx; i < lines.length; i++) {
    if (lines[i].includes('Prominent External Close Button')) {
      closeBtnIdx = i - 1;
      break;
    }
  }
}

if (minHFullIdx !== -1 && closeBtnIdx !== -1) {
  const wrapperOpen = `                      <div className="min-h-full w-full flex items-center justify-center py-10">`;
  const wrapperClose = `                      </div>`;
  const newBlock = [wrapperOpen, ...cert1Lines, wrapperClose];
  lines.splice(minHFullIdx, closeBtnIdx - minHFullIdx + 1, ...newBlock);
  console.log('Cert 1 replaced at line:', minHFullIdx);
} else {
  console.log('Could not find cert 1. minHFullIdx:', minHFullIdx, 'closeBtnIdx:', closeBtnIdx);
}

// Find and replace cert 2 (hidden cert)
const hiddenCertIdx = lines.findIndex(l => l.includes('Hidden Off-Screen Certificate'));
let securityModalIdx = -1;
if (hiddenCertIdx !== -1) {
  for (let i = hiddenCertIdx; i < lines.length; i++) {
    if (lines[i].includes('Security Protection Modal')) {
      securityModalIdx = i - 1;
      break;
    }
  }
}

if (hiddenCertIdx !== -1 && securityModalIdx !== -1) {
  const newHiddenBlock = [
    `                {/* Hidden Off-Screen Certificate for PDF Capture - Never visible to user */}`,
    `                {`,
    `                  downloadingCert && (`,
    ...cert2Lines,
    `                  )`,
    `                }`,
  ];
  lines.splice(hiddenCertIdx, securityModalIdx - hiddenCertIdx + 1, ...newHiddenBlock);
  console.log('Cert 2 replaced at line:', hiddenCertIdx);
} else {
  console.log('Could not find cert 2. hiddenCertIdx:', hiddenCertIdx, 'securityModalIdx:', securityModalIdx);
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done! src/App.tsx updated successfully.');
