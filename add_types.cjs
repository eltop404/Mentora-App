const fs = require('fs');

let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('universityEmail?: string;')) {
    content = content.replace(/email\?: string;/, 'email?: string;\n    universityEmail?: string;\n    universityId?: string;\n    englishName?: string;\n    department?: string;');
    fs.writeFileSync('src/types.ts', content);
    console.log('Added fields to types.ts');
} else {
    console.log('Fields already exist in types.ts');
}
