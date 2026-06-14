const https = require('https');
const fs = require('fs');

const cloud512 = 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=512&h=512&output=png';
const cloud192 = 'https://wsrv.nl/?url=i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png&mask=circle&w=192&h=192&output=png';

const dl = (url, path) => new Promise((resolve) => {
    https.get(url, (response) => {
        const s = fs.createWriteStream(path);
        response.pipe(s);
        s.on('finish', () => { s.close(); resolve(); });
    });
});

Promise.all([
    dl(cloud512, 'd:\\نبض-التاريخ\\public\\favicon-512.png'),
    dl(cloud192, 'd:\\نبض-التاريخ\\public\\favicon-192.png')
]).then(() => {
    console.log("Perfectly Circular PNGs successfully generated and saved to public folder!");
});
