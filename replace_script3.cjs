const fs = require('fs');

function cleanUp() {
    let course = fs.readFileSync('src/components/admin/CourseManagement.tsx', 'utf8');
    let lesson = fs.readFileSync('src/components/admin/LessonManagement.tsx', 'utf8');

    // Remove handleVideoUpload from Course
    course = course.replace(/const handleVideoUpload = \([\s\S]*?reader\.readAsDataURL\(file\);\s*\n\s*};\n/, '');

    // Remove handleThumbUpload from Lesson
    lesson = lesson.replace(/const handleThumbUpload = \([\s\S]*?reader\.readAsDataURL\(file\);\s*\n\s*};\n/, '');

    // Remove handleVideoFileUpload from Lesson
    lesson = lesson.replace(/const handleVideoFileUpload = \([\s\S]*?reader\.readAsDataURL\(file\);\s*\n\s*};\n/, '');

    fs.writeFileSync('src/components/admin/CourseManagement.tsx', course);
    fs.writeFileSync('src/components/admin/LessonManagement.tsx', lesson);
    console.log('Cleaned unused functions');
}

try {
    cleanUp();
} catch(e) {
    console.error(e);
}
