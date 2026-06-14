const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
    /window\.dispatchEvent\(new CustomEvent\('nt-admin-force-edit', \{\s*detail: \{ type, item \}\s*\}\)\);/,
    "window.dispatchEvent(new CustomEvent(type === 'section' ? 'nt-admin-force-edit-section' : 'nt-admin-force-edit', {\n        detail: { type, item }\n      }));"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code, 'utf8');
console.log('Fixed event dispatch.');
