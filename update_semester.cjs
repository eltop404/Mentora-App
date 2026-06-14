const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Management.tsx'));

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/(<select[^>]*?)(\s+value=\{[^}]*\.semester\})/g, "$1 disabled={DB.getAdminSession()?.role === 'SUB_ADMIN'}$2");
    fs.writeFileSync(fullPath, content, 'utf8');
});
