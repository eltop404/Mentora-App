const fs = require('fs');

const currentLines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const backupLines = fs.readFileSync('src/App.tsx.mentora-backup', 'utf8').split('\n');

function normalize(str) {
    return str.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
}

let fixedCount = 0;

for (let i = 0; i < currentLines.length; i++) {
    if (currentLines[i].includes('\uFFFD') || currentLines[i].includes('Ø')) {
        let n = normalize(currentLines[i]);
        if (n.length < 5) continue; // Too small to be unique
        
        // Find best match in backup
        let bestMatch = null;
        for (let j = Math.max(0, i - 10000); j < Math.min(backupLines.length, i + 10000); j++) {
            if (normalize(backupLines[j]) === n && backupLines[j].match(/[\u0600-\u06FF]/)) {
                bestMatch = backupLines[j];
                break;
            }
        }
        
        if (bestMatch) {
            currentLines[i] = bestMatch;
            fixedCount++;
        }
    }
}

fs.writeFileSync('src/App.tsx', currentLines.join('\n'), 'utf8');
console.log('Fixed ' + fixedCount + ' lines.');
