const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src/components/admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Management.tsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let code = fs.readFileSync(filePath, 'utf8');

    // 1. Add term to initial filter state
    code = code.replace(/semester: '-',/g, "semester: '-',\n        term: 'الفصل الدراسي الأول',");

    // 2. Add terms array
    if(!code.includes('const terms =')) {
        code = code.replace(/const semesters = \['-', 'محاسبة', 'تمويل', 'نظم المعلومات'\];/g, "const semesters = ['-', 'محاسبة', 'تمويل', 'نظم المعلومات'];\n    const terms = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني'];");
    }

    // 3. Add term to form state
    code = code.replace(/unit: 'المادة الأولى',/g, "unit: 'المادة الأولى',\n        term: 'الفصل الدراسي الأول',");

    // 4. Update the content data to include term when saving
    code = code.replace(/semester: filter\.semester,/g, "semester: filter.semester,\n            term: filter.term,");

    // 5. Add UI field in the filter row
    const termSelectUI = `
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الفصل الدراسي</label>
                    <select
                        value={filter.term}
                        onChange={(e) => setFilter({ ...filter, term: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                    >
                        {terms.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>`;
                
    // Insert after التخصص (semester)
    const semesterBlockRegex = /<div className="space-y-2">\s*<label className="text-xs font-bold text-gray-500 mr-2">التخصص<\/label>[\s\S]*?<\/div>/;
    code = code.replace(semesterBlockRegex, match => match + '\n' + termSelectUI);
    
    // Also change grid cols to md:grid-cols-5 to accommodate the new filter
    code = code.replace(/md:grid-cols-4/g, "md:grid-cols-5");

    // 6. Fix filteredList logic to check term
    const varMatches = code.match(/const ([a-zA-Z]+)Sem = normalizeArabic\(([a-zA-Z]+)\.semester/);
    if(varMatches) {
        const itemVarName = varMatches[2];
        const shortName = varMatches[1];
        
        const replaceRegex = new RegExp(`const matchSemester = fSem === (?:normalizeArabic\\('الكل'\\)|'الكل') \\|\\| ${shortName}Sem === fSem;`);
        
        code = code.replace(replaceRegex, 
        `const matchSemester = fSem === normalizeArabic('الكل') || fSem === 'الكل' || ${shortName}Sem === fSem;
        const ${shortName}Term = normalizeArabic(${itemVarName}.term || 'الفصل الدراسي الأول');
        const fTerm = normalizeArabic(filter.term || 'الفصل الدراسي الأول');
        const matchTerm = ${shortName}Term === fTerm;`
        );
        
        code = code.replace(/return matchStage && matchYear && matchSemester && matchUnit;/, `return matchStage && matchYear && matchSemester && matchUnit && matchTerm;`);
    }

    fs.writeFileSync(filePath, code);
}
console.log('Admin files modified');
