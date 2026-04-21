-- Prevent payments for student profiles that are pending school confirmation.
-- This is a backend guard to complement frontend checks.

CREATE OR REPLACE FUNCTION public.block_unconfirmed_student_transactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    verification_marker text;
BEGIN
    IF NEW.student_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(to_jsonb(s)->>'verification_status', s.metadata->>'verification_status')
    INTO verification_marker
    FROM public.students s
    WHERE s.student_id = NEW.student_id;

    IF verification_marker = 'unverified' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'This student profile is pending school confirmation. Payments are available after school verification.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_unconfirmed_student_transactions ON public.transactions;

CREATE TRIGGER trg_block_unconfirmed_student_transactions
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.block_unconfirmed_student_transactions();
