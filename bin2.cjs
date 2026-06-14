const fs = require('fs');
const { execSync } = require('child_process');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Binary search between 9625 and 9668
let lo = 9625, hi = 9668;
while (lo < hi - 1) {
  const mid = Math.floor((lo + hi) / 2);
  const partial = lines.slice(0, mid).join('\n') + '\nexport {};';
  fs.writeFileSync('src/__test.tsx', partial, 'utf8');
  let ok = true;
  try {
    execSync('npx esbuild src/__test.tsx --bundle=false 2>&1', { stdio: 'pipe' });
  } catch(e) {
    ok = false;
  }
  console.log(`Lines 1-${mid}: ${ok ? 'OK' : 'FAIL'}`);
  if (ok) lo = mid; else hi = mid;
}
console.log(`Error starts around line ${hi}`);
// Show the suspicious line
console.log(`Line ${hi}: ${JSON.stringify(lines[hi-1])}`);
console.log(`Line ${hi-1}: ${JSON.stringify(lines[hi-2])}`);
try { fs.unlinkSync('src/__test.tsx'); } catch(e) {}
