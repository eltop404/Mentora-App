const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

const startMarker = "{/* Referral & Email Verification Widgets */}";
const endMarker = '<div className="grid grid-cols-2 gap-3 w-full max-w-2xl px-2">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + content.substring(endIndex);
    fs.writeFileSync('src/App.tsx', newContent);
    console.log('Successfully removed Referral Widgets from App.tsx');
} else {
    console.log('Markers not found');
}
