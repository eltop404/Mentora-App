const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// Find all strings containing mojibake patterns (control chars + Arabic fragments)
// Pattern: contains \u001e or \ufffd mixed with Arabic chars
const lines = content.split('\n');
const broken = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Check for mojibake: has \u001e (record separator) or \ufffd (replacement char) mixed with content
  if ((line.includes('\u001e') || line.includes('\ufffd')) && 
      (line.includes("'") || line.includes('"') || line.includes('`'))) {
    // Skip pure code lines (no string content visible)
    const hasString = /['"`][^'"`\n]*[\u001e\ufffd][^'"`\n]*['"`]/.test(line);
    if (hasString) {
      broken.push({ line: i+1, content: line.trim().substring(0, 100) });
    }
  }
}

console.log(`Total lines with broken strings: ${broken.length}`);
broken.slice(0, 30).forEach(b => console.log(`  L${b.line}: ${b.content}`));
