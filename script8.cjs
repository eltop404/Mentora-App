const fs = require('fs');
let code = fs.readFileSync('src/components/admin/ExamManagement.tsx', 'utf8');

// Replace the hardcoded prepYears/secondaryYears
code = code.replace(/const prepYears = \['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'\];/g, "const stages = ['اعمال دوليه IB', 'نظم المعلومات BIS'];\n    const semestersList = ['-', 'محاسبة', 'تمويل', 'نظم المعلومات'];\n    const terms = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني'];\n    const prepYears = ['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'];");

// Replace the filter state
code = code.replace(/const \[filter, setFilter\] = useState\(\{[\s\S]*?\}\);/, `const [filter, setFilter] = useState({
        stage: 'اعمال دوليه IB',
        year: 'الفرقة الأولى',
        semester: '-',
        term: 'الفصل الدراسي الأول',
        unit: 'الكل'
    });`);

// Fix filteredExams logic
const filteredExamsLogic = `    const filteredExams = examList.filter(e => {
        const matchStage = filter.stage === 'الكل' || e.stage === filter.stage;
        const matchYear = filter.year === 'الكل' || e.year === filter.year;
        const matchSemester = filter.semester === 'الكل' || e.semester === filter.semester;
        const matchTerm = filter.term === 'الكل' || e.term === filter.term || !e.term;
        return matchStage && matchYear && matchSemester && matchTerm;
    });`;

code = code.replace(/const filteredExams = examList\.filter\([\s\S]*?\}\);/, filteredExamsLogic);

// Replace the filter UI
const filterUIRegex = /<div className="bg-white\/5 p-6 rounded-\[2\.5rem\] border border-white\/5 flex flex-wrap gap-4 items-center justify-end">[\s\S]*?<\/div>\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">/;

const newFilterUI = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 glass rounded-[2.5rem] border border-white/5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الشعبة</label>
                    <select
                        value={filter.stage}
                        onChange={(e) => setFilter({...filter, stage: e.target.value, year: 'الفرقة الأولى'})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                    >
                        <option value="الكل">الكل (جميع المراحل)</option>
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الفرقة</label>
                    <select
                        value={filter.year}
                        onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                    >
                        <option value="الكل">الكل (جميع السنين)</option>
                        {prepYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">التخصص</label>
                    <select
                        value={filter.semester}
                        onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                    >
                        <option value="الكل">الكل (جميع التخصصات)</option>
                        {semestersList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الفصل الدراسي</label>
                    <select
                        value={filter.term}
                        onChange={(e) => setFilter({ ...filter, term: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-right outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                    >
                        {terms.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="col-span-1 md:col-span-4 flex items-center gap-2 bg-black/20 p-2 rounded-2xl justify-end">
                    <button
                        onClick={handleToggleLock}
                        className={\`flex items-center gap-2 px-4 py-2 rounded-xl transition-all \${DB.isSemesterLocked(filter.stage, filter.year, filter.term) ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}\`}
                    >
                        {DB.isSemesterLocked(filter.stage, filter.year, filter.term) ? <Lock size={16} /> : <Unlock size={16} />}
                        <span className="text-xs font-bold">{DB.isSemesterLocked(filter.stage, filter.year, filter.term) ? 'فتح الفصل' : 'قفل الفصل'}</span>
                    </button>
                    <div className="text-xs text-gray-500 mr-2">حالة التسجيل</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">`;

code = code.replace(filterUIRegex, newFilterUI);

// When creating new exam, ensure it saves with the right filter
code = code.replace(/stage: filter\.stage,\s*year: filter\.year,\s*semester: filter\.semester,\s*term: filter\.term,/g, "stage: filter.stage,\n                year: filter.year,\n                semester: filter.semester,\n                term: filter.term,");

fs.writeFileSync('src/components/admin/ExamManagement.tsx', code);
console.log('ExamManagement updated');
