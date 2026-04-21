-- Grants for guardian matching tables used by the client-side registration flow.
-- Fixes: permission denied for table guardian_link_audit.

GRANT SELECT, INSERT, UPDATE ON TABLE public.student_match_candidates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.guardian_link_requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_merge_jobs TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.guardian_link_audit TO anon, authenticated;
