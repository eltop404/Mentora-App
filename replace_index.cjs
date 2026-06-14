const fs = require('fs');

let indexContent = fs.readFileSync('index.html', 'utf8');

const targetLogo = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

// Replace texts
indexContent = indexContent.replace(/نبض التاريخ/g, 'Mentora');
indexContent = indexContent.replace(/نبض-التاريخ/g, 'Mentora');

// Replace favicon and og images
indexContent = indexContent.replace(/\/images\/napd-altareekh-logo\.png/g, targetLogo);

fs.writeFileSync('index.html', indexContent);
console.log('Replaced Nabd Al-Tarikh and logo in index.html');
