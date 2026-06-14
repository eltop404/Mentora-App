const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zcnomkgzlmdtccnnxawg.supabase.co';
const supabaseKey = 'sb_publishable_jhLCcHAfnDKRqcgYR4zAxA_RM93kOgN';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data, error } = await supabase
            .from('site_data')
            .select('value')
            .eq('key', 'nt_deleted_students')
            .single();

        if (error) {
            console.error("Error fetching deleted:", error);
            return;
        }

        console.log("Deleted student IDs in Supabase:", JSON.parse(data.value));

    } catch (e) {
        console.error("Exception occurred:", e);
    }
}

run();
