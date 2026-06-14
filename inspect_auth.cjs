const fs = require('fs');

const targetLogo = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const regexes = [
    /نبض التاريخ/g,
    /نبض-التاريخ/g,
    /منصة نبض التاريخ/g,
    /Nabd Al-Tareekh/gi,
    /Pulse of History/gi,
];

let match;
const foundLogos = appContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/g);
if (foundLogos) {
    console.log("Found img tags in App.tsx:\n" + foundLogos.join('\n'));
}

const foundTexts = appContent.match(/أهلاً بك في[^\n]+/g);
if (foundTexts) {
    console.log("Found welcome texts in App.tsx:\n" + foundTexts.join('\n'));
}

// Let's also do a hard replace using Buffer if encoding was an issue
// BUT I did replace texts before. Maybe the text is not 'نبض التاريخ' but something with spaces or different characters?
// Like 'ن ب ض  ا ل ت ا ر ي خ' ? Unlikely.
// Let's just log what we find.
