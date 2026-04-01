-- Migration: Add outstanding_balance to payment_history table
-- Run this in your Supabase SQL Editor

-- Add outstanding_balance column to payment_history table
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS outstanding_balance INTEGER DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN payment_history.outstanding_balance IS 'Outstanding balance for the student at the time of this payment record (in cents/ngwee)';

-- Create an index for faster queries on student_id and outstanding_balance
CREATE INDEX IF NOT EXISTS idx_payment_history_student_outstanding 
ON payment_history(student_id, outstanding_balance) 
WHERE outstanding_balance > 0;

-- Optional: Update existing records with current outstanding balance from students table
-- (Only run this if you want to backfill existing payment_history records)
UPDATE payment_history ph
SET outstanding_balance = s.outstanding_balance
FROM students s
WHERE ph.student_id = s.student_id
AND ph.outstanding_balance = 0;
