-- When the school approves a guardian link request, link the parent to the reviewed student.

CREATE OR REPLACE FUNCTION public.apply_approved_guardian_link_request()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    current_parent_id uuid;
    current_other_parent_id uuid;
BEGIN
    IF TG_OP <> 'UPDATE' OR NEW.status <> 'approved' OR COALESCE(OLD.status, '') = 'approved' THEN
        RETURN NEW;
    END IF;

    SELECT parent_id, other_parent_id
    INTO current_parent_id, current_other_parent_id
    FROM public.students
    WHERE student_id = NEW.requested_student_id
    FOR UPDATE;

    IF current_parent_id = NEW.parent_id OR current_other_parent_id = NEW.parent_id THEN
        RETURN NEW;
    END IF;

    IF current_parent_id IS NULL THEN
        UPDATE public.students
        SET parent_id = NEW.parent_id
        WHERE student_id = NEW.requested_student_id;
    ELSIF current_other_parent_id IS NULL THEN
        UPDATE public.students
        SET other_parent_id = NEW.parent_id
        WHERE student_id = NEW.requested_student_id;
    ELSE
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'This student already has two parent/guardian profiles. Remove one before approving this request.';
    END IF;

    INSERT INTO public.guardian_link_audit (
        actor_parent_id,
        actor_role,
        action,
        parent_id,
        student_id,
        request_id,
        payload
    )
    VALUES (
        NEW.reviewer_parent_id,
        'school_admin',
        'link_approved',
        NEW.parent_id,
        NEW.requested_student_id,
        NEW.request_id,
        jsonb_build_object(
            'requestReason', NEW.request_reason,
            'reviewerNote', NEW.reviewer_note
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_approved_guardian_link_request ON public.guardian_link_requests;

CREATE TRIGGER trg_apply_approved_guardian_link_request
AFTER UPDATE OF status ON public.guardian_link_requests
FOR EACH ROW
EXECUTE FUNCTION public.apply_approved_guardian_link_request();
