const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<Trophy, Globe size=\{20\} \/>/g, '<Trophy size={20} />');

if(!code.includes(`id: 'tanta_portal'`)) {
    code = code.replace(/\{ id: 'achievements', icon: <Trophy size=\{20\} \/>, label: 'انجازاتي' \},/, 
        `{ id: 'achievements', icon: <Trophy size={20} />, label: 'انجازاتي' },
                    { id: 'tanta_portal', icon: <Globe size={20} />, label: 'منصة المنصة' },`);
}

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed syntax error');
