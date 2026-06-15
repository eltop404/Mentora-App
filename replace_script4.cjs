const fs = require('fs');

function cleanStates() {
    let course = fs.readFileSync('src/components/admin/CourseManagement.tsx', 'utf8');
    let lesson = fs.readFileSync('src/components/admin/LessonManagement.tsx', 'utf8');

    // Remove isUploading state and usage
    course = course.replace(/const \[isUploading, setIsUploading\] = useState\(false\);\s*\n/, '');
    course = course.replace(/disabled=\{isUploading\}/g, '');
    course = course.replace(/isUploading \? 'جاري الرفع\.\.\.' : /g, '');

    // Remove isUploadingThumb and isUploadingVideo states and usage
    lesson = lesson.replace(/const \[isUploadingThumb, setIsUploadingThumb\] = useState\(false\);\s*\n/, '');
    lesson = lesson.replace(/const \[isUploadingVideo, setIsUploadingVideo\] = useState\(false\);\s*\n/, '');
    lesson = lesson.replace(/isUploadingThumb \|\| isUploadingVideo/g, 'false');

    fs.writeFileSync('src/components/admin/CourseManagement.tsx', course);
    fs.writeFileSync('src/components/admin/LessonManagement.tsx', lesson);
    console.log('Cleaned unused states');
}

try {
    cleanStates();
} catch(e) {
    console.error(e);
}
