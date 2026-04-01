import { supabase } from '../client';
import type { School } from '../../../types';
import { offlineDB } from '../../offlineDatabase';

/**
 * Fetch all active schools from `school` table (Master-fees Database schema).
 * Columns: school_id, school_name, logo_url, phone, email, lenco_public_key, is_active, access_code
 */
export async function getSchools(): Promise<School[]> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            console.log('[API] Fetching schools from Supabase...');
            const { data, error } = await supabase
                .from('schools')
                .select('school_id, school_name, logo_url, phone, email, lenco_public_key, is_active, access_code, uses_forms')
                .eq('is_active', true)
                .order('school_name');

            if (error) {
                console.error('[API] Supabase error fetching schools:', error);
            } else if (data) {
                console.log(`[API] Successfully fetched ${data.length} schools`);
                const schools: School[] = data.map(s => ({
                    id: s.school_id,
                    name: s.school_name,
                    logo: s.logo_url || null,
                    address: undefined,
                    phone: s.phone || null,
                    email: s.email || null,
                    lenco_public_key: s.lenco_public_key || null,
                    access_code: s.access_code || null,
                    uses_forms: s.uses_forms || false,
                }));
                await offlineDB.putAll('schools', schools);
                return schools;
            }
        } catch (e) {
            console.error('[API] Exception fetching schools:', e);
        }
    }

    console.log('[API] Falling back to offline cache for schools');
    const cachedSchools = await offlineDB.getAll('schools');
    return (cachedSchools as School[]) || [];
}

/**
 * Fetch a specific school by name.
 */
export async function getSchoolByName(name: string): Promise<School | null> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('school_id, school_name, logo_url, phone, email, lenco_public_key, is_active, access_code, uses_forms')
                .eq('school_name', name)
                .maybeSingle();

            if (error) {
                console.error('[API] Error fetching school by name:', error);
            } else if (!data) {
                console.log(`[API] School "${name}" not found in Supabase.`);
            } else {
                // Fetch all items from the new unified fee schedule
                const { data: feeItems, error: feesError } = await supabase
                    .from('fee_items')
                    .select(`
                        id,
                        name,
                        amount,
                        billing_cycle,
                        grade_id,
                        grade:grades(grade_name),
                        category:fee_categories(name, category)
                    `)
                    .eq('school_id', data.school_id)
                    .eq('is_active', true);

                if (feesError) {
                    console.error('[API] Error fetching fee items:', feesError);
                }

                const items = feeItems || [];

                const GRADE_ORDER: Record<string, number> = {
                    'baby-class': 1,
                    'middle-class': 2,
                    'reception': 3,
                    'pre-unit': 4,
                    'grade-1': 10,
                    'grade-2': 11,
                    'grade-3': 12,
                    'grade-4': 13,
                    'grade-5': 14,
                    'grade-6': 15,
                    'grade-7': 16,
                    'grade-8': 17,
                    'grade-9': 18,
                    'grade-10': 19,
                    'grade-11': 20,
                    'grade-12': 21,
                };

                // Map Tuition Fees to grade_pricing
                const fetchedGradePricing = items
                    .filter(i => (i.category as any)?.category === 'tuition')
                    .map(i => {
                        const rawName = i.grade?.grade_name || i.name.split(' Tuition')[0] || 'Unknown Grade';
                        const normalizedForSort = rawName.toLowerCase().replace(/\s+/g, '-');
                        return {
                            name: rawName,
                            label: `${rawName} - K${Number(i.amount).toLocaleString()} (${i.billing_cycle || 'Per term'})`,
                            value: i.grade_id || i.id, 
                            price: Number(i.amount),
                            sortKey: normalizedForSort
                        };
                    })
                    .sort((a, b) => (GRADE_ORDER[a.sortKey] || 99) - (GRADE_ORDER[b.sortKey] || 99));

                // Map Transport to bus_routes
                const fetchedBusRoutes = items
                    .filter(i => (i.category as any)?.category === 'transport')
                    .map(i => ({
                        id: i.id,
                        name: i.name,
                        price: Number(i.amount),
                        description: `${i.name} - ${i.billing_cycle || 'Monthly'}`
                    }));

                // Map Canteen to canteen_plans
                const fetchedCanteen = items
                    .filter(i => (i.category as any)?.category === 'canteen')
                    .map(i => ({
                        id: i.id,
                        name: i.name,
                        price: Number(i.amount),
                        description: `${i.name} - ${i.billing_cycle || 'Cycle'}`
                    }));

                // Map Boarding to boarding_rooms
                const fetchedBoarding = items
                    .filter(i => (i.category as any)?.category === 'boarding')
                    .map(i => ({
                        id: i.id,
                        name: i.name,
                        price: Number(i.amount),
                        capacity: 1 // Default
                    }));

                // Map Others
                const fetchedOtherServices = items
                    .filter(i => {
                        const cat = (i.category as any)?.category;
                        return cat === 'other' || !['tuition', 'transport', 'canteen', 'boarding'].includes(cat);
                    })
                    .map(i => ({
                        id: i.id,
                        name: i.name,
                        description: i.billing_cycle || '',
                        price: Number(i.amount),
                        category: (i.category as any)?.category || 'other'
                    }));

                console.log(`[API] Unified School details loaded. Grades: ${fetchedGradePricing.length}, Transport: ${fetchedBusRoutes.length}, Canteen: ${fetchedCanteen.length}`);

                const school: School = {
                    id: data.school_id,
                    name: data.school_name,
                    logo: data.logo_url || null,
                    phone: data.phone || null,
                    email: data.email || null,
                    lenco_public_key: data.lenco_public_key || null,
                    access_code: data.access_code || null,
                    uses_forms: data.uses_forms || false,
                    grade_pricing: fetchedGradePricing,
                    other_services: fetchedOtherServices,
                    bus_routes: fetchedBusRoutes,
                    boarding_rooms: fetchedBoarding,
                    canteen_plans: fetchedCanteen,
                };
                return school;
            } // Close the 'else' block
        } catch (e) {
            console.error('[API] Exception fetching school by name:', e);
        }
    }

    // Offline fallback
    const cachedSchools = await offlineDB.getAll('schools');
    const school = (cachedSchools as School[]).find(s => s.name === name);
    return school || null;
}
