const fs = require('fs');

const targetLogo = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the logo in App.tsx
appContent = appContent.replace(/https:\/\/i\.postimg\.cc\/76BFFtJY\/1572113\.jpg/g, targetLogo);

fs.writeFileSync('src/App.tsx', appContent);
console.log('Replaced logo in App.tsx');
