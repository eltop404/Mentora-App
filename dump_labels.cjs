const fs = require('fs');

const filePath = 'E:\\نبض-التاريخ\\src\\App.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Find all label: '...' occurrences in the nav section
// Search around the nav area by looking for the nav tabs array
const navStart = content.indexOf("id: 'booklets'");
const navEnd = content.indexOf(".filter(item =>", navStart);

if (navStart === -1) {
  console.log("Could not find nav start");
  process.exit(1);
}

const navSection = content.substring(navStart, navEnd + 100);
console.log("Nav section found, length:", navSection.length);

// Extract all label values
const labelRegex = /label:\s*'([^']+)'/g;
let match;
const labels = [];
while ((match = labelRegex.exec(navSection)) !== null) {
  const val = match[1];
  let hexStr = '';
  for (let j = 0; j < Math.min(val.length, 30); j++) {
    hexStr += `\\u${val.charCodeAt(j).toString(16).padStart(4,'0')}`;
  }
  labels.push({ original: val, hex: hexStr, index: navStart + match.index });
}

console.log("\n=== ALL LABELS IN NAV ===");
labels.forEach((l, i) => {
  console.log(`[${i}] '${l.original}' => ${l.hex}`);
});
