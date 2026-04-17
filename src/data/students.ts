/**
 * ========================================
 * STUDENT & PARENT DATA (SUPABASE)
 * ========================================
 * 
 * This file provides backward compatibility for components
 * that still use the old data fetching patterns.
 * 
 * Now powered by Supabase instead of mock data!
 */

import { getParentByPhone, getStudentsByParentPhone } from '../lib/supabase/api/parents';
import { getStudentsOutstandingBalances, getStudentsUnpaidInvoicesCount, getStudentsActualDebt } from '../lib/supabase/api/transactions';
import type { StudentWithSchool } from '../lib/supabase/types';

// Re-export types for backward compatibility
export interface Student {
  name: string;
  id: string; // This MUST be the UUID for database queries
  admissionNumber?: string; // For display purposes (e.g. TEC1455)
  grade: string;
  balances: number;
  unpaidInvoicesCount: number;
  schoolName: string;
  schoolId?: string;
  gradeId?: string;
  termBalances?: {
    term1?: boolean;
    term2?: boolean;
    term3?: boolean;
  };
}

export interface ParentData {
  id: string; // Parent's UUID from the database
  name: string;
  phone: string;
  students: Student[];
  primarySchool: string;
}

/**
 * Convert Supabase student data to legacy format
 * Now fetches outstanding balance from payment_history table
 */
async function convertToLegacyStudent(student: StudentWithSchool, balanceMap?: Record<string, number>, countMap?: Record<string, number>, actualDebtMap?: Record<string, number>): Promise<Student> {
  const actualDebt = actualDebtMap?.[student.student_id] ?? 0;
  const pendingCount = countMap?.[student.student_id] ?? 0;

  return {
    name: student.name || 'Unknown Student',
    id: student.student_id || (student as any).id || '', // Always use UUID as the primary ID for logic/DB
    admissionNumber: (student as any).admission_number || '', // Store display ID separately
    grade: `${student.grade || ''}${(student as any).class ? ` ${(student as any).class}` : ''}`,
    // Use balance from payment_history invoices + any new pending transactions
    balances: (balanceMap?.[student.student_id] ?? 0),
    // Count student as 1 if they have an outstanding balance, plus number of pending invoices
    unpaidInvoicesCount: (actualDebt > 0 ? 1 : 0) + pendingCount,
    schoolName: student.school?.school_name || student.school?.name || 'Unknown School',
    schoolId: student.school?.school_id || (student.school as any)?.id,
    gradeId: (student as any).gradeId,
    // Note: termBalances not available in Supabase yet
    termBalances: {
      term1: false,
      term2: false,
      term3: false,
    },
  };
}

/**
 * Get students by parent phone number
 * 
 * This is the main function used for "login" - we look up parents by phone
 * and return their students.
 * 
 * @param phone - Parent's phone number
 * @returns Array of students in legacy format
 */
export async function getStudentsByPhone(phone: string): Promise<Student[]> {
  try {
    console.log('[getStudentsByPhone] Searching for phone:', phone);
    const students = await getStudentsByParentPhone(phone);

    if (!students || students.length === 0) {
      console.warn('[getStudentsByPhone] No students found for phone:', phone);
      return [];
    }

    console.log(`[getStudentsByPhone] Found ${students.length} students, fetching balances...`);
    // Fetch outstanding balances and counts from pending transactions and payment history
    const studentIds = students.map(s => s.student_id);
    const [balanceMap, countMap, actualDebtMap] = await Promise.all([
      getStudentsOutstandingBalances(studentIds),
      getStudentsUnpaidInvoicesCount(studentIds),
      getStudentsActualDebt(studentIds)
    ]);

    // Convert all students with their balances and counts
    const convertedStudents = await Promise.all(
      students.map(student => convertToLegacyStudent(student, balanceMap, countMap, actualDebtMap))
    );

    console.log('[getStudentsByPhone] Successfully converted students:', convertedStudents.map(s => s.name));
    return convertedStudents;
  } catch (error) {
    console.error('[getStudentsByPhone] Error:', error);
    // Return empty array on error to prevent app crash
    return [];
  }
}

/**
 * Get parent data by phone number
 * 
 * @param phone - Parent's phone number
 * @returns Parent data with students, or null if not found
 */
export async function getParentDataByPhone(phone: string): Promise<ParentData | null> {
  try {
    const parentData = await getParentByPhone(phone);

    if (!parentData) {
      return null;
    }

    // Fetch outstanding balances and counts from pending transactions and payment history
    const studentIds = parentData.students.map((s: StudentWithSchool) => s.student_id);
    const [balanceMap, countMap, actualDebtMap] = await Promise.all([
      getStudentsOutstandingBalances(studentIds),
      getStudentsUnpaidInvoicesCount(studentIds),
      getStudentsActualDebt(studentIds)
    ]);

    // Convert students with balances and counts
    const convertedStudents = await Promise.all(
      parentData.students.map((student: StudentWithSchool) => convertToLegacyStudent(student, balanceMap, countMap, actualDebtMap))
    );

    return {
      id: parentData.id,
      name: parentData.name,
      phone: (parentData as any).phone_number || parentData.phone,
      students: convertedStudents,
      primarySchool: parentData.students[0]?.school.name || '',
    };
  } catch (error) {
    console.error('[getParentDataByPhone] Error:', error);
    return null;
  }
}

/**
 * Get institution type (school or university)
 * For now, we'll assume all are schools
 */
export function getInstitutionType(_schoolName: string): 'school' | 'university' {
  // In the future, this could query the database
  // For now, assume all are schools
  return 'school';
}

/**
 * Check if term selection is allowed for a school
 * For now, return true for all schools
 */
export function canSelectTerm(_schoolName: string): boolean {
  return true;
}
