-- Temporary registration policy patch for environments where student creation is blocked.
-- This keeps registration flow working with anon client keys.
-- Replace with stricter auth-scoped policies when backend auth is introduced.

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'students'
          AND policyname = 'Allow all users to insert students (registration)'
    ) THEN
        CREATE POLICY "Allow all users to insert students (registration)"
        ON public.students
        FOR INSERT
        WITH CHECK (true);
    END IF;
END
$$;
