const fs = require('fs');
const c = fs.readFileSync('e:/نبض-التاريخ/src/components/AdminDashboard.tsx', 'utf8');

// Find all strings containing Arabic characters or common corruption characters (like & and ` mixed with Arabic)
const matches = c.match(/['"`][\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9a-zA-Z\s&!`\[\]]+['"`]/g) || [];

// Filter to only those containing some Arabic or looking suspicious
const suspicious = matches.filter(m => /[\u0600-\u06FF&]/.test(m) && m.length > 5);

// Get unique
const unique = [...new Set(suspicious)].sort();
fs.writeFileSync('e:/نبض-التاريخ/scratch.txt', unique.join('\n'), 'utf8');
console.log('Saved to scratch.txt. Count: ', unique.length);
