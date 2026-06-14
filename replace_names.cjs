const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const logoUrl = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        if (content.includes('نبض التاريخ') || content.includes('Pulse of History') || content.includes('منصة نبض التاريخ')) {
            content = content.replace(/منصة نبض التاريخ/g, 'Mentora');
            content = content.replace(/نبض التاريخ/g, 'Mentora');
            content = content.replace(/Pulse of History/gi, 'Mentora');
            updated = true;
        }

        // Search for old logo images
        // The old logo might have been an external URL or a local file like '/logo.png'
        const regexes = [
            /https:\/\/i\.postimg\.cc\/wMzX8B0N\/image\.png/g,
            /https:\/\/i\.postimg\.cc\/y6v8G52V\/image\.png/g,
            /https:\/\/i\.postimg\.cc\/nrgD3K7f\/image\.png/g,
            /https:\/\/i\.postimg\.cc\/[a-zA-Z0-9]+\/image\.png/g,
            /https:\/\/i\.postimg\.cc\/DyrJ7wS8\/Screenshot-2024-09-08-011853-removebg-preview\.png/g,
            /https:\/\/i\.postimg\.cc\/DyrJ7wS8\/.*\.png/g,
            /https:\/\/i\.postimg\.cc\/.*\/logo.*\.png/gi,
            // Any old image URL we used for the logo
        ];

        // Let's just find anything resembling the old logo manually or just replace all postimg ones?
        // Wait, not all postimg are logos. Let's do a replace for the known logo URLs.
        
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated texts in:', filePath);
        }
    }
});
