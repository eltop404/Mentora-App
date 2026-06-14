const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zcnomkgzlmdtccnnxawg.supabase.co';
const supabaseKey = 'sb_publishable_jhLCcHAfnDKRqcgYR4zAxA_RM93kOgN';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data, error } = await supabase
            .from('site_data')
            .select('value')
            .eq('key', 'nt_students')
            .single();

        if (error) {
            console.error("Error fetching students:", error);
            return;
        }

        const students = JSON.parse(data.value);
        console.log(`Total students in Supabase: ${students.length}`);
        
        // Print all students
        students.forEach(s => {
            console.log(`Student: ${s.username} (ID: ${s.id})`);
            console.log(`  Referral Code: ${s.referral_code}`);
            console.log(`  Referred By: ${s.referred_by}`);
            console.log(`  Referred By ID: ${s.referred_by_id}`);
            console.log(`  Referral Count: ${s.referral_count}`);
            console.log(`  Coins: ${s.coins}, Points: ${s.points}`);
            console.log(`  Deleted: ${s.isDeleted}`);
            console.log('-----------------------------------');
        });

    } catch (e) {
        console.error("Exception occurred:", e);
    }
}

run();
