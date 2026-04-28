import { useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAppStore } from '../stores/useAppStore';

/**
 * useRealtimeInvalidation
 * 
 * A high-level hook that listens to Supabase Realtime changes 
 * and automatically triggers a state refresh across the app.
 * 
 * This creates a "Live System" feel where the UI stays in sync 
 * across different devices and browser tabs instantly.
 */
export function useRealtimeInvalidation(schoolId: string | null) {
  const triggerSync = useAppStore((state) => state.triggerSync);

  useEffect(() => {
    if (!schoolId) return;

    console.log(`[Realtime] Subscribing to changes for School: ${schoolId}`);

    // Create a channel for this school's financial and task events
    const channel = supabase
      .channel(`school-updates-${schoolId}`)
      // 1. Transactions & Payments
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('[Realtime] Transaction updated:', payload.eventType);
          triggerSync();
        }
      )
      // 2. Invoices
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('[Realtime] Invoice updated:', payload.eventType);
          triggerSync();
        }
      )
      // 3. Students (Balance changes, etc.)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('[Realtime] Student data updated:', payload.eventType);
          triggerSync();
        }
      )
      .subscribe();

    return () => {
      console.log(`[Realtime] Unsubscribing from changes for School: ${schoolId}`);
      supabase.removeChannel(channel);
    };
  }, [schoolId, triggerSync]);
}
