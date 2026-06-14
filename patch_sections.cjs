const fs = require('fs');

let code = fs.readFileSync('src/components/admin/ContentManagement.tsx', 'utf8');

code = code.replace(/ContentManagement/g, 'SectionsManagement');
code = code.replace(/Content/g, 'Section');
code = code.replace(/contentList/g, 'sectionList');
code = code.replace(/setContentList/g, 'setSectionList');
code = code.replace(/DB\.getContent/g, 'DB.getSections');
code = code.replace(/DB\.saveContent/g, 'DB.saveSections');
code = code.replace(/DB\.addContent/g, 'DB.addSection');
code = code.replace(/DB\.updateContent/g, 'DB.updateSection');
code = code.replace(/DB\.deleteContent/g, 'DB.deleteSection');
code = code.replace(/contentData/g, 'sectionData');
code = code.replace(/allContent/g, 'allSections');
code = code.replace(/updatedContent/g, 'updatedSections');

// Arabic labels
code = code.replace(/إدارة المحتوى التعليمي/g, 'إدارة السكاشن');
code = code.replace(/تعديل المحتوى/g, 'تعديل السكشن');
code = code.replace(/إضافة محتوى جديد/g, 'إضافة سكشن جديد');
code = code.replace(/عنوان المحتوى/g, 'عنوان السكشن');
code = code.replace(/نص المحتوى/g, 'نص السكشن');
code = code.replace(/محتوى مجاني/g, 'سكشن مجاني');
code = code.replace(/محتوى جديد/g, 'سكشن جديد');
code = code.replace(/المحتوى/g, 'السكشن');
code = code.replace(/محتوى/g, 'سكشن');

// Event listener
code = code.replace(/nt-admin-force-edit/g, 'nt-admin-force-edit-section');

// Write out to the new file
fs.writeFileSync('src/components/admin/SectionsManagement.tsx', code, 'utf8');
console.log('SectionsManagement.tsx created successfully');
