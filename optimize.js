const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const animRegex = /\b(animate-in|fade-in|zoom-in(?:-\d+)?|slide-in-from-[a-z0-9-]+|duration-\d+|delay-\d+|fill-mode-both)\b\s*/g;
content = content.replace(animRegex, '');
content = content.replace(/drop-shadow-md/g, '');
content = content.replace(/willChange:\s*'scroll-position',/g, "willChange: 'scroll-position', transform: 'translateZ(0)',");
content = content.replace(/blur-\[120px\]/g, 'blur-2xl opacity-5');
content = content.replace(/blur-\[60px\]/g, 'blur-xl opacity-10');
content = content.replace(/\btransition-all duration-(?:500|700|1000)\b/g, 'transition-none');
content = content.replace(/\banimate-pulse\b/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx optimized.');
