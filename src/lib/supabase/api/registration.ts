// Registration API - v2.2 (Stability & Sync Refactor)
import { supabase } from '../client';
import type { ParentData } from '../../../components/registration/ParentInformationPage';

export interface StudentData {
    id: string;
    name: string;
    grade: string;
    class: string;
    studentId: string;
    parentName?: string;
    otherParentName?: string;
}

/**
 * Search for students by name or admission number.
 */
export async function searchStudentsByName(query: string, schoolId?: string): Promise<StudentData[]> {
    if (!query || query.trim().length < 2) return [];

    const parts = query.trim().split(/\s+/);
    let supabaseQuery = supabase
        .from('students')
        .select(`
            student_id,
            first_name,
            last_name,
            school_id,
            admission_number,
            student_grade (
                class,
                is_active,
                grades (
                    grade_name
                )
            ),
            parent:parents!student_parent_id_fkey (
                first_name,
                last_name
            ),
            other_parent:parents!student_other_parent_id_fkey (
                first_name,
                last_name
            )
        `);

    if (parts.length >= 2) {
        supabaseQuery = supabaseQuery
            .ilike('first_name', `%${parts[0]}%`)
            .ilike('last_name', `%${parts.slice(1).join(' ')}%`);
    } else {
        supabaseQuery = supabaseQuery
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`);
    }

    if (schoolId) {
        supabaseQuery = supabaseQuery.eq('school_id', schoolId);
    }

    const { data, error } = await supabaseQuery.limit(10);
    if (error) {
        console.error('Error searching students:', error);
        return [];
    }

    return (data || []).map(s => {
        const studentGrades = (s as any).student_grade || [];
        const activeGrade = studentGrades.find((sg: any) => sg.is_active) || studentGrades[0];
        const p1 = (s as any).parent;
        const p2 = (s as any).other_parent;
        const primaryParent = p1 ? `${p1.first_name} ${p1.last_name}`.trim() : undefined;
        const secondaryParent = p2 ? `${p2.first_name} ${p2.last_name}`.trim() : undefined;
        
        return {
            id: s.student_id,
            name: `${s.first_name} ${s.last_name}`,
            grade: activeGrade?.grades?.grade_name || 'Unknown',
            class: activeGrade?.class || 'A',
            studentId: s.admission_number || 'Pending',
            parentName: primaryParent,
            otherParentName: secondaryParent
        };
    });
}

/**
 * Register a parent or find an existing one.
 */
export interface RegisterParentResult {
    parentId: string;
    isExisting: boolean;
    existingName?: string;
    isNameMatch?: boolean;
}

export async function registerParent(parentData: ParentData): Promise<RegisterParentResult> {
    console.log('[Registration] Registering parent:', { phone: parentData.phone });
    
    // 1. Phone-based duplicate detection (Essential for Zambia)
    const cleanPhone = parentData.phone.replace(/\D/g, '');
    const variants = [cleanPhone];
    if (cleanPhone.startsWith('260')) variants.push(cleanPhone.substring(3));
    if (!cleanPhone.startsWith('0') && !cleanPhone.startsWith('26')) variants.push(`0${cleanPhone}`);
    if (cleanPhone.startsWith('0')) variants.push(cleanPhone.substring(1));
    const safeVariants = variants.filter(v => v.length >= 9);

    const { data: phoneMatch, error: phoneErr } = await supabase
        .from('parents')
        .select('parent_id, first_name, last_name')
        .in('phone_number', safeVariants)
        .limit(1)
        .maybeSingle();

    if (phoneMatch) {
        const existingName = `${phoneMatch.first_name} ${phoneMatch.last_name}`.trim();
        const isNameMatch = parentData.fullName.trim().toLowerCase() === existingName.toLowerCase();
        return { parentId: phoneMatch.parent_id, isExisting: true, existingName, isNameMatch };
    }

    // 2. Email-based fallback
    const trimmedEmail = parentData.email.trim();
    if (trimmedEmail) {
        const { data: emailMatch } = await supabase
            .from('parents')
            .select('parent_id, first_name, last_name')
            .eq('email', trimmedEmail)
            .limit(1)
            .maybeSingle();
        
        if (emailMatch) {
            const existingName = `${emailMatch.first_name} ${emailMatch.last_name}`.trim();
            return { parentId: emailMatch.parent_id, isExisting: true, existingName };
        }
    }

    // 3. Create new account
    const nameParts = parentData.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data, error } = await supabase
        .from('parents')
        .insert({
            first_name: firstName,
            last_name: lastName,
            email: trimmedEmail || null,
            phone_number: parentData.phone,
            created_at: new Date().toISOString()
        })
        .select('parent_id')
        .single();

    if (error) throw new Error(`Failed to create account: ${error.message}`);
    return { parentId: data.parent_id, isExisting: false };
}

/**
 * Linking students and grades.
 */
export async function linkStudentsToParent(parentId: string, students: StudentData[], schoolId: string): Promise<void> {
    console.log('[Registration] Linking students process started');
    
    // Fetch grades and academic year
    const [{ data: schoolGrades }, { data: academicYear }] = await Promise.all([
        supabase.from('grades').select('grade_id, grade_name').eq('school_id', schoolId),
        supabase.from('academic_year').select('academic_year_id').order('year', { ascending: false }).limit(1).maybeSingle()
    ]);

    if (!academicYear) throw new Error('No active academic year found.');
    const gradeMap = new Map((schoolGrades || []).map(g => [g.grade_name.toLowerCase(), g.grade_id]));

    for (const student of students) {
        const nameParts = student.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        const targetGradeId = gradeMap.get(student.grade.trim().toLowerCase()) || null;

        let student_id = student.id;

        if (student.id.startsWith('new-')) {
            // New student creation
            const { data: newS, error: sErr } = await supabase
                .from('students')
                .insert({
                    school_id: schoolId,
                    parent_id: parentId,
                    first_name: firstName,
                    last_name: lastName,
                    date_of_enrollment: new Date().toISOString().split('T')[0]
                })
                .select('student_id')
                .single();
            if (sErr) throw sErr;
            student_id = newS.student_id;
        } else {
            // Update links for existing
            await supabase.from('students')
                .update({ parent_id: parentId, first_name: firstName, last_name: lastName })
                .eq('student_id', student.id);
        }

        // Grade Assignment
        if (targetGradeId) {
            let targetStreamId: string | null = null;
            if (student.class && student.class !== 'General') {
                const { data: stream } = await supabase.from('school_streams')
                    .select('id').eq('school_id', schoolId).eq('grade_id', targetGradeId).eq('stream_name', student.class).maybeSingle();
                targetStreamId = stream?.id || null;
            }

            const gradeEntry = {
                student_id,
                grade_id: targetGradeId,
                academic_year_id: academicYear.academic_year_id,
                class: student.class || 'A',
                is_active: true,
                school_id: schoolId,
                stream_id: targetStreamId
            };

            await supabase.from('student_grade').upsert(gradeEntry, { onConflict: 'student_id, academic_year_id' });
        }
    }
}

export async function getGradesBySchool(schoolId: string) {
    const { data } = await supabase.from('grades').select('grade_id, grade_name').eq('school_id', schoolId).eq('is_active', true).order('display_order');
    return data || [];
}

export async function getClassesByGrade(schoolId: string, gradeId: string) {
    const { data } = await supabase.from('school_streams').select('stream_name').eq('school_id', schoolId).eq('grade_id', gradeId).eq('is_active', true);
    return (data || []).map(s => s.stream_name);
}

/**
 * THE GOLDEN FINANCIAL SUMMARY
 * Canonical source for student balances, ledger audits, and double-invoicing protection.
 */
export async function getStudentFinancialSummary(studentId: string): Promise<any> {
    try {
        const [studentResp, invoicesResp, transactionsResp, feeItemsResp] = await Promise.all([
            supabase.from('students').select('student_id, school_id, first_name, last_name, admission_number, student_grade(grade_id, grade:grades(grade_name, grade_id))').eq('student_id', studentId).single(),
            supabase.from('invoices').select('*').eq('student_id', studentId).neq('status', 'void'),
            supabase.from('transactions').select('*').eq('student_id', studentId).in('status', ['success', 'successful', 'completed']),
            supabase.from('fee_items').select('*, category:fee_categories(category)').eq('is_active', true)
        ]);

        const student = studentResp.data;
        if (!student) return null;

        const invoices = invoicesResp.data || [];
        const transactions = transactionsResp.data || [];
        const feeItems = feeItemsResp.data || [];

        const studentGrades = (student.student_grade as any[]) || [];
        const activeGradeData = studentGrades.find(sg => sg.is_active) || studentGrades[studentGrades.length - 1];
        const activeGradeId = activeGradeData?.grade?.grade_id || activeGradeData?.grade_id;

        const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number((inv as any).total_amount_cached || inv.total_amount || 0)), 0);
        const totalPaid = transactions.reduce((sum, tx) => sum + (Number(tx.amount || 0)), 0);

        const invoiceItems = invoices.map(inv => {
            const invId = (inv as any).invoice_id || inv.id;
            let invName = inv.service_name;
            if (!invName && inv.invoice_items?.items && Array.isArray(inv.invoice_items.items)) {
                const firstItem = inv.invoice_items.items[0];
                invName = firstItem.description || firstItem.name;
            }
            if (!invName) invName = 'School Fee Payment';
            const total = Number((inv as any).total_amount_cached || inv.total_amount || 0);
            
            const paid = transactions.filter(tx => {
                const metaService = tx.metadata?.service_name || (tx as any).meta_data?.service_name;
                const reason = tx.reason || (tx as any).meta_data?.reason || '';
                
                return tx.invoice_id === invId || 
                       metaService === invName || 
                       reason.includes(invName) ||
                       (invName === 'School Fee Payment' && !tx.invoice_id && !metaService);
            }).reduce((sum, tx) => sum + (Number(tx.amount || 0)), 0);

            return {
                type: 'invoice',
                invoice_id: invId,
                name: invName,
                description: inv.invoice_items?.items?.[0]?.description || invName,
                invoice_number: inv.invoice_number,
                expected: total,
                collected: paid,
                balance: Math.max(0, total - paid),
                status: (total - paid <= 0) ? 'paid' : inv.status,
                term: inv.term,
                initiated_at: inv.created_at
            };
        });

        const activeBalanceSum = invoiceItems.reduce((sum, item) => sum + item.balance, 0);

        // Term Locking Map
        const termServiceMap: Record<number, string[]> = {};
        invoiceItems.forEach(inv => {
            if (inv.term) {
                if (!termServiceMap[inv.term]) termServiceMap[inv.term] = [];
                termServiceMap[inv.term].push(inv.name.toLowerCase());
            }
        });

        const netBalance = totalInvoiced - totalPaid;

        return {
            student: { id: student.student_id, name: `${student.first_name} ${student.last_name}`, grade: activeGradeData?.grade?.grade_name, admission_number: student.admission_number, active_grade_id: activeGradeId },
            items: invoiceItems,
            termServiceMap,
            totalInvoiced,
            totalPaid,
            totalBalance: activeBalanceSum,
            netBalanceRaw: netBalance,
            surplus: netBalance < 0 ? Math.abs(netBalance) : 0,
            reconciledAt: new Date().toISOString(),
            transactions
        };
    } catch (e) {
        console.error('getStudentFinancialSummary failed:', e);
        return null;
    }
}
