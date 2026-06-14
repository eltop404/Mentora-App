const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const lucideMatch = code.match(/import \{([\s\S]*?)\} from 'lucide-react';/);
if (lucideMatch) {
    let importList = lucideMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    importList = [...new Set(importList)]; // Remove duplicates
    
    code = code.replace(lucideMatch[0], `import { ${importList.join(', ')} } from 'lucide-react';`);
    fs.writeFileSync('src/App.tsx', code);
    console.log('Fixed duplicate imports');
} else {
    console.log('lucide-react import not found');
}
