-- Migration: Auto-sync transactions to QuickBooks
-- This trigger automatically invokes the QuickBooks sync function when a payment succeeds

-- First, enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create function to invoke QuickBooks sync
CREATE OR REPLACE FUNCTION trigger_quickbooks_sync()
RETURNS TRIGGER AS $$
DECLARE
  school_connected BOOLEAN;
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only sync if transaction is successful and not already syncing/synced
  IF NEW.status = 'successful' AND (NEW.qbo_sync_status IS NULL OR NEW.qbo_sync_status = 'error') THEN
    
    -- Check if school is connected to QuickBooks
    SELECT (qbo_refresh_token IS NOT NULL AND qbo_realm_id IS NOT NULL)
    INTO school_connected
    FROM schools
    WHERE school_id = NEW.school_id;
    
    -- Only invoke sync if school is connected
    IF school_connected THEN
      -- Get Supabase URL and service role key from settings
      -- These should be set as database settings
      SELECT current_setting('app.supabase_url', true) INTO function_url;
      SELECT current_setting('app.supabase_service_role_key', true) INTO service_role_key;
      
      -- If settings are not configured, log warning but don't fail
      IF function_url IS NULL OR service_role_key IS NULL THEN
        RAISE WARNING 'QuickBooks auto-sync not configured. Set app.supabase_url and app.supabase_service_role_key';
        RETURN NEW;
      END IF;
      
      -- Invoke the Edge Function asynchronously
      PERFORM
        extensions.http_post(
          url := function_url || '/functions/v1/quickbooks-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
          ),
          body := jsonb_build_object('transaction_id', NEW.id::text)
        );
      
      RAISE NOTICE 'QuickBooks sync triggered for transaction %', NEW.id;
    ELSE
      RAISE NOTICE 'School not connected to QuickBooks, skipping auto-sync for transaction %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction insert/update
    RAISE WARNING 'Failed to trigger QuickBooks sync for transaction %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_transaction_successful ON transactions;

-- Create trigger
CREATE TRIGGER on_transaction_successful
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'successful' AND (OLD.status IS NULL OR OLD.status != 'successful'))
  EXECUTE FUNCTION trigger_quickbooks_sync();

-- Add helpful comment
COMMENT ON TRIGGER on_transaction_successful ON transactions IS 
  'Automatically triggers QuickBooks sync when a transaction becomes successful';
