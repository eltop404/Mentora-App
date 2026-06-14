const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('SubAdminManagement')) {
    content = content.replace(
        /import \{ SystemControl \} from '\.\/admin\/SystemControl';/,
        `import { SystemControl } from './admin/SystemControl';\nimport { SubAdminManagement } from './admin/SubAdminManagement';`
    );
}

// 2. Add Sidebar Item
// Find { id: 'admin_management', label: 'إدارة المسؤولين', icon: <ShieldCheck size={18} /> },
content = content.replace(
    /\{\s*id:\s*'admin_management'.*?\}/,
    `$&,\n                { id: 'sub_admins', label: 'لوحات التحكم', icon: <Layers size={18} /> }`
);

// 3. Add Component Render
// Find {activeTab === 'admin_management' && ... }
content = content.replace(
    /\{activeTab === 'admin_management' && \([\s\S]*?<\/>\s*\)\s*\}/,
    `$&\n          {activeTab === 'sub_admins' && <SubAdminManagement />}`
);

fs.writeFileSync(file, content, 'utf8');
