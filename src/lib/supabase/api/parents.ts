import { supabase, handleSupabaseError } from '../client';
import type { Parent, ParentWithStudents, StudentWithSchool } from '../types';
import { phoneOrFilter } from '../../../utils/reconciliation';

/**
 * Get parent by phone number — queries `parents` table in Master-fees Database.
 */
export async function getParentByPhone(phone: string): Promise<ParentWithStudents | null> {
    try {
        const orQuery = phoneOrFilter('phone_number', phone);

        const { data: parentRaw, error: parentError } = await supabase
            .from('parents')
            .select('*')
            .or(orQuery)
            .limit(1)
            .maybeSingle();

        if (parentError) handleSupabaseError(parentError, 'getParentByPhone');
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

        // Get students for this parent with their school info and current grade
        const { data: studentsRaw, error: studentsError } = await supabase
            .from('students')
            .select(`
                *,
                school:schools(*),
                student_grade(
                    grade_id,
                    is_active,
                    grade:grades(grade_name)
                )
            `)
            .or(`parent_id.eq.${parent.id},other_parent_id.eq.${parent.id}`);

        if (studentsError) handleSupabaseError(studentsError, 'getParentByPhone - students');

        const mappedStudents = (studentsRaw || []).map((s: any) => {
            const activeGrade = s.student_grade?.find((sg: any) => sg.is_active) || s.student_grade?.[0];
            return {
                ...s,
                id: s.student_id,
                name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                grade: activeGrade?.grade?.grade_name || 'Unknown',
                gradeId: activeGrade?.grade_id,
                admissionNumber: s.admission_number,
            };
        });

        return { ...parent, students: mappedStudents as StudentWithSchool[] };
    } catch (error) {
        console.error('[getParentByPhone] Error:', error);
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
