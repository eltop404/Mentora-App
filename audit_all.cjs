/**
 * Full audit of remaining corrupted Arabic strings in both files
 */
const fs = require('fs');

function auditFile(path, name) {
  const c = fs.readFileSync(path, 'utf8');
  const lines = c.split('\n');
  const issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Only check lines that have Arabic chars
    if (!/[\u0600-\u06FF]/.test(l)) continue;
    
    // Look for corruption indicators in Arabic context:
    // 1. Backtick (`) surrounded by Arabic
    // 2. \x1a (SUB) char
    // 3. \x1c, \x1d, \x1e, \x1f control chars
    // 4. Single exclamation ! surrounded by Arabic
    // 5. \x13, \x14, \x19 control chars near Arabic
    if (/[\u0600-\u06FF][`!][\u0600-\u06FF]/.test(l) ||
        /[\u0600-\u06FF]\x1a/.test(l) || /\x1a[\u0600-\u06FF]/.test(l) ||
        /[\u0600-\u06FF][\x1c\x1d\x1e\x1f]/.test(l) || /[\x1c\x1d\x1e\x1f][\u0600-\u06FF]/.test(l) ||
        /[\u0600-\u06FF][\x13\x14\x19]/.test(l) || /[\x13\x14\x19][\u0600-\u06FF]/.test(l)) {
      issues.push({ line: i+1, text: l.trim().substring(0, 120) });
    }
  }
  
  console.log(`\n== ${name}: ${issues.length} remaining issues ==`);
  issues.slice(0, 30).forEach(x => console.log(x.line + ': ' + x.text));
  return issues;
}

auditFile('e:/نبض-التاريخ/src/App.tsx', 'App.tsx');
auditFile('e:/نبض-التاريخ/src/components/AdminDashboard.tsx', 'AdminDashboard.tsx');
