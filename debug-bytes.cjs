const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Print bytes around lines 9699-9706 to check for hidden chars
for (let i = 9698; i <= 9706; i++) {
  const line = lines[i] || '';
  const bytes = Buffer.from(line, 'utf8');
  // Print any non-ASCII chars
  const nonAscii = [];
  for (let j = 0; j < bytes.length; j++) {
    if (bytes[j] > 127) nonAscii.push(`pos${j}=0x${bytes[j].toString(16)}`);
  }
  console.log(`${i+1}: len=${bytes.length}, nonASCII=[${nonAscii.join(',')}] | ${JSON.stringify(line.substring(0, 60))}`);
}
