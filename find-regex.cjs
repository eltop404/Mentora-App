const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Search for any line between 9300-9705 that has an odd number of backticks (template literal issue)
for (let i = 9300; i <= 9710; i++) {
  const line = lines[i] || '';
  const backticks = (line.match(/`/g) || []).length;
  if (backticks % 2 !== 0) {
    console.log(`Line ${i+1} has ODD backticks (${backticks}): ${line.trim()}`);
  }
  // Also check for slash patterns that look like regex starts
  if (line.includes('/ ') && !line.includes('//') && !line.includes('*/')) {
    // could be regex issue
  }
}

console.log('\nDone scanning for odd backtick lines');

// Also scan for lines that esbuild commonly trips on - template literals with / inside
for (let i = 9600; i <= 9710; i++) {
  const line = lines[i] || '';
  if (line.includes('`') || (line.includes('/') && !line.includes('//') && !line.includes('className'))) {
    console.log(`${i+1}: ${line.trim().substring(0, 100)}`);
  }
}
