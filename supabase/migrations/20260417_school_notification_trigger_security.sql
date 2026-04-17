-- Notification triggers write to school_notification on behalf of parent/client actions.
-- Run them as trusted database functions so RLS on school_notification does not
-- block the parent request that caused the notification.

DO $$
BEGIN
    IF to_regprocedure('public.notify_school_of_refund_request()') IS NOT NULL THEN
        ALTER FUNCTION public.notify_school_of_refund_request() SECURITY DEFINER;
        ALTER FUNCTION public.notify_school_of_refund_request() SET search_path = public;
    END IF;

    IF to_regprocedure('public.notify_school_of_balance_dispute()') IS NOT NULL THEN
        ALTER FUNCTION public.notify_school_of_balance_dispute() SECURITY DEFINER;
        ALTER FUNCTION public.notify_school_of_balance_dispute() SET search_path = public;
    END IF;

    IF to_regprocedure('public.notify_school_of_guardian_link_request()') IS NOT NULL THEN
        ALTER FUNCTION public.notify_school_of_guardian_link_request() SECURITY DEFINER;
        ALTER FUNCTION public.notify_school_of_guardian_link_request() SET search_path = public;
    END IF;
END
$$;
