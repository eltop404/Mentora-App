const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Count backticks line by line tracking state
let inTemplateLiteral = false;
let depth = 0;

for (let i = 9600; i <= 9720; i++) {
  const line = lines[i] || '';
  let lineInfo = '';
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '`') {
      inTemplateLiteral = !inTemplateLiteral;
      lineInfo += `[BACKTICK@${j},now=${inTemplateLiteral?'IN':'OUT'}]`;
    }
  }
  if (lineInfo || inTemplateLiteral) {
    console.log(`${i+1} [inTemplate=${inTemplateLiteral}]: ${line.trim().substring(0,80)} ${lineInfo}`);
  }
}

console.log(`\nFinal state: inTemplateLiteral=${inTemplateLiteral}`);
