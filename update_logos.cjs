const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/AdminDashboard.tsx',
  'src/components/ParentDashboard.tsx',
  'src/components/StudentDashboard.tsx',
  'src/components/StudentReports.tsx',
  'src/components/TeacherDashboard.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;

  // We find every <img ... src="...IMG-20260420-WA0023-2.jpg" ... className="..." />
  // and we make sure the className has rounded-full object-cover shrink-0
  c = c.replace(/<img([^>]*)src=["']https:\/\/i\.postimg\.cc\/4NP62dYC\/IMG-20260420-WA0023-2\.jpg["']([^>]*)>/g, (match, before, after) => {
    let newMatch = match;
    let clsMatch = match.match(/className=["']([^"']*)["']/);
    
    if (clsMatch) {
      let cls = clsMatch[1];
      let newCls = cls;
      if (!newCls.includes('rounded-full')) newCls += ' rounded-full';
      if (!newCls.includes('object-cover')) newCls += ' object-cover';
      if (!newCls.includes('shrink-0')) newCls += ' shrink-0';
      
      newMatch = newMatch.replace(clsMatch[0], `className="${newCls}"`);
    } else {
      // If it doesn't have className, add it
      newMatch = `<img${before}src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg"${after} className="w-full h-full rounded-full object-cover shrink-0">`;
    }
    
    if (newMatch !== match) changed = true;
    return newMatch;
  });

  if (changed) {
    fs.writeFileSync(f, c);
    console.log(`Updated ${f}`);
  }
});

console.log('done updating logos');
