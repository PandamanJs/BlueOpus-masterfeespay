-- Manual QuickBooks Sync Utility
-- Run these queries to manually sync pending transactions

-- ============================================
-- STEP 1: Check current sync status
-- ============================================
SELECT 
  t.id,
  t.reference,
  t.status,
  t.amount,
  t.total_amount,
  t.qbo_sync_status,
  t.qbo_last_sync_attempt,
  t.qbo_synced_at,
  t.qbo_sync_error,
  t.qb_invoice_id,
  t.qb_payment_id,
  t.created_at,
  s.school_name,
  s.qbo_realm_id IS NOT NULL as school_connected,
  CASE 
    WHEN t.qbo_sync_status = 'completed' AND t.qb_payment_id IS NOT NULL THEN '✅ Synced'
    WHEN t.qbo_sync_status = 'error' THEN '❌ Error'
    WHEN t.qbo_sync_status = 'syncing' THEN '⏳ Syncing/Stuck'
    WHEN t.qbo_sync_status IS NULL AND t.status = 'successful' THEN '🔴 Never Attempted'
    ELSE '⚠️ Unknown'
  END as sync_state
FROM transactions t
LEFT JOIN schools s ON t.school_id = s.school_id
WHERE t.status = 'successful'
  AND t.created_at > NOW() - INTERVAL '30 days'
ORDER BY t.created_at DESC;

-- ============================================
-- STEP 2: Find stuck transactions
-- ============================================
SELECT 
  id,
  reference,
  qbo_sync_status,
  qbo_last_sync_attempt,
  qbo_sync_error,
  EXTRACT(EPOCH FROM (NOW() - qbo_last_sync_attempt))/60 as stuck_minutes
FROM transactions
WHERE qbo_sync_status = 'syncing'
  AND qbo_last_sync_attempt < NOW() - INTERVAL '5 minutes'
ORDER BY qbo_last_sync_attempt;

-- ============================================
-- STEP 3: Reset stuck transactions
-- ============================================
-- CAUTION: Only run this if you have stuck transactions
-- This will reset their status so they can be retried

-- UPDATE transactions
-- SET qbo_sync_status = NULL,
--     qbo_sync_error = 'Reset from stuck syncing status'
-- WHERE qbo_sync_status = 'syncing'
--   AND qbo_last_sync_attempt < NOW() - INTERVAL '5 minutes';

-- ============================================
-- STEP 4: Find transactions that need syncing
-- ============================================
SELECT 
  t.id,
  t.reference,
  t.status,
  t.amount,
  t.qbo_sync_status,
  t.qbo_sync_error,
  s.school_name,
  s.qbo_realm_id IS NOT NULL as school_connected,
  t.created_at
FROM transactions t
LEFT JOIN schools s ON t.school_id = s.school_id
WHERE t.status = 'successful'
  AND (t.qbo_sync_status IS NULL OR t.qbo_sync_status = 'error')
  AND s.qbo_realm_id IS NOT NULL
  AND s.qbo_refresh_token IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 20;

-- ============================================
-- STEP 5: Manual sync invocation
-- ============================================
-- To manually sync a specific transaction, use the quickbooks-sync Edge Function:
-- 
-- curl -X POST https://ookznzyorjzmryulktiw.supabase.co/functions/v1/quickbooks-sync \
--   -H "Content-Type: application/json" \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -d '{"transaction_id": "TRANSACTION_ID_HERE"}'

-- ============================================
-- STEP 6: Check school QuickBooks connection
-- ============================================
SELECT 
  school_id,
  school_name,
  qbo_realm_id IS NOT NULL as has_realm_id,
  qbo_refresh_token IS NOT NULL as has_refresh_token,
  qbo_connected_at,
  EXTRACT(EPOCH FROM (NOW() - qbo_connected_at))/3600 as hours_since_connection
FROM schools
WHERE qbo_realm_id IS NOT NULL OR qbo_refresh_token IS NOT NULL
ORDER BY qbo_connected_at DESC;

-- ============================================
-- STEP 7: Verify sync results in QuickBooks
-- ============================================
-- After syncing, check that transactions have:
-- 1. qbo_sync_status = 'completed'
-- 2. qb_invoice_id is not null
-- 3. qb_payment_id is not null
-- 4. qbo_synced_at is set

SELECT 
  id,
  reference,
  qbo_sync_status,
  qb_invoice_id,
  qb_payment_id,
  qbo_synced_at,
  created_at
FROM transactions
WHERE qbo_sync_status = 'completed'
ORDER BY qbo_synced_at DESC
LIMIT 10;
