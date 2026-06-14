const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search for Mentora/2026/حقوق ---');
lines.forEach((line, i) => {
  if (/mentora/i.test(line) || /2026/.test(line) || /حقوق/.test(line) || /محفوظة/.test(line)) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
