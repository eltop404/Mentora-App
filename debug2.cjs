const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Show lines around 9700-9710 with char codes
for (let i = 9698; i <= 9710; i++) {
  const line = lines[i];
  const codes = Array.from(line).map(c => c.charCodeAt(0));
  console.log(`${i+1}: ${JSON.stringify(line)} codes: ${codes.slice(0,5).join(',')}`);
}
