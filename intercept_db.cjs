const fs = require('fs');

let content = fs.readFileSync('src/services/db.ts', 'utf8');

const interceptLogic = `
    // ---- Theme & Customization ----
    getTheme: () => {
        const t = safeParse(Storage.getItem('nt_theme'), { primary: '#3b82f6', variant: 'professional' });
        // OVERRIDE: Force Mentora logo
        t.logo = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';
        return t;
    },
    saveTheme: (theme: any) => {
        // OVERRIDE: Force Mentora logo
        theme.logo = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';
        Storage.setItem('nt_theme', JSON.stringify(theme));
        notify('nt-theme-change');
    },

    // ---- Site Texts ----
    getSiteTexts: (): SiteTexts => {
        let t = safeParse(Storage.getItem(KEYS.SITE_TEXTS), {} as Partial<SiteTexts>);
        
        // OVERRIDE: Scrub old names and welcome texts dynamically
        const overrideMentora = (val: string, defaultVal: string) => {
            if (!val) return defaultVal;
            return val.replace(/نبض التاريخ/g, 'Mentora')
                      .replace(/نبض-التاريخ/g, 'Mentora')
                      .replace(/منصة نبض التاريخ/g, 'Mentora')
                      .replace(/منصه نبض التاريخ/g, 'Mentora');
        };

        return {
            ...t,
            welcomeTitle: overrideMentora(t.welcomeTitle, 'أهلاً بك في Mentora'),
            welcomeSubtitle: overrideMentora(t.welcomeSubtitle, 'نتمنى لك تجربة تعليمية ممتعة ومفيدة.'),
            homeTitle: overrideMentora(t.homeTitle, 'Mentora'),
            homeSubtitle: overrideMentora(t.homeSubtitle, 'تعلم بذكاء، تفوق بثقة!'),
            marqueeText: overrideMentora(t.marqueeText, 'أهلاً وسهلاً بجميع الطلاب في Mentora! نتمنى لكم التوفيق والنجاح.'),
            platformName: overrideMentora(t.platformName, 'Mentora'),
            contactPhone: t.contactPhone || '01000000000',
            supportEmail: t.supportEmail || 'support@mentora.com'
        };
    },
`;

// Replace getTheme and getSiteTexts definitions in db.ts
// We'll replace the block from "getTheme: () => {" down to the end of getSiteTexts.
// Let's do it with a targeted regex or split.

const parts = content.split('// ---- Theme & Customization ----');
if (parts.length > 1) {
    const afterTheme = parts[1];
    const endOfSiteTexts = afterTheme.indexOf('getStudents:'); // or whatever comes next
    if (endOfSiteTexts !== -1) {
        // We'll just replace getTheme and getSiteTexts safely
        content = content.replace(/getTheme: \(\) => \{[\s\S]*?getSiteTexts: \(\): SiteTexts => \{[\s\S]*?return \{[\s\S]*?\};\n    \},/, interceptLogic.trim() + ',');
        fs.writeFileSync('src/services/db.ts', content);
        console.log('Successfully intercepted db.ts for theme and texts');
    }
}
