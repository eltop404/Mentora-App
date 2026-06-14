const Database = require('better-sqlite3');
const db = new Database('nt_database.db');
const row = db.prepare("SELECT value FROM nt_data WHERE key = 'nt_students'").get();
if (row) {
    const students = JSON.parse(row.value);
    console.log("Total students:", students.length);
    students.forEach(s => {
        console.log(`Student: ${s.username} (ID: ${s.id})`);
        console.log(`  Referral Code: ${s.referral_code}`);
        console.log(`  Referred By: ${s.referred_by}`);
        console.log(`  Referred By ID: ${s.referred_by_id}`);
        console.log(`  Referral Count: ${s.referral_count}`);
        console.log(`  Coins: ${s.coins}, Points: ${s.points}`);
        console.log(`  Deleted: ${s.isDeleted}`);
    });
} else {
    console.log("No nt_students key found in database!");
}
