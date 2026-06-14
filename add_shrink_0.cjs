const fs = require('fs');
let files = ['src/App.tsx', 'src/components/AdminDashboard.tsx'];
files.forEach(f => {
    try {
        let c = fs.readFileSync(f, 'utf8');
        c = c.replace(/className="([^"]*rounded-full[^"]*)"/g, (m, p1) => {
            if (p1.includes('shrink-0')) return m;
            return 'className="' + p1 + ' shrink-0"';
        });
        fs.writeFileSync(f, c);
    } catch (e) { console.error(e); }
});
console.log('done shrink-0');
