const https = require('https');
const fs = require('fs');
const path = require('path');

const outDir = 'd:\\نبض-التاريخ\\public';

const files = [
    { name: 'favicon-16.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=16&h=16&output=png' },
    { name: 'favicon-32.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=32&h=32&output=png' },
    { name: 'favicon-48.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=48&h=48&output=png' },
    { name: 'favicon-64.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=64&h=64&output=png' },
    { name: 'favicon-96.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=96&h=96&output=png' },
    { name: 'apple-touch-icon.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=180&h=180&output=png' },
    { name: 'android-chrome-192.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=192&h=192&output=png' },
    { name: 'android-chrome-256.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=256&h=256&output=png' },
    { name: 'android-chrome-512.png', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=512&h=512&output=png' },
    { name: 'favicon.ico', url: 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=32&h=32&output=ico' }
];

let completed = 0;

files.forEach(file => {
    https.get(file.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
        const dest = fs.createWriteStream(path.join(outDir, file.name));
        res.pipe(dest);
        dest.on('finish', () => {
            console.log('Saved: ' + file.name);
            completed++;
            if (completed === files.length) {
                console.log('ALL DONE');
                process.exit(0);
            }
        });
    }).on('error', (err) => {
        console.error(err);
        process.exit(1);
    });
});
