const fs = require('fs');
const { execSync } = require('child_process');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

for (let testLine = 9668; testLine <= 9700; testLine++) {
  const partial = lines.slice(0, testLine).join('\n') + '\nexport {};';
  fs.writeFileSync('src/__test.tsx', partial, 'utf8');
  try {
    execSync('npx esbuild src/__test.tsx --bundle=false 2>&1', { stdio: 'pipe' });
    console.log(`Lines 1-${testLine}: OK`);
  } catch(e) {
    const out = (e.stdout || Buffer.from('')).toString();
    const errLine = out.match(/:(\d+):\d+/);
    console.log(`Lines 1-${testLine}: FAIL (esbuild err at ${errLine ? errLine[1] : '?'})`);
  }
}

try { fs.unlinkSync('src/__test.tsx'); } catch(e) {}
