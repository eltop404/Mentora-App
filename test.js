const https = require('https');

const url = 'https://ylrttsfaffaghztlihbq.supabase.co/rest/v1/site_data?select=*';
const key = 'sb_publishable_c07bWn4Xxsn4R3-MBaTepA_iGOZBRml';

const options = {
    headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json'
    }
};

https.get(url, options, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            const keys = ['nt_content', 'nt_booklets', 'nt_courses', 'nt_lessons'];
            keys.forEach(k => {
                const row = data.find(d => d.key === k);
                if (row && row.value) {
                    let parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
                    console.log('--- ' + k + ' (' + parsed.length + ' items) ---');
                    if (parsed.length > 0) {
                        const breakdown = parsed.map(x => `${x.stage} | ${x.year} | ${x.semester} | ${x.unit}`);
                        console.log([...new Set(breakdown)].map(s => `  ${s} = ${breakdown.filter(x => x === s).length}x`).join('\n'));
                    }
                } else {
                    console.log('--- ' + k + ' (0 items) ---');
                }
            });
        } catch (e) {
            console.error('Error parsing:', e.message);
        }
    });
}).on('error', e => console.error(e));
