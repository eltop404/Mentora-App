const fs = require('fs');
let code = fs.readFileSync('src/components/UnitsSection.tsx', 'utf8');

// Replace standard variables
code = code.replace(/UnitsSection/g, 'SectionsSection');
code = code.replace(/contents/g, 'sectionsList');
code = code.replace(/setContents/g, 'setSectionsList');
code = code.replace(/DB\.getContent/g, 'DB.getSections');
code = code.replace(/contentList/g, 'sectionList');
code = code.replace(/Content/g, 'Section');
code = code.replace(/nt-content-change/g, 'nt-sections-change');

// In types, wait, Content is a type from types.ts, so we still import Content.
code = code.replace(/import \{ Section \}/g, 'import { Content }');
code = code.replace(/setSectionsList\(DB\.getSections\(\)\);/g, 'setSectionsList(DB.getSections());');
// the generic replacement above changed Content -> Section. Let's fix that for types.
code = code.replace(/Section\[\]/g, 'Content[]');
code = code.replace(/useState<Content\[\]>/g, 'useState<Content[]>');

// The file might use c as variable
code = code.replace(/إدارة المحتوى/g, 'إدارة السكاشن');
code = code.replace(/المحتوى/g, 'السكشن');
code = code.replace(/الوحدات الدراسية/g, 'السكاشن');
code = code.replace(/وحدة دراسية/g, 'سكشن');
code = code.replace(/الوحدات/g, 'السكاشن');

fs.writeFileSync('src/components/SectionsSection.tsx', code, 'utf8');
console.log('SectionsSection.tsx created.');
