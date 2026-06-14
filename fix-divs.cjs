const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').replace(/\r\n/g, '\n').split('\n');

// Print lines 9700-9710 before
console.log('Before:');
for (let i = 9698; i <= 9710; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}

// The payment modal overlay needs exactly 3 closing divs:
// 1. </div> closes scrollable content
// 2. </div> closes modal card
// 3. </div> closes overlay
// But we have 5 closing tags at 9701-9705
// Correct balance shows we need to remove the 3 EXTRA ones at 9703, 9704, 9705

// Remove lines at index 9702, 9703, 9704 (0-indexed) = lines 9703, 9704, 9705 (1-indexed)
lines.splice(9702, 3);

console.log('\nAfter:');
for (let i = 9698; i <= 9708; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}

const result = lines.join('\r\n');
fs.writeFileSync('src/App.tsx', result, 'utf8');
console.log('\nSaved!');
