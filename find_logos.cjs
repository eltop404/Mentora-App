const fs = require('fs');

const appContent = fs.readFileSync('src/App.tsx', 'utf8');
const indexContent = fs.readFileSync('index.html', 'utf8');

const regex = /https:\/\/[\w./-]+(?:png|jpg|jpeg|gif|svg)/g;

console.log("App.tsx URLs:", [...new Set(appContent.match(regex))]);
console.log("index.html URLs:", [...new Set(indexContent.match(regex))]);
