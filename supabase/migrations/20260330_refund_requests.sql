-- Create the refund_requests table
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(student_id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.parents(parent_id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    meta_data JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Basic policies to allow the app to work (Matches existing loose policy pattern in the project)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read refund_requests') THEN
        CREATE POLICY "Allow all users to read refund_requests" ON public.refund_requests FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to insert refund_requests') THEN
        CREATE POLICY "Allow all users to insert refund_requests" ON public.refund_requests FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
