// Registration API - v2.1 (Fixed smart class lookup)
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

export interface DbStudent {
    student_id: string;
    first_name: string;
    last_name: string;
    grade: string;
    class: string;
    school_id: string;
}

export async function searchStudentsByName(query: string, schoolId?: string): Promise<StudentData[]> {
    if (!query || query.trim().length < 2) return [];

    // Split on whitespace so "John Banda" searches first_name=John AND last_name=Banda
    // rather than looking for the literal string "John Banda" in a single column
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
        // Multi-word query: first word → first_name, rest → last_name
        supabaseQuery = supabaseQuery
            .ilike('first_name', `%${parts[0]}%`)
            .ilike('last_name', `%${parts.slice(1).join(' ')}%`);
    } else {
        // Single word: match first_name, last_name, or admission number
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

export interface RegisterParentResult {
    parentId: string;
    isExisting: boolean;       // true = we found a matching account in the DB
    existingName?: string;     // the name on the existing account, so we can show a confirmation
    isNameMatch?: boolean;      // true = the name we have matches exactly (safe to auto-merge)
}

export async function registerParent(parentData: ParentData): Promise<RegisterParentResult> {
    console.log('[Registration] Registering parent:', { email: parentData.email, phone: parentData.phone });
    
    // 1. Check if parent already exists by PHONE NUMBER (primary identifier).
    //
    // WHY PHONE-ONLY:
    //   In Zambia, family members commonly share email addresses. Using email
    //   alone to detect duplicates would incorrectly link a new parent (e.g. a
    //   mother) to an existing account (e.g. the father) just because they share
    //   a family email. Phone numbers are unique to individuals, so we use them
    //   as the sole identifier for duplicate detection.

    let existingParent: { parent_id: string; first_name: string; last_name: string } | null = null;
    let lookupError: any = null;

    const cleanPhone = parentData.phone.replace(/\D/g, '');
    const variants = [cleanPhone];
    if (cleanPhone.startsWith('260')) variants.push(cleanPhone.substring(3));
    if (!cleanPhone.startsWith('0') && !cleanPhone.startsWith('26')) variants.push(`0${cleanPhone}`);
    if (cleanPhone.startsWith('0')) variants.push(cleanPhone.substring(1));
    
    // Filter out any short strings to prevent accidental broad matches
    const safeVariants = variants.filter(v => v.length >= 9);
    console.log('[Registration] Phone variants to check:', safeVariants);

    if (safeVariants.length > 0) {
        const { data: phoneMatch, error: phoneErr } = await supabase
            .from('parents')
            .select('parent_id, first_name, last_name')
            .in('phone_number', safeVariants)
            .limit(1)
            .maybeSingle();
        
        if (phoneErr) {
            console.error('[Registration] Phone lookup error:', phoneErr);
            lookupError = phoneErr;
        }
        if (phoneMatch) {
            existingParent = phoneMatch;
            console.log('[Registration] Found existing parent by phone:', phoneMatch.parent_id);
        }
    }

    // 2. Secondary check: email (only if phone didn't match)
    //    This catches cases where a different family member already registered
    //    with the same email. The UI will show a modal so the user can confirm
    //    or choose to create a new account anyway.
    if (!existingParent) {
        const trimmedEmail = parentData.email.trim();
        if (trimmedEmail) {
            const { data: emailMatch, error: emailErr } = await supabase
                .from('parents')
                .select('parent_id, first_name, last_name')
                .eq('email', trimmedEmail)
                .limit(1)
                .maybeSingle();
            
            if (emailErr) {
                console.error('[Registration] Email lookup error:', emailErr);
            }
            if (emailMatch) {
                existingParent = emailMatch;
                console.log('[Registration] Found existing parent by email:', emailMatch.parent_id);
            }
        }
    }

    if (lookupError) {
        console.error('[Registration] Parent lookup error:', lookupError);
        throw new Error('Failed to verify parent account');
    }

    // Return with a flag so the UI can ask the parent to confirm it's them
    if (existingParent) {
        console.log('[Registration] Found existing parent:', existingParent.parent_id);
        const existingName = `${existingParent.first_name} ${existingParent.last_name}`.trim();
        
        // Name match check - normalize both to compare
        const normalizedInput = parentData.fullName.trim().toLowerCase();
        const normalizedExisting = existingName.toLowerCase();
        const isNameMatch = normalizedInput === normalizedExisting;
        
        console.log('[Registration] Name match check:', { normalizedInput, normalizedExisting, isNameMatch });
        
        return { 
            parentId: existingParent.parent_id, 
            isExisting: true, 
            existingName,
            isNameMatch 
        };
    }

    console.log('[Registration] Creating new parent account...');

    // 2. Parse name
    const nameParts = parentData.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // 3. Create new parent
    const { data, error } = await supabase
        .from('parents')
        .insert({
            first_name: firstName,
            last_name: lastName,
            email: parentData.email.trim() || null,
            phone_number: parentData.phone,
            created_at: new Date().toISOString()
        })
        .select('parent_id')
        .single();

    if (error) {
        console.error('[Registration] Error creating parent:', error);
        throw new Error(`Failed to create account: ${error.message}`);
    }

    console.log('[Registration] Successfully created parent:', data.parent_id);
    return { parentId: data.parent_id, isExisting: false };
}

// Helper to generate next ID
async function getNextStudentId(): Promise<string> {
    // We need to find the highest number after 'TEC'
    // A simple order by admission_number might fail because 'TEC9' > 'TEC10' alphabetically
    const { data, error } = await supabase
        .from('students')
        .select('admission_number')
        .like('admission_number', 'TEC%')
        .order('admission_number', { ascending: false }); // We'll filter in JS to be safe

    if (error || !data || data.length === 0) {
        return 'TEC1000'; // Start base
    }

    // Extract numbers and find the max
    const numbers = data
        .map(s => {
            const match = s.admission_number?.match(/TEC(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));

    if (numbers.length === 0) return 'TEC1000';

    const maxId = Math.max(...numbers);
    return `TEC${maxId}`;
}

export async function linkStudentsToParent(parentId: string, students: StudentData[], schoolId: string): Promise<void> {
    console.log('[Registration] Linking students:', { parentId, studentCount: students.length, schoolId });
    
    // 1. Get all grades for this school to map names to IDs
    const { data: schoolGrades, error: gradesError } = await supabase
        .from('grades')
        .select('grade_id, grade_name')
        .eq('school_id', schoolId);

    if (gradesError) {
        console.error('[Registration] Error fetching grades:', gradesError);
        throw new Error('Failed to fetch school grades');
    }

    const gradeMap = new Map((schoolGrades || []).map(g => [g.grade_name.toLowerCase(), g.grade_id]));
    console.log(`[Registration] Found ${schoolGrades?.length || 0} grades for school`);

    // 2. Get the current academic year
    const { data: academicYear, error: ayError } = await supabase
        .from('academic_year')
        .select('academic_year_id')
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (ayError || !academicYear) {
        console.error('[Registration] Academic year error:', ayError || 'No academic year found');
        throw new Error('Could not find an active academic year. Please contact support.');
    }
    console.log('[Registration] Using academic year:', academicYear.academic_year_id);

    // 3. Get the base ID once if we have new students
    const hasNewStudents = students.some(s => s.id.startsWith('new-'));
    let nextIdNum = 0;

    if (hasNewStudents) {
        const lastId = await getNextStudentId();
        nextIdNum = parseInt(lastId.replace('TEC', ''), 10) + 1; // Start from next available
        console.log(`[Registration] Starting new student IDs from TEC${nextIdNum}`);
    }

    // 4. Process all students
    for (const student of students) {
        console.log(`[Registration] Processing student: ${student.name} (${student.id})`);
        const nameParts = student.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const gradeName = student.grade.trim();
        const targetGradeId = gradeMap.get(gradeName.toLowerCase()) || null;

        let student_id = student.id;

        if (student.id.startsWith('new-')) {
            const admissionNumber = `TEC${nextIdNum}`;
            nextIdNum++;

            const { data: newStudent, error } = await supabase
                .from('students')
                .insert({
                    school_id: schoolId,
                    parent_id: parentId,
                    first_name: firstName,
                    last_name: lastName,
                    admission_number: admissionNumber,
                    date_of_enrollment: new Date().toISOString().split('T')[0]
                })
                .select('student_id')
                .single();

            if (error || !newStudent) {
                console.error(`[Registration] Error creating student ${student.name}:`, error);
                throw new Error(`Failed to create student ${student.name}: ${error?.message}`);
            }
            student_id = newStudent.student_id;
            console.log(`[Registration] Created new student: ${student.name} (UUID: ${student_id}, Admission: ${admissionNumber}) for parent: ${parentId}`);
        } else {
            // Existing student, handle multiple parents
            console.log(`[Registration] Updating links for existing student: ${student.name} (ID: ${student.id}) to parent: ${parentId}`);
            const { data: currentStudent, error: fetchError } = await supabase
                .from('students')
                .select('parent_id, other_parent_id')
                .eq('student_id', student.id)
                .maybeSingle();

            if (fetchError) {
                console.error(`[Registration] Error fetching existing student ${student.id}:`, fetchError);
                throw new Error(`Failed to verify student ${student.name}`);
            }

            if (currentStudent) {
                const isAlreadyLinked = currentStudent.parent_id === parentId || currentStudent.other_parent_id === parentId;
                
                if (!isAlreadyLinked) {
                    const updateData: any = {
                        first_name: firstName,
                        last_name: lastName
                    };

                    if (!currentStudent.parent_id) {
                        updateData.parent_id = parentId;
                    } else if (!currentStudent.other_parent_id) {
                        updateData.other_parent_id = parentId;
                    } else {
                        updateData.parent_id = parentId;
                    }

                    const { error } = await supabase
                        .from('students')
                        .update(updateData)
                        .eq('student_id', student.id);

                    if (error) {
                        console.error(`[Registration] Error updating student ${student.id}:`, error);
                        throw new Error(`Failed to update student ${student.name}: ${error.message}`);
                    }
                } else {
                    await supabase
                        .from('students')
                        .update({ first_name: firstName, last_name: lastName })
                        .eq('student_id', student.id);
                }
            }
        }

        // 5. Update/Insert grade assignment if we have a grade
        if (targetGradeId) {
            console.log(`[Registration] Assigning grade ${targetGradeId} to student ${student_id}`);
            let targetStreamId: string | null = null;
            if (student.class && student.class !== 'General') {
                const { data: streamData } = await supabase
                    .from('school_streams')
                    .select('id')
                    .eq('school_id', schoolId)
                    .eq('grade_id', targetGradeId)
                    .eq('stream_name', student.class)
                    .maybeSingle();
                
                targetStreamId = streamData?.id || null;
            }

            const { data: existingGrade } = await supabase
                .from('student_grade')
                .select('student_grade_id')
                .eq('student_id', student_id)
                .eq('academic_year_id', academicYear.academic_year_id)
                .maybeSingle();

            const gradeEntry = {
                student_id: student_id,
                grade_id: targetGradeId,
                academic_year_id: academicYear.academic_year_id,
                class: student.class || 'A',
                is_active: true,
                school_id: schoolId,
                stream_id: targetStreamId
            };

            if (existingGrade) {
                const { error: updateError } = await supabase
                    .from('student_grade')
                    .update(gradeEntry)
                    .eq('student_grade_id', existingGrade.student_grade_id);
                
                if (updateError) {
                    console.error('[Registration] Error updating grade:', updateError);
                    throw new Error('Failed to update student grade');
                }
            } else {
                const { error: insertError } = await supabase
                    .from('student_grade')
                    .insert(gradeEntry);
                
                if (insertError) {
                    console.error('[Registration] Error inserting grade:', insertError);
                    throw new Error('Failed to create student grade enrollment');
                }
            }
        }
    }
    console.log('[Registration] Student linking completed successfully');
}

export interface SchoolGrade {
    grade_id: string;
    grade_name: string;
}

export async function getGradesBySchool(schoolId: string): Promise<SchoolGrade[]> {
    const { data, error } = await supabase
        .from('grades')
        .select('grade_id, grade_name')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching grades:', error);
        return []; 
    }

    return (data || []).map(g => ({
        grade_id: g.grade_id,
        grade_name: g.grade_name
    }));
}

export async function getClassesByGrade(schoolId: string, gradeId: string): Promise<string[]> {
    // 1. First attempt: Fetch configured streams for this grade ID
    const { data: streamData, error: streamError } = await supabase
        .from('school_streams')
        .select('stream_name')
        .eq('school_id', schoolId)
        .eq('grade_id', gradeId)
        .eq('is_active', true)
        .order('stream_name', { ascending: true });

    if (!streamError && streamData && streamData.length > 0) {
        const uniqueClasses = Array.from(new Set(streamData.map(s => s.stream_name)));
        return uniqueClasses;
    }

    // 2. Fallback: If no streams configured, infer from existing students
    const { data: studentGrades, error: sgError } = await supabase
        .from('student_grade')
        .select('class')
        .eq('grade_id', gradeId)
        .eq('is_active', true);

    if (!sgError && studentGrades && studentGrades.length > 0) {
        const inferredClasses = Array.from(new Set(studentGrades.map(sg => sg.class).filter(c => c && c.trim() !== '')));
        // Return sorted alphabetically
        return inferredClasses.sort((a, b) => a.localeCompare(b));
    }

    // 3. Absolute fallback returns empty array, which UI handles as "General"
    return [];
}

export async function getStudentFinancialSummary(studentId: string): Promise<any> {
    try {
        const [
            studentResp,
            invoicesResp,
            transactionsResp,
            enrollmentsResp,
            feeItemsResp
        ] = await Promise.all([
            supabase.from('students').select('student_id, school_id, first_name, last_name, admission_number, student_grade(grade_id, grade:grades(grade_name, grade_id))').eq('student_id', studentId).single(),
            supabase.from('invoices').select('*').eq('student_id', studentId).neq('status', 'void'),
            supabase.from('transactions').select('*').eq('student_id', studentId).in('status', ['success', 'successful', 'completed']),
            supabase.from('student_fee_enrollments').select('*, fee_items(*)').eq('student_id', studentId).eq('is_active', true),
            supabase.from('fee_items').select('*, category:fee_categories(category)').eq('is_active', true)
        ]);

        const student = studentResp.data;
        const invoices = invoicesResp.data || [];
        const transactions = transactionsResp.data || [];
        const _enrollments = enrollmentsResp.data || [];
        const feeItems = feeItemsResp.data || [];

        if (!student) return null;

        const schId = student.school_id;
        const studentGrades = (student.student_grade as any[]) || [];
        const activeGradeData = studentGrades.find(sg => sg.is_active) || studentGrades[studentGrades.length - 1];
        let activeGradeName = activeGradeData?.grade?.grade_name || 'Current Grade';
        
        // Remove "Grade " prefix if it exists to prevent "Grade Grade X" in UI
        activeGradeName = activeGradeName.replace(/^(grade\s+)/i, '');
        
        const activeGradeId = activeGradeData?.grade?.grade_id || activeGradeData?.grade_id;

        // tuition price
        const tuitionItem = feeItems.find(fi => 
            fi.school_id === schId && 
            (fi.category as any)?.category === 'tuition' && 
            fi.grade_id === activeGradeId
        );
        const tuitionPrice = Number(tuitionItem?.amount || 0);

        const invoiceItems: any[] = invoices.map(inv => {
            const total = Number((inv as any).total_amount_cached || inv.total_amount || 0);
            let name = inv.service_name;
            if (!name && inv.invoice_items?.items?.[0]?.name) {
                name = inv.invoice_items.items[0].name;
            }
            if (!name) name = 'School Fees';

            return {
                type: 'invoice',
                invoice_id: (inv as any).invoice_id || inv.id,
                invoice_number: inv.invoice_number,
                name: name,
                expected: total,
                collected: 0,
                invoiced: total,
                balance: total,
                status: inv.status,
                initiated_at: (inv as any).created_at || (inv as any).issued_at || (inv as any).date_issued || null,
                transactions: []
            };
        });

        // fallback items
        const fallbackItems: any[] = [];
        if (!invoiceItems.some(ii => ii.name.toLowerCase().includes('tuition')) && tuitionPrice > 0) {
            fallbackItems.push({ type: 'tuition', name: 'Tuition Fees', expected: tuitionPrice, collected: 0, invoiced: 0, balance: tuitionPrice, status: 'unpaid' });
        }

        const allItems = [...invoiceItems, ...fallbackItems];

        // Match payments
        transactions.forEach(tx => {
            const amount = Number(tx.amount || 0);
            const txInvoiceId = (tx as any).invoice_id;
            let match = txInvoiceId ? allItems.find(it => it.invoice_id === txInvoiceId) : null;
            if (match) match.collected += amount;
        });

        // Calculate total balance
        const totalBalance = allItems.reduce((sum, item) => sum + (item.expected - item.collected), 0);

        return {
            student: {
                id: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                grade: activeGradeName
            },
            items: allItems,
            totalBalance
        };
    } catch (e) {
        console.error('Error detail:', e);
        return null;
    }
}
