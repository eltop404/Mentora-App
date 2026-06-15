const fs = require('fs');

function fixDiscussionTexts() {
    let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

    const replacements = [
        ['إدالمرورة ا اشاتم ااستم طاعاتم اعا&ة', 'إدارة ساحة النقاش العامة'],
        ['إضافة & شر جديد', 'إضافة منشور جديد'],
        ['Create New Discussion Post', 'إنشاء منشور نقاش جديد'],
        ['حذف جميع المنشوراتم ', 'حذف جميع المنشورات'],
        ['`رجى ْتم ابة  ص ا& شر', 'يرجى كتابة نص المنشور'],
        ["level: 'عا&'", "level: 'عام'"],
        ['تم &  شر ا& شر في ساحة النقاش', 'تم نشر المنشور في ساحة النقاش'],
        [' شر اآ  xa', 'نشر الآن'],
        ['ا تم جد استم طاعاتم في اتم احا`', 'لا توجد منشورات في ساحة النقاش حالياً'],
        ['& شر إدالمرور`', 'منشور الإدارة'],
        ['ارد عى اطاب', 'الرد على الطالب'],
        ['الكلتم ب ردْ ! ا بشْ احتم راف`...', 'اكتب ردك بشكل احترافي...'],
        ['إرسا ارد اآ ', 'إرسال الرد الآن'],
        ['إغاء', 'إلغاء']
    ];

    replacements.forEach(([bad, good]) => {
        content = content.split(bad).join(good);
    });

    fs.writeFileSync('src/components/AdminDashboard.tsx', content);
    console.log('Fixed discussion texts in AdminDashboard.tsx');
}

try {
    fixDiscussionTexts();
} catch(e) {
    console.error(e);
}
