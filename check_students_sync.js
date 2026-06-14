const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ylrttsfaffaghztlihbq.supabase.co';
const supabaseAnonKey = 'sb_publishable_c07bWn4Xxsn4R3-MBaTepA_iGOZBRml';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStudents() {
    const { data, error } = await supabase
        .from('site_data')
        .select('key, value')
        .in('key', ['nt_students', 'nt_deleted_student_ids']);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    const studentsRaw = data.find(d => d.key === 'nt_students')?.value;
    const deletedRaw = data.find(d => d.key === 'nt_deleted_student_ids')?.value;

    const students = typeof studentsRaw === 'string' ? JSON.parse(studentsRaw) : (studentsRaw || []);
    const deletedIds = typeof deletedRaw === 'string' ? JSON.parse(deletedRaw) : (deletedRaw || []);

    console.log('--- Students ---');
    students.forEach(s => {
        if (s.year === 'أولى إعدادي' && s.semester === 'الفصل الدراسي الأول') {
            console.log(`ID: ${s.id}, Name: ${s.username}, Year: ${s.year}, Semester: ${s.semester}, isDeleted: ${s.isDeleted}`);
        }
    });

    console.log('\n--- Deleted IDs ---');
    console.log(deletedIds);
}

checkStudents();
