const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Management.tsx') && f !== 'StudentManagement.tsx');

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace initial state
    content = content.replace(/stage:\s*['"]اعمال دوليه IB['"]/g, "stage: DB.getAdminSession()?.role === 'SUB_ADMIN' ? DB.getAdminSession()?.division || 'اعمال دوليه IB' : 'اعمال دوليه IB'");
    content = content.replace(/year:\s*['"]الفرقة الأولى['"]/g, "year: DB.getAdminSession()?.role === 'SUB_ADMIN' ? DB.getAdminSession()?.year || 'الفرقة الأولى' : 'الفرقة الأولى'");
    content = content.replace(/semester:\s*['"]-['"]/g, "semester: DB.getAdminSession()?.role === 'SUB_ADMIN' ? DB.getAdminSession()?.specialization || '-' : '-'");

    fs.writeFileSync(fullPath, content, 'utf8');
});
