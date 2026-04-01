import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../src/utils/supabase/info';

const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
);

async function createTransaction() {
    const parentId = '750e8400-e29b-41d4-a716-446655440001';
    const studentId = '850e8400-e29b-41d4-a716-446655440001'; // Louis Siwale

    // 1. Get Student details
    const { data: student, error: sError } = await supabase
        .from('students')
        .select('name, school_id')
        .eq('id', studentId)
        .single();

    if (sError || !student) {
        console.error('Error fetching student:', sError);
        return;
    }

    // 2. Get Parent phone
    const { data: parent, error: pError } = await supabase
        .from('parents')
        .select('phone')
        .eq('id', parentId)
        .single();

    if (pError || !parent) {
        console.error('Error fetching parent:', pError);
        return;
    }

    // 3. Get School name
    const { data: school, error: scError } = await supabase
        .from('schools')
        .select('name')
        .eq('id', student.school_id)
        .single();

    if (scError || !school) {
        console.error('Error fetching school:', scError);
        return;
    }

    console.log('Found Student:', student.name, 'Parent Phone:', parent.phone, 'School:', school.name);

    const paymentHistoryEntry = {
        parent_phone: parent.phone,
        student_name: student.name,
        school_name: school.name,
        services: [{
            description: 'Tuition Fees Term 1',
            amount: 1500,
            invoiceNo: 'TEST-001'
        }],
        total_amount: 1500,
        service_fee: 0,
        final_amount: 1500,
        reference: 'TEST-TX-' + Date.now(),
        status: 'completed',
        term: 1,
        academic_year: 2024,
        payment_date: new Date().toISOString()
    };

    console.log('Inserting payment history:', paymentHistoryEntry);

    const { data, error } = await supabase
        .from('payment_history')
        .insert([paymentHistoryEntry])
        .select();

    if (error) {
        console.error('Error inserting payment history:', error);
    } else {
        console.log('Payment history inserted successfully:', data);
    }
}

createTransaction();
