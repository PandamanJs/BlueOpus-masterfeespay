import { supabase } from '../client';

/**
 * Verifies if the provided access code matches the school's record.
 * @param schoolId The UUID of the school
 * @param code The access code to verify
 * @returns true if valid, false otherwise
 */
export async function verifySchoolCode(schoolId: string, code: string): Promise<boolean> {
    if (!schoolId || !code) return false;

    // Security Note: In a production environment with RLS, this query might fail if public read 
    // access to 'access_code' isn't allowed. Ideally, this should be an RPC or an edge function.
    // For this client-side implementation, we are checking existence.
    const { data, error } = await supabase
        .from('schools')
        .select('school_id')
        .eq('school_id', schoolId)
        .eq('access_code', code)
        .maybeSingle();

    if (error) {
        console.error('Error verifying school code:', error);
        return false;
    }

    return !!data;
}
