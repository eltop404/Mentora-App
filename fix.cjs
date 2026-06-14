const fs = require('fs');
const files = [
  'e:/نبض-التاريخ/src/App.tsx',
  'e:/نبض-التاريخ/src/components/AdminDashboard.tsx',
  'e:/نبض-التاريخ/src/components/admin/StudentReports.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    
    // Fix </[a-z-]/gspan> -> </span>
    c = c.replace(/<\/[a-z-]+\/g([a-zA-Z0-9_]+)>/g, '</$1>');
    
    // Fix /[a-z-]/gspan> -> 10"></span>
    c = c.replace(/\/[a-z-]+\/g([a-zA-Z0-9_]+)>/g, '10"></$1>');
    
    // Fix /[a-z-]/g>} -> 10">}
    c = c.replace(/\/[a-z-]+\/g>}/g, '10">}');
    
    // Fix <Users size={24} /[a-z-]/g> -> <Users size={24} />
    c = c.replace(/<([a-zA-Z0-9_]+)([^>]*?)\/[a-z-]+\/g>/g, '<$1$2/>');
    
    // Fix /[a-z-]/g/> -> 10" />
    c = c.replace(/\/[a-z-]+\/g\/>/g, '10" />');
    
    // Fix /[a-z-]/g> -> 10">
    c = c.replace(/\/[a-z-]+\/g>/g, '10">');
    
    // Fix //[a-z-]/g/ -> //
    c = c.replace(/\/\/\[a-z-\]\/g\//g, '// ');
    
    // Fix /[a-z-]/g -> 10 (fallback for any remaining)
    c = c.replace(/\[a-z-\]\/g/g, '10');
    
    fs.writeFileSync(f, c);
    console.log('Fixed', f);
  }
});
