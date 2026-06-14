const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace blur-3xl and blur-2xl with much lighter effects if they're used heavily
content = content.replace(/blur-3xl/g, 'blur-lg opacity-10');
content = content.replace(/blur-2xl/g, 'blur-md opacity-20');

// Remove static-bg and isBgAnimated toggles if they cause issues, but the user said keep the design.
// Just lowering the blur amount drastically improves GPU framerates on mobile.

fs.writeFileSync('src/App.tsx', content);
console.log('Background blurs optimized in App.tsx');
