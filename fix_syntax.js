const fs = require('fs');

const filepath = 'd:\\نبض-التاريخ\\src\\App.tsx';
let code = fs.readFileSync(filepath, 'utf-8');

code = code.replaceAll('/ alt="منصة نبض التاريخ التعليمية"', 'alt="منصة نبض التاريخ التعليمية"');
code = code.replaceAll('/ alt="مطور منصة نبض التاريخ التعليمية"', 'alt="مطور منصة نبض التاريخ التعليمية"');
code = code.replaceAll('/ alt="الدفع عبر انستا باي - منصة نبض التاريخ"', 'alt="الدفع عبر انستا باي - منصة نبض التاريخ"');

// Fix the teacher image
const badTeacherStart = '<img  src="/images/napd-altareekh-teacher.png" alt={siteTexts.teacherName}';
const badTeacherEnd = 'onError={(e) = alt="الأستاذ محمد يوسف - منصة نبض التاريخ" title="الأستاذ محمد يوسف مدرس التاريخ" loading="lazy" /> {';
const fixTeacherReplacement = `onError={(e) => {`;
code = code.replaceAll(badTeacherEnd, `alt="الأستاذ محمد يوسف - منصة نبض التاريخ" title="الأستاذ محمد يوسف مدرس التاريخ" loading="lazy" onError={(e) => {`);

fs.writeFileSync(filepath, code, 'utf-8');
console.log('Fixed syntax errors');
