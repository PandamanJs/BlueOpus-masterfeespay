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

export interface SchoolGrade {
    grade_id: string;
    grade_name: string;
}

/**
 * Search for students by name or admission number.
 */
export async function searchStudentsByName(query: string, schoolId?: string, currentParentId?: string): Promise<StudentData[]> {
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
            parent_id,
            other_parent_id,
            student_grade (
                class,
                is_active,
                grades (
                    grade_name
                )
            ),
            parent:parents!student_parent_id_fkey (
                first_name,
                last_name,
                phone_number
            ),
            other_parent:parents!student_other_parent_id_fkey (
                first_name,
                last_name,
                phone_number
            )
        `);

    // Broader search to catch potential typos or partial names
    if (parts.length >= 2) {
        // Try searching by both names first
        supabaseQuery = supabaseQuery.or(`and(first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts.slice(1).join(' ')}%),and(first_name.ilike.%${parts[parts.length-1]}%,last_name.ilike.%${parts.slice(0, parts.length-1).join(' ')}%)`);
    } else {
        // Single name search
        supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`);
    }

    if (schoolId) {
        supabaseQuery = supabaseQuery.eq('school_id', schoolId);
    }

    let { data, error } = await supabaseQuery.limit(15); // Increased limit as we'll filter some out
    
    // Fallback if no data
    if (!error && (!data || data.length === 0) && query.length > 3) {
        const broadQuery = supabase
            .from('students')
            .select(`
                student_id, first_name, last_name, school_id, admission_number, parent_id, other_parent_id,
                student_grade(class, is_active, grades(grade_name)),
                parent:parents!student_parent_id_fkey(first_name, last_name, phone_number),
                other_parent:parents!student_other_parent_id_fkey(first_name, last_name, phone_number)
            `)
            .or(`first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[parts.length-1]}%`)
            .limit(15);
        
        if (schoolId) broadQuery.eq('school_id', schoolId);
        const { data: broadData } = await broadQuery;
        if (broadData && broadData.length > 0) data = broadData;
    }

    if (error) {
        console.error('Error searching students:', error);
        return [];
    }

    const filtered = (data || []).filter(s => {
        const p1 = s.parent_id;
        const p2 = s.other_parent_id;
        
        // IF a child has two guardians already AND the current parent is not one of them, hide it
        if (p1 && p2) {
            if (currentParentId && (p1 === currentParentId || p2 === currentParentId)) {
                return true; // Current parent is already linked, show it (for confirmation/view)
            }
            return false; // Two guardians exist and neither is the current one -> HIDE
        }
        
        return true; // 0 or 1 guardians -> Show it
    });

    return filtered.map(s => {
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
    matchType?: 'phone' | 'email';
}

export async function registerParent(parentData: ParentData): Promise<RegisterParentResult> {
    console.log('[Registration] Registering parent:', { phone: parentData.phone, existingId: parentData.parentId });

    // 0. If we already have an ID (from a deliberate UI match), skip detection
    if (parentData.parentId) {
        return { parentId: parentData.parentId, isExisting: true };
    }
    
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
        return { parentId: phoneMatch.parent_id, isExisting: true, existingName, isNameMatch, matchType: 'phone' };
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
            return { parentId: emailMatch.parent_id, isExisting: true, existingName, matchType: 'email' };
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
    const registrationSessionId = crypto.randomUUID();
    
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
            // 1. Create the student record (unverified and unlinked)
            const { data: newS, error: sErr } = await supabase
                .from('students')
                .insert({
                    school_id: schoolId,
                    // Note: explicitly not setting parent_id to keep it unlinked until review
                    first_name: firstName,
                    last_name: lastName,
                    date_of_enrollment: new Date().toISOString().split('T')[0],
                    verification_status: 'unverified',
                    metadata: {
                        created_via: 'manual_registration_flow',
                        registration_date: new Date().toISOString()
                    }
                })
                .select('student_id')
                .single();
            
            if (sErr) throw sErr;
            student_id = newS.student_id;

            // 2. Insert into guardian_link_requests table for review
            const { error: reqErr } = await supabase
                .from('guardian_link_requests')
                .insert({
                    registration_session_id: registrationSessionId,
                    parent_id: parentId,
                    school_id: schoolId,
                    requested_student_id: student_id,
                    request_reason: 'manual_override',
                    status: 'pending',
                    evidence: {
                        source: 'registration_flow',
                        grade_provided: student.grade,
                        class_provided: student.class
                    }
                });
            
            if (reqErr) {
                console.error('[Registration] Failed to create link request:', reqErr);
                // We continue since the student was created, but log the error
            }
        } else {
            // Update links for existing - also potentially create a request if parent is new to this child
            // Check if already linked
            const { data: existingChild } = await supabase
                .from('students')
                .select('parent_id, other_parent_id')
                .eq('student_id', student.id)
                .single();

            const isAlreadyLinked = existingChild && (existingChild.parent_id === parentId || existingChild.other_parent_id === parentId);

            if (!isAlreadyLinked) {
                // If not already linked, we create a link request for review
                await supabase.from('guardian_link_requests').insert({
                    registration_session_id: registrationSessionId,
                    parent_id: parentId,
                    school_id: schoolId,
                    requested_student_id: student.id,
                    request_reason: 'manual_override',
                    status: 'pending',
                    evidence: {
                        source: 'linked_from_search',
                        grade_at_link: student.grade
                    }
                });
            }
        }

        // Grade Assignment (Internal bookkeeping)
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

            await supabase.from('student_grade').upsert(gradeEntry, { onConflict: 'student_id, grade_id, academic_year_id' });
        }

    }
}

export async function getGradesWithStreams(schoolId: string) {
    const { data, error } = await supabase
        .from('grades')
        .select(`
            grade_id,
            grade_name,
            school_streams(stream_name)
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('display_order');

    if (error) {
        console.error('[Registration] Error fetching grades with streams:', error);
        return [];
    }

    console.log('[Registration] Raw grades/streams data:', data);

    const result: { grade_id: string; grade_name: string; stream_name?: string }[] = [];
    
    (data || []).forEach(g => {
        const streams = (g.school_streams as any[]) || [];
        
        if (streams.length > 0) {
            streams.forEach(s => {
                result.push({
                    grade_id: g.grade_id,
                    grade_name: g.grade_name,
                    stream_name: s.stream_name
                });
            });
        } else {
            result.push({
                grade_id: g.grade_id,
                grade_name: g.grade_name
            });
        }
    });

    console.log('[Registration] Final availableOptions:', result);
    return result;
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
 * Saves a parent's verification or dispute of a student's ledger balance.
 */
export async function saveLedgerVerification(params: {
    studentId: string;
    parentId?: string;
    schoolId?: string;
    status: 'confirmed' | 'disputed';
    notes?: string;
    metadata?: any;
}) {
    console.log('[Registration] Saving ledger verification:', { 
        studentId: params.studentId, 
        status: params.status 
    });

    const { error } = await supabase
        .from('ledger_verifications')
        .insert({
            student_id: params.studentId,
            parent_id: params.parentId, // Optional if we don't have it yet, but best to have it
            school_id: params.schoolId,
            status: params.status,
            notes: params.notes,
            meta_data: params.metadata || {}
        });

    if (error) {
        console.error('Error saving ledger verification:', error);
        throw error;
    }

    return { success: true };
}
