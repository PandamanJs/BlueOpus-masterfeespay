import { supabase } from '../client';
import type { Policy } from '../../../types';

/**
 * Fetches all active policies for a specific school.
 * @param schoolId The UUID of the school.
 * @param category Optional category filter (e.g., 'payment_plan').
 */
export async function getPoliciesBySchool(schoolId: string, category?: string): Promise<Policy[]> {
    let query = supabase
        .from('fee_policies')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true);

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching policies:', error);
        return [];
    }

    if (!data) return [];

    // Map database structure to Policy interface
    return data.map(item => {
        const installments = Array.isArray(item.installment_structure) ? item.installment_structure.length : 1;
        const isMonthly = item.name.toLowerCase().includes('monthly');
        
        // Dynamic estimation logic: roughly K15k for termly, K5k per month for monthly
        const estimatedTotal = isMonthly ? 5000 * (installments || 1) : 15000;
        const perInstall = estimatedTotal / (installments || 1);

        return {
            policy_id: item.id,
            name: item.name,
            description: item.name, // Use name as description if not available
            plan_code: item.id.substring(0, 8).toUpperCase(), // Generate a mock plan code
            installments: installments,
            frequency: isMonthly ? 'monthly' : 'termly',
            total_amount: estimatedTotal,
            per_installment: perInstall,
            effective_date: new Date().toLocaleDateString('en-ZM'),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZM'), // 30 days from now
            terms: [
                'Payment must be made by the due date.',
                'Late fees may apply according to school policy.',
                'Initial payment required to activate plan.'
            ],
            category: item.category,
            school_id: item.school_id,
            is_active: item.is_active,
            created_at: item.created_at
        };
    });
}

/**
 * Fetches all global/active policies across all schools (where school_id is null).
 */
export async function getGlobalPolicies(category?: string): Promise<Policy[]> {
    let query = supabase
        .from('fee_policies')
        .select('*')
        .is('school_id', null)
        .eq('is_active', true);

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching global policies:', error);
        return [];
    }

    if (!data) return [];

    return data.map(item => {
        const installments = Array.isArray(item.installment_structure) ? item.installment_structure.length : 1;
        const isMonthly = item.name.toLowerCase().includes('monthly');
        const estimatedTotal = isMonthly ? 5000 * (installments || 1) : 15000;
        const perInstall = estimatedTotal / (installments || 1);

        return {
            policy_id: item.id,
            name: item.name,
            description: item.name,
            plan_code: item.id.substring(0, 8).toUpperCase(),
            installments: installments,
            frequency: isMonthly ? 'monthly' : 'termly',
            total_amount: estimatedTotal,
            per_installment: perInstall,
            effective_date: new Date().toLocaleDateString('en-ZM'),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZM'),
            terms: [
                'Payment must be made by the due date.',
                'Late fees may apply according to school policy.',
                'Initial payment required to activate plan.'
            ],
            category: item.category,
            school_id: item.school_id,
            is_active: item.is_active,
            created_at: item.created_at
        };
    });
}
