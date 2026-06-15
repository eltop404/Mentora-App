const fs = require('fs');

function removeUploads() {
    let course = fs.readFileSync('src/components/admin/CourseManagement.tsx', 'utf8');
    let lesson = fs.readFileSync('src/components/admin/LessonManagement.tsx', 'utf8');

    // Remove course thumbnail button
    course = course.replace(/<button[^>]*?onClick=\{\(\) => document\.getElementById\('course-thumbnail-upload'\)\?\.click\(\)\}[^>]*?>[\s\S]*?<\/button>/, '');
    
    // Remove course video upload block
    course = course.replace(/<label className=\"flex items-center justify-between w-full bg-black\/40 border border-white\/10 rounded-2xl py-4 px-6 cursor-pointer hover:border-cyan-500\/30 transition-all group\/up\">[\s\S]*?<input type=\"file\" accept=\"video\/\*\" className=\"hidden\" onChange=\{handleVideoUpload\} \/>\s*<\/label>/, '');

    // Remove course thumbnail input
    course = course.replace(/<input\s+id="course-thumbnail-upload"\s+type="file"[\s\S]*?\/>/, '');

    // Remove lesson thumbnail button
    lesson = lesson.replace(/<button[^>]*?onClick=\{\(\) => \(document\.querySelector\('input\[type="file"\]\[accept="image\/\*"\]'\) as HTMLInputElement\)\?\.click\(\)\}[^>]*?>[\s\S]*?<\/button>/, '');

    // Remove lesson video upload block
    lesson = lesson.replace(/<label className=\"flex items-center justify-between bg-black\/40 border border-white\/10 rounded-xl py-2 px-4 cursor-pointer\">[\s\S]*?<input type=\"file\" accept=\"video\/\*\" className=\"hidden\" onChange=\{handleVideoFileUpload\} \/>\s*<\/label>/, '');

    // Remove lesson thumbnail input
    lesson = lesson.replace(/<input type="file" accept="image\/\*" className="hidden" onChange=\{handleThumbUpload\} \/>/, '');

    // Replace flex-[2] with w-full for the text inputs next to the removed buttons
    course = course.replace('className="flex-[2] ', 'className="w-full ');
    lesson = lesson.replace('className="flex-[2] ', 'className="w-full ');

    fs.writeFileSync('src/components/admin/CourseManagement.tsx', course);
    fs.writeFileSync('src/components/admin/LessonManagement.tsx', lesson);
    console.log('Files updated successfully using Regex.');
}

try {
    removeUploads();
} catch(e) {
    console.error(e);
}
