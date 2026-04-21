-- Balance disputes require school-side verification before payment can continue.

CREATE OR REPLACE FUNCTION public.sync_balance_dispute_verification_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    dispute_type text;
BEGIN
    dispute_type := COALESCE(NEW.meta_data->>'type', '');

    IF dispute_type <> 'student_account_dispute' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        UPDATE public.students
        SET verification_status = 'unverified',
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('verification_status', 'unverified')
        WHERE student_id = NEW.student_id;

        RETURN NEW;
    END IF;

    IF NEW.status IN ('resolved', 'approved', 'rejected', 'cancelled') THEN
        UPDATE public.students
        SET verification_status = NULL,
            metadata = COALESCE(metadata, '{}'::jsonb) - 'verification_status'
        WHERE student_id = NEW.student_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_balance_dispute_verification_status ON public.refund_requests;

CREATE TRIGGER trg_sync_balance_dispute_verification_status
AFTER INSERT OR UPDATE OF status ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_balance_dispute_verification_status();

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to update refund_requests') THEN
        CREATE POLICY "Allow all users to update refund_requests" ON public.refund_requests FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END
$$;
