const fs = require('fs');
const https = require('https');
const path = require('path');

const publicImagesDir = 'd:\\نبض-التاريخ\\public\\images';
if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
}

const imagesToDownload = [
    { url: 'https://i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png', filename: 'napd-altareekh-logo.png' },
    { url: 'https://i.postimg.cc/HL4PLT7r/file-00000000acb0720a85e431d06d86ac60.png', filename: 'napd-altareekh-teacher.png' },
    { url: 'https://i.postimg.cc/9Mb46zG7/Instapay-logo.png', filename: 'napd-altareekh-instapay.png' },
    { url: 'https://i.postimg.cc/Bvs7RQyh/20260104203339612.jpg', filename: 'napd-altareekh-developer.jpg' }
];

async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const dest = path.join(publicImagesDir, filename);
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log('Downloading images...');
    for (const img of imagesToDownload) {
        await downloadImage(img.url, img.filename);
        console.log('Saved:', img.filename);
    }

    const filesToUpdate = [
        'd:\\نبض-التاريخ\\src\\App.tsx',
        'd:\\نبض-التاريخ\\src\\components\\StudentChat.tsx',
        'd:\\نبض-التاريخ\\src\\components\\admin\\StudentReports.tsx'
    ];

    filesToUpdate.forEach(filepath => {
        if (!fs.existsSync(filepath)) return;
        let code = fs.readFileSync(filepath, 'utf-8');
        let originalCode = code;

        // Replace Logo Images
        const logoPattern = /<img\s+([^>]*?)src="https:\/\/i\.postimg\.cc\/(?:CxnFdCMx|J7N6X6rs|gkWR67tv)\/file-00000000c8ec7246b0ffc1ff669ce0f8\.png"([^>]*?)>/g;
        code = code.replace(logoPattern, (match, p1, p2) => {
            let before = p1.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            let after = p2.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            return `<img ${before} src="/images/napd-altareekh-logo.png" ${after} alt="منصة نبض التاريخ التعليمية" title="منصة نبض التاريخ | منصة تعليم التاريخ للمرحلة الإعدادية والثانوية" loading="lazy" />`;
        });

        // Other str-based logo replacements
        code = code.replaceAll('https://i.postimg.cc/CxnFdCMx/file-00000000c8ec7246b0ffc1ff669ce0f8.png', '/images/napd-altareekh-logo.png');
        code = code.replaceAll('https://i.postimg.cc/gkWR67tv/file-00000000c8ec7246b0ffc1ff669ce0f8.png', '/images/napd-altareekh-logo.png');
        code = code.replaceAll('https://i.postimg.cc/J7N6X6rs/file-00000000c8ec7246b0ffc1ff669ce0f8.png', '/images/napd-altareekh-logo.png');

        // Replace Teacher Image
        const teacherPattern = /<img\s+([^>]*?)src="https:\/\/i\.postimg\.cc\/HL4PLT7r\/file-00000000acb0720a85e431d06d86ac60\.png"([^>]*?)>/g;
        code = code.replace(teacherPattern, (match, p1, p2) => {
            let before = p1.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            let after = p2.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            return `<img ${before} src="/images/napd-altareekh-teacher.png" ${after} alt="الأستاذ محمد يوسف - منصة نبض التاريخ" title="الأستاذ محمد يوسف مدرس التاريخ" loading="lazy" />`;
        });

        // Replace Instapay Logo
        const instapayPattern = /<img\s+([^>]*?)src="https:\/\/i\.postimg\.cc\/9Mb46zG7\/Instapay-logo\.png"([^>]*?)>/g;
        code = code.replace(instapayPattern, (match, p1, p2) => {
            let before = p1.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            let after = p2.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            return `<img ${before} src="/images/napd-altareekh-instapay.png" ${after} alt="الدفع عبر انستا باي - منصة نبض التاريخ" title="دفع اشتراك منصة نبض التاريخ عبر InstaPay" loading="lazy" />`;
        });

        // Replace Developer Image
        const devPattern = /<img\s+([^>]*?)src="https:\/\/i\.postimg\.cc\/Bvs7RQyh\/20260104203339612\.jpg"([^>]*?)>/g;
        code = code.replace(devPattern, (match, p1, p2) => {
            let before = p1.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            let after = p2.replace(/(alt|title|loading)="[^"]*"/g, '').trim();
            return `<img ${before} src="/images/napd-altareekh-developer.jpg" ${after} alt="مطور منصة نبض التاريخ التعليمية" title="عمرو لطفي - مطور برمجيات" loading="lazy" />`;
        });

        if (code !== originalCode) {
            fs.writeFileSync(filepath, code, 'utf-8');
            console.log('Updated SEO images in:', filepath);
        }
    });

    console.log('ALL SEO IMAGE TAGS UPDATED SUCCESSFULLY!');
}

run();
