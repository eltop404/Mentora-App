const fs = require('fs');
const path = require('path');

const targetLogo = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const namesToReplace = [
    'نبض التاريخ',
    'نبض-التاريخ',
    'منصة نبض التاريخ',
    'منصه نبض التاريخ',
    'Pulse of History'
];

walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        // Replace logo
        if (content.includes('/images/napd-altareekh-logo.png')) {
            content = content.replace(/\/images\/napd-altareekh-logo\.png/g, targetLogo);
            updated = true;
        }

        // Replace all variants of the name
        namesToReplace.forEach(name => {
            if (content.includes(name)) {
                // We use split and join to replace all occurrences without regex to avoid any regex escaping issues
                content = content.split(name).join('Mentora');
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated logo and names in:', filePath);
        }
    }
});
