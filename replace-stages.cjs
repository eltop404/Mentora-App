const fs = require('fs');
const path = require('path');

const files = [
  'e:/نبض-التاريخ/src/components/admin/GameExamManagement.tsx',
  'e:/نبض-التاريخ/src/components/admin/LessonManagement.tsx',
  'e:/نبض-التاريخ/src/components/admin/MoraPDFCreator.tsx',
  'e:/نبض-التاريخ/src/components/admin/PdfToExamGeneratorLocal.tsx',
  'e:/نبض-التاريخ/src/components/admin/StudentManagement.tsx',
  'e:/نبض-التاريخ/src/components/admin/AddCourseModal.tsx',
  'e:/نبض-التاريخ/src/components/admin/CourseManagement.tsx',
  'e:/نبض-التاريخ/src/components/admin/BookletManagement.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace stages
    content = content.replace(/'إعدادي'/g, "'نظم المعلومات BIS'");
    content = content.replace(/'ثانوي'/g, "'اعمال دوليه IB'");
    content = content.replace(/>إعدادي</g, '>نظم المعلومات BIS<');
    content = content.replace(/>ثانوي</g, '>اعمال دوليه IB<');
    content = content.replace(/'إعدادية'/g, "'نظم المعلومات BIS'");
    content = content.replace(/'ثانوية'/g, "'اعمال دوليه IB'");
    content = content.replace(/>إعدادية</g, '>نظم المعلومات BIS<');
    content = content.replace(/>ثانوية</g, '>اعمال دوليه IB<');

    content = content.replace(/الصف الأول الإعدادي/g, 'الفرقة الأولى');
    content = content.replace(/الصف الثاني الإعدادي/g, 'الفرقة الثانية');
    content = content.replace(/الصف الثالث الإعدادي/g, 'الفرقة الثالثة');
    content = content.replace(/الصف الأول الثانوي/g, 'الفرقة الأولى');
    content = content.replace(/الصف الثاني الثانوي/g, 'الفرقة الثانية');
    content = content.replace(/الصف الثالث الثانوي/g, 'الفرقة الثالثة');
    
    content = content.replace(/الأول الإعدادي/g, 'الفرقة الأولى');
    content = content.replace(/الثاني الإعدادي/g, 'الفرقة الثانية');
    content = content.replace(/الثالث الإعدادي/g, 'الفرقة الثالثة');
    content = content.replace(/الأول الثانوي/g, 'الفرقة الأولى');
    content = content.replace(/الثاني الثانوي/g, 'الفرقة الثانية');
    content = content.replace(/الثالث الثانوي/g, 'الفرقة الثالثة');

    content = content.replace(/أولى إعدادي/g, 'الفرقة الأولى');
    content = content.replace(/ثانية إعدادي/g, 'الفرقة الثانية');
    content = content.replace(/تانية إعدادي/g, 'الفرقة الثانية');
    content = content.replace(/ثالثة إعدادي/g, 'الفرقة الثالثة');
    content = content.replace(/تالتة إعدادي/g, 'الفرقة الثالثة');
    content = content.replace(/أولى ثانوي/g, 'الفرقة الأولى');
    content = content.replace(/ثانية ثانوي/g, 'الفرقة الثانية');
    content = content.replace(/تانية ثانوي/g, 'الفرقة الثانية');
    content = content.replace(/ثالثة ثانوي/g, 'الفرقة الثالثة');
    content = content.replace(/تالتة ثانوي/g, 'الفرقة الثالثة');

    fs.writeFileSync(file, content);
  }
}
console.log('Done replacing stages and years in admin components.');
