/**
 * Final audit and cleanup of App.tsx
 * Targets all remaining corrupted label/string patterns
 */
const fs = require('fs');
let c = fs.readFileSync('e:/نبض-التاريخ/src/App.tsx', 'utf8');

const fixes = [
  // Navigation label corruptions still visible in prev scan
  ["label: 'ت\x1ar`ر الطالب'", "label: 'تقرير الطالب'"],
  ["label: '!\u0060ت\u0060'", "label: 'بطاقتي'"],
  ["label: 'شح '", "label: 'شحن'"],
  ["label: 'إ\u0060صال'", "label: 'إيصال'"],
  ["label: 'التح\u0026'", "label: 'التحكم'"],
  ["label: 'ا جازات\u0060'", "label: 'إنجازاتي'"],
  ["label: 'المتصدر '", "label: 'المتصدرين'"],
  ["label: '\u0026 صة المع!د'", "label: 'منصة المعهد'"],
  ["label: '\u0026\u0060ت ج'", "label: 'ميتنج'"],
  ["label: 'المطر'", "label: 'المطور'"],
  ["label: 'الدع\u0026'", "label: 'الدعم'"],
  ["label: 'ث\u0060مات'", "label: 'ثيمات'"],
  ["label: '\u0026شارْ!'", "label: 'مشاركة'"],
  ["label: 'العض\u0060ة الذ!ب\u0060ة'", "label: 'العضوية الذهبية'"],
  ["label: 'الخصص\u0060!'", "label: 'الخصوصية'"],
  ["label: '\u0026لف\u0060'", "label: 'ملفي'"],
  
  // General broken Arabic in strings (backtick = ي, ! = ه)
  ["ا\x1aتسج\x1aل \x1aتطلب موافقة الأد\x1aن", "التسجيل يتطلب موافقة الأدمن"],
  
  // student_report label
  ["label: 'ت\x1ar\u0060ر الطالب'", "label: 'تقرير الطالب'"],
  
  // Backtick substitutions in Arabic → ي ، ه
  // These chars are: \u0060 backtick appears instead of ي
  //                  ! appears instead of ه in some contexts
  //                  \x1a (SUB) appears instead of ق
  //                  \u0052 (R) suffix after Arabic means ،
  //                  x suffix represents an emoji
  
  // Remaining broken snippets found
  ["'تم التح\x1a\x1a \u0026  بصمة", "'تم التحقق من بصمة"],
  ["setVerificationError('ب\u0060ا ات غ\u0060ر متطاب\x1aة مع السجل المد `\u0060 الط `\u0060')", "setVerificationError('بيانات غير متطابقة مع السجل المدني الطبي')"],
  ["setVerificationError('ب`ا ات غ`ر متطاب\\x1aة مع السجل المد `\\ الط `')", "setVerificationError('بيانات غير متطابقة مع السجل المدني')"],
  
  // student activity labels with corrupted \x1c and \x19 chars
  ["label: 'AI'", "label: 'AI'"], // this one is fine
  
  // admin_management and system_control need correct labels
  ["label: 'حالات التحكم'", "label: 'إدارة المسؤولين'"],
  ["label: 'لوحة التحكم'", "label: 'ضبط النظام'"],
];

let count = 0;
for (const [from, to] of fixes) {
  if (c.includes(from)) {
    c = c.split(from).join(to);
    count++;
  }
}

// Now apply a regex to clean up any remaining backtick-i (`) corruption in Arabic label strings
// Pattern: label: '...' where backtick appears inside Arabic
c = c.replace(/label: '([^']*)`([^']*)'/g, (match, before, after) => {
  const arabic = /[\u0600-\u06FF]/;
  if (arabic.test(before) || arabic.test(after)) {
    return `label: '${before}ي${after}'`;
  }
  return match;
});

fs.writeFileSync('e:/نبض-التاريخ/src/App.tsx', c, 'utf8');

// Also quick-scan for the 2 remaining verification error lines
const c2 = fs.readFileSync('e:/نبض-التاريخ/src/App.tsx', 'utf8');
const linesBroken = [];
const lines = c2.split('\n');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if ((l.includes('setVerificationError') || l.includes('setVerificationStage')) && /[\x1a\x1b\x1c\x1d\x1e\x1f\u0060!]/.test(l)) {
    linesBroken.push(i+1 + ': ' + l.trim());
  }
}
console.log('Applied fixes:', count);
console.log('Remaining broken verification lines:', linesBroken.length);
linesBroken.forEach(l => console.log(l));
