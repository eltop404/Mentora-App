const fs = require('fs');
let content = fs.readFileSync('src/services/db.ts', 'utf8');

content = content.replace(/SUBJECTS: 'nt_subjects',/, "SUBJECTS: 'nt_subjects',\n    SECTIONS: 'nt_sections',");
content = content.replace(/\[KEYS\.PARENTS\]: 'nt-parents-change',/, "[KEYS.PARENTS]: 'nt-parents-change',\n        [KEYS.SECTIONS]: 'nt-sections-change',");
content = content.replace(/KEYS\.CONTENT, KEYS\.EXAMS/g, 'KEYS.CONTENT, KEYS.SECTIONS, KEYS.EXAMS');
content = content.replace(/let cachedContent: any\[\] \| null = null;/, "let cachedContent: any[] | null = null;\nlet cachedSections: any[] | null = null;");
content = content.replace(/cachedContent = null;/, "cachedContent = null;\n    cachedSections = null;");

const sectionsLogic = `
    // ---- Sections ----
    getSections: (): Content[] => {
        if (cachedSections) return cachedSections;
        const items = safeParse<Content[]>(Storage.getItem(KEYS.SECTIONS), []);
        cachedSections = items.map(c => ({
            ...c,
            stage: normalizeStage(c.stage),
            year: normalizeYear(c.year),
            semester: normalizeSemester(c.semester)
        }));
        return cachedSections;
    },
    saveSections: (sections: Content[]) => {
        cachedSections = sections;
        Storage.setItem(KEYS.SECTIONS, JSON.stringify(sections));
        notify('nt-sections-change');
        DB._syncToServer(KEYS.SECTIONS, sections);
    },
    addSection: (section: Content) => {
        const sections = DB.getSections();
        sections.push(section);
        DB.saveSections(sections);
        if (section.unit) DB.markUnitUpdated(section.stage, section.year, section.semester, section.unit);
        DB.setLatestContentUpdate('تم إضافة سكشن جديد: ' + section.title, 'lessons');
    },
    updateSection: (id: string, updated: Partial<Content>) => {
        const sections = DB.getSections();
        const index = sections.findIndex(c => c.id === id);
        if (index !== -1) {
            sections[index] = { ...sections[index], ...updated };
            DB.saveSections(sections);
            if (sections[index].unit) DB.markUnitUpdated(sections[index].stage, sections[index].year, sections[index].semester, sections[index].unit);
        }
    },
    deleteSection: (id: string) => {
        DB.saveSections(DB.getSections().filter(c => c.id !== id));
    },
`;

content = content.replace(/\/\/ ---- Exams ----/, sectionsLogic + '\n    // ---- Exams ----');

fs.writeFileSync('src/services/db.ts', content, 'utf8');
console.log('db.ts patched successfully');
