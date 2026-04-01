-- Migration: Remove outstanding_balance column and transition to programmatic calculation
-- This script removes the redundant outstanding_balance columns and associated synchronization logic.

-- 1. Remove columns from base tables
ALTER TABLE students DROP COLUMN IF EXISTS outstanding_balance;
ALTER TABLE payment_history_records DROP COLUMN IF EXISTS outstanding_balance;

-- 2. Clean up triggers and functions used for synchronization
DROP TRIGGER IF EXISTS tr_log_payment_history_insert ON transactions;
DROP TRIGGER IF EXISTS tr_log_payment_history_update ON transactions;
DROP FUNCTION IF EXISTS log_to_payment_history();

-- 3. Recreate the payment_history view without the outstanding_balance column
-- The frontend now calculates balances programmatically from individual transaction statuses.
DROP VIEW IF EXISTS payment_history;
CREATE VIEW payment_history AS
SELECT
    phr.id, 
    phr.transaction_id, 
    phr.payment_date, 
    phr.reference,
    phr.amount as total_amount, 
    phr.status,
    ((s.first_name || ' '::text) || s.last_name) AS student_name,
    p.phone_number AS parent_phone,
    phr.term, 
    phr.academic_year, 
    phr.services,
    phr.student_id
FROM payment_history_records phr
LEFT JOIN students s ON phr.student_id = s.student_id
LEFT JOIN parents p ON phr.parent_id = p.parent_id;

COMMENT ON VIEW payment_history IS 'Consolidated view of payment history records for UI display, excluding pre-calculated balances.';
