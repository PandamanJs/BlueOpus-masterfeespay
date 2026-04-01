
/**
 * ========================================
 * SCHOOL SERVICES DATA
 * ========================================
 */

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

const TWALUMBU_ROUTE_PRICING: Record<string, number> = {
    "Drop-Off Zone 1": 810,
    "Drop-Off Zone 2": 855,
    "Drop-Off Zone 3": 930,
    "Drop-Off Zone 4": 945,
    "Drop-Off Zone 5": 1155,
    "Drop-Off Zone 6": 1200,
    "Drop-Off Zone 7": 1305,
    "Drop-Off Zone 8": 1350,
    "Drop-Off Zone 9": 1395,
    "Drop-Off Zone 10": 1500,
    "Drop-Off Zone 11": 1605,
};

const TWALUMBU_UNIFORM_SUBITEMS = [
    { id: "uniform-complete", name: "Complete Uniform Set", amount: 1110 },
    { id: "jersey-ece", name: "School Jerseys – ECE", amount: 180 },
    { id: "jersey-grade-1-4", name: "School Jerseys – Grade 1–4", amount: 190 },
    { id: "jersey-grade-5-7", name: "School Jerseys – Grade 5–7", amount: 200 },
    { id: "socks", name: "School Socks", amount: 30 },
    { id: "golf-tshirt", name: "Golf T-Shirts", amount: 120 },
    { id: "tracksuit-ece-4", name: "Tracksuits – ECE to Grade 4", amount: 190 },
    { id: "tracksuit-grade-5-7", name: "Tracksuits – Grade 5–7", amount: 200 },
];

const TWALUMBU_CANTEEN_PERIODS = [
    { period: "day", amount: 30 },
    { period: "week", amount: 120 },
    { period: "month", amount: 480 },
    { period: "term", amount: 1560 },
];

const isTwalumbuSchool = (name: string) => name.trim().toLowerCase().includes("twalumbu");

const createPaymentPeriods = (termAmount: number) => {
    const monthlyAmount = Math.max(1, Math.round(termAmount / 3));
    const weeklyAmount = Math.max(1, Math.round(termAmount / 12));

    return [
        { period: "term", amount: termAmount },
        { period: "month", amount: monthlyAmount },
        { period: "week", amount: weeklyAmount },
    ];
};

const cloneService = (service: SchoolService): SchoolService => ({
    ...service,
    subItems: service.subItems ? service.subItems.map(item => ({ ...item })) : undefined,
    paymentPeriods: service.paymentPeriods ? service.paymentPeriods.map(period => ({ ...period })) : undefined,
    routePricing: service.routePricing ? { ...service.routePricing } : undefined,
});

export const DEMO_SERVICES: SchoolService[] = [
    {
        id: "serv-001",
        name: "School Bus",
        description: "Daily transportation to and from school",
        amount: 1500,
        category: "transport",
        paymentPeriods: createPaymentPeriods(1500),
        routePricing: {
            "Route A - Central": 1500,
            "Route B - East": 1600,
            "Route C - West": 1400
        }
    },
    {
        id: "serv-002",
        name: "Hot Lunch",
        description: "Nutritious hot meals served daily",
        amount: 900,
        category: "meals",
        paymentPeriods: [
            { period: "term", amount: 900 },
            { period: "month", amount: 300 }
        ]
    },
    {
        id: "serv-003",
        name: "Swimming Club",
        description: "After-school swimming lessons and practice",
        amount: 300,
        category: "activities"
    },
    {
        id: "serv-004",
        name: "School Uniform Set",
        description: "Complete school uniform package",
        amount: 850,
        category: "uniform",
        subItems: [
            { id: "uniform-complete", name: "Complete Set", amount: 850 },
            { id: "shirt", name: "School Shirt", amount: 150 },
            { id: "trousers", name: "Trousers/Skirt", amount: 200 },
            { id: "blazer", name: "Blazer", amount: 350 },
            { id: "tie", name: "School Tie", amount: 50 },
            { id: "pe-kit", name: "PE Kit", amount: 250 }
        ]
    },
    {
        id: "serv-005",
        name: "Grade 7 ECZ Exam Fee",
        description: "ECZ Exam Fee for Grade 7 students",
        amount: 150,
        category: "supplies"
    },
    {
        id: "serv-006",
        name: "Application Forms",
        description: "Application forms for new students",
        amount: 100,
        category: "supplies"
    }
];

import { supabase } from '../lib/supabase/client';

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
                    paymentPeriods: createPaymentPeriods(amount)
                });
            });

            if (dynamicServices.length > 0) {
                return dynamicServices;
            }
        } catch (err) {
            console.error('[getSchoolServices] Exception fetching synced services:', err);
        }
    }


    // Fallback to Demo Data
    const baseServices = DEMO_SERVICES.map(cloneService);

    if (isTwalumbuSchool(schoolName)) {
        const defaultZone = "Drop-Off Zone 1";
        const defaultAmount = TWALUMBU_ROUTE_PRICING[defaultZone];

        if (defaultAmount === undefined) {
            return baseServices;
        }

        const twalumbuServices = baseServices.map(service => {
            if (service.category === "transport") {
                return {
                    ...service,
                    amount: defaultAmount,
                    paymentPeriods: createPaymentPeriods(defaultAmount),
                    routePricing: { ...TWALUMBU_ROUTE_PRICING }
                };
            }

            if (service.category === "uniform") {
                const completeSet = TWALUMBU_UNIFORM_SUBITEMS.find(item => item.id === "uniform-complete");
                const uniformAmount = completeSet ? completeSet.amount : service.amount;

                return {
                    ...service,
                    amount: uniformAmount,
                    subItems: TWALUMBU_UNIFORM_SUBITEMS.map(item => ({ ...item })),
                };
            }

            if (service.category === "meals") {
                return {
                    ...service,
                    name: "School Canteen",
                    amount: TWALUMBU_CANTEEN_PERIODS.find(p => p.period === "term")?.amount || service.amount,
                    paymentPeriods: TWALUMBU_CANTEEN_PERIODS.map(period => ({ ...period })),
                };
            }

            return service;
        });

        return twalumbuServices.filter(service => service.name !== "Swimming Club");
    }

    return baseServices;
}
