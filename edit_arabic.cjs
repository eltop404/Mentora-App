const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace corrupted Arabic strings
const replacements = [
  { s: 'placeholder="بحث بااس& أ ID..."', r: 'placeholder="بحث بالاسم أو ID..."' },
  { s: '<option className="bg-[#0b141a] text-white" value="all">ْ افر</option>', r: '<option className="bg-[#0b141a] text-white" value="all">الفرقة</option>' },
  { s: '<option className="bg-[#0b141a] text-white" value="all">ْ اشعب</option>', r: '<option className="bg-[#0b141a] text-white" value="all">الشعبة</option>' },
  { s: '<option className="bg-[#0b141a] text-white" value=" ظ& ا&ع&اتم BIS"> ظ& ا&ع&اتم BIS</option>', r: '<option className="bg-[#0b141a] text-white" value="نظم المعلومات BIS">نظم المعلومات BIS</option>' },
  { s: '<option className="bg-[#0b141a] text-white" value="all">ْ اتم خصصاتم </option>', r: '<option className="bg-[#0b141a] text-white" value="all">التخصص</option>' },
  { s: '<option className="bg-[#0b141a] text-white" value="تم ✓">تم ✓</option>', r: '<option className="bg-[#0b141a] text-white" value="تمويل">تمويل</option>' },
  { s: '<option className="bg-[#0b141a] text-white" value=" ظ& ا&ع&اتم "> ظ& ا&ع&اتم </option>', r: '<option className="bg-[#0b141a] text-white" value="نظم المعلومات">نظم المعلومات</option>' },
  { s: '<option className="bg-[#0b141a] text-white" value="all">ْ افص</option>', r: '<option className="bg-[#0b141a] text-white" value="all">الفصل</option>' },
  { s: 'عرض ا&زيد &  اطاب', r: 'عرض المزيد من الطلاب' },
  { s: '&تم ب`', r: 'متبقي' }
];

replacements.forEach(({s, r}) => {
  content = content.replaceAll(s, r);
});

fs.writeFileSync(file, content);
console.log('done replacing arabic');
