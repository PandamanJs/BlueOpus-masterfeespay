// Registration API - v2.2 (Stability & Sync Refactor)
import { supabase } from '../client';
import type { ParentData } from '../../../components/registration/ParentInformationPage';
import { phoneVariants, toE164 } from '../../../utils/reconciliation';
import { getStudentFinancialSummary as getStudentFinancialSummaryCanonical } from './transactions';

export interface StudentData {
    id: string;
    name: string;
    grade: string;
    class: string;
    studentId: string;
    parentName?: string;
    otherParentName?: string;
    isGuardianLinkLocked?: boolean;
    guardianSlotsRemaining?: number;
    guardianNames?: string[];
    confidenceBand?: ConfidenceBand;
    confidenceScore?: number;
    requiresSchoolReview?: boolean;
    matchCandidateId?: string;
    balanceDisputeNote?: string;
    balanceDisputeClaimedBalance?: number;
    balanceDisputeRecordedBalance?: number;
    balanceDisputeRecordedChargedAmount?: number;
    balanceDisputeRecordedPaidAmount?: number;
    guardianReviewStudentId?: string;
    guardianReviewReason?: 'duplicate_suspected' | 'manual_override' | 'two_guardians_full';
    guardianReviewEvidence?: Record<string, any>;
}

export type ConfidenceBand = 'high' | 'medium' | 'low';

export interface MatchScoreBreakdown {
    exactName: number;
    tokenOverlap: number;
    gradeMatch: number;
    classMatch: number;
    duplicatePenalty: number;
}

export interface MatchCandidate {
    candidateId?: string;
    studentId: string;
    displayName: string;
    grade?: string;
    className?: string;
    confidenceScore: number;
    confidenceBand: ConfidenceBand;
    breakdown: MatchScoreBreakdown;
    requiresSchoolReview: boolean;
}

export interface ScoreStudentMatchesInput {
    registrationSessionId: string;
    parentId?: string;
    schoolId: string;
    queryName: string;
    queriedGrade?: string;
    queriedClass?: string;
}

export interface ScoreStudentMatchesResult {
    candidates: MatchCandidate[];
}

export interface AttemptGuardianLinkInput {
    registrationSessionId: string;
    parentId: string;
    schoolId: string;
    studentId: string;
    confidenceScore?: number;
    confidenceBand?: ConfidenceBand;
    evidence?: Record<string, any>;
    mediumConfirmed?: boolean;
}

export interface AttemptGuardianLinkResult {
    outcome: 'linked' | 'needs_confirmation' | 'queued_for_review' | 'blocked_two_guardians';
    requestId?: string;
    message: string;
}

export interface SchoolGrade {
    grade_id: string;
    grade_name: string;
    is_active?: boolean | null;
    display_order?: number | null;
}

/**
 * Search for students by name or admission number.
 */
export async function searchStudentsByName(
    query: string,
    schoolId?: string,
    currentParentId?: string,
    options?: { includeGuardianLocked?: boolean }
): Promise<StudentData[]> {
    if (!query || query.trim().length < 2) return [];

    const normalizedQuery = normalizeName(query);
    const tokens = normalizedQuery.split(' ').filter(Boolean);
    const searchTokens = tokens.length > 0
        ? tokens
        : query.trim().toLowerCase().split(/\s+/).map(token => token.replace(/[^a-z0-9]/gi, '')).filter(Boolean);

    if (searchTokens.length === 0) return [];

    const orTerms = Array.from(new Set(searchTokens)).flatMap(token => ([
        `first_name.ilike.%${token}%`,
        `last_name.ilike.%${token}%`,
        `admission_number.ilike.%${token}%`
    ]));

    let supabaseQuery = supabase
        .from('students')
        .select(`
            student_id,
            first_name,
            last_name,
            parent_id,
            other_parent_id,
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
        `)
        .or(orTerms.join(','));

    if (schoolId) {
        supabaseQuery = supabaseQuery.eq('school_id', schoolId);
    }

    const { data, error } = await supabaseQuery.limit(30);

    if (error) {
        console.error('Error searching students:', error);
        return [];
    }

    const includeGuardianLocked = Boolean(options?.includeGuardianLocked);
    const filtered = (data || []).filter(s => {
        const p1 = s.parent_id;
        const p2 = s.other_parent_id;
        
        // IF a child has two guardians already AND the current parent is not one of them, hide it
        if (p1 && p2) {
            if (currentParentId && (p1 === currentParentId || p2 === currentParentId)) {
                return true; // Current parent is already linked, show it (for confirmation/view)
            }
            return includeGuardianLocked; // Keep hidden for normal search, expose for review-aware duplicate checks
        }
        
        return true; // 0 or 1 guardians -> Show it
    });

    const scored = filtered.map(s => {
        const studentGrades = (s as any).student_grade || [];
        const activeGrade = studentGrades.find((sg: any) => sg.is_active) || studentGrades[0];
        const p1 = (s as any).parent;
        const p2 = (s as any).other_parent;
        const primaryParent = p1 ? `${p1.first_name} ${p1.last_name}`.trim() : undefined;
        const secondaryParent = p2 ? `${p2.first_name} ${p2.last_name}`.trim() : undefined;
        const guardianNames = [primaryParent, secondaryParent].filter(Boolean) as string[];
        const hasPrimaryGuardian = Boolean((s as any).parent_id);
        const hasSecondaryGuardian = Boolean((s as any).other_parent_id);
        const guardianCount = (hasPrimaryGuardian ? 1 : 0) + (hasSecondaryGuardian ? 1 : 0);
        const guardianSlotsRemaining = Math.max(0, 2 - guardianCount);
        const displayName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
        const normalizedDisplayName = normalizeName(displayName);
        const normalizedAdmission = String(s.admission_number || '').toLowerCase();
        const matchesAllTokens = searchTokens.every(token =>
            normalizedDisplayName.includes(token) || normalizedAdmission.includes(token)
        );

        if (!matchesAllTokens) return null;

        const exactNameMatch = normalizedDisplayName === normalizedQuery;
        const startsWithQuery = normalizedDisplayName.startsWith(normalizedQuery);
        const admissionExact = normalizedAdmission === query.trim().toLowerCase();
        const tokenHits = searchTokens.reduce((sum, token) => {
            return sum
                + (normalizedDisplayName.includes(token) ? 2 : 0)
                + (normalizedAdmission.includes(token) ? 1 : 0);
        }, 0);
        const score = (admissionExact ? 120 : 0)
            + (exactNameMatch ? 100 : 0)
            + (startsWithQuery ? 25 : 0)
            + tokenHits;

        return {
            id: s.student_id,
            name: displayName,
            grade: activeGrade?.grades?.grade_name || 'Unknown',
            class: activeGrade?.class || 'A',
            studentId: s.admission_number || 'Pending',
            parentName: primaryParent,
            otherParentName: secondaryParent,
            guardianNames,
            isGuardianLinkLocked: guardianSlotsRemaining === 0,
            guardianSlotsRemaining,
            confidenceScore: score
        };
    }).filter((student): student is StudentData & { confidenceScore: number } => Boolean(student));

    return scored
        .sort((left, right) => (right.confidenceScore || 0) - (left.confidenceScore || 0))
        .slice(0, 15);
}

function normalizeName(value: string): string {
    return (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function nameTokens(value: string): string[] {
    return normalizeName(value).split(' ').filter(Boolean);
}

function tokenOverlapRatio(left: string[], right: string[]): number {
    if (!left.length || !right.length) return 0;
    const rightSet = new Set(right);
    const overlap = left.filter(token => rightSet.has(token)).length;
    return overlap / Math.max(left.length, right.length);
}

function matchesAllQueryTokens(queryTokens: string[], candidateName: string): boolean {
    if (!queryTokens.length) return true;
    const candidateTokens = nameTokens(candidateName);
    const candidateSet = new Set(candidateTokens);
    return queryTokens.every(token => candidateSet.has(token));
}

function toConfidenceBand(score: number): ConfidenceBand {
    if (score >= 80) return 'high';
    if (score >= 45) return 'medium';
    return 'low';
}

function normalizeGradeLabel(value: string): string {
    return (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function numberFromWord(value: string): number | null {
    const byWord: Record<string, number> = {
        one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
        seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
    };
    return byWord[value] ?? null;
}

function gradeSortRank(gradeName: string): number {
    const n = normalizeGradeLabel(gradeName);

    // Early-learning sequence
    if (/^baby class$/.test(n) || n.includes('baby class')) return 10;
    if (/^middle class$/.test(n) || n.includes('middle class')) return 20;
    if (n === 'reception' || n.includes('reception class')) return 30;

    // Nursery aliases (some schools use Nursery One/Two)
    if (/nursery\s*(1|one|i)\b/.test(n) || n === 'nursery one' || n === 'nursery 1') return 40;
    if (/nursery\s*(2|two|ii)\b/.test(n) || n === 'nursery two' || n === 'nursery 2') return 50;

    // Pre-unit / PP
    if (/pre[\s-]?unit/.test(n) || /\bpp\s*1\b/.test(n)) return 60;
    if (/\bpp\s*2\b/.test(n)) return 70;

    // Grade/class/standard/form/year + numeric
    const numericMatch = n.match(/\b(grade|gr|class|std|standard|form|year)\s*(\d{1,2})\b/);
    if (numericMatch) return 100 + Number(numericMatch[2]);

    // Bare numeric fallback: "1", "2", ...
    const bareNumeric = n.match(/^(\d{1,2})$/);
    if (bareNumeric) return 100 + Number(bareNumeric[1]);

    // Word-number fallback: "grade one", "form two", ...
    const wordMatch = n.match(/\b(grade|gr|class|std|standard|form|year)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/);
    if (wordMatch) {
        const parsed = numberFromWord(wordMatch[2]);
        if (parsed !== null) return 100 + parsed;
    }

    // Unknown labels go last, alphabetically.
    return 1000;
}

function sortSchoolGrades(grades: SchoolGrade[]): SchoolGrade[] {
    return [...grades].sort((a, b) => {
        const rankA = gradeSortRank(a.grade_name);
        const rankB = gradeSortRank(b.grade_name);
        if (rankA !== rankB) return rankA - rankB;
        return a.grade_name.localeCompare(b.grade_name, undefined, { sensitivity: 'base' });
    });
}

function normalizeClassLabel(value: string): string {
    return (value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
}

function uniqueSortedStreams(values: string[]): string[] {
    const cleaned = values
        .map(v => normalizeClassLabel(v))
        .filter(Boolean);
    return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

async function getStudentGradeClassFallbackByGradeName(schoolId: string, gradeName: string): Promise<string[]> {
    const trimmedGrade = (gradeName || '').trim();
    if (!schoolId || !trimmedGrade) return [];

    const { data: rows, error } = await supabase
        .from('student_grade')
        .select(`
            class,
            students!inner ( school_id ),
            grades!inner ( grade_name )
        `)
        .eq('students.school_id', schoolId)
        .ilike('grades.grade_name', trimmedGrade);

    if (error) {
        throw new Error(`Failed to fetch class fallback from student records for ${trimmedGrade}: ${error.message}`);
    }

    return uniqueSortedStreams((rows || []).map((r: any) => r.class).filter((v: string) => {
        const n = (v || '').trim().toLowerCase();
        return Boolean(n) && n !== 'general';
    }));
}

async function writeGuardianAudit(entry: {
    actorParentId?: string | null;
    actorRole: 'parent' | 'school_admin' | 'system';
    action: 'match_scored' | 'link_attempted' | 'link_blocked' | 'link_approved' | 'link_rejected' | 'merge_requested' | 'merge_executed';
    parentId?: string | null;
    studentId?: string | null;
    requestId?: string | null;
    payload?: Record<string, any>;
}) {
    const { error } = await supabase.from('guardian_link_audit').insert({
        actor_parent_id: entry.actorParentId || null,
        actor_role: entry.actorRole,
        action: entry.action,
        parent_id: entry.parentId || null,
        student_id: entry.studentId || null,
        request_id: entry.requestId || null,
        payload: entry.payload || {},
    });
    if (error) {
        console.warn('[GuardianAudit] Failed to write audit record:', error.message);
    }
}

export async function scoreStudentMatches(input: ScoreStudentMatchesInput): Promise<ScoreStudentMatchesResult> {
    const queryName = input.queryName.trim();
    if (queryName.length < 2) return { candidates: [] };

    const tokens = nameTokens(queryName);
    const orTerms = Array.from(new Set(tokens));
    const orFilter = orTerms
        .map(token => `first_name.ilike.%${token}%,last_name.ilike.%${token}%`)
        .join(',');

    let query = supabase
        .from('students')
        .select(`
            student_id,
            first_name,
            last_name,
            school_id,
            student_grade (
                class,
                is_active,
                grades (
                    grade_name
                )
            )
        `)
        .eq('school_id', input.schoolId)
        .limit(30);

    if (orFilter) {
        query = query.or(orFilter);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to score student matches: ${error.message}`);

    // Enforce narrowing behavior: as users type more tokens, candidates must match all tokens.
    // Example: "banda" -> many rows, "banda tapiwa" -> only names containing both tokens.
    const narrowedRows = (data || []).filter((row: any) => {
        const displayName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
        return matchesAllQueryTokens(tokens, displayName);
    });

    const candidates: MatchCandidate[] = narrowedRows.map((row: any) => {
        const displayName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
        const studentTokens = nameTokens(displayName);
        const activeGrade = (row.student_grade || []).find((sg: any) => sg.is_active) || row.student_grade?.[0];
        const gradeName = activeGrade?.grades?.grade_name || '';
        const className = activeGrade?.class || '';

        const normalizedDisplay = normalizeName(displayName);
        const normalizedQuery = normalizeName(queryName);

        const exactName = normalizedDisplay === normalizedQuery ? 55 : 0;
        const overlap = tokenOverlapRatio(tokens, studentTokens);
        const tokenOverlap = Math.round(overlap * 30);
        const overlapSupport = overlap > 0 ? 40 : 0;
        const normalizedGrade = normalizeGradeLabel(gradeName);
        const normalizedQueriedGrade = normalizeGradeLabel(input.queriedGrade || '');
        const normalizedClass = normalizeClassLabel(className);
        const normalizedQueriedClass = normalizeClassLabel(input.queriedClass || '');
        const sameNameAsQuery = normalizedDisplay === normalizedQuery;
        const sameQueriedGrade = Boolean(normalizedQueriedGrade) && normalizedGrade === normalizedQueriedGrade;
        const sameQueriedClass = Boolean(normalizedQueriedClass)
            && normalizedQueriedClass !== 'GENERAL'
            && normalizedClass === normalizedQueriedClass;
        const requiresSchoolReview = sameNameAsQuery && (sameQueriedGrade || sameQueriedClass);

        const gradeMatch = sameQueriedGrade ? 10 : 0;
        const classMatch = sameQueriedClass ? 5 : 0;

        // Same name is only risky when the entered grade or a real stream/class also matches.
        const uniqueExactNameBonus = exactName > 0 && !requiresSchoolReview ? 25 : 0;
        const duplicatePenalty = requiresSchoolReview ? -20 : 0;

        const rawScore = exactName + tokenOverlap + overlapSupport + gradeMatch + classMatch + uniqueExactNameBonus + duplicatePenalty;
        const confidenceScore = Math.max(0, Math.min(100, rawScore));
        const confidenceBand = toConfidenceBand(confidenceScore);

        return {
            studentId: row.student_id,
            displayName,
            grade: gradeName,
            className,
            confidenceScore,
            confidenceBand,
            breakdown: {
                exactName,
                tokenOverlap,
                gradeMatch,
                classMatch,
                duplicatePenalty
            },
            requiresSchoolReview
        };
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);

    if (candidates.length > 0) {
        const rows = candidates.map(c => ({
            registration_session_id: input.registrationSessionId,
            parent_id: input.parentId || null,
            school_id: input.schoolId,
            queried_name: queryName,
            queried_class: input.queriedClass || null,
            student_id: c.studentId,
            confidence_score: c.confidenceScore,
            confidence_band: c.confidenceBand,
            score_breakdown: c.breakdown,
            decision: 'pending'
        }));

        const { data: insertedRows, error: insertError } = await supabase
            .from('student_match_candidates')
            .insert(rows)
            .select('candidate_id, student_id');

        if (!insertError && insertedRows) {
            const byStudent = new Map(insertedRows.map((r: any) => [r.student_id, r.candidate_id]));
            candidates.forEach(candidate => {
                candidate.candidateId = byStudent.get(candidate.studentId);
            });
        }
    }

    await writeGuardianAudit({
        actorParentId: input.parentId || null,
        actorRole: input.parentId ? 'parent' : 'system',
        action: 'match_scored',
        parentId: input.parentId || null,
        payload: {
            registrationSessionId: input.registrationSessionId,
            queryName,
            candidates: candidates.slice(0, 10).map(c => ({
                studentId: c.studentId,
                confidenceScore: c.confidenceScore,
                confidenceBand: c.confidenceBand
            }))
        }
    });

    return { candidates };
}

async function createGuardianLinkRequest(input: {
    registrationSessionId: string;
    parentId: string;
    schoolId: string;
    studentId: string;
    requestReason: 'medium_confidence' | 'low_confidence' | 'two_guardians_full' | 'duplicate_suspected' | 'manual_override';
    confidenceScore?: number;
    confidenceBand?: ConfidenceBand;
    evidence?: Record<string, any>;
}): Promise<string> {
    const { data, error } = await supabase
        .from('guardian_link_requests')
        .insert({
            registration_session_id: input.registrationSessionId,
            parent_id: input.parentId,
            school_id: input.schoolId,
            requested_student_id: input.studentId,
            request_reason: input.requestReason,
            confidence_score: input.confidenceScore ?? null,
            confidence_band: input.confidenceBand ?? null,
            evidence: input.evidence || {},
            status: 'pending'
        })
        .select('request_id')
        .single();

    if (error) {
        if (error.code === '23505') {
            const { data: existing, error: existingError } = await supabase
                .from('guardian_link_requests')
                .select('request_id')
                .eq('parent_id', input.parentId)
                .eq('requested_student_id', input.studentId)
                .eq('status', 'pending')
                .maybeSingle();

            if (!existingError && existing?.request_id) {
                return existing.request_id;
            }
        }

        throw new Error(`Failed to create guardian link request: ${error.message}`);
    }
    return data.request_id;
}

export async function attemptGuardianLink(input: AttemptGuardianLinkInput): Promise<AttemptGuardianLinkResult> {
    const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('student_id, parent_id, other_parent_id')
        .eq('student_id', input.studentId)
        .maybeSingle();

    if (fetchError) throw new Error(`Failed to validate student link: ${fetchError.message}`);
    if (!student) throw new Error('Student was not found.');

    await writeGuardianAudit({
        actorParentId: input.parentId,
        actorRole: 'parent',
        action: 'link_attempted',
        parentId: input.parentId,
        studentId: input.studentId,
        payload: {
            registrationSessionId: input.registrationSessionId,
            confidenceScore: input.confidenceScore ?? null,
            confidenceBand: input.confidenceBand ?? null,
        }
    });

    if (student.parent_id === input.parentId || student.other_parent_id === input.parentId) {
        return { outcome: 'linked', message: 'Student is already linked to this parent profile.' };
    }

    const band = input.confidenceBand ?? 'medium';
    if (band === 'low') {
        const requestId = await createGuardianLinkRequest({
            registrationSessionId: input.registrationSessionId,
            parentId: input.parentId,
            schoolId: input.schoolId,
            studentId: input.studentId,
            requestReason: 'low_confidence',
            confidenceScore: input.confidenceScore,
            confidenceBand: band,
            evidence: input.evidence
        });
        await writeGuardianAudit({
            actorParentId: input.parentId,
            actorRole: 'parent',
            action: 'link_blocked',
            parentId: input.parentId,
            studentId: input.studentId,
            requestId,
            payload: { reason: 'low_confidence' }
        });
        return {
            outcome: 'queued_for_review',
            requestId,
            message: 'This match needs school review before linking.'
        };
    }

    if (band === 'medium' && !input.mediumConfirmed) {
        return {
            outcome: 'needs_confirmation',
            message: 'Please confirm this medium-confidence match before linking.'
        };
    }

    const updatePayload: Record<string, string> = {};
    if (!student.parent_id) {
        updatePayload.parent_id = input.parentId;
    } else if (!student.other_parent_id) {
        updatePayload.other_parent_id = input.parentId;
    } else {
        const requestId = await createGuardianLinkRequest({
            registrationSessionId: input.registrationSessionId,
            parentId: input.parentId,
            schoolId: input.schoolId,
            studentId: input.studentId,
            requestReason: 'two_guardians_full',
            confidenceScore: input.confidenceScore,
            confidenceBand: band,
            evidence: input.evidence
        });
        await writeGuardianAudit({
            actorParentId: input.parentId,
            actorRole: 'parent',
            action: 'link_blocked',
            parentId: input.parentId,
            studentId: input.studentId,
            requestId,
            payload: { reason: 'two_guardians_full' }
        });
        return {
            outcome: 'blocked_two_guardians',
            requestId,
            message: 'This student already has two parent/guardian profiles. School review is required.'
        };
    }

    const { error: linkError } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('student_id', input.studentId);
    if (linkError) throw new Error(`Failed to link guardian: ${linkError.message}`);

    await writeGuardianAudit({
        actorParentId: input.parentId,
        actorRole: 'parent',
        action: 'link_approved',
        parentId: input.parentId,
        studentId: input.studentId,
        payload: { band, mediumConfirmed: Boolean(input.mediumConfirmed) }
    });

    return { outcome: 'linked', message: 'Student linked successfully.' };
}

export async function confirmMediumConfidenceLink(input: Omit<AttemptGuardianLinkInput, 'mediumConfirmed'>): Promise<AttemptGuardianLinkResult> {
    return attemptGuardianLink({ ...input, mediumConfirmed: true });
}

export async function reportDuplicateSuspicion(input: {
    schoolId: string;
    requestedByParentId?: string;
    survivorStudentId: string;
    duplicateStudentId: string;
    suspicionScore?: number;
    rationale?: Record<string, any>;
}) {
    const { data, error } = await supabase
        .from('student_merge_jobs')
        .insert({
            school_id: input.schoolId,
            survivor_student_id: input.survivorStudentId,
            duplicate_student_id: input.duplicateStudentId,
            suspicion_score: input.suspicionScore ?? null,
            rationale: input.rationale || {},
            requested_by_parent_id: input.requestedByParentId || null,
            status: 'pending'
        })
        .select('merge_job_id, status')
        .single();

    if (error) throw new Error(`Failed to report duplicate suspicion: ${error.message}`);

    await writeGuardianAudit({
        actorParentId: input.requestedByParentId || null,
        actorRole: input.requestedByParentId ? 'parent' : 'system',
        action: 'merge_requested',
        studentId: input.duplicateStudentId,
        payload: {
            mergeJobId: data.merge_job_id,
            survivorStudentId: input.survivorStudentId,
            duplicateStudentId: input.duplicateStudentId,
        }
    });

    return {
        mergeJobId: data.merge_job_id,
        status: data.status as 'pending' | 'approved' | 'executed' | 'rejected'
    };
}

/**
 * Register a parent or find an existing one.
 */
export interface RegisterParentResult {
    parentId: string;
    isExisting: boolean;
    wasCreated: boolean;
    existingName?: string;
    duplicateField?: 'phone' | 'email';
    matchType?: 'phone' | 'email';
    isNameMatch?: boolean;
}

export async function registerParent(parentData: ParentData): Promise<RegisterParentResult> {
    console.log('[Registration] Registering parent:', { phone: parentData.phone, existingId: parentData.parentId });

    // 0. If we already have an ID (from a deliberate UI match or smart check), skip detection
    if (parentData.parentId) {
        return { parentId: parentData.parentId, isExisting: false, wasCreated: false };
    }
    
    // 1. Credential-based duplicate detection only. Names are not unique.
    const safeVariants = phoneVariants(parentData.phone).filter(v => v.replace(/\D/g, '').length >= 9);

    const { data: phoneMatch, error: phoneErr } = await supabase
        .from('parents')
        .select('parent_id, first_name, last_name')
        .in('phone_number', safeVariants)
        .limit(1)
        .maybeSingle();

    if (phoneErr) throw new Error(`Failed to check phone number: ${phoneErr.message}`);

    if (phoneMatch) {
        const existingName = `${phoneMatch.first_name} ${phoneMatch.last_name}`.trim();
        const isNameMatch = parentData.fullName.trim().toLowerCase() === existingName.toLowerCase();
        
        // Check if this parent already has students at THIS school
        const { data: schoolLink } = await supabase
            .from('students')
            .select('student_id')
            .eq('school_id', parentData.schoolId)
            .or(`parent_id.eq.${phoneMatch.parent_id},other_parent_id.eq.${phoneMatch.parent_id}`)
            .limit(1)
            .maybeSingle();

        const isExistingInSchool = !!schoolLink;

        return { 
            parentId: phoneMatch.parent_id, 
            isExisting: isExistingInSchool, 
            wasCreated: false, 
            existingName, 
            duplicateField: 'phone', 
            matchType: 'phone', 
            isNameMatch 
        };
    }

    // 2. Email-based fallback
    const trimmedEmail = parentData.email.trim().toLowerCase();
    if (trimmedEmail) {
        const { data: emailMatch, error: emailErr } = await supabase
            .from('parents')
            .select('parent_id, first_name, last_name')
            .eq('email', trimmedEmail)
            .limit(1)
            .maybeSingle();

        if (emailErr) throw new Error(`Failed to check email address: ${emailErr.message}`);
        
        if (emailMatch) {
            const existingName = `${emailMatch.first_name} ${emailMatch.last_name}`.trim();
            
            // Check if this parent already has students at THIS school
            const { data: schoolLink } = await supabase
                .from('students')
                .select('student_id')
                .eq('school_id', parentData.schoolId)
                .or(`parent_id.eq.${emailMatch.parent_id},other_parent_id.eq.${emailMatch.parent_id}`)
                .limit(1)
                .maybeSingle();

            const isExistingInSchool = !!schoolLink;

            return { 
                parentId: emailMatch.parent_id, 
                isExisting: isExistingInSchool, 
                wasCreated: false, 
                existingName, 
                duplicateField: 'email', 
                matchType: 'email' 
            };
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
            phone_number: toE164(parentData.phone),
            created_at: new Date().toISOString()
        })
        .select('parent_id')
        .single();

    if (error) throw new Error(`Failed to create account: ${error.message}`);
    return { parentId: data.parent_id, isExisting: false, wasCreated: true };
}

/**
 * Linking students and grades.
 */
export async function linkStudentsToParent(parentId: string, students: StudentData[], schoolId: string): Promise<void> {
    console.log('[Registration] Linking students process started');
    const registrationSessionId = crypto.randomUUID();
    
    // Fetch grades and academic year
    const [{ data: schoolGrades, error: gradesError }, { data: academicYear, error: academicYearError }] = await Promise.all([
        supabase.from('grades').select('grade_id, grade_name').eq('school_id', schoolId),
        supabase.from('academic_year').select('academic_year_id').order('year', { ascending: false }).limit(1).maybeSingle()
    ]);

    if (gradesError) throw new Error(`Failed to load grades: ${gradesError.message}`);
    if (academicYearError) throw new Error(`Failed to load academic year: ${academicYearError.message}`);
    if (!academicYear) throw new Error('No active academic year found.');
    const gradeMap = new Map((schoolGrades || []).map(g => [g.grade_name.toLowerCase(), g.grade_id]));
    const streamMap = new Map<string, string>();
    const desiredByInputId = new Map<string, {
        firstName: string;
        lastName: string;
        targetGradeId: string;
        className: string;
        streamId: string | null;
    }>();
    const createdStudentIds: string[] = [];
    const touchedExistingStudentIds = new Set<string>();
    const existingIds = students
        .filter(s => !s.id.startsWith('new-') && !s.guardianReviewStudentId)
        .map(s => s.id);
    const previousStudentsMap = new Map<string, {
        parent_id: string | null;
        other_parent_id: string | null;
        first_name: string | null;
        last_name: string | null;
        verification_status: string | null;
        metadata: Record<string, any> | null;
    }>();
    const previousGradeMap = new Map<string, {
        student_id: string;
        grade_id: string;
        academic_year_id: string;
        class: string | null;
        is_active: boolean | null;
        school_id: string | null;
        stream_id: string | null;
    }>();

    if (existingIds.length > 0) {
        const [{ data: previousStudents, error: prevStudentsError }, { data: previousGrades, error: prevGradesError }] = await Promise.all([
            supabase.from('students').select('student_id, parent_id, other_parent_id, first_name, last_name, verification_status, metadata').in('student_id', existingIds),
            supabase.from('student_grade').select('student_id, grade_id, academic_year_id, class, is_active, school_id, stream_id')
                .eq('academic_year_id', academicYear.academic_year_id)
                .in('student_id', existingIds),
        ]);

        if (prevStudentsError) throw new Error(`Failed to load current student links: ${prevStudentsError.message}`);
        if (prevGradesError) throw new Error(`Failed to load current grade assignments: ${prevGradesError.message}`);

        for (const row of previousStudents || []) {
            previousStudentsMap.set(row.student_id, {
                parent_id: row.parent_id,
                other_parent_id: row.other_parent_id,
                first_name: row.first_name,
                last_name: row.last_name,
                verification_status: row.verification_status,
                metadata: row.metadata,
            });
        }
        for (const row of previousGrades || []) {
            previousGradeMap.set(row.student_id, {
                student_id: row.student_id,
                grade_id: row.grade_id,
                academic_year_id: row.academic_year_id,
                class: row.class,
                is_active: row.is_active,
                school_id: row.school_id,
                stream_id: row.stream_id,
            });
        }
    }

    // Pre-validate grade references up-front so we fail before any writes.
    // Class/stream mismatches are treated as non-fatal because many schools
    // have legacy class labels that don't map 1:1 to school_streams.
    for (const student of students) {
        if (student.guardianReviewStudentId) continue;

        const nameParts = student.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        const targetGradeId = gradeMap.get(student.grade.trim().toLowerCase());
        if (!targetGradeId) throw new Error(`Could not find grade "${student.grade}" for ${student.name}.`);

        const className = student.class || 'A';
        let targetStreamId: string | null = null;
        if (className && className !== 'General') {
            const streamKey = `${targetGradeId}::${className.toLowerCase()}`;
            if (streamMap.has(streamKey)) {
                targetStreamId = streamMap.get(streamKey) || null;
            } else {
                const { data: stream, error: streamError } = await supabase.from('school_streams')
                    .select('id')
                    .eq('school_id', schoolId)
                    .eq('grade_id', targetGradeId)
                    .eq('stream_name', className)
                    .maybeSingle();
                if (streamError) throw new Error(`Failed to validate class "${className}" for ${student.name}: ${streamError.message}`);
                targetStreamId = stream?.id || null;
                streamMap.set(streamKey, targetStreamId);
            }
        }

        desiredByInputId.set(student.id, {
            firstName,
            lastName,
            targetGradeId,
            className,
            streamId: targetStreamId,
        });
    }

    try {
        for (const student of students) {
            if (student.guardianReviewStudentId) {
                const requestId = await createGuardianLinkRequest({
                    registrationSessionId: String(student.guardianReviewEvidence?.registrationSessionId || crypto.randomUUID()),
                    parentId,
                    schoolId,
                    studentId: student.guardianReviewStudentId,
                    requestReason: student.guardianReviewReason || 'duplicate_suspected',
                    confidenceScore: typeof student.guardianReviewEvidence?.confidenceScore === 'number'
                        ? student.guardianReviewEvidence.confidenceScore
                        : undefined,
                    confidenceBand: student.guardianReviewEvidence?.confidenceBand as ConfidenceBand | undefined,
                    evidence: {
                        ...student.guardianReviewEvidence,
                        requestedName: student.name,
                        requestedGrade: student.grade,
                        requestedClass: student.class,
                    },
                });

                await writeGuardianAudit({
                    actorParentId: parentId,
                    actorRole: 'parent',
                    action: 'link_blocked',
                    parentId,
                    studentId: student.guardianReviewStudentId,
                    requestId,
                    payload: {
                        reason: student.guardianReviewReason || 'duplicate_suspected',
                        requestedName: student.name,
                        requestedGrade: student.grade,
                        requestedClass: student.class,
                    },
                });

                continue;
            }

            const desired = desiredByInputId.get(student.id);
            if (!desired) throw new Error(`Missing prepared registration data for ${student.name}.`);

            let student_id = student.id;

            if (student.id.startsWith('new-')) {
                // New student creation
                student_id = await createManualStudent({
                    schoolId,
                    parentId,
                    firstName: desired.firstName,
                    lastName: desired.lastName
                });
                createdStudentIds.push(student_id);
            } else {
                // Link existing student without overriding guardian assignments incorrectly.
                const { data: existingStudentRow, error: existingStudentError } = await supabase
                    .from('students')
                    .select('student_id, parent_id, other_parent_id')
                    .eq('student_id', student.id)
                    .maybeSingle();
                if (existingStudentError) throw new Error(existingStudentError.message);
                if (!existingStudentRow) throw new Error(`Student ${student.name} was not found during linking.`);

                const linkUpdate: Record<string, string> = {};
                if (existingStudentRow.parent_id === parentId || existingStudentRow.other_parent_id === parentId) {
                    // Already linked to this parent; no guardian slot changes needed.
                } else if (!existingStudentRow.parent_id) {
                    linkUpdate.parent_id = parentId;
                } else if (!existingStudentRow.other_parent_id) {
                    linkUpdate.other_parent_id = parentId;
                } else {
                    throw new Error(
                        `${student.name} already has two parent/guardian profiles assigned. Please request support from the school office to review or transfer access.`
                    );
                }

                if (Object.keys(linkUpdate).length > 0) {
                    const { error: updateError } = await supabase.from('students')
                        .update(linkUpdate)
                        .eq('student_id', student.id);
                    if (updateError) throw updateError;
                }
                touchedExistingStudentIds.add(student.id);
            }
            await syncLegacyParentLinkIfAvailable(student_id, parentId);

            if (student.balanceDisputeNote?.trim()) {
                const claimedBalance = Number(student.balanceDisputeClaimedBalance ?? 0);
                const safeClaimedBalance = Number.isFinite(claimedBalance) && claimedBalance >= 0 ? claimedBalance : 0;
                const recordedBalance = Number(student.balanceDisputeRecordedBalance ?? 0);
                const recordedChargedAmount = Number(student.balanceDisputeRecordedChargedAmount ?? 0);
                const recordedPaidAmount = Number(student.balanceDisputeRecordedPaidAmount ?? 0);

                const { error: verificationError } = await supabase
                    .from('students')
                    .update({ verification_status: 'unverified' })
                    .eq('student_id', student_id);
                if (verificationError) throw new Error(`Failed to queue balance verification for ${student.name}: ${verificationError.message}`);

                const { error: disputeError } = await supabase
                    .from('refund_requests')
                    .insert({
                        student_id,
                        parent_id: parentId,
                        school_id: schoolId,
                        amount: safeClaimedBalance,
                        reason: student.balanceDisputeNote.trim(),
                        status: 'pending',
                        meta_data: {
                            source: 'registration_review',
                            type: 'student_account_dispute',
                            parent_claimed_balance: safeClaimedBalance,
                            recorded_balance_at_submission: Number.isFinite(recordedBalance) ? recordedBalance : null,
                            recorded_charged_amount: Number.isFinite(recordedChargedAmount) ? recordedChargedAmount : null,
                            recorded_paid_amount: Number.isFinite(recordedPaidAmount) ? recordedPaidAmount : null
                        },
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                if (disputeError) throw new Error(`Failed to submit balance review request for ${student.name}: ${disputeError.message}`);
            }

            const gradeEntry = {
                student_id,
                grade_id: desired.targetGradeId,
                academic_year_id: academicYear.academic_year_id,
                class: desired.className,
                is_active: true,
                school_id: schoolId,
                stream_id: desired.streamId
            };

            const { data: existingGrade, error: existingGradeError } = await supabase
                .from('student_grade')
                .select('student_id')
                .eq('student_id', student_id)
                .eq('academic_year_id', academicYear.academic_year_id)
                .limit(1)
                .maybeSingle();
            if (existingGradeError) throw new Error(existingGradeError.message);

            if (existingGrade) {
                const { error: gradeUpdateError } = await supabase
                    .from('student_grade')
                    .update(gradeEntry)
                    .eq('student_id', student_id)
                    .eq('academic_year_id', academicYear.academic_year_id);
                if (gradeUpdateError) throw new Error(gradeUpdateError.message);
            } else {
                const { error: gradeInsertError } = await supabase
                    .from('student_grade')
                    .insert(gradeEntry);
                if (gradeInsertError) throw new Error(gradeInsertError.message);
            }

            if (!student.id.startsWith('new-')) {
                touchedExistingStudentIds.add(student.id);
            }
        }
    } catch (error) {
        const cleanupIssues: string[] = [];
        // Best-effort compensation to avoid silent partial registration state.
        if (createdStudentIds.length > 0) {
            const { error: deleteGradesError } = await supabase.from('student_grade')
                .delete()
                .eq('academic_year_id', academicYear.academic_year_id)
                .in('student_id', createdStudentIds);
            if (deleteGradesError) cleanupIssues.push(`student_grade cleanup failed: ${deleteGradesError.message}`);

            const { error: deleteStudentsError } = await supabase
                .from('students')
                .delete()
                .in('student_id', createdStudentIds);
            if (deleteStudentsError) cleanupIssues.push(`student cleanup failed: ${deleteStudentsError.message}`);
        }

        for (const studentId of touchedExistingStudentIds) {
            const previousStudent = previousStudentsMap.get(studentId);
            if (previousStudent) {
                await supabase.from('students')
                    .update({
                        parent_id: previousStudent.parent_id,
                        other_parent_id: previousStudent.other_parent_id,
                        first_name: previousStudent.first_name,
                        last_name: previousStudent.last_name,
                        verification_status: previousStudent.verification_status,
                        metadata: previousStudent.metadata,
                    })
                    .eq('student_id', studentId);
            }

            const previousGrade = previousGradeMap.get(studentId);
            if (previousGrade) {
                const { data: existingRestoreGrade } = await supabase
                    .from('student_grade')
                    .select('student_id')
                    .eq('student_id', previousGrade.student_id)
                    .eq('academic_year_id', previousGrade.academic_year_id)
                    .limit(1)
                    .maybeSingle();

                if (existingRestoreGrade) {
                    await supabase.from('student_grade')
                        .update(previousGrade)
                        .eq('student_id', previousGrade.student_id)
                        .eq('academic_year_id', previousGrade.academic_year_id);
                } else {
                    await supabase.from('student_grade')
                        .insert(previousGrade);
                }
            } else {
                await supabase.from('student_grade')
                    .delete()
                    .eq('academic_year_id', academicYear.academic_year_id)
                    .eq('student_id', studentId);
            }
        }

        const baseReason = error instanceof Error ? error.message : 'Unknown registration error';
        const cleanupReason = cleanupIssues.length > 0
            ? ` Cleanup warning: ${cleanupIssues.join(' | ')}`
            : '';
        throw new Error(`Failed to complete student linking. Changes were rolled back. ${baseReason}${cleanupReason}`.trim());
    }
}

export async function rollbackParentCreation(parentId: string): Promise<void> {
    const { data: linkedStudents, error: linkedError } = await supabase
        .from('students')
        .select('student_id')
        .or(`parent_id.eq.${parentId},other_parent_id.eq.${parentId}`)
        .limit(1);

    if (linkedError) {
        throw new Error(`Failed to verify rollback safety: ${linkedError.message}`);
    }

    if ((linkedStudents || []).length > 0) {
        // Parent is already linked, so don't delete it.
        return;
    }

    const { error: deleteError } = await supabase
        .from('parents')
        .delete()
        .eq('parent_id', parentId);

    if (deleteError) {
        throw new Error(`Failed to rollback parent creation: ${deleteError.message}`);
    }
}

export async function getGradesWithStreams(schoolId: string) {
    const grades = await getGradesBySchool(schoolId);
    const result: { grade_id: string; grade_name: string; stream_name?: string }[] = [];

    for (const grade of grades || []) {
        const classes = await getClassesByGrade(schoolId, grade.grade_id);

        if ((classes || []).length > 0) {
            classes.forEach((streamName: string) => {
                result.push({
                    grade_id: grade.grade_id,
                    grade_name: grade.grade_name,
                    stream_name: streamName,
                });
            });
        } else {
            result.push({
                grade_id: grade.grade_id,
                grade_name: grade.grade_name,
            });
        }
    }

    return result;
}

/**
 * Saves a parent's confirmation or dispute of the currently displayed ledger.
 * The balance review workflow still uses refund_requests; this record is an
 * extra audit trail for the parent-facing review step.
 */
export async function saveLedgerVerification(params: {
    studentId: string;
    parentId?: string;
    schoolId?: string;
    status: 'confirmed' | 'disputed';
    notes?: string;
    metadata?: any;
}) {
    const { error } = await supabase
        .from('ledger_verifications')
        .insert({
            student_id: params.studentId,
            parent_id: params.parentId,
            school_id: params.schoolId,
            status: params.status,
            notes: params.notes,
            meta_data: params.metadata || {},
        });

    if (error) {
        console.warn('[Registration] Ledger verification audit failed:', error.message);
    }

    return { success: !error };
}

function isAuthorizationError(error: any): boolean {
    const message = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '').toLowerCase();
    const status = Number((error as any)?.status || 0);

    return status === 401
        || status === 403
        || code === '42501'
        || message.includes('not authenticated')
        || message.includes('row-level security')
        || message.includes('permission denied')
        || message.includes('jwt');
}

function toStudentCreationError(error: any): Error {
    if (isAuthorizationError(error)) {
        return new Error(
            'Student creation is blocked by database permissions (401/403). Please enable an INSERT policy for students or register while authenticated.'
        );
    }
    return new Error(`Failed to create student record: ${error?.message || 'Unknown error'}`);
}

async function createManualStudent(data: {
    schoolId: string;
    parentId: string;
    firstName: string;
    lastName: string;
}): Promise<string> {
    const baseStudent = {
        school_id: data.schoolId,
        parent_id: data.parentId,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_enrollment: new Date().toISOString().split('T')[0],
        metadata: {
            registration_source: 'manual_parent_registration',
            verification_status: 'unverified',
        },
    };

    const { data: newStudent, error } = await supabase
        .from('students')
        .insert({
            ...baseStudent,
            verification_status: 'unverified',
        })
        .select('student_id')
        .single();

    if (!error) return newStudent.student_id;

    const missingVerificationColumn = error.code === 'PGRST204'
        || error.code === '42703'
        || /verification_status/i.test(error.message || '');

    if (!missingVerificationColumn) throw toStudentCreationError(error);

    const { data: fallbackStudent, error: fallbackError } = await supabase
        .from('students')
        .insert({
            ...baseStudent,
        })
        .select('student_id')
        .single();

    if (fallbackError) throw toStudentCreationError(fallbackError);
    await syncLegacyParentLinkIfAvailable(fallbackStudent.student_id, data.parentId);
    return fallbackStudent.student_id;
}

async function syncLegacyParentLinkIfAvailable(studentId: string, parentId: string): Promise<void> {
    void studentId;
    void parentId;
}

export async function getGradesBySchool(schoolId: string) {
    if (!schoolId) return [];

    const { data: activeGrades, error: activeError } = await supabase
        .from('grades')
        .select('grade_id, grade_name, is_active, display_order')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('display_order');

    if (activeError) {
        throw new Error(`Failed to fetch grades for school ${schoolId}: ${activeError.message}`);
    }

    if ((activeGrades || []).length > 0) {
        return sortSchoolGrades((activeGrades || []) as SchoolGrade[]);
    }

    // Legacy fallback #1: some schools have grade rows with null/false is_active.
    const { data: schoolFallbackGrades, error: schoolFallbackError } = await supabase
        .from('grades')
        .select('grade_id, grade_name, is_active, display_order')
        .eq('school_id', schoolId)
        .order('display_order');

    if (schoolFallbackError) {
        throw new Error(`Failed to fetch fallback grades for school ${schoolId}: ${schoolFallbackError.message}`);
    }

    if ((schoolFallbackGrades || []).length > 0) {
        return sortSchoolGrades((schoolFallbackGrades || []) as SchoolGrade[]);
    }

    // Legacy fallback #2: some deployments use global grades (school_id is NULL).
    const { data: globalActiveGrades, error: globalActiveError } = await supabase
        .from('grades')
        .select('grade_id, grade_name, is_active, display_order')
        .is('school_id', null)
        .eq('is_active', true)
        .order('display_order');

    if (globalActiveError) {
        throw new Error(`Failed to fetch global active grades: ${globalActiveError.message}`);
    }

    if ((globalActiveGrades || []).length > 0) {
        return sortSchoolGrades((globalActiveGrades || []) as SchoolGrade[]);
    }

    const { data: globalFallbackGrades, error: globalFallbackError } = await supabase
        .from('grades')
        .select('grade_id, grade_name, is_active, display_order')
        .is('school_id', null)
        .order('display_order');

    if (globalFallbackError) {
        throw new Error(`Failed to fetch global fallback grades: ${globalFallbackError.message}`);
    }

    return sortSchoolGrades((globalFallbackGrades || []) as SchoolGrade[]);
}

export async function getClassesByGrade(schoolId: string, gradeId: string) {
    if (!schoolId || !gradeId) return [];

    const { data: activeStreams, error: activeError } = await supabase
        .from('school_streams')
        .select('stream_name, is_active')
        .eq('school_id', schoolId)
        .eq('grade_id', gradeId)
        .eq('is_active', true);

    if (activeError) {
        throw new Error(`Failed to fetch classes for school ${schoolId} and grade ${gradeId}: ${activeError.message}`);
    }

    if ((activeStreams || []).length > 0) {
        return uniqueSortedStreams((activeStreams || []).map(s => s.stream_name));
    }

    // Legacy fallback #1: stream records may not have is_active set.
    const { data: schoolFallbackStreams, error: schoolFallbackError } = await supabase
        .from('school_streams')
        .select('stream_name, is_active')
        .eq('school_id', schoolId)
        .eq('grade_id', gradeId);

    if (schoolFallbackError) {
        throw new Error(`Failed to fetch fallback classes for school ${schoolId} and grade ${gradeId}: ${schoolFallbackError.message}`);
    }

    if ((schoolFallbackStreams || []).length > 0) {
        return uniqueSortedStreams((schoolFallbackStreams || []).map(s => s.stream_name));
    }

    // Fallback #1.5: grade_id might belong to a global/legacy grade row.
    // Resolve by grade_name, then search school streams using school-owned grade IDs with same name.
    const { data: sourceGrade, error: sourceGradeError } = await supabase
        .from('grades')
        .select('grade_name')
        .eq('grade_id', gradeId)
        .maybeSingle();

    if (!sourceGradeError && sourceGrade?.grade_name) {
        const normalizedGradeName = sourceGrade.grade_name.trim().toLowerCase();
        if (normalizedGradeName) {
            const { data: schoolGradeRows, error: schoolGradeRowsError } = await supabase
                .from('grades')
                .select('grade_id')
                .eq('school_id', schoolId)
                .ilike('grade_name', sourceGrade.grade_name);

            if (schoolGradeRowsError) {
                throw new Error(`Failed to resolve school grade mappings for ${sourceGrade.grade_name}: ${schoolGradeRowsError.message}`);
            }

            const mappedGradeIds = Array.from(new Set((schoolGradeRows || []).map(r => r.grade_id).filter(Boolean)));
            if (mappedGradeIds.length > 0) {
                const { data: mappedActiveStreams, error: mappedActiveError } = await supabase
                    .from('school_streams')
                    .select('stream_name, is_active')
                    .eq('school_id', schoolId)
                    .in('grade_id', mappedGradeIds)
                    .eq('is_active', true);

                if (mappedActiveError) {
                    throw new Error(`Failed to fetch mapped classes for ${sourceGrade.grade_name}: ${mappedActiveError.message}`);
                }

                if ((mappedActiveStreams || []).length > 0) {
                    return uniqueSortedStreams((mappedActiveStreams || []).map(s => s.stream_name));
                }

                const { data: mappedFallbackStreams, error: mappedFallbackError } = await supabase
                    .from('school_streams')
                    .select('stream_name, is_active')
                    .eq('school_id', schoolId)
                    .in('grade_id', mappedGradeIds);

                if (mappedFallbackError) {
                    throw new Error(`Failed to fetch mapped fallback classes for ${sourceGrade.grade_name}: ${mappedFallbackError.message}`);
                }

                if ((mappedFallbackStreams || []).length > 0) {
                    return uniqueSortedStreams((mappedFallbackStreams || []).map(s => s.stream_name));
                }
            }

            // Fallback #1.6: derive classes from existing student_grade.class records for this school+grade name.
            const studentDerivedClasses = await getStudentGradeClassFallbackByGradeName(schoolId, sourceGrade.grade_name);
            if (studentDerivedClasses.length > 0) {
                return studentDerivedClasses;
            }
        }
    }

    // Legacy fallback #2: some deployments use global streams (school_id is NULL).
    const { data: globalActiveStreams, error: globalActiveError } = await supabase
        .from('school_streams')
        .select('stream_name, is_active')
        .is('school_id', null)
        .eq('grade_id', gradeId)
        .eq('is_active', true);

    if (globalActiveError) {
        throw new Error(`Failed to fetch global active classes for grade ${gradeId}: ${globalActiveError.message}`);
    }

    if ((globalActiveStreams || []).length > 0) {
        return uniqueSortedStreams((globalActiveStreams || []).map(s => s.stream_name));
    }

    const { data: globalFallbackStreams, error: globalFallbackError } = await supabase
        .from('school_streams')
        .select('stream_name, is_active')
        .is('school_id', null)
        .eq('grade_id', gradeId);

    if (globalFallbackError) {
        throw new Error(`Failed to fetch global fallback classes for grade ${gradeId}: ${globalFallbackError.message}`);
    }

    const globalClasses = uniqueSortedStreams((globalFallbackStreams || []).map(s => s.stream_name));
    if (globalClasses.length > 0) return globalClasses;

    // Final fallback: if we can resolve grade name, derive class options from historical student rows.
    const { data: finalSourceGrade } = await supabase
        .from('grades')
        .select('grade_name')
        .eq('grade_id', gradeId)
        .maybeSingle();
    if (finalSourceGrade?.grade_name) {
        const studentDerivedClasses = await getStudentGradeClassFallbackByGradeName(schoolId, finalSourceGrade.grade_name);
        if (studentDerivedClasses.length > 0) return studentDerivedClasses;
    }

    return [];
}

/**
 * THE GOLDEN FINANCIAL SUMMARY
 * Canonical source for student balances, ledger audits, and double-invoicing protection.
 */
export async function getStudentFinancialSummary(studentId: string): Promise<any> {
    return getStudentFinancialSummaryCanonical(studentId);
}
