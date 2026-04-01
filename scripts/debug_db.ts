import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../src/utils/supabase/info';

const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
);

async function checkSchools() {
    console.log('Checking schools...');

    // Get Schools
    const { data: schools, error: sError } = await supabase
        .from('schools')
        .select('id, name, is_active')
        .eq('is_active', true);

    if (sError) {
        console.error('Error fetching schools:', sError);
        return;
    }

    if (!schools || schools.length === 0) {
        console.log('No active schools found.');
    } else {
        console.log(`Found ${schools.length} active schools:`);
        schools.forEach(school => {
            console.log(`- ${school.name} (${school.id})`);
        });
    }
}

checkSchools();
