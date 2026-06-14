const fs = require('fs');
const c = fs.readFileSync('e:/نبض-التاريخ/src/App.tsx', 'utf8');
const lines = c.split('\n');
const susLines = [];
const arabicRangeRegex = /[\u0600-\u06FF]/;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (!arabicRangeRegex.test(l)) continue;
  // Look for patterns: Arabic char followed by & or ` or backtick or ! mixed in
  if (l.includes('\x26') && arabicRangeRegex.test(l)) {
    susLines.push({ line: i+1, text: l.substring(0, 120) });
  }
}
console.log('Lines with & mixed in Arabic:', susLines.length);
susLines.slice(0, 40).forEach(x => console.log(x.line + ': ' + x.text));
