const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// Find all activeModal === 'X' to see which sections are handled in render
const modalRegex = /activeModal === '([^']+)'/g;
let m; const modals = new Set();
while((m = modalRegex.exec(content)) !== null) modals.add(m[1]);

// Also find activeModal switch/case
const caseRegex = /case '([^']+)':/g;
while((m = caseRegex.exec(content)) !== null) modals.add(m[1]);

console.log('All rendered activeModal sections:');
[...modals].sort().forEach(id => console.log('  -', id));
console.log('\nTotal:', modals.size);
