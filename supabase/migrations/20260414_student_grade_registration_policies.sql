-- Registration hotfix for student_grade + rollback consistency.
-- WARNING: permissive policies for anon usage. Tighten later with auth-aware checks.

ALTER TABLE public.student_grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- student_grade policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'student_grade'
          AND policyname = 'Allow all users to read student_grade'
    ) THEN
        CREATE POLICY "Allow all users to read student_grade"
        ON public.student_grade FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'student_grade'
          AND policyname = 'Allow all users to insert student_grade'
    ) THEN
        CREATE POLICY "Allow all users to insert student_grade"
        ON public.student_grade FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'student_grade'
          AND policyname = 'Allow all users to update student_grade'
    ) THEN
        CREATE POLICY "Allow all users to update student_grade"
        ON public.student_grade FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'student_grade'
          AND policyname = 'Allow all users to delete student_grade'
    ) THEN
        CREATE POLICY "Allow all users to delete student_grade"
        ON public.student_grade FOR DELETE USING (true);
    END IF;

    -- students cleanup policies used by registration rollback path
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'students'
          AND policyname = 'Allow all users to delete students (registration rollback)'
    ) THEN
        CREATE POLICY "Allow all users to delete students (registration rollback)"
        ON public.students FOR DELETE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'students'
          AND policyname = 'Allow all users to update students (registration)'
    ) THEN
        CREATE POLICY "Allow all users to update students (registration)"
        ON public.students FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END
$$;
