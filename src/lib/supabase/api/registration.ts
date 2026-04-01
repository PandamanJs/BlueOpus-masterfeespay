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
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`);

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

export async function registerParent(parentData: ParentData): Promise<string | null> {
    // 1. Check if parent already exists with this email or phone
    const cleanPhone = parentData.phone.replace(/\D/g, '');
    const variants = [cleanPhone];
    if (cleanPhone.startsWith('260')) variants.push(cleanPhone.substring(3));
    if (!cleanPhone.startsWith('0') && !cleanPhone.startsWith('26')) variants.push(`0${cleanPhone}`);
    if (cleanPhone.startsWith('0')) variants.push(cleanPhone.substring(1));

    const phoneOrQuery = variants.map(v => `phone_number.eq.${v}`).join(',');
    
    let query = supabase.from('parents').select('parent_id');

    if (parentData.email.trim()) {
        query = query.or(`email.eq.${parentData.email},${phoneOrQuery}`);
    } else {
        query = query.or(phoneOrQuery);
    }

    const { data: existingParent } = await query.limit(1).maybeSingle();

    if (existingParent) {
        return existingParent.parent_id;
    }

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
            email: parentData.email.trim() || null, // Convert empty string to null
            phone_number: parentData.phone,
            created_at: new Date().toISOString()
        })
        .select('parent_id')
        .single();


    if (error) {
        console.error('Error registering parent:', error);
        throw new Error('Failed to register parent');
    }

    return data.parent_id;
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
    // 1. Get all grades for this school to map names to IDs
    const { data: schoolGrades, error: gradesError } = await supabase
        .from('grades')
        .select('grade_id, grade_name')
        .eq('school_id', schoolId);

    if (gradesError) {
        console.error('Error fetching grades for mapping:', gradesError);
        throw new Error('Failed to fetch school grades');
    }

    const gradeMap = new Map((schoolGrades || []).map(g => [g.grade_name.toLowerCase(), g.grade_id]));

    // 2. Get the current academic year
    const { data: academicYear, error: ayError } = await supabase
        .from('academic_year')
        .select('academic_year_id')
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (ayError || !academicYear) {
        console.error('Error fetching academic year:', ayError);
        throw new Error('Could not find an active academic year. Please contact support.');
    }

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
                console.error(`Error creating student ${student.name}:`, error);
                throw new Error(`Failed to create student ${student.name}: ${error?.message}`);
            }
            student_id = newStudent.student_id;
            console.log(`Created new student: ${student.name} with ID ${admissionNumber}`);
        } else {
            // Existing student, handle multiple parents
            // First, check who the current parents are
            const { data: currentStudent } = await supabase
                .from('students')
                .select('parent_id, other_parent_id')
                .eq('student_id', student.id)
                .single();

            if (currentStudent) {
                const isAlreadyLinked = currentStudent.parent_id === parentId || currentStudent.other_parent_id === parentId;
                
                if (!isAlreadyLinked) {
                    // Decide which slot to use
                    const updateData: any = {
                        first_name: firstName,
                        last_name: lastName
                    };

                    if (!currentStudent.parent_id) {
                        updateData.parent_id = parentId;
                    } else if (!currentStudent.other_parent_id) {
                        updateData.other_parent_id = parentId;
                    } else {
                        // Both slots full, we'll update the primary parent for this session's context
                        updateData.parent_id = parentId;
                    }

                    const { error } = await supabase
                        .from('students')
                        .update(updateData)
                        .eq('student_id', student.id);

                    if (error) {
                        console.error(`Error updating student ${student.id}:`, error);
                        throw new Error(`Failed to update student ${student.name}: ${error.message}`);
                    }
                } else {
                    // Already linked, just sync names
                    await supabase
                        .from('students')
                        .update({ first_name: firstName, last_name: lastName })
                        .eq('student_id', student.id);
                }
            }
            console.log(`Updated parent links for existing student: ${student.name}`);
        }

        // 5. Update/Insert grade assignment if we have a grade
        if (targetGradeId) {
            // Check if active grade assignment exists for this student and year
            const { data: existingGrade } = await supabase
                .from('student_grade')
                .select('student_grade_id')
                .eq('student_id', student_id)
                .eq('academic_year_id', academicYear.academic_year_id)
                .maybeSingle();

            if (existingGrade) {
                await supabase
                    .from('student_grade')
                    .update({
                        grade_id: targetGradeId,
                        class: student.class || 'A'
                    })
                    .eq('student_grade_id', existingGrade.student_grade_id);
            } else {
                await supabase
                    .from('student_grade')
                    .insert({
                        student_id: student_id,
                        grade_id: targetGradeId,
                        academic_year_id: academicYear.academic_year_id,
                        class: student.class || 'A',
                        is_active: true
                    });
            }
        }
    }
}

export async function getGradesBySchool(schoolId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('grades')
        .select('grade_name')
        .eq('school_id', schoolId)
        .order('grade_id', { ascending: true });

    if (error) {
        console.error('Error fetching grades:', error);
        return [];
    }

    const uniqueGrades = Array.from(new Set((data || []).map(g => g.grade_name)));
    return uniqueGrades.length > 0 ? uniqueGrades : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
}

export async function getClassesBySchool(schoolId: string): Promise<string[]> {
    const { data: classData, error: classError } = await supabase
        .from('student_grade')
        .select('class')
        .neq('class', '')
        .limit(500);

    if (classError) {
        console.error('Error fetching classes:', classError);
        return ['A', 'B', 'C', 'D'];
    }

    const uniqueClasses = Array.from(new Set((classData || []).map(c => c.class))).sort();
    return uniqueClasses.length > 0 ? uniqueClasses : ['A', 'B', 'C', 'D'];
}
