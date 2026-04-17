import { supabase, handleSupabaseError } from '../client';

/**
 * Get all available grades for a specific school.
 */
export async function getGradesBySchool(schoolId: string) {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('grade_id, grade_name')
      .eq('school_id', schoolId)
      .order('grade_name');

    if (error) handleSupabaseError(error, 'getGradesBySchool');
    return data || [];
  } catch (error) {
    console.error('[getGradesBySchool] Error:', error);
    return [];
  }
}

/**
 * Update student basic information and grade.
 */
export async function updateStudent(
  studentId: string, 
  data: { 
    firstName?: string; 
    lastName?: string; 
    gradeId?: string;
  }
) {
  try {
    // 1. Update Students Table (Name)
    if (data.firstName || data.lastName) {
      const studentUpdate: any = {};
      if (data.firstName) studentUpdate.first_name = data.firstName;
      if (data.lastName) studentUpdate.last_name = data.lastName;

      const { error: studentError } = await supabase
        .from('students')
        .update(studentUpdate)
        .eq('student_id', studentId);

      if (studentError) handleSupabaseError(studentError, 'updateStudent - name');
    }

    // 2. Update Grade
    if (data.gradeId) {
      // Find current active grade to get academic_year_id and other context
      const { data: currentGrade, error: fetchError } = await supabase
        .from('student_grade')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) handleSupabaseError(fetchError, 'updateStudent - fetch current grade');

      if (currentGrade) {
        // If the grade is actually different, update it
        if (currentGrade.grade_id !== data.gradeId) {
          const { error: updateError } = await supabase
            .from('student_grade')
            .update({ grade_id: data.gradeId })
            .eq('student_grade_id', currentGrade.student_grade_id);

          if (updateError) handleSupabaseError(updateError, 'updateStudent - change grade');
        }
      } else {
        // Fallback: search for any grade record to get context
        const { data: anyGrade } = await supabase
          .from('student_grade')
          .select('*')
          .eq('student_id', studentId)
          .limit(1)
          .maybeSingle();
        
        if (anyGrade) {
           await supabase
            .from('student_grade')
            .insert({
              student_id: studentId,
              grade_id: data.gradeId,
              academic_year_id: anyGrade.academic_year_id,
              school_id: anyGrade.school_id,
              is_active: true
            });
        }
      }
    }
  } catch (error) {
    console.error('[updateStudent] Error:', error);
    throw error;
  }
}
