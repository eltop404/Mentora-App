const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const match = content.match(/<UnitsSection[\s\S]*?\/>/);
if (match) {
    console.log(match[0]);
} else {
    console.log("Not found");
}
