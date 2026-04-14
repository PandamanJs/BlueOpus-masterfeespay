import { supabase, handleSupabaseError } from '../client';
import type { Transaction } from '../../../types';
import type { PaymentHistoryRecord } from '../types';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { offlineDB } from '../../offlineDatabase';
import { phoneOrFilter, phoneVariants, sanitizeTransactionMetadata } from '../../../utils/reconciliation';

export type TransactionInput = {
    parent_id: string;
    student_id: string;
    school_id: string;
    amount: number;
    service_fee: number;
    total_amount: number;
    status: 'pending' | 'successful' | 'failed';
    payment_method: 'mobile_money' | 'card' | 'bank_transfer';
    reference: string;
    invoice_id?: string;  // UUID of the specific invoice being paid
    meta_data?: Record<string, any>;
    initiated_at: string;
    completed_at?: string;
};


/**
 * Get transactions for a parent by telephone number.
 */
export async function getTransactionsByParentPhone(phone: string): Promise<Transaction[]> {
    try {
        const orQuery = phoneOrFilter('phone_number', phone);

        // 1. Find the parent
        const { data: parent, error: parentError } = await supabase
            .from('parents')
            .select('parent_id')
            .or(orQuery)
            .limit(1)
            .maybeSingle();

        if (parentError || !parent) return [];

        // 2. Find all students linked to this parent (as parent_id OR other_parent_id)
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('student_id')
            .or(`parent_id.eq.${parent.parent_id},other_parent_id.eq.${parent.parent_id}`);

        if (studentsError || !students || students.length === 0) {
            // Fallback: If no students found by linkage, maybe still show transactions they personally initiated
            const { data: initiatedTransactions, error: initiatedError } = await supabase
                .from('transactions')
                .select('*')
                .eq('parent_id', parent.parent_id)
                .order('initiated_at', { ascending: false });
            
            if (initiatedError) return [];
            return initiatedTransactions || [];
        }

        const studentIds = students.map(s => s.student_id);

        // 3. Get all transactions for these students OR initiated by this parent
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .or(`student_id.in.(${studentIds.join(',')}),parent_id.eq.${parent.parent_id}`)
            .order('initiated_at', { ascending: false });

        if (error) { handleSupabaseError(error, 'getTransactionsByParentPhone'); return []; }
        return transactions || [];
    } catch (error) {
        console.error('Exception in getTransactionsByParentPhone:', error);
        return [];
    }
}

/**
 * Create a new transaction in the database using the Edge Function API.
 * This guarantees the Dashboard unified ledger will sync.
 */
export async function createTransaction(transaction: TransactionInput): Promise<{ success: boolean; data?: Transaction; error?: any; queued?: boolean }> {
    const isOnline = navigator.onLine;

    const sanitizedMeta = sanitizeTransactionMetadata(
        transaction.meta_data ?? {},
        {
            amount: transaction.amount,
            total_amount: transaction.total_amount,
            initiated_at: transaction.initiated_at,
            completed_at: transaction.completed_at,
        }
    );

    // Build a human-readable reason from the selected services
    const services = (sanitizedMeta as any)?.services as Array<{ description?: string; name?: string }> | undefined;
    const reason = services && services.length > 0
        ? services.map(s => s.description || s.name || 'Service').join(', ')
        : 'School Fees Payment';

    const txData = {
        school_id: transaction.school_id,
        parent_id: transaction.parent_id,
        student_id: transaction.student_id,
        amount: transaction.amount,
        service_fee: transaction.service_fee,
        total_amount: transaction.total_amount,
        status: transaction.status === 'successful' ? 'success' : (transaction.status === 'pending' ? 'pending' : 'failed'),
        payment_method: transaction.payment_method === 'mobile_money' ? 'mobile_money' : 'bank',
        reference: transaction.reference,
        // Top-level fields the Edge Function reads directly
        invoice_id: transaction.invoice_id || (sanitizedMeta as any)?.invoice_id || null,
        term: (sanitizedMeta as any)?.term ? parseInt((sanitizedMeta as any).term) : null,
        year: (sanitizedMeta as any)?.year ? parseInt((sanitizedMeta as any).year) : new Date().getFullYear(),
        reason,
        // The Edge Function expects `metadata` (not `meta_data`)
        metadata: sanitizedMeta,
        // Keep meta_data too for backward compat / offline queue
        meta_data: sanitizedMeta,
    };

    if (!isOnline) {
        await offlineDB.put('transaction_queue', {
            reference: transaction.reference,
            data: txData,
            timestamp: new Date().toISOString(),
            retryCount: 0
        });
        return { success: true, queued: true };
    }

    try {
        // Fetch Edge Function
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server/make-server-f6550ac6/payment/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify(txData)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('[createTransaction] edge function error:', result.error);
            // Fallback to queue...
            await offlineDB.put('transaction_queue', {
                reference: transaction.reference,
                data: txData,
                timestamp: new Date().toISOString(),
                retryCount: 0
            });
            return { success: true, queued: true };
        }
        return { success: true, data: result.data };
    } catch (error) {
        console.error('Exception in createTransaction:', error);
        await offlineDB.put('transaction_queue', {
            reference: transaction.reference,
            data: txData,
            timestamp: new Date().toISOString(),
            retryCount: 0
        });
        return { success: true, queued: true };
    }
}

/**
 * Update transaction status (pending → success/failed).
 */
export async function updateTransactionStatus(
    reference: string,
    status: 'successful' | 'failed',
    additionalMetadata?: Record<string, any>
): Promise<{ success: boolean; error?: any }> {
    try {
        const { data: existingTx } = await supabase
            .from('transactions')
            .select('meta_data')
            .eq('reference', reference)
            .single();

        const updateData: any = {
            status: status === 'successful' ? 'success' : 'failed',
            completed_at: new Date().toISOString(),
        };

        if (additionalMetadata) {
            updateData.meta_data = {
                ...(existingTx?.meta_data || {}),
                ...additionalMetadata,
                statusUpdatedAt: new Date().toISOString(),
            };
        }

        const { error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('reference', reference);

        if (error) { handleSupabaseError(error, 'updateTransactionStatus'); return { success: false, error }; }
        return { success: true };
    } catch (error) {
        console.error('Exception in updateTransactionStatus:', error);
        return { success: false, error };
    }
}

/**
 * Get a transaction by reference number.
 */
export async function getTransactionByReference(reference: string): Promise<Transaction | null> {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('reference', reference)
            .maybeSingle();
        if (error) { console.error(error); return null; }
        return data;
    } catch { return null; }
}

/**
 * Get payment history for a parent from the payment_history view.
 */
export async function getPaymentHistoryByParentPhone(phone: string): Promise<PaymentHistoryRecord[]> {
    const isOnline = navigator.onLine;
    try {
        const variants = phoneVariants(phone);

        if (isOnline) {
            // 1. Find the parent
            const { data: parent, error: parentError } = await supabase
                .from('parents')
                .select('parent_id')
                .or(phoneOrFilter('phone_number', phone))
                .limit(1)
                .maybeSingle();

            if (parentError || !parent) return [];

            // 2. Find all students linked to this parent
            const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('student_id')
                .or(`parent_id.eq.${parent.parent_id},other_parent_id.eq.${parent.parent_id}`);

            if (studentsError || !students || students.length === 0) return [];

            const studentIds = students.map(s => s.student_id);

            // 3. Get history for all these students
            const { data, error } = await supabase
                .from('payment_history')
                .select('*')
                .in('student_id', studentIds)
                .order('payment_date', { ascending: false });

            if (!error && data) {
                await offlineDB.putAll('payment_history', data as PaymentHistoryRecord[]);
                return data as PaymentHistoryRecord[];
            }
        }

        // Offline fallback
        const allCached = await offlineDB.getAll('payment_history') as PaymentHistoryRecord[];
        return allCached.filter(r => {
            const p = r.parent_phone?.replace(/\D/g, '');
            return variants.some(v => p?.includes(v));
        }).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    } catch (error) {
        console.error('Exception in getPaymentHistoryByParentPhone:', error);
        return [];
    }
}

/**
 * Get payment history for a specific student.
 */
export async function getPaymentHistoryRecordByStudentId(studentId: string): Promise<PaymentHistoryRecord[]> {
    const isOnline = navigator.onLine;
    try {
        if (isOnline) {
            const { data, error } = await supabase
                .from('payment_history')
                .select('*')
                .eq('student_id', studentId)
                .order('payment_date', { ascending: false });

            if (!error && data) {
                return data as PaymentHistoryRecord[];
            }
        }

        // Offline fallback
        const allCached = await offlineDB.getAll('payment_history') as PaymentHistoryRecord[];
        return (allCached || [])
            .filter(r => r.student_id === studentId)
            .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    } catch (error) {
        console.error('Exception in getPaymentHistoryRecordByStudentId:', error);
        return [];
    }
}

export async function getPendingTransactionsForStudent(studentId: string): Promise<Transaction[]> {
    try {
        const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', 'pending')
            .order('initiated_at', { ascending: false });
        return data || [];
    } catch { return []; }
}

/**
 * Get student subscriptions from `student_service_subscription`.
 */
export async function getStudentSubscriptions(studentIds: string[]): Promise<any[]> {
    if (!studentIds.length) return [];
    try {
        const { data, error } = await supabase
            .from('student_service_subscription')
            .select(`
                *,
                school_service:school_service_id (
                    price,
                    service_type:service_type_id (
                        name,
                        category
                    )
                )
            `)
            .in('student_id', studentIds);
        
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Error fetching student subscriptions:', e);
        return [];
    }
}

/**
 * Get a student's actual outstanding balance by summing:
 * 1. Base Tuition (from student's grade pricing)
 * 2. Active Subscriptions
 * 3. Formal Invoices (if they exceed the sum of 1+2)
 * Minus: All successful payments.
 * 
 * This matches the logic in `useInstitutionalFinancials` from the Dashboard.
 */
export async function getStudentOutstandingBalance(studentId: string): Promise<number> {
    const results = await getStudentsOutstandingBalances([studentId]);
    return results[studentId] || 0;
}

export async function getStudentsOutstandingBalances(studentIds: string[]): Promise<Record<string, number>> {
    if (!studentIds.length) return {};
    
    try {
        // 1. Fetch academic components
        const [
            studentsResp,
            invoicesResp,
            transactionsResp,
            enrollmentsResp,
            feeItemsResp
        ] = await Promise.all([
            // Use the correct relation names for current schema
            supabase.from('students').select('student_id, school_id, student_grade(grade_id, grade:grades(grade_name, grade_id))').in('student_id', studentIds),
            supabase.from('invoices').select('student_id, total_amount_cached, status').in('student_id', studentIds).neq('status', 'void'),
            supabase.from('transactions').select('student_id, amount, service_fee, status').in('student_id', studentIds).in('status', ['success', 'successful', 'completed']),
            supabase.from('student_fee_enrollments').select('student_id, fee_item_id, override_amount, is_active').in('student_id', studentIds).eq('is_active', true),
            supabase.from('fee_items').select('id, school_id, amount, grade_id, category:fee_categories(category)').eq('is_active', true)
        ]);

        const studentsRaw = studentsResp.data || [];
        const invoices = invoicesResp.data || [];
        const transactions = transactionsResp.data || [];
        const enrollments = enrollmentsResp.data || [];
        const feeItems = feeItemsResp.data || [];

        const map: Record<string, number> = {};

        // Invoiced Debt (Source of Truth) + Uninvoiced Expected Debt
        const allInvoicedData = await Promise.all(
            studentIds.map(id => getInvoicesWithBalanceForStudent(id))
        );

        studentsRaw.forEach((student, idx) => {
            const sId = student.student_id;
            const schId = student.school_id;
            const history = allInvoicedData[idx] || [];
            
            // A. Debt from actual formal invoices that have remaining balances
            const invoicedDebt = history.reduce((sum, inv) => sum + (Number(inv.balance_remaining) || 0), 0);

            // B. Resolve Virtual (Uninvoiced) Debt
            const studentGrades = (student.student_grade as any[]) || [];
            const activeGradeRef = studentGrades.find(sg => sg.is_active) || studentGrades[studentGrades.length - 1] || studentGrades[0];
            const activeGradeId = activeGradeRef?.grade?.grade_id || activeGradeRef?.grade_id;

            const existsInHistory = (keyword: string) => history.some(inv => 
                inv.service_name?.toLowerCase().includes(keyword.toLowerCase())
            );

            let virtualDebt = 0;
            if (!existsInHistory('tuition')) {
                const tuitionItem = feeItems.find(fi => 
                    fi.school_id === schId && 
                    (fi.category as any)?.category === 'tuition' && 
                    fi.grade_id === activeGradeId
                );
                virtualDebt += Number(tuitionItem?.amount || 0);
            }

            // Expected Active Subscriptions
            const activeSubs = enrollments.filter(e => e.student_id === sId);
            activeSubs.forEach(e => {
                const item = feeItems.find(fi => fi.id === e.fee_item_id);
                const category = (item?.category as any)?.category || 'general';
                const price = e.override_amount !== null ? Number(e.override_amount) : Number(item?.amount || 0);

                if (!existsInHistory(category)) {
                    virtualDebt += price;
                }
            });

            // C. Total Balance
            map[sId] = invoicedDebt + virtualDebt;

            console.log(`[Lifecycle Ledger] Student: ${sId}, Invoiced Balance: ${invoicedDebt}, Uninvoiced Expected: ${virtualDebt} => Total: ${map[sId]}`);
        });


        // Ensure all input IDs are represented
        studentIds.forEach(id => { if (map[id] === undefined) map[id] = 0; });

        return map;
    } catch (error) {
        console.error('Exception in getStudentsOutstandingBalances:', error);
        return Object.fromEntries(studentIds.map(id => [id, 0]));
    }
}

export async function getStudentsActualDebt(studentIds: string[]): Promise<Record<string, number>> {
    return getStudentsOutstandingBalances(studentIds);
}

export async function getInvoicesWithBalanceForStudent(studentId: string): Promise<PaymentHistoryRecord[]> {
    try {
        // 1. Get records from payment_history view (usually handles partials)
        const { data: historyData } = await supabase
            .from('payment_history')
            .select('*')
            .eq('student_id', studentId)
            .gt('balance_remaining', 0);

        // 2. Get fresh invoices from invoices table (handles new unpaid ones)
        const { data: freshInvoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('student_id', studentId)
            .neq('status', 'complete');

        const results: PaymentHistoryRecord[] = [...(historyData || [])] as PaymentHistoryRecord[];

        // 3. Merge fresh invoices if they are not already in history
        // Deduplicate using BOTH UUIDs and reference numbers
        const seenIds = new Set(results.map(r => r.id));
        const seenRefs = new Set(results.map(r => r.reference?.toLowerCase()));

        (freshInvoices || []).forEach(inv => {
            const invId = inv.invoice_id;
            const invRef = (inv.invoice_number || inv.invoice_id).toLowerCase();
            
            if (!seenIds.has(invId) && !seenRefs.has(invRef)) {
                // Try to extract name from invoice_items JSON
                let serviceName = "School Fee Payment";
                if (inv.invoice_items?.items && Array.isArray(inv.invoice_items.items)) {
                    const firstItem = inv.invoice_items.items[0];
                    serviceName = firstItem.description || firstItem.name || serviceName;
                }

                results.push({
                    id: invId,
                    payment_date: inv.created_at,
                    reference: inv.invoice_number || inv.invoice_id,
                    total_amount: inv.total_amount_cached || 0,
                    base_amount: inv.total_amount_cached || 0,
                    service_fee: 0,
                    status: inv.status,
                    payment_method: 'invoice',
                    student_name: "",
                    admission_number: "",
                    school_name: "",
                    parent_phone: "",
                    parent_id: "",
                    student_id: inv.student_id,
                    school_id: inv.school_id,
                    term: inv.term || inv.invoice_items?.meta?.term,
                    academic_year: inv.year || inv.invoice_items?.meta?.academic_year,
                    services: inv.invoice_items?.items || [],
                    completed_at: "",
                    initiated_at: inv.created_at,
                    balance_remaining: inv.total_amount_cached || 0,
                    service_name: serviceName
                });
                
                seenIds.add(invId);
                seenRefs.add(invRef);
            }
        });

        return results;
    } catch { return []; }
}

export async function getStudentsUnpaidInvoicesCount(studentIds: string[]): Promise<Record<string, number>> {
    if (!studentIds.length) return {};
    try {
        const { data } = await supabase
            .from('transactions')
            .select('student_id')
            .in('student_id', studentIds)
            .eq('status', 'pending');
        const map: Record<string, number> = Object.fromEntries(studentIds.map(id => [id, 0]));
        (data || []).forEach(r => { if (r.student_id) map[r.student_id] = (map[r.student_id] || 0) + 1; });
        return map;
    } catch { return Object.fromEntries(studentIds.map(id => [id, 0])); }
}

/**
 * Get a complete financial summary for a student, including:
 * 1. Base Tuition (expected and paid)
 * 2. Active Subscriptions (expected and paid)
 * 3. Formal Invoices (total amount and balance)
 * 
 * This enables the UI to show a unified history that includes non-invoiced items.
 */
export async function getStudentFinancialSummary(studentId: string): Promise<any> {
    try {
        const [
            studentResp,
            invoicesResp,
            transactionsResp,
            enrollmentsResp,
            feeItemsResp
        ] = await Promise.all([
            supabase.from('students').select('student_id, school_id, first_name, last_name, admission_number, student_grade(grade_id, grade:grades(grade_name, grade_id))').eq('student_id', studentId).single(),
            supabase.from('invoices').select('*').eq('student_id', studentId).neq('status', 'void'),
            supabase.from('transactions').select('*').eq('student_id', studentId).in('status', ['success', 'successful', 'completed']),
            supabase.from('student_fee_enrollments').select('*, fee_items(*)').eq('student_id', studentId).eq('is_active', true),
            supabase.from('fee_items').select('*, category:fee_categories(category)').eq('is_active', true)
        ]);

        const student = studentResp.data;
        const invoices = invoicesResp.data || [];
        const transactions = transactionsResp.data || [];
        const enrollments = enrollmentsResp.data || [];
        const feeItems = feeItemsResp.data || [];

        if (!student) return null;

        const schId = student.school_id;
        const studentGrades = (student.student_grade as any[]) || [];
        const activeGradeData = studentGrades.find(sg => sg.is_active) || studentGrades[studentGrades.length - 1];
        const activeGradeId = activeGradeData?.grade?.grade_id || activeGradeData?.grade_id;
        const activeGradeName = activeGradeData?.grade?.grade_name || 'Current Grade';

        // 1. Identify Tuition
        const tuitionItem = feeItems.find(fi => 
            fi.school_id === schId && 
            (fi.category as any)?.category === 'tuition' && 
            fi.grade_id === activeGradeId
        );
        const tuitionPrice = Number(tuitionItem?.amount || 0);

        const items: any[] = [];

        // Add Tuition Item
        items.push({
            type: 'tuition',
            name: `${activeGradeName} Tuition Fees`,
            expected: tuitionPrice,
            collected: 0,
            invoiced: 0,
            balance: tuitionPrice,
            status: 'unpaid'
        });

        // 2. Add Subscription Items from Enrollments
        enrollments.forEach((en: any) => {
            const item = en.fee_items;
            const price = en.override_amount !== null ? Number(en.override_amount) : Number(item?.amount || 0);
            items.push({
                type: 'subscription',
                id: en.id,
                name: item?.name || 'Service',
                expected: price,
                collected: 0,
                invoiced: 0,
                balance: price,
                status: 'unpaid'
            });
        });

        // 3. Build items DIRECTLY from invoices (the source of truth).
        //    This guarantees every invoice the school issued for this student
        //    appears on the history page, regardless of enrollment matching.
        //    Fee items/enrollments are only used as fallback for services with no invoice yet.
        const invoiceItems: any[] = invoices.map(inv => {
            const total = Number((inv as any).total_amount_cached || inv.total_amount || 0);
            let name = inv.service_name;
            if (!name && inv.invoice_items?.items && Array.isArray(inv.invoice_items.items)) {
                const firstItem = inv.invoice_items.items[0];
                name = firstItem.description || firstItem.name;
            }
            if (!name) name = 'School Fee Payment';

            return {
                type: 'invoice',
                invoice_id: (inv as any).invoice_id || inv.id,
                invoice_number: inv.invoice_number,
                name: name,
                expected: total,
                collected: 0,
                invoiced: total,
                balance: total,
                status: inv.status,
                term: inv.term,
                academic_year: inv.academic_year || inv.year,
                initiated_at: (inv as any).created_at || (inv as any).issued_at || (inv as any).date_issued || null,
                transactions: [] // We'll fill this specifically
            };
        });

        // 4. Fallbacks
        const fallbackItems: any[] = [];
        const hasTuitionInvoice = invoiceItems.some(ii => {
            const n = ii.name.toLowerCase();
            return n.includes('tuition') || n.includes('school fees') || n.includes('academic');
        });
        if (!hasTuitionInvoice && tuitionPrice > 0) {
            fallbackItems.push({
                type: 'tuition',
                id: `virtual-tuition-${studentId}`,
                name: `${activeGradeName} Tuition Fees`,
                expected: tuitionPrice,
                collected: 0,
                invoiced: 0,
                balance: tuitionPrice,
                status: 'unpaid',
                term: null, // Virtual debt might not have a fixed term yet
                academic_year: new Date().getFullYear(),
                initiated_at: null,
                transactions: []
            });
        }

        enrollments.forEach((en: any) => {
            const item = en.fee_items;
            const itemName = (item?.name || 'Service').toLowerCase();
            const isCovered = invoiceItems.some(ii => ii.name.toLowerCase().includes(itemName));
            if (!isCovered) {
                const price = en.override_amount !== null ? Number(en.override_amount) : Number(item?.amount || 0);
                fallbackItems.push({
                    type: 'subscription',
                    id: en.id,
                    name: item?.name || 'Service',
                    expected: price,
                    collected: 0,
                    invoiced: 0,
                    balance: price,
                    status: 'unpaid',
                    term: en.term,
                    academic_year: en.academic_year || en.year,
                    initiated_at: null,
                    transactions: []
                });
            }
        });

        const allItems = [...invoiceItems, ...fallbackItems];

        // 5. Attribute payments — match each transaction to exactly ONE item
        let totalPaid = 0;
        let unallocatedPaymentsTotal = 0;
        const unallocatedTxs: any[] = [];

        transactions.forEach(tx => {
            const amount = Number(tx.amount || 0);
            totalPaid += amount;
            const txInvoiceId = (tx as any).invoice_id;
            const reason = (tx.reason || '').toLowerCase();

            let match = txInvoiceId
                ? allItems.find(it => it.invoice_id === txInvoiceId)
                : null;

            if (!match && tx.meta_data?.invoice_no) {
                match = allItems.find(it => it.invoice_number === tx.meta_data.invoice_no);
            }

            if (!match) {
                match = allItems.find(it =>
                    reason.includes(it.name.toLowerCase()) ||
                    (it.type === 'tuition' && (reason.includes('tuition') || reason.includes('school')))
                );
            }

            if (match) {
                match.collected += amount;
                if (!match.transactions) match.transactions = [];
                match.transactions.push(tx); // Attach transaction to this specific item
            } else {
                // If no match found, this is an orphan/unallocated payment (surplus source)
                unallocatedPaymentsTotal += amount;
                unallocatedTxs.push(tx);
            }
        });

        // Finalize balances with Waterfall Logic:
        // Automatically apply overpayments (credits) to any other outstanding debt for this student.
        items.length = 0;
        let surplusValue = unallocatedPaymentsTotal; // Start with unallocated orphan payments
        
        // Phase 1: Identify all items with surplus (overpayments)
        const provisionalItems = allItems.map(it => {
            const rawBalance = Math.max(it.expected, it.invoiced) - it.collected;
            if (rawBalance < 0) {
                const cred = Math.abs(rawBalance);
                surplusValue += cred;
                // An overpayment means this item is 'cleared' and contributes to the global surplus.
                return { ...it, balance: 0, status: 'cleared', credit_applied: 0 };
            }
            // Items with debt (balance > 0) start with 0 credit_applied
            return { ...it, balance: rawBalance, credit_applied: 0 };
        });

        // Phase 2: Apply cumulative surplus to older debts first (Waterfall)
        provisionalItems.sort((a,b) => (a.initiated_at || '').localeCompare(b.initiated_at || ''));

        provisionalItems.forEach(it => {
            if (it.balance > 0 && surplusValue > 0) {
                const deduction = Math.min(it.balance, surplusValue);
                it.balance -= deduction;
                it.credit_applied = (it.credit_applied || 0) + deduction; 
                surplusValue -= deduction;
            }
            items.push(it);
        });

        // Phase 3: Total remaining absolute surplus
        if (surplusValue > 0) {
            if (items.length > 0) {
                items[items.length - 1].balance -= surplusValue; 
            } else {
                items.push({
                    type: 'surplus',
                    name: 'Account Credit / Surplus',
                    expected: 0,
                    collected: surplusValue,
                    invoiced: 0,
                    balance: -surplusValue,
                    status: 'cleared',
                    initiated_at: new Date().toISOString()
                });
            }
        }

        const totalBalance = items.reduce((sum, it) => sum + (it.balance || 0), 0);
        const totalInvoiced = allItems.reduce((sum, it) => sum + it.expected, 0);

        // Term Locking Map (for AddServicesPage)
        const termServiceMap: Record<number, string[]> = {};
        items.forEach(it => {
            if (it.term) {
                if (!termServiceMap[it.term]) termServiceMap[it.term] = [];
                termServiceMap[it.term].push(it.name.toLowerCase());
            }
        });

        return {
            student: {
                id: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                admission_number: student.admission_number,
                grade: activeGradeName,
                active_grade_id: activeGradeId
            },
            items,
            termServiceMap,
            totalInvoiced,
            totalPaid,
            totalBalance: Math.max(0, totalBalance),
            netBalanceRaw: totalBalance,
            surplus: surplusValue,
            transactions,
            reconciledAt: new Date().toISOString()
        };

    } catch (e) {
        console.error('Error in getStudentFinancialSummary synced:', e);
        return null;
    }
}

export async function syncTransactionToQuickBooks(transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const serviceRoleKey = import.meta.env['VITE_SUPABASE_SERVICE_ROLE_KEY'];
        if (!serviceRoleKey) return { success: false, error: 'Service role key not configured' };
        const response = await fetch(
            `${import.meta.env['VITE_SUPABASE_URL']}/functions/v1/quickbooks-sync`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` }, body: JSON.stringify({ transaction_id: transactionId }) }
        );
        if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
        const result = await response.json();
        return result.success ? { success: true } : { success: false, error: result.error };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
