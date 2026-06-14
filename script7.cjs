const fs = require('fs');
let code = fs.readFileSync('src/components/UnitsSection.tsx', 'utf8');

code = code.replace(/const sameSem = normalizeArabic\(c\.semester\) === normalizeArabic\(user\.semester\);/g, 
    "const sameSem = (normalizeArabic(c.semester || '-') === normalizeArabic((user as any).specialization || '-')) || normalizeArabic(c.semester || '-') === '-';\n                const sameTerm = (normalizeArabic(c.term || 'الفصل الدراسي الأول') === normalizeArabic(user.semester || 'الفصل الدراسي الأول')) || !c.term;"
);

code = code.replace(/return sameUnit && sameStage && sameYear && sameSem && c\.isVisible;/g,
    "return sameUnit && sameStage && sameYear && sameSem && sameTerm && c.isVisible;"
);

fs.writeFileSync('src/components/UnitsSection.tsx', code);
console.log('UnitsSection term filtered');
