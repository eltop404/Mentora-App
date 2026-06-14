const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add loading="lazy" to <img tags if not already there
content = content.replace(/<img(?!\s+[^>]*loading=)([^>]*)>/g, '<img loading="lazy"$1>');

fs.writeFileSync('src/App.tsx', content);
console.log('Images optimized in App.tsx');
