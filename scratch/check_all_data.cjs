const Database = require('better-sqlite3');
const db = new Database('nt_database.db');

// Get all keys
const rows = db.prepare("SELECT * FROM nt_data").all();
rows.forEach(row => {
    if (row.key === 'nt_students') {
        const students = JSON.parse(row.value);
        console.log("=== Active Students in nt_students ===");
        students.forEach(s => {
            console.log(`- Username: ${s.username}, ID: ${s.id}, Code: ${s.referral_code}, RefBy: ${s.referred_by}, RefByID: ${s.referred_by_id}, RefCount: ${s.referral_count}`);
        });
    }
    if (row.key === 'nt_deleted_students') {
        console.log("=== Deleted Students IDs ===", JSON.parse(row.value));
    }
});
