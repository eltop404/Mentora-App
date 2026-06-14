const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const navRegex = /\{ id: 'certificates', icon: <Award size=\{20\} \/>, label: 'شهادتي', notify: hasNewCert \},/g;

let idx = content.search(navRegex);
if(idx !== -1) {
    console.log(content.substring(idx, idx + 1000));
} else {
    console.log("Nav not found");
}
