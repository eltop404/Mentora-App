const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src/components/admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Management.tsx') || f === 'PdfToExamGeneratorLocal.tsx' || f === 'StudentReports.tsx');

for (const file of files) {
    const filePath = path.join(dir, file);
    let code = fs.readFileSync(filePath, 'utf8');

    code = code.replace(/stage: 'إعدادي'/g, "stage: 'اعمال دوليه IB'");
    code = code.replace(/year: 'أولى إعدادي'/g, "year: 'الفرقة الأولى'");
    code = code.replace(/semester: 'الفصل الدراسي الأول'/g, "semester: '-'");
    code = code.replace(/unit: 'الوحدة الأولى'/g, "unit: 'المادة الأولى'");
    
    // Also the top level units init
    code = code.replace(/const \[units, setUnits\] = useState<string\[\]>\(\(\) => DB.getSubjects\(\).map\(s => s.name\)\);/g, 
    "const [units, setUnits] = useState<string[]>(() => ['المادة الأولى']);");

    const useEffectRegex = /useEffect\(\(\) => \{\s*const u = DB\.getSubjects\(\)\.map\(s => s\.name\);\s*setUnits\(u\);\s*\}, \[filter\.stage, filter\.year, filter\.semester\]\);/g;
    
    const properUseEffect = `useEffect(() => {
        const allSubs = DB.getSubjects();
        const filteredSubs = allSubs.filter(s => 
            s.division === filter.stage && 
            s.year === filter.year && 
            (s.specialization === filter.semester || filter.semester === '-' || !s.specialization || filter.year === 'الفرقة الأولى' || filter.year === 'الفرقة الثانية')
        );
        const u = filteredSubs.map(s => s.name);
        setUnits(u.length ? u : ['المادة الأولى']);
        
        if (filter.unit !== 'الكل' && u.length && !u.includes(filter.unit)) {
             setFilter(prev => ({...prev, unit: u[0]}));
        }
    }, [filter.stage, filter.year, filter.semester]);`;

    code = code.replace(useEffectRegex, properUseEffect);

    fs.writeFileSync(filePath, code);
}
console.log('Done script 2');
