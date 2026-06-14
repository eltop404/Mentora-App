const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<UnitsSection\s*user=\{\{\s*stage: user\.level === 'إعدادية' \? 'إعدادي' : 'ثانوي',\s*year: user\.year,\s*semester: user\.semester\s*\}\}/;

const replacement = `<UnitsSection
                  user={{
                    stage: user.level,
                    year: user.year,
                    specialization: user.specialization,
                    semester: user.semester
                  }}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed UnitsSection user prop');
