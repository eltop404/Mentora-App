const fs = require('fs');
let code = fs.readFileSync('src/components/UnitsSection.tsx', 'utf8');

// fix lines 51 and 57:
code = code.replace(/s\.specialization === user\.semester/g, 's.specialization === user.specialization');

// fix line 103 items mapping
const oldMapping = `const sameSem = (normalizeArabic(c.semester || '-') === normalizeArabic((user as any).specialization || '-')) || normalizeArabic(c.semester || '-') === '-';
                const sameTerm = (normalizeArabic(c.term || 'الفصل الدراسي الأول') === normalizeArabic(user.semester || 'الفصل الدراسي الأول')) || !c.term;`;

const newMapping = `const sameSem = (normalizeArabic(c.semester || '-') === normalizeArabic(user.specialization || '-')) || normalizeArabic(c.semester || '-') === '-';
                const sameTerm = (normalizeArabic(c.term || 'الفصل الدراسي الأول') === normalizeArabic(user.semester || 'الفصل الدراسي الأول')) || !c.term;`;

code = code.replace(oldMapping, newMapping);

fs.writeFileSync('src/components/UnitsSection.tsx', code);
console.log('Fixed UnitsSection data fetching logic');
