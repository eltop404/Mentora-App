const fs = require('fs');
let content = fs.readFileSync('e:/نبض-التاريخ/src/App.tsx', 'utf8');

content = content.replace(/border-white\/\[a-z-\]\/gdiv>/g, 'border-white/10\"></div>');
content = content.replace(/border-white\/\[a-z-\]\/g>/g, 'border-white/10\">');
content = content.replace(/border-b\/\[a-z-\]\/g/g, 'border-white/10\">');
content = content.replace(/black\/\[a-z-\]\/g/g, 'black/30\">');
content = content.replace(/emerald-500\/\[a-z-\]\/g/g, 'emerald-500/10\">');
content = content.replace(/\/\[a-z-\]\/g/g, '\">');

fs.writeFileSync('e:/نبض-التاريخ/src/App.tsx', content, 'utf8');
console.log('Fixed generic tags');
