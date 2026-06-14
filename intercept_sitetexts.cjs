const fs = require('fs');

let content = fs.readFileSync('src/services/db.ts', 'utf8');

const replacement = `
    getSiteTexts: (): SiteTexts => {
        let t = safeParse(Storage.getItem(KEYS.SITE_TEXTS), {} as Partial<SiteTexts>);
        
        // --- OVERRIDE: Scrub old names dynamically from any cached user data ---
        const scrub = (val) => {
            if (typeof val === 'string') {
                return val.replace(/نبض التاريخ/g, 'Mentora')
                          .replace(/نبض-التاريخ/g, 'Mentora')
                          .replace(/منصة نبض التاريخ/g, 'Mentora')
                          .replace(/منصه نبض التاريخ/g, 'Mentora')
                          .replace(/Pulse of History/gi, 'Mentora');
            }
            return val;
        };
        
        return {
            ...t,
            welcomeTitle: scrub(t.welcomeTitle) || 'أهلاً بك في Mentora',
            welcomeSubtitle: scrub(t.welcomeSubtitle) || 'نتمنى لك تجربة تعليمية ممتعة ومفيدة.',
            homeTitle: scrub(t.homeTitle) || 'Mentora',
            homeSubtitle: scrub(t.homeSubtitle) || 'تعلم بذكاء، تفوق بثقة!',
            marqueeText: scrub(t.marqueeText) || 'أهلاً وسهلاً بجميع الطلاب في Mentora! نتمنى لكم التوفيق والنجاح.',
            teacherName: scrub(t.teacherName) || 'أ: محمد يوسف',
            teacherTitle1: scrub(t.teacherTitle1) || 'مدرس الدراسات الاجتماعيه للمرحله الإعداديه..',
            teacherTitle2: scrub(t.teacherTitle2) || 'ومدرس التاريخ للمرحله الثانويه.',
            teacherExperience: scrub(t.teacherExperience) || 'خبره اكثر من 11 عام',
`;

content = content.replace(/getSiteTexts: \(\): SiteTexts => \{[\s\S]*?teacherExperience: t\.teacherExperience \|\| 'خبره اكثر من 11 عام',/, replacement.trim());

fs.writeFileSync('src/services/db.ts', content);
console.log('Intercepted getSiteTexts in db.ts successfully');
