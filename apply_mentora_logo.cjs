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

  c = c.replace(/<img([^>]*)src=["']https:\/\/i\.postimg\.cc\/4NP62dYC\/IMG-20260420-WA0023-2\.jpg["']([^>]*)>/g, (match, before, after) => {
    let newMatch = match;
    let clsMatch = match.match(/className=["']([^"']*)["']/);
    
    if (clsMatch) {
      let cls = clsMatch[1];
      let newCls = cls;
      if (!newCls.includes('mentora-logo')) newCls += ' mentora-logo';
      
      newMatch = newMatch.replace(clsMatch[0], `className="${newCls}"`);
    } else {
      if (after.endsWith('/')) {
         newMatch = `<img${before}src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg"${after.slice(0, -1)} className="mentora-logo" />`;
      } else {
         newMatch = `<img${before}src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg"${after} className="mentora-logo" />`;
      }
    }
    
    if (newMatch !== match) changed = true;
    return newMatch;
  });

  if (changed) {
    fs.writeFileSync(f, c);
    console.log(`Updated ${f}`);
  }
});

console.log('done applying mentora-logo class');
