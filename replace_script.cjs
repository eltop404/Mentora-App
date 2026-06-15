const fs = require('fs');

function removeUploads(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove the thumbnail button
    let startIndex = content.indexOf('<button');
    while (startIndex !== -1) {
        const buttonText = content.substring(startIndex, startIndex + 500);
        if (buttonText.includes('رفع صورة')) {
            const endIndex = content.indexOf('</button>', startIndex) + 9;
            content = content.substring(0, startIndex) + content.substring(endIndex);
            // Replace flex-[2] with w-full for the input next to it
            content = content.replace('flex-[2]', 'w-full');
            break; // found and removed
        }
        startIndex = content.indexOf('<button', startIndex + 1);
    }

    // Remove the thumbnail hidden input
    let inputIndex = content.indexOf('<input');
    while (inputIndex !== -1) {
        const inputText = content.substring(inputIndex, inputIndex + 500);
        if (inputText.includes('type=\"file\"') && inputText.includes('accept=\"image/*\"')) {
            const endIndex = content.indexOf('/>', inputIndex) + 2;
            content = content.substring(0, inputIndex) + content.substring(endIndex);
            break;
        }
        inputIndex = content.indexOf('<input', inputIndex + 1);
    }

    // Remove video upload (CourseManagement)
    if (file.includes('CourseManagement')) {
        let labelIndex = content.indexOf('<div className=\"space-y-1 text-right\">');
        while (labelIndex !== -1) {
            const labelText = content.substring(labelIndex, labelIndex + 800);
            if (labelText.includes('رفع ملف فيديو مباشر') && labelText.includes('اختر فيديو')) {
                const endIndex = content.indexOf('</div>', labelIndex + 200) + 6;
                content = content.substring(0, labelIndex) + content.substring(endIndex);
                break;
            }
            labelIndex = content.indexOf('<div className=\"space-y-1 text-right\">', labelIndex + 1);
        }
    }

    // Remove video upload (LessonManagement)
    if (file.includes('LessonManagement')) {
        let labelIndex = content.indexOf('<label');
        while (labelIndex !== -1) {
            const labelText = content.substring(labelIndex, labelIndex + 600);
            if (labelText.includes('أو ارفع ملف') && labelText.includes('type=\"file\"') && labelText.includes('accept=\"video/*\"')) {
                const endIndex = content.indexOf('</label>', labelIndex) + 8;
                content = content.substring(0, labelIndex) + content.substring(endIndex);
                break;
            }
            labelIndex = content.indexOf('<label', labelIndex + 1);
        }
    }

    fs.writeFileSync(file, content);
    console.log(file, 'updated successfully');
}

try {
    removeUploads('src/components/admin/CourseManagement.tsx');
    removeUploads('src/components/admin/LessonManagement.tsx');
} catch(e) {
    console.error(e);
}
