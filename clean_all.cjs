const fs = require('fs');

function cleanThumbnail(file) {
    let content = fs.readFileSync(file, 'utf8');

    const lines = content.split('\\n');
    let newLines = [];
    let insideThumbnail = false;
    let divDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!insideThumbnail && line.includes('صورة الغلاف (Thumbnail)')) {
            if (newLines.length > 0 && newLines[newLines.length - 1].includes('space-y-1')) {
                newLines.pop();
            }
            insideThumbnail = true;
            divDepth = 1;
            continue;
        }

        if (insideThumbnail) {
            const opens = (line.match(/<div[^>]*>/g) || []).filter(d => !d.endsWith('/>')).length;
            const closes = (line.match(/<\/div>/g) || []).length;
            
            divDepth += opens;
            divDepth -= closes;

            if (divDepth <= 0) {
                insideThumbnail = false;
            }
            continue;
        }

        newLines.push(line);
    }

    content = newLines.join('\\n');

    let openDivs = (content.match(/<div[^>]*>/g) || []).filter(d => !d.endsWith('/>')).length;
    let closeDivs = (content.match(/<\/div>/g) || []).length;
    console.log(file, 'Initial Open:', openDivs, 'Close:', closeDivs);

    while (openDivs > closeDivs) {
        content = content.replace(/(<\/div>\s*\);\s*};\s*$)/, '</div>\\n$1');
        closeDivs++;
        console.log('Added </div>');
    }
    while (closeDivs > openDivs) {
        content = content.replace(/<\/div>(\s*<\/div>\s*\);\s*};\s*$)/, '$1');
        closeDivs--;
        console.log('Removed </div>');
    }

    fs.writeFileSync(file, content);
}

['src/components/admin/SectionsManagement.tsx', 'src/components/admin/BookletManagement.tsx', 'src/components/admin/ContentManagement.tsx'].forEach(file => {
    cleanThumbnail(file);
});
