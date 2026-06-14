const fs = require('fs');
let content = fs.readFileSync('e:/نبض-التاريخ/src/App.tsx', 'utf8');
const lines = content.split('\n');

let start = -1;
for (let i = 0; i < 100; i++) {
    if (lines[i].includes('const getDeviceInfo = () => {')) start = i;
}
if (start !== -1) {
    let end = start;
    for (let i = start; i < 100; i++) {
        if (lines[i].includes('const logSecurityEvent =')) {
            end = i;
            break;
        }
    }
    const newBlock = [
        '  const getDeviceInfo = () => {',
        '    const ua = navigator.userAgent;',
        '    let type = "Unknown";',
        '    let brand = "Unknown";',
        '    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {',
        '      type = "Mobile";',
        '    } else if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {',
        '      type = "Tablet";',
        '    } else {',
        '      type = "Desktop";',
        '    }',
        '    if (/iPad|iPhone|iPod/.test(ua)) brand = "Apple";',
        '    else if (/Android/.test(ua)) brand = "Android";',
        '    else if (/Windows/.test(ua)) brand = "Windows";',
        '    else if (/Mac/.test(ua)) brand = "Apple";',
        '    return { type, brand };',
        '  };',
        '',
        '  // Security logging helper'
    ];
    lines.splice(start, end - start, ...newBlock);
    fs.writeFileSync('e:/نبض-التاريخ/src/App.tsx', lines.join('\n'), 'utf8');
    console.log('Fixed getDeviceInfo');
}
