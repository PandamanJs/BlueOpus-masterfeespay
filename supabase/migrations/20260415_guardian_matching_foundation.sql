-- Guardian matching foundation
-- Step 1 (DB): confidence scoring storage, review queue, merge workflow, and audit trail.

-- 1) Candidate scores captured during parent search/matching
CREATE TABLE IF NOT EXISTS public.student_match_candidates (
    candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_session_id UUID NOT NULL,
    parent_id UUID NULL REFERENCES public.parents(parent_id) ON DELETE SET NULL,
    school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
    queried_name TEXT NOT NULL,
    queried_grade_id UUID NULL REFERENCES public.grades(grade_id) ON DELETE SET NULL,
    queried_class TEXT NULL,
    student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    confidence_band TEXT NOT NULL CHECK (confidence_band IN ('high', 'medium', 'low')),
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    decision TEXT NULL CHECK (decision IN ('pending', 'auto_linked', 'parent_confirmed', 'parent_rejected', 'queued_for_review')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_student_match_candidates_session ON public.student_match_candidates(registration_session_id);
CREATE INDEX IF NOT EXISTS idx_student_match_candidates_student ON public.student_match_candidates(student_id);
CREATE INDEX IF NOT EXISTS idx_student_match_candidates_school_band ON public.student_match_candidates(school_id, confidence_band);
CREATE INDEX IF NOT EXISTS idx_student_match_candidates_decision ON public.student_match_candidates(decision);

-- 2) Queue for risky or blocked guardian-link requests that require school review
CREATE TABLE IF NOT EXISTS public.guardian_link_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_session_id UUID NOT NULL,
    parent_id UUID NOT NULL REFERENCES public.parents(parent_id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
    requested_student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    request_reason TEXT NOT NULL CHECK (request_reason IN ('medium_confidence', 'low_confidence', 'two_guardians_full', 'duplicate_suspected', 'manual_override')),
    confidence_score NUMERIC(5,2) NULL CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
    confidence_band TEXT NULL CHECK (confidence_band IN ('high', 'medium', 'low')),
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewer_parent_id UUID NULL REFERENCES public.parents(parent_id) ON DELETE SET NULL,
    reviewer_note TEXT NULL,
    reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guardian_link_requests_parent ON public.guardian_link_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_guardian_link_requests_school_status ON public.guardian_link_requests(school_id, status);
CREATE INDEX IF NOT EXISTS idx_guardian_link_requests_student ON public.guardian_link_requests(requested_student_id);
CREATE INDEX IF NOT EXISTS idx_guardian_link_requests_created_at ON public.guardian_link_requests(created_at DESC);

-- Prevent noisy duplicates while a request is still active
CREATE UNIQUE INDEX IF NOT EXISTS uq_guardian_link_requests_open
ON public.guardian_link_requests(parent_id, requested_student_id)
WHERE status = 'pending';

-- 3) Duplicate-student merge workflow for school/admin operations
CREATE TABLE IF NOT EXISTS public.student_merge_jobs (
    merge_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
    survivor_student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    duplicate_student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'rejected')),
    suspicion_score NUMERIC(5,2) NULL CHECK (suspicion_score IS NULL OR (suspicion_score >= 0 AND suspicion_score <= 100)),
    rationale JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_by_parent_id UUID NULL REFERENCES public.parents(parent_id) ON DELETE SET NULL,
    reviewed_by_parent_id UUID NULL REFERENCES public.parents(parent_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ NULL,
    executed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT student_merge_jobs_students_distinct CHECK (survivor_student_id <> duplicate_student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_merge_jobs_school_status ON public.student_merge_jobs(school_id, status);
CREATE INDEX IF NOT EXISTS idx_student_merge_jobs_survivor ON public.student_merge_jobs(survivor_student_id);
CREATE INDEX IF NOT EXISTS idx_student_merge_jobs_duplicate ON public.student_merge_jobs(duplicate_student_id);
CREATE INDEX IF NOT EXISTS idx_student_merge_jobs_created_at ON public.student_merge_jobs(created_at DESC);

-- 4) Immutable-style audit log (append-only by convention)
CREATE TABLE IF NOT EXISTS public.guardian_link_audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_parent_id UUID NULL REFERENCES public.parents(parent_id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('parent', 'school_admin', 'system')),
    action TEXT NOT NULL CHECK (action IN ('match_scored', 'link_attempted', 'link_blocked', 'link_approved', 'link_rejected', 'merge_requested', 'merge_executed')),
    parent_id UUID NULL REFERENCES public.parents(parent_id) ON DELETE SET NULL,
    student_id UUID NULL REFERENCES public.students(student_id) ON DELETE SET NULL,
    request_id UUID NULL REFERENCES public.guardian_link_requests(request_id) ON DELETE SET NULL,
    merge_job_id UUID NULL REFERENCES public.student_merge_jobs(merge_job_id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guardian_link_audit_created_at ON public.guardian_link_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_link_audit_parent ON public.guardian_link_audit(parent_id);
CREATE INDEX IF NOT EXISTS idx_guardian_link_audit_student ON public.guardian_link_audit(student_id);
CREATE INDEX IF NOT EXISTS idx_guardian_link_audit_action ON public.guardian_link_audit(action);
CREATE INDEX IF NOT EXISTS idx_guardian_link_audit_request ON public.guardian_link_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_guardian_link_audit_merge_job ON public.guardian_link_audit(merge_job_id);

-- RLS baseline (project currently uses permissive policies for app operations)
ALTER TABLE public.student_match_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_merge_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_link_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- student_match_candidates policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_match_candidates'
        AND policyname='Allow all users to read student_match_candidates'
    ) THEN
        CREATE POLICY "Allow all users to read student_match_candidates"
        ON public.student_match_candidates FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_match_candidates'
        AND policyname='Allow all users to insert student_match_candidates'
    ) THEN
        CREATE POLICY "Allow all users to insert student_match_candidates"
        ON public.student_match_candidates FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_match_candidates'
        AND policyname='Allow all users to update student_match_candidates'
    ) THEN
        CREATE POLICY "Allow all users to update student_match_candidates"
        ON public.student_match_candidates FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    -- guardian_link_requests policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='guardian_link_requests'
        AND policyname='Allow all users to read guardian_link_requests'
    ) THEN
        CREATE POLICY "Allow all users to read guardian_link_requests"
        ON public.guardian_link_requests FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='guardian_link_requests'
        AND policyname='Allow all users to insert guardian_link_requests'
    ) THEN
        CREATE POLICY "Allow all users to insert guardian_link_requests"
        ON public.guardian_link_requests FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='guardian_link_requests'
        AND policyname='Allow all users to update guardian_link_requests'
    ) THEN
        CREATE POLICY "Allow all users to update guardian_link_requests"
        ON public.guardian_link_requests FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    -- student_merge_jobs policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_merge_jobs'
        AND policyname='Allow all users to read student_merge_jobs'
    ) THEN
        CREATE POLICY "Allow all users to read student_merge_jobs"
        ON public.student_merge_jobs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_merge_jobs'
        AND policyname='Allow all users to insert student_merge_jobs'
    ) THEN
        CREATE POLICY "Allow all users to insert student_merge_jobs"
        ON public.student_merge_jobs FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='student_merge_jobs'
        AND policyname='Allow all users to update student_merge_jobs'
    ) THEN
        CREATE POLICY "Allow all users to update student_merge_jobs"
        ON public.student_merge_jobs FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    -- guardian_link_audit policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='guardian_link_audit'
        AND policyname='Allow all users to read guardian_link_audit'
    ) THEN
        CREATE POLICY "Allow all users to read guardian_link_audit"
        ON public.guardian_link_audit FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='guardian_link_audit'
        AND policyname='Allow all users to insert guardian_link_audit'
    ) THEN
        CREATE POLICY "Allow all users to insert guardian_link_audit"
        ON public.guardian_link_audit FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
