const fs = require('fs');
const { execSync } = require('child_process');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// More precise binary search around 9699-9710
for (let testLine = 9700; testLine <= 9710; testLine++) {
  const partial = lines.slice(0, testLine).join('\n') + '\nexport {};';
  fs.writeFileSync('src/__test.tsx', partial, 'utf8');
  try {
    const out = execSync('npx esbuild src/__test.tsx --bundle=false 2>&1', { stdio: 'pipe' }).toString();
    console.log(`Lines 1-${testLine}: OK`);
  } catch(e) {
    const out = (e.stdout || Buffer.from('')).toString() + (e.stderr || Buffer.from('')).toString();
    if (out.includes('Unterminated') || out.includes('error')) {
      const errLine = out.match(/(\d+)\|/);
      console.log(`Lines 1-${testLine}: FAIL at esbuild line ${errLine ? errLine[1] : '?'}`);
    } else {
      console.log(`Lines 1-${testLine}: OK (other)`);
    }
  }
}

try { fs.unlinkSync('src/__test.tsx'); } catch(e) {}
