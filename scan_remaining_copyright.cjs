const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

console.log('--- Scanning for any remaining garbled copyright/footer indicators ---');
lines.forEach((line, i) => {
  if (line.includes('Mentora') && /[\x80-\x9f\x00-\x08\x0b\x0c\x0e-\x1f]/.test(line)) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
console.log('--- Done Scanning ---');
