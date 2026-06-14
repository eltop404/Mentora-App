const fs = require('fs');
const c = fs.readFileSync('src/App.tsx', 'utf8');
const lines = c.split('\n');

// Find all activeModal sections
const found = [];
lines.forEach((l, i) => {
  if (l.includes('activeModal') && l.includes("=== '")) {
    const m = l.match(/activeModal === '([^']+)'/);
    if (m) found.push(i + 1 + ' -> ' + m[1]);
  }
});
console.log('All modal sections:\n' + found.join('\n'));

// Now scan each modal region for any "garbage" Arabic
// Garbage = Arabic chars mixed with chars outside normal ranges
const suspectLines = [];
lines.forEach((l, i) => {
  // Has Arabic text
  if (/[\u0600-\u06ff]/.test(l)) {
    // Has non-standard chars in same line (not standard ASCII, not Arabic, not common symbols)
    const stripped = l.replace(/[\u0600-\u06ff\u0020-\u007e\u00a0-\u00ff\u2000-\u206f\u{1f300}-\u{1f9ff}\t ]/gu, '');
    if (stripped.length > 0 && !/^[<>{}/=().,\[\]'";:\-_!?@#$%^&*+|~`\\]+$/.test(stripped)) {
      suspectLines.push({ n: i + 1, bad: stripped.substring(0, 20), text: l.trim().substring(0, 80) });
    }
  }
});
console.log('\nSuspect Arabic lines:', suspectLines.length);
suspectLines.slice(0, 30).forEach(s => console.log(s.n + ' [' + Buffer.from(s.bad).toString('hex').substring(0,20) + ']: ' + s.text));
