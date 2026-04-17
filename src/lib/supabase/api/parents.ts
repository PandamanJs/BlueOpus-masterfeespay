import { supabase, handleSupabaseError } from '../client';
import type { Parent, ParentWithStudents, StudentWithSchool } from '../types';
import { phoneOrFilter, phoneVariants } from '../../../utils/reconciliation';

export interface ParentReviewRequest {
    id: string;
    type: 'balance_dispute' | 'guardian_link';
    status: 'pending' | 'approved' | 'rejected' | 'resolved' | 'cancelled' | string;
    studentId: string;
    studentName: string;
    schoolId?: string | null;
    schoolName?: string | null;
    reason?: string | null;
    createdAt: string;
    reviewedAt?: string | null;
}

async function fetchStudentsForParentId(parentId: string): Promise<StudentWithSchool[]> {
    const selectClause = `
        *,
        school:schools(*),
        student_grade(
            grade_id,
            is_active,
            grade:grades(grade_name)
        )
    `;

    const isLegacyLinkQueryUnsupported = (error: any): boolean => {
        const message = String(error?.message || '').toLowerCase();
        const details = String(error?.details || '').toLowerCase();
        const hint = String(error?.hint || '').toLowerCase();
        const combined = `${message} ${details} ${hint}`;

        return (
            /column .* does not exist/.test(combined) ||
            /failed to parse logic tree/.test(combined) ||
            /unknown column/.test(combined) ||
            /student_parent_id|student_other_parent_id/.test(combined)
        );
    };

    const fetchByLink = async (primaryCol: string, secondaryCol: string): Promise<{ data: any[]; missingColumns: boolean }> => {
        const { data, error } = await supabase
            .from('students')
            .select(selectClause)
            .or(`${primaryCol}.eq.${parentId},${secondaryCol}.eq.${parentId}`);

        if (error) {
            // Some deployments still use one pair of link columns only.
            if (isLegacyLinkQueryUnsupported(error)) return { data: [], missingColumns: true };
            handleSupabaseError(error, `fetchStudentsForParentId (${primaryCol}/${secondaryCol})`);
        }
        return { data: data || [], missingColumns: false };
    };

    // Query modern schema first. Only attempt legacy schema when modern rows are empty.
    const modern = await fetchByLink('parent_id', 'other_parent_id');
    let legacy: { data: any[]; missingColumns: boolean } = { data: [], missingColumns: true };
    if ((modern.data || []).length === 0) {
        legacy = await fetchByLink('student_parent_id', 'student_other_parent_id');
    }

    // Support mixed deployments where some rows are linked through modern columns
    // and others still exist on legacy columns.
    const mergedRows = [...modern.data, ...legacy.data];
    const dedupedRows = Array.from(
        new Map(mergedRows.map((row: any) => [row.student_id, row])).values()
    );

    return dedupedRows.map((s: any) => {
        const activeGrade = s.student_grade?.find((sg: any) => sg.is_active) || s.student_grade?.[0];
        return {
            ...s,
            id: s.student_id,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            grade: activeGrade?.grade?.grade_name || 'Unknown',
            gradeId: activeGrade?.grade_id,
            admissionNumber: s.admission_number,
        };
    }) as StudentWithSchool[];
}

/**
 * Get parent by phone number - queries `parents` table in Master-fees Database.
 */
export async function getParentByPhone(phone: string): Promise<ParentWithStudents | null> {
    try {
        const variants = phoneVariants(phone).filter(v => v.replace(/\D/g, '').length >= 9);
        console.log('[getParentByPhone] Querying with variants:', variants);

        const { data: parentRaw, error: parentError } = await supabase
            .from('parents')
            .select('*')
            .in('phone_number', variants)
            .limit(1)
            .maybeSingle();

        if (parentError) handleSupabaseError(parentError, 'getParentByPhone');
        if (!parentRaw) {
            console.warn('[getParentByPhone] No parent found for phone:', phone);
            return null;
        }
        console.log('[getParentByPhone] Found parent:', parentRaw.parent_id);

        const parent: Parent = {
            id: parentRaw.parent_id,
            name: `${parentRaw.first_name || ''} ${parentRaw.last_name || ''}`.trim(),
            phone: parentRaw.phone_number,
            email: parentRaw.email,
            address: null,
            created_at: parentRaw.created_at,
            updated_at: null,
        } as unknown as Parent;

        const mappedStudents = await fetchStudentsForParentId(parent.id);

        return { ...parent, students: mappedStudents as StudentWithSchool[] };
    } catch (error) {
        console.error('[getParentByPhone] Error:', error);
        throw error;
    }
}

/**
 * Get parent by email address.
 */
export async function getParentByEmail(email: string): Promise<ParentWithStudents | null> {
    try {
        const { data: parentRaw, error: parentError } = await supabase
            .from('parents')
            .select('*')
            .eq('email', email.trim())
            .limit(1)
            .maybeSingle();

        if (parentError) handleSupabaseError(parentError, 'getParentByEmail');
        if (!parentRaw) return null;

        const parent: Parent = {
            id: parentRaw.parent_id,
            name: `${parentRaw.first_name || ''} ${parentRaw.last_name || ''}`.trim(),
            phone: parentRaw.phone_number,
            email: parentRaw.email,
            address: null,
            created_at: parentRaw.created_at,
            updated_at: null,
        } as unknown as Parent;

        const mappedStudents = await fetchStudentsForParentId(parent.id);

        return { ...parent, students: mappedStudents as StudentWithSchool[] };
    } catch (error) {
        console.error('[getParentByEmail] Error:', error);
        throw error;
    }
}

/**
 * Get students for a parent by phone number.
 */
export async function getStudentsByParentPhone(phone: string): Promise<StudentWithSchool[]> {
    const parentData = await getParentByPhone(phone);
    return parentData?.students || [];
}

/**
 * Get students for a parent by parent_id.
 */
export async function getStudentsByParentId(parentId: string): Promise<StudentWithSchool[]> {
    try {
        if (!parentId?.trim()) return [];
        return await fetchStudentsForParentId(parentId.trim());
    } catch (error) {
        console.error('[getStudentsByParentId] Error:', error);
        throw error;
    }
}

/**
 * Get pending/history review requests submitted by a parent.
 *
 * Connected students only tell us what is already linked. These rows tell the
 * parent what is still waiting for school review, including guardian-link
 * requests for students who are not connected yet.
 */
export async function getParentReviewRequests(parentId: string): Promise<ParentReviewRequest[]> {
    try {
        if (!parentId?.trim()) return [];

        const [
            { data: disputeRows, error: disputeError },
            { data: guardianRows, error: guardianError },
        ] = await Promise.all([
            supabase
                .from('refund_requests')
                .select('id, student_id, parent_id, school_id, amount, reason, status, meta_data, created_at, updated_at')
                .eq('parent_id', parentId)
                .eq('meta_data->>type', 'student_account_dispute')
                .order('created_at', { ascending: false }),
            supabase
                .from('guardian_link_requests')
                .select('request_id, parent_id, school_id, requested_student_id, request_reason, status, evidence, created_at, reviewed_at')
                .eq('parent_id', parentId)
                .order('created_at', { ascending: false }),
        ]);

        if (disputeError) handleSupabaseError(disputeError, 'getParentReviewRequests - disputes');
        if (guardianError) handleSupabaseError(guardianError, 'getParentReviewRequests - guardian links');

        const studentIds = Array.from(new Set([
            ...((disputeRows || []).map((row: any) => row.student_id).filter(Boolean)),
            ...((guardianRows || []).map((row: any) => row.requested_student_id).filter(Boolean)),
        ]));
        const schoolIds = Array.from(new Set([
            ...((disputeRows || []).map((row: any) => row.school_id).filter(Boolean)),
            ...((guardianRows || []).map((row: any) => row.school_id).filter(Boolean)),
        ]));

        const [{ data: studentRows, error: studentsError }, { data: schoolRows, error: schoolsError }] = await Promise.all([
            studentIds.length > 0
                ? supabase.from('students').select('student_id, first_name, last_name, school_id').in('student_id', studentIds)
                : Promise.resolve({ data: [], error: null } as any),
            schoolIds.length > 0
                ? supabase.from('schools').select('school_id, school_name').in('school_id', schoolIds)
                : Promise.resolve({ data: [], error: null } as any),
        ]);

        if (studentsError) handleSupabaseError(studentsError, 'getParentReviewRequests - students');
        if (schoolsError) handleSupabaseError(schoolsError, 'getParentReviewRequests - schools');

        const studentsById = new Map((studentRows || []).map((student: any) => [
            student.student_id,
            {
                name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown student',
                schoolId: student.school_id,
            },
        ]));
        const schoolsById = new Map((schoolRows || []).map((school: any) => [school.school_id, school.school_name]));

        const disputes: ParentReviewRequest[] = (disputeRows || []).map((row: any) => {
            const student = studentsById.get(row.student_id);
            const schoolId = row.school_id || student?.schoolId || null;
            return {
                id: row.id,
                type: 'balance_dispute',
                status: row.status,
                studentId: row.student_id,
                studentName: student?.name || 'Unknown student',
                schoolId,
                schoolName: schoolId ? (schoolsById.get(schoolId) || null) : null,
                reason: row.reason,
                createdAt: row.created_at,
                reviewedAt: row.updated_at,
            };
        });

        const guardianLinks: ParentReviewRequest[] = (guardianRows || []).map((row: any) => {
            const student = studentsById.get(row.requested_student_id);
            const schoolId = row.school_id || student?.schoolId || null;
            return {
                id: row.request_id,
                type: 'guardian_link',
                status: row.status,
                studentId: row.requested_student_id,
                studentName: student?.name || row.evidence?.requestedName || 'Unknown student',
                schoolId,
                schoolName: schoolId ? (schoolsById.get(schoolId) || null) : null,
                reason: row.request_reason,
                createdAt: row.created_at,
                reviewedAt: row.reviewed_at,
            };
        });

        return [...disputes, ...guardianLinks].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error('[getParentReviewRequests] Error:', error);
        throw error;
    }
}

/**
 * Create a new parent.
 */
export async function createParent(data: {
    phone: string;
    name: string;
    email?: string;
    address?: string;
}): Promise<Parent> {
    try {
        const cleanPhone = data.phone.replace(/\D/g, '');
        const nameParts = data.name.trim().split(' ');

        const { data: parentRaw, error } = await supabase
            .from('parents')
            .insert({
                first_name: nameParts[0],
                last_name: nameParts.slice(1).join(' ') || '',
                email: data.email || null,
                phone_number: cleanPhone,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) handleSupabaseError(error, 'createParent');

        return {
            id: parentRaw!.parent_id,
            name: `${parentRaw!.first_name} ${parentRaw!.last_name}`,
            phone: parentRaw!.phone_number,
            email: parentRaw!.email,
            address: null,
            created_at: parentRaw!.created_at,
        } as unknown as Parent;
    } catch (error) {
        console.error('[createParent] Error:', error);
        throw error;
    }
}

/**
 * Update parent information.
 */
export async function updateParent(
    id: string,
    data: Partial<{ name: string; email: string; address: string; phone: string; }>
): Promise<Parent> {
    try {
        const updateData: any = {};
        if (data.name) {
            const parts = data.name.trim().split(' ');
            updateData.first_name = parts[0];
            updateData.last_name = parts.slice(1).join(' ') || '';
        }
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone) updateData.phone_number = data.phone.replace(/\D/g, '');

        const { data: parentRaw, error } = await supabase
            .from('parents')
            .update(updateData)
            .eq('parent_id', id)
            .select()
            .single();

        if (error) handleSupabaseError(error, 'updateParent');

        return {
            id: parentRaw!.parent_id,
            name: `${parentRaw!.first_name} ${parentRaw!.last_name}`,
            phone: parentRaw!.phone_number,
            email: parentRaw!.email,
            address: null,
            created_at: parentRaw!.created_at,
        } as unknown as Parent;
    } catch (error) {
        console.error('[updateParent] Error:', error);
        throw error;
    }
}

/**
 * Log a parent dispute against a student's account.
 */
export async function logDispute(studentId: string, parentId: string, reason: string): Promise<void> {
    try {
        const { data: currentStudent, error: fetchError } = await supabase
            .from('students')
            .select('metadata, school_id')
            .eq('student_id', studentId)
            .or(`parent_id.eq.${parentId},other_parent_id.eq.${parentId}`)
            .maybeSingle();

        if (fetchError) handleSupabaseError(fetchError, 'logDispute - fetch student');
        if (!currentStudent) throw new Error('Student not found for this parent.');

        const currentMetadata = (currentStudent as any).metadata;
        const nextMetadata = currentMetadata && typeof currentMetadata === 'object'
            ? { ...currentMetadata, verification_status: 'unverified' }
            : { verification_status: 'unverified' };

        const { error: verificationError } = await supabase
            .from('students')
            .update({
                verification_status: 'unverified',
                metadata: nextMetadata,
            })
            .eq('student_id', studentId)
            .or(`parent_id.eq.${parentId},other_parent_id.eq.${parentId}`);

        if (verificationError) handleSupabaseError(verificationError, 'logDispute - mark unverified');

        const { error } = await supabase
            .from('refund_requests')
            .insert({
                student_id: studentId,
                parent_id: parentId,
                school_id: (currentStudent as any).school_id,
                amount: 0,
                reason: reason.trim(),
                status: 'pending',
                meta_data: {
                    source: 'account_profile',
                    type: 'student_account_dispute'
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) handleSupabaseError(error, 'logDispute');
    } catch (error) {
        console.error('[logDispute] Error:', error);
        throw error;
    }
}

/**
 * Get all balance disputes submitted by a parent.
 */
export async function getDisputesByParent(parentId: string): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('refund_requests')
            .select(`
                id,
                student_id,
                parent_id,
                school_id,
                amount,
                reason,
                status,
                meta_data,
                created_at,
                updated_at,
                student:students(first_name, last_name, student_id)
            `)
            .eq('parent_id', parentId)
            .eq('meta_data->>type', 'student_account_dispute')
            .order('created_at', { ascending: false });

        if (error) {
            handleSupabaseError(error, 'getDisputesByParent');
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('[getDisputesByParent] Error:', error);
        return [];
    }
}

/**
 * Check if the given phone number belongs to a staff member.
 * Checks both the profiles table roles and the parents table is_staff flag.
 */
export async function checkIfStaff(phone: string): Promise<boolean> {
    try {
        const cleanPhone = phone.replace(/\D/g, '');

        const profileQuery = phoneOrFilter('phone', cleanPhone);
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .or(profileQuery)
            .eq('status', 'verified');

        if (!profileError && profileData?.some((profile: any) =>
            ['staff', 'admin', 'manager'].includes(profile.role)
        )) {
            return true;
        }

        const parentQuery = phoneOrFilter('phone_number', cleanPhone);
        const { data: parentData, error: parentError } = await supabase
            .from('parents')
            .select('is_staff')
            .or(parentQuery)
            .maybeSingle();

        return !parentError && Boolean((parentData as any)?.is_staff);
    } catch (error) {
        console.error('[checkIfStaff] Error:', error);
        return false;
    }
}

/**
 * Mark a student record as verified/updated by parent.
 * We clear the explicit `unverified` marker.
 */
export async function markStudentAsVerified(studentId: string, parentId: string): Promise<void> {
    try {
        const { data: currentStudent, error: fetchError } = await supabase
            .from('students')
            .select('metadata')
            .eq('student_id', studentId)
            .or(`parent_id.eq.${parentId},other_parent_id.eq.${parentId}`)
            .maybeSingle();

        if (fetchError) handleSupabaseError(fetchError, 'markStudentAsVerified - fetch');
        if (!currentStudent) throw new Error('Student not found for this parent.');

        const currentMetadata = (currentStudent as any).metadata;
        const nextMetadata = currentMetadata && typeof currentMetadata === 'object'
            ? { ...currentMetadata }
            : undefined;

        if (nextMetadata && 'verification_status' in nextMetadata) {
            delete nextMetadata.verification_status;
        }

        const payload: any = { verification_status: null };
        if (nextMetadata) payload.metadata = nextMetadata;

        const { error: updateError } = await supabase
            .from('students')
            .update(payload)
            .eq('student_id', studentId)
            .or(`parent_id.eq.${parentId},other_parent_id.eq.${parentId}`);

        if (updateError) handleSupabaseError(updateError, 'markStudentAsVerified - update');
    } catch (error) {
        console.error('[markStudentAsVerified] Error:', error);
        throw error;
    }
}
