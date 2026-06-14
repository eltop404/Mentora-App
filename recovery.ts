
import Database from 'better-sqlite3';
import fs from 'fs';

try {
    const db = new Database('nt_database.db');
    const rows = db.prepare('SELECT * FROM nt_data').all();
    const data: Record<string, any> = {};
    rows.forEach((r: any) => {
        try {
            data[r.key] = JSON.parse(r.value);
        } catch (e) {
            data[r.key] = r.value;
        }
    });
    fs.writeFileSync('recovery_dump.json', JSON.stringify(data, null, 2));
    console.log('✅ Recovery success. Found keys:', Object.keys(data));
} catch (e: any) {
    console.error('❌ Recovery failed:', e.message);
}
