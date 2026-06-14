const fs = require('fs');
const path = require('path');

const filePath = 'E:\\نبض-التاريخ\\src\\App.tsx';

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\r\n');

const lineIdx = 2987; // 0-indexed = line 2988
const line = lines[lineIdx];

console.log('Line 2988 (first 150 chars):');
console.log(JSON.stringify(line.substring(0, 150)));

// The issue: message: استخراج: ${nidResult.dob}`
// Should be: message: `استخراج: ${nidResult.dob}`
// Unicode: استخراج = \u0627\u0633\u062A\u062E\u0631\u0627\u062C

const brokenPattern = 'message: \u0627\u0633\u062A\u062E\u0631\u0627\u062C: ${nidResult.dob}`';
const fixedPattern  = 'message: `\u0627\u0633\u062A\u062E\u0631\u0627\u062C: ${nidResult.dob}`';

if (line.includes(brokenPattern)) {
  console.log('FOUND! Fixing...');
  lines[lineIdx] = line.replace(brokenPattern, fixedPattern);
  const newContent = lines.join('\r\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('DONE - file saved.');
} else {
  console.log('Pattern not found. Dumping chars around "message:"...');
  const idx = line.indexOf('message:');
  if (idx >= 0) {
    const chunk = line.substring(idx, idx + 80);
    console.log('Chars:');
    for (let i = 0; i < chunk.length; i++) {
      console.log(`  [${i}] U+${chunk.charCodeAt(i).toString(16).padStart(4,'0')} = ${JSON.stringify(chunk[i])}`);
    }
  } else {
    console.log('No "message:" found on line 2988');
    console.log('Full line:', JSON.stringify(line));
  }
}
