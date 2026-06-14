const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zcnomkgzlmdtccnnxawg.supabase.co';
const supabaseKey = 'sb_publishable_jhLCcHAfnDKRqcgYR4zAxA_RM93kOgN';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data, error } = await supabase
            .from('site_data')
            .select('value')
            .eq('key', 'nt_activity_logs_NT-26-PREP-1-RVDKC-VMUQ63')
            .single();

        if (error) {
            console.error("Error fetching logs:", error);
            return;
        }

        console.log("Logs in Supabase:", JSON.parse(data.value));

    } catch (e) {
        console.error("Exception occurred:", e);
    }
}

run();
