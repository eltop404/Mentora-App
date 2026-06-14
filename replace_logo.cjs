const fs = require('fs');

const targetLogo = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

// Let's replace the index.html logo
let indexContent = fs.readFileSync('index.html', 'utf8');
indexContent = indexContent.replace(/https:\/\/i\.postimg\.cc\/L8hjZLrg\/file-00000000c8ec7246b0ffc1ff669ce0f8\.png/g, targetLogo);
indexContent = indexContent.replace(/https:\/\/i\.postimg\.cc\/[a-zA-Z0-9_-]+\/[^"']+/g, targetLogo); // Replace any postimg in index.html just in case

// We must be careful not to replace avatars or other non-logo postimg links in App.tsx.
// Let's check what postimg links are in App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const postimgMatches = appContent.match(/https:\/\/i\.postimg\.cc\/[a-zA-Z0-9_-]+\/[^"']+/g) || [];
console.log("App.tsx postimg links:", [...new Set(postimgMatches)]);

// The only one is 'https://i.postimg.cc/76BFFtJY/1572113.jpg'.
// Let's check what it's used for. Is it the background image?
const bgIndex = appContent.indexOf('1572113.jpg');
if (bgIndex !== -1) {
    console.log("Surrounding code for 1572113.jpg:", appContent.substring(Math.max(0, bgIndex - 50), bgIndex + 50));
}

fs.writeFileSync('index.html', indexContent);
