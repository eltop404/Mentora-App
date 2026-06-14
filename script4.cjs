const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace standard unit loops with subjects
code = code.replace(/const \[units, setUnits\] = useState<string\[\]>\(DB\.getUnits\(currentUser\?.stage \|\| 'إعدادي', currentUser\?.year \|\| 'أولى إعدادي', currentUser\?.semester \|\| 'الفصل الدراسي الأول'\)\);/g,
    "const [units, setUnits] = useState<string[]>(DB.getSubjects().filter(s => s.division === currentUser?.level && s.year === currentUser?.year && (s.specialization === currentUser?.specialization || !s.specialization || currentUser?.year === 'الفرقة الأولى' || currentUser?.year === 'الفرقة الثانية')).map(s => s.name));"
);

code = code.replace(/const unitsList = DB\.getUnits\(currentUser\.stage \|\| 'إعدادي', currentUser\.year \|\| 'أولى إعدادي', currentUser\.semester \|\| 'الفصل الدراسي الأول'\);/g,
    "const unitsList = DB.getSubjects().filter(s => s.division === currentUser.level && s.year === currentUser.year && (s.specialization === currentUser.specialization || !s.specialization || currentUser.year === 'الفرقة الأولى' || currentUser.year === 'الفرقة الثانية')).map(s => s.name);"
);

code = code.replace(/setUnits\(unitsList\);/g, "setUnits(unitsList.length ? unitsList : ['المادة الأولى']);");

// Ensure all DB.getUnits calls in App.tsx use DB.getSubjects instead if there's any other
code = code.replace(/DB\.getUnits\([^)]+\)/g, "DB.getSubjects().filter(s => s.division === currentUser?.level && s.year === currentUser?.year && (s.specialization === currentUser?.specialization || !s.specialization || currentUser?.year === 'الفرقة الأولى' || currentUser?.year === 'الفرقة الثانية')).map(s => s.name)");

// Replace 'الوحدة' with 'المادة' everywhere in the UI strings inside App.tsx
code = code.replace(/الوحدة/g, 'المادة');
code = code.replace(/الوحدات/g, 'المواد');
code = code.replace(/وحدات/g, 'مواد');

fs.writeFileSync(file, code);
console.log('App.tsx Updated');
