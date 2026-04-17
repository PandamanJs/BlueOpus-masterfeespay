-- Keep normal refund notifications separate from balance dispute notifications.
-- Balance disputes are handled by notify_school_of_balance_dispute().

ALTER TABLE public.school_notification
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.notify_school_of_refund_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_school_id uuid;
BEGIN
    -- Balance disputes have their own notification trigger and review workflow.
    IF COALESCE(NEW.meta_data->>'type', '') = 'student_account_dispute' THEN
        RETURN NEW;
    END IF;

    target_school_id := NEW.school_id;

    IF target_school_id IS NULL THEN
        SELECT school_id
        INTO target_school_id
        FROM public.students
        WHERE student_id = NEW.student_id;
    END IF;

    IF target_school_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.school_notification (
        school_id,
        message,
        type,
        is_read,
        metadata
    )
    VALUES (
        target_school_id,
        'A parent submitted a refund request.',
        'refund',
        false,
        jsonb_build_object(
            'review_type', 'refund_request',
            'refund_request_id', NEW.id,
            'student_id', NEW.student_id,
            'parent_id', NEW.parent_id
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_refund_request_created ON public.refund_requests;

CREATE TRIGGER on_refund_request_created
AFTER INSERT ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_school_of_refund_request();
