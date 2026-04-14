-- Track only explicitly unverified student records.
-- NULL means the student is treated the same as verified.
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS verification_status TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'students_verification_status_check'
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT students_verification_status_check
        CHECK (verification_status IS NULL OR verification_status = 'unverified');
    END IF;
END
$$;
