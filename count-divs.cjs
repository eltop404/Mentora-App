const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Count open/close divs from line 9406 (the payment overlay)
let opens = 0, closes = 0;
for (let i = 9405; i <= 9710; i++) {
  const line = lines[i] || '';
  // Count <div ...> opens (not self-closing)
  const openMatches = line.match(/<div\b[^>]*>/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];
  opens += openMatches.length;
  closes += closeMatches.length;
  
  if (openMatches.length > 0 || closeMatches.length > 0) {
    const balance = opens - closes;
    if (balance <= 3) { // Getting close to closing
      console.log(`${i+1} [balance=${balance}]: opens+${openMatches.length} closes-${closeMatches.length} | ${line.trim().substring(0,60)}`);
    }
  }
}
console.log(`\nFinal: opens=${opens}, closes=${closes}, balance=${opens-closes}`);
