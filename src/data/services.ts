import { supabase } from '../lib/supabase/client';

export interface SchoolService {
    id: string;
    name: string;
    description: string;
    amount: number;
    category: 'tuition' | 'meals' | 'transport' | 'uniform' | 'activities' | 'supplies' | 'accommodation' | 'other';
    subItems?: Array<{ id: string; name: string; amount: number }>;
    paymentPeriods?: Array<{ period: string; amount: number }>;
    routePricing?: Record<string, number>;
}

export async function getSchoolServices(schoolName: string, schoolId?: string, gradeId?: string): Promise<SchoolService[]> {

    // Prioritize DB fetch if schoolId is available
    if (schoolId) {
        try {
            console.log(`[getSchoolServices] Syncing comprehensive services for ID: ${schoolId}`);
            
            const { data: feeItems, error: feesError } = await supabase
                .from('fee_items')
                .select(`
                    id,
                    name,
                    description,
                    amount,
                    billing_cycle,
                    grade_id,
                    category:fee_categories(category)
                `)
                .eq('school_id', schoolId)
                .eq('is_active', true);

            if (feesError) throw feesError;

            const dynamicServices: SchoolService[] = [];
            const items = feeItems || [];

            items.forEach(i => {
                const categoryRaw = ((i.category as any)?.category || 'other').toLowerCase();
                const amount = Number(i.amount);

                // Skip anything that is tuition (handled on the main tuition page)
                if (categoryRaw === 'tuition') return;

                // Grade filtering for service items
                if (gradeId && i.grade_id && i.grade_id !== gradeId) {
                    return;
                }

                // Map Database categories to UI-supported categories
                let mappedCat: SchoolService['category'] = 'other';
                if (['transport', 'logistics', 'transportation'].includes(categoryRaw)) mappedCat = 'transport';
                else if (['canteen', 'meals', 'catering', 'cafeteria'].includes(categoryRaw)) mappedCat = 'meals';
                else if (['boarding', 'accommodation', 'hostel'].includes(categoryRaw)) mappedCat = 'accommodation';
                else if (['uniform', 'apparel'].includes(categoryRaw)) mappedCat = 'uniform';
                else if (['activities', 'extracurricular'].includes(categoryRaw)) mappedCat = 'activities';
                else if (['supplies', 'stationery', 'utility'].includes(categoryRaw)) mappedCat = 'supplies';

                dynamicServices.push({
                    id: i.id,
                    name: i.name || 'Service',
                    description: i.description || i.billing_cycle || '',
                    amount: amount,
                    category: mappedCat,
                    paymentPeriods: [
                        { period: "term", amount: amount },
                        { period: "month", amount: Math.max(1, Math.round(amount / 3)) },
                        { period: "week", amount: Math.max(1, Math.round(amount / 12)) },
                    ]
                });
            });

            return dynamicServices;
        } catch (err) {
            console.error('[getSchoolServices] Exception fetching synced services:', err);
            return [];
        }
    }

    return [];
}
