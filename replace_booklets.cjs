const fs = require('fs');

function cleanBookletManagement() {
    let content = fs.readFileSync('src/components/admin/BookletManagement.tsx', 'utf8');

    // Remove PDF upload box
    content = content.replace(/<div className="space-y-1 text-right">\s*<label className="text-xs font-bold text-gray-500 mr-2">الملخصات \(PDF\)<\/label>\s*<label className="flex items-center justify-between w-full bg-black\/40 border border-white\/10 rounded-2xl py-3 px-6 cursor-pointer hover:border-amber-500\/30 transition-all group\/up">\s*<FileUp size=\{18\} className="text-gray-500 group-hover\/up:text-amber-500 transition-colors" \/>\s*<span className="text-gray-400 text-sm">ارفع ملف PDF<\/span>\s*<input type="file" multiple accept="\.pdf" className="hidden" onChange=\{handleFileUpload\} \/>\s*<\/label>\s*<\/div>/g, '');

    // Remove preview area
    content = content.replace(/\{form\.files\.length > 0 && \([\s\S]*?الملفات المرفوعة :[\s\S]*?\}\s*<\/div>\s*<\/div>\s*\)\}/, '');

    // Remove handleFileUpload function
    content = content.replace(/const handleFileUpload = \([\s\S]*?reader\.readAsDataURL\(file\);\s*\n\s*\}\);\s*\n\s*\};\n/, '');

    // Remove isUploading state
    content = content.replace(/const \[isUploading, setIsUploading\] = useState\(false\);\s*\n/, '');
    
    // Remove disabled={isUploading}
    content = content.replace(/disabled=\{isUploading\}/g, '');
    
    // Remove ternary for Uploading text
    content = content.replace(/\{isUploading \? 'جاري الرفع\.\.\.' : isEditing \? 'تحديث الملخص' : 'حفظ ونشر الملخص'\}/g, "{isEditing ? 'تحديث الملخص' : 'حفظ ونشر الملخص'}");

    fs.writeFileSync('src/components/admin/BookletManagement.tsx', content);
    console.log('BookletManagement updated successfully');
}

try {
    cleanBookletManagement();
} catch(e) {
    console.error(e);
}
