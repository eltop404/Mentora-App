const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/services/db.ts');
let content = fs.readFileSync(file, 'utf8');

// Add KEY
content = content.replace(
    /PARENTS: 'nt_parents',/,
    `PARENTS: 'nt_parents',\n    SUB_ADMINS: 'nt_sub_admins',`
);

// Add interface and default data
const newMethods = `

export interface SubAdminConfig {
    id?: string;
    user: string;
    pass: string;
    year: string;
    division: string;
    spec: string;
}

const DEFAULT_SUB_ADMINS: SubAdminConfig[] = [
      { user: 'admin', pass: 'euxsuwA468Sdj', year: 'الفرقة الأولى', division: 'اعمال دوليه IB', spec: '' },
      { user: 'admin', pass: 'qjxxhWucyccy4435sh', year: 'الفرقة الأولى', division: 'نظم المعلومات BIS', spec: '' },
      { user: 'admin', pass: 'Chdsjfj464dkdj', year: 'الفرقة الثانية', division: 'اعمال دوليه IB', spec: '' },
      { user: 'admin', pass: 'cjdhf644Awue', year: 'الفرقة الثانية', division: 'نظم المعلومات BIS', spec: '' },
      { user: 'admin', pass: 'QJXJFFH5674quayh', year: 'الفرقة الثالثة', division: 'اعمال دوليه IB', spec: 'محاسبة' },
      { user: 'admin', pass: 'vjddh434shsSf', year: 'الفرقة الثالثة', division: 'اعمال دوليه IB', spec: 'تمويل' },
      { user: 'admin', pass: 'Wugcud565fuxshs', year: 'الفرقة الثالثة', division: 'نظم المعلومات BIS', spec: 'نظم المعلومات' },
      { user: 'admin', pass: 'Mduzshd568zhsw', year: 'الفرقة الرابعة', division: 'اعمال دوليه IB', spec: 'محاسبة' },
      { user: 'admin', pass: 'vjsjd5656Sufudgc', year: 'الفرقة الرابعة', division: 'اعمال دوليه IB', spec: 'تمويل' },
      { user: 'admin', pass: 'Hjsjshs56868msjdd', year: 'الفرقة الرابعة', division: 'نظم المعلومات BIS', spec: 'نظم المعلومات' },
];

export const DB = {
    getSubAdmins: (): SubAdminConfig[] => {
        const stored = safeParse<SubAdminConfig[]>(Storage.getItem(KEYS.SUB_ADMINS), []);
        if (stored.length === 0) {
            return DEFAULT_SUB_ADMINS;
        }
        return stored;
    },
    saveSubAdmins: (admins: SubAdminConfig[]) => {
        Storage.setItem(KEYS.SUB_ADMINS, JSON.stringify(admins));
        realtimeService.emit('sub_admins_updated', admins);
    },
`;

content = content.replace(/export const DB = \{/, newMethods);

fs.writeFileSync(file, content, 'utf8');
