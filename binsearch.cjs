const fs = require('fs');
const { execSync } = require('child_process');

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
const total = lines.length;

console.log(`Total lines: ${total}`);

// Binary search for the broken line
// Try building half the file at a time
function tryBuild(lineCount) {
  const partial = lines.slice(0, lineCount).join('\n') + '\nexport default App;';
  fs.writeFileSync('src/__test_partial.tsx', partial, 'utf8');
  try {
    execSync('npx esbuild src/__test_partial.tsx --bundle=false 2>&1', { stdio: 'pipe' });
    return true;
  } catch(e) {
    const out = e.stdout ? e.stdout.toString() : e.message;
    if (out.includes('Unterminated')) {
      return false;
    }
    return true; // other errors are ok
  }
}

// Binary search
let lo = 1, hi = Math.min(total, 11000);
while (lo < hi - 1) {
  const mid = Math.floor((lo + hi) / 2);
  const ok = tryBuild(mid);
  console.log(`Testing lines 1-${mid}: ${ok ? 'OK' : 'FAIL'}`);
  if (ok) lo = mid;
  else hi = mid;
}
console.log(`Error is near line ${hi}`);

// Cleanup
try { fs.unlinkSync('src/__test_partial.tsx'); } catch(e) {}
