import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Create Supabase client
export const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    }
);

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any, context: string): never {
    console.error(`[Supabase Error - ${context}]:`, error);
    throw new Error(`Database error: ${error.message || 'Unknown error occurred'}`);
}

// Helper to check if we're online
export function isOnline(): boolean {
    return navigator.onLine;
}
