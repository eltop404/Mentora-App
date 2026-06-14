const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const SUB_ADMINS = \[\s*\{ user: 'admin', pass: 'euxsuwA468Sdj', year: 'الفرقة الأولى', division: 'اعمال دوليه IB', spec: '' \},\s*\{ user: 'admin', pass: 'qjxxhWucyccy4435sh', year: 'الفرقة الأولى', division: 'نظم المعلومات BIS', spec: '' \},\s*\{ user: 'admin', pass: 'Chdsjfj464dkdj', year: 'الفرقة الثانية', division: 'اعمال دوليه IB', spec: '' \},\s*\{ user: 'admin', pass: 'cjdhf644Awue', year: 'الفرقة الثانية', division: 'نظم المعلومات BIS', spec: '' \},\s*\{ user: 'admin', pass: 'QJXJFFH5674quayh', year: 'الفرقة الثالثة', division: 'اعمال دوليه IB', spec: 'محاسبة' \},\s*\{ user: 'admin', pass: 'vjddh434shsSf', year: 'الفرقة الثالثة', division: 'اعمال دوليه IB', spec: 'تمويل' \},\s*\{ user: 'admin', pass: 'Wugcud565fuxshs', year: 'الفرقة الثالثة', division: 'نظم المعلومات BIS', spec: 'نظم المعلومات' \},\s*\{ user: 'admin', pass: 'Mduzshd568zhsw', year: 'الفرقة الرابعة', division: 'اعمال دوليه IB', spec: 'محاسبة' \},\s*\{ user: 'admin', pass: 'vjsjd5656Sufudgc', year: 'الفرقة الرابعة', division: 'اعمال دوليه IB', spec: 'تمويل' \},\s*\{ user: 'admin', pass: 'Hjsjshs56868msjdd', year: 'الفرقة الرابعة', division: 'نظم المعلومات BIS', spec: 'نظم المعلومات' \},\s*\];/g,
    `const SUB_ADMINS = DB.getSubAdmins();`
);

fs.writeFileSync(file, content, 'utf8');
