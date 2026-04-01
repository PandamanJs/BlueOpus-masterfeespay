import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '../lib/offlineDatabase';
import { supabase } from '../lib/supabase/client';
import { updateTransactionStatus, syncTransactionToQuickBooks } from '../lib/supabase/api/transactions';
import { findExistingTransaction } from '../utils/reconciliation';
import { useDynamicIsland } from '../components/DynamicIsland';
import { WifiOff } from 'lucide-react';

export function useOfflineManager() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { show, hide, islandData } = useDynamicIsland();

    const processQueue = useCallback(async () => {
        if (!navigator.onLine) return;

        const queued = await offlineDB.getAll('transaction_queue');
        if (queued.length === 0) return;

        console.log(`[OfflineManager] Processing ${queued.length} queued transactions...`);

        for (const tx of queued) {
            try {
                // ── Idempotency guard ────────────────────────────────────────
                // Check if this reference was already committed to Supabase
                // (can happen when connectivity drops mid-response)
                const existingId = await findExistingTransaction(supabase, tx.reference);

                let transactionId: string | null = existingId;

                if (existingId) {
                    console.log(`[OfflineManager] Reference ${tx.reference} already exists (id: ${existingId}). Skipping insert.`);
                    await offlineDB.delete('transaction_queue', tx.reference);
                } else {
                    // 1. Try to create the transaction in Supabase
                    const { data, error } = await supabase
                        .from('transactions')
                        .insert(tx.data)
                        .select()
                        .single();

                    if (!error && data) {
                        transactionId = data.id;
                        // 2. Clear from queue
                        await offlineDB.delete('transaction_queue', tx.reference);
                        // 3. Update status to successful
                        await updateTransactionStatus(tx.reference, 'successful', {
                            syncedFromOffline: true,
                            syncedAt: new Date().toISOString()
                        });

                        console.log(`[OfflineManager] Successfully synced transaction ${tx.reference}`);
                    } else if (error) {
                        console.error(`[OfflineManager] Supabase error for ${tx.reference}:`, error);
                        // Drop unrecoverable schema / constraint errors
                        const isUnrecoverable = [
                            error.code?.startsWith('22'),
                            error.code?.startsWith('23'),
                            error.code?.startsWith('PGRST'),
                            error.message?.includes('invalid'),
                            error.message?.includes('could not find the'),
                            error.details?.includes('invalid'),
                        ].some(Boolean);

                        if (isUnrecoverable) {
                            console.warn(`[OfflineManager] Dropping invalid transaction ${tx.reference}.`);
                            await offlineDB.delete('transaction_queue', tx.reference);
                        } else {
                            // Increment retry counter so stuck items are visible
                            await offlineDB.put('transaction_queue', {
                                ...tx,
                                retryCount: (tx.retryCount || 0) + 1,
                            });
                        }
                        transactionId = null;
                    }
                }

                // 4. Sync to QuickBooks regardless of whether insert was new or pre-existing
                if (transactionId) {
                    await syncTransactionToQuickBooks(transactionId);
                }
            } catch (err) {
                console.error(`[OfflineManager] Failed to sync transaction ${tx.reference}:`, err);
            }
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (navigator.onLine) {
            processQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [processQueue]);

    // Handle Persistent Dynamic Island for Offline State
    useEffect(() => {
        if (!isOnline) {
            show('warning', {
                title: 'Offline Mode',
                subtitle: 'Viewing cached data. Payments disabled.',
                customIcon: WifiOff,
                autoHide: 999999, // Persist while offline
            });
        } else {
            // Only hide if the current notification is the Offline one
            if (islandData.title === 'Offline Mode') {
                hide();
            }
        }
    }, [isOnline, show, hide, islandData.title]);

    return { isOnline };
}
