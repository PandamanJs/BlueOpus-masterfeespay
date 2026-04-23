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

import {
  getParentByPhone,
  getParentReviewRequests,
  getStudentsByParentPhone,
  getStudentsByParentId as getStudentsByParentIdApi
} from '../lib/supabase/api/parents';
import { supabase } from '../lib/supabase/client';
import {
  getStudentsOutstandingBalances,
  getStudentFinancialSummary
} from '../lib/supabase/api/transactions';
import type { StudentWithSchool } from '../lib/supabase/types';

// Re-export types for backward compatibility
export interface Student {
  name: string;
  id: string; // This MUST be the UUID for database queries
  admissionNumber?: string; // For display purposes (e.g. TEC1455)
  verificationStatus?: 'unverified' | null;
  verificationReason?: 'new_student_review' | 'balance_dispute' | 'school_review' | 'two_guardians_full' | null;
  pendingReviewStatus?: 'pending' | 'approved' | 'rejected' | 'resolved' | 'cancelled' | string | null;
  reviewGuardianNames?: string[];
  reviewNote?: string | null;
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

type VerificationReason = NonNullable<Student['verificationReason']>;

function buildPendingGuardianReviewStudents(
  reviewRequests: Awaited<ReturnType<typeof getParentReviewRequests>>,
  schoolFilterId?: string
): Student[] {
  return reviewRequests
    .filter(request =>
      request.type === 'guardian_link'
      && ['pending', 'rejected'].includes(String(request.status || '').toLowerCase())
      && (!schoolFilterId || !request.schoolId || request.schoolId === schoolFilterId)
    )
    .map((request) => {
      const grade = request.requestedGrade || 'Pending review';
      const className = request.requestedClassName;
      const reason = request.reason === 'two_guardians_full' ? 'two_guardians_full' : 'school_review';
      return {
        name: request.studentName,
        id: `review-request-${request.id}`,
        admissionNumber: 'School Review',
        verificationStatus: 'unverified',
        verificationReason: reason,
        pendingReviewStatus: request.status,
        reviewGuardianNames: request.existingGuardianNames || [],
        reviewNote: request.reviewerNote || null,
        grade: `${grade}${className ? ` ${className}` : ''}`,
        balances: 0,
        unpaidInvoicesCount: 0,
        schoolName: request.schoolName || 'Unknown School',
        schoolId: request.schoolId || undefined,
      };
    });
}

async function getCanonicalBalanceSnapshot(studentIds: string[]): Promise<{
  balanceMap: Record<string, number>;
  countMap: Record<string, number>;
}> {
  if (!studentIds.length) {
    return { balanceMap: {}, countMap: {} };
  }

  const summaryResults = await Promise.all(
    studentIds.map(async (studentId) => {
      try {
        const summary = await getStudentFinancialSummary(studentId);
        const totalBalance = Number(summary?.totalBalance ?? 0);
        const outstandingCount = Array.isArray(summary?.items)
          ? summary.items.filter((item: any) => Number(item?.balance ?? 0) > 0).length
          : 0;
        return { studentId, totalBalance, outstandingCount, ok: true as const };
      } catch {
        return { studentId, totalBalance: 0, outstandingCount: 0, ok: false as const };
      }
    })
  );

  const failedIds = summaryResults.filter(r => !r.ok).map(r => r.studentId);
  let fallbackBalanceMap: Record<string, number> = {};
  let fallbackCountMap: Record<string, number> = {};

  if (failedIds.length > 0) {
    const [balances, counts] = await Promise.all([
      getStudentsOutstandingBalances(failedIds),
      getStudentsUnpaidInvoicesCount(failedIds)
    ]);
    fallbackBalanceMap = balances;
    fallbackCountMap = counts;
  }

  const balanceMap: Record<string, number> = {};
  const countMap: Record<string, number> = {};

  for (const result of summaryResults) {
    if (result.ok) {
      balanceMap[result.studentId] = result.totalBalance;
      countMap[result.studentId] = result.outstandingCount;
      continue;
    }
    balanceMap[result.studentId] = fallbackBalanceMap[result.studentId] ?? 0;
    countMap[result.studentId] = fallbackCountMap[result.studentId] ?? 0;
  }

  return { balanceMap, countMap };
}

async function getPendingBalanceReviewMap(studentIds: string[]): Promise<Record<string, { status: string }>> {
  if (!studentIds.length) return {};

  try {
    const { data, error } = await supabase
      .from('refund_requests')
      .select('student_id, status, created_at, meta_data')
      .in('student_id', studentIds)
      .eq('meta_data->>type', 'student_account_dispute')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[students] Could not fetch pending balance reviews:', error.message);
      return {};
    }

    const map: Record<string, { status: string }> = {};
    (data || []).forEach((row: any) => {
      if (row.student_id && !map[row.student_id]) {
        map[row.student_id] = { status: row.status };
      }
    });
    return map;
  } catch (error) {
    console.warn('[students] Pending balance review lookup failed:', error);
    return {};
  }
}

/**
 * Convert Supabase student data to legacy format
 * Uses the same canonical balance snapshot as history and checkout.
 */
async function convertToLegacyStudent(
  student: StudentWithSchool,
  balanceMap?: Record<string, number>,
  countMap?: Record<string, number>,
  actualDebtMap?: Record<string, number>,
  pendingBalanceReviewMap?: Record<string, { status: string }>
): Promise<Student> {
  const actualDebt = actualDebtMap?.[student.student_id] ?? 0;
  const pendingCount = countMap?.[student.student_id] ?? 0;
  const isUnverified = ((student as any).verification_status === 'unverified' || (student as any)?.metadata?.verification_status === 'unverified');
  const pendingBalanceReview = pendingBalanceReviewMap?.[student.student_id];
  const metadata = (student as any)?.metadata || {};
  const metadataReason = metadata.verification_reason || metadata.review_type || metadata.registration_source;
  const isManualRegistration =
    metadataReason === 'manual_parent_registration' ||
    metadataReason === 'new_student_review' ||
    metadataReason === 'new_student';
  const verificationReason: VerificationReason | null = pendingBalanceReview
    ? 'balance_dispute'
    : isUnverified && isManualRegistration
      ? 'new_student_review'
      : isUnverified
        ? 'new_student_review'
        : null;

  return {
    name: student.name || 'Unknown Student',
    id: student.student_id || (student as any).id || '', // Always use UUID as the primary ID for logic/DB
    admissionNumber: (student as any).admission_number || '', // Store display ID separately
    verificationStatus: isUnverified ? 'unverified' : null,
    verificationReason,
    pendingReviewStatus: pendingBalanceReview?.status || null,
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
 * @param schoolId - Optional school ID to filter students by
 * @returns Array of students in legacy format
 */
export async function getStudentsByPhone(phone: string, schoolId?: string): Promise<Student[]> {
  try {
    console.log('[getStudentsByPhone] Searching for phone:', phone, schoolId ? `(School: ${schoolId})` : '');
    const parent = await getParentByPhone(phone, schoolId);
    if (!parent) {
      console.warn('[getStudentsByPhone] No parent found for phone:', phone, schoolId ? `at school: ${schoolId}` : '');
      return [];
    }
    const students = parent.students || [];
    const pendingGuardianReviews = await getParentReviewRequests(parent.id);

    if ((!students || students.length === 0) && pendingGuardianReviews.length === 0) {
      console.warn('[getStudentsByPhone] No students or pending reviews found for phone:', phone, schoolId ? `at school: ${schoolId}` : '');
      return [];
    }

    console.log(`[getStudentsByPhone] Found ${students.length} linked students, fetching balances...`);
    // Fetch canonical balances and counts so all fee pages stay in sync.
    const studentIds = students.map(s => s.student_id);
    const [{ balanceMap, countMap }, pendingBalanceReviewMap] = await Promise.all([
      getCanonicalBalanceSnapshot(studentIds),
      getPendingBalanceReviewMap(studentIds)
    ]);
    const actualDebtMap = balanceMap;

    // Convert all students with their balances and counts
    const convertedStudents = await Promise.all(
      students.map(student => convertToLegacyStudent(student, balanceMap, countMap, actualDebtMap, pendingBalanceReviewMap))
    );
    const pendingReviewStudents = buildPendingGuardianReviewStudents(pendingGuardianReviews, schoolId);

    console.log('[getStudentsByPhone] Successfully converted students:', convertedStudents.map(s => s.name));
    return [...convertedStudents, ...pendingReviewStudents];
  } catch (error) {
    console.error('[getStudentsByPhone] Error:', error);
    // Return empty array on error to prevent app crash
    return [];
  }
}

/**
 * Get students by parent_id.
 */
export async function getStudentsByParentId(parentId: string): Promise<Student[]> {
  try {
    const students = await getStudentsByParentIdApi(parentId);
    const pendingGuardianReviews = await getParentReviewRequests(parentId);

    if ((!students || students.length === 0) && pendingGuardianReviews.length === 0) {
      return [];
    }

    const studentIds = students.map(s => s.student_id);
    const [{ balanceMap, countMap }, pendingBalanceReviewMap] = await Promise.all([
      getCanonicalBalanceSnapshot(studentIds),
      getPendingBalanceReviewMap(studentIds)
    ]);
    const actualDebtMap = balanceMap;

    const converted = await Promise.all(
      students.map(student => convertToLegacyStudent(student, balanceMap, countMap, actualDebtMap, pendingBalanceReviewMap))
    );
    return [...converted, ...buildPendingGuardianReviewStudents(pendingGuardianReviews)];
  } catch (error) {
    console.error('[getStudentsByParentId] Error:', error);
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

    // Fetch canonical balances and counts from the same source used in history.
    const studentIds = parentData.students.map((s: StudentWithSchool) => s.student_id);
    const [{ balanceMap, countMap }, pendingBalanceReviewMap] = await Promise.all([
      getCanonicalBalanceSnapshot(studentIds),
      getPendingBalanceReviewMap(studentIds)
    ]);
    const actualDebtMap = balanceMap;

    // Convert students with balances and counts
    const convertedStudents = await Promise.all(
      parentData.students.map((student: StudentWithSchool) => convertToLegacyStudent(student, balanceMap, countMap, actualDebtMap, pendingBalanceReviewMap))
    );
    const pendingReviewStudents = await getParentReviewRequests(parentData.id);

    return {
      id: parentData.id,
      name: parentData.name,
      phone: (parentData as any).phone_number || parentData.phone || '',
      students: [...convertedStudents, ...buildPendingGuardianReviewStudents(pendingReviewStudents)],
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
