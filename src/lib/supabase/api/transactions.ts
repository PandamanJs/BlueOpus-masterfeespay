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

const SUCCESSFUL_TRANSACTION_STATUSES = ['success', 'successful', 'completed'];
const CLOSED_INVOICE_STATUSES = ['paid', 'settled', 'cleared', 'void', 'cancelled', 'canceled'];
const OPEN_INVOICE_STATUSES = ['unpaid', 'partial', 'overdue', 'pending'];

function asAmount(value: any, fallback = 0): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : fallback;
}

function firstDefinedAmount(...values: any[]): number | null {
    for (const value of values) {
        if (value === null || value === undefined || value === '') continue;
        const amount = Number(value);
        if (Number.isFinite(amount)) return amount;
    }
    return null;
}

function normalizeReference(value: any): string {
    return String(value || '').trim().toLowerCase();
}

function getInvoiceId(row: any): string {
    return String(row?.invoice_id || row?.id || row?.linked_invoice_id || '');
}

function getInvoiceReference(row: any): string {
    return String(row?.invoice_number || row?.reference || getInvoiceId(row));
}

function getInvoiceServices(row: any): any[] {
    if (Array.isArray(row?.services)) return row.services;
    if (Array.isArray(row?.invoice_items?.items)) return row.invoice_items.items;
    if (Array.isArray(row?.items)) return row.items;
    return [];
}

function getInvoiceName(row: any): string {
    const services = getInvoiceServices(row);
    return row?.service_name || row?.description || services[0]?.description || services[0]?.name || 'School Fee Payment';
}

function getInvoiceTotal(row: any): number {
    return firstDefinedAmount(row?.total_amount_cached, row?.total_amount, row?.base_amount, row?.amount, row?.invoice_total) ?? 0;
}

function getExplicitInvoiceBalance(row: any): number | null {
    return firstDefinedAmount(row?.balance_remaining, row?.outstanding_balance, row?.balance_due, row?.amount_due);
}

function getExplicitPaidAmount(row: any): number | null {
    return firstDefinedAmount(row?.amount_paid, row?.paid_amount, row?.total_paid);
}

function transactionMatchesInvoice(tx: any, invoice: any): boolean {
    const invoiceId = getInvoiceId(invoice);
    const invoiceRef = getInvoiceReference(invoice);
    const txInvoiceId = String(tx?.invoice_id || tx?.linked_invoice_id || tx?.meta_data?.invoice_id || '');
    const txInvoiceRef = normalizeReference(tx?.meta_data?.invoice_no || tx?.meta_data?.invoice_number || tx?.reference);

    return Boolean(
        (invoiceId && txInvoiceId && invoiceId === txInvoiceId) ||
        (invoiceRef && txInvoiceRef && normalizeReference(invoiceRef) === txInvoiceRef)
    );
}

function transactionPaidAmount(tx: any): number {
    return asAmount(tx?.amount);
}

function getActiveStudentGrade(student: any) {
    const grades = (student?.student_grade as any[]) || [];
    return grades.find(sg => sg.is_active) || grades[grades.length - 1] || null;
}

function buildInvoiceSummaryItem(row: any, transactions: any[], source: 'invoice' | 'payment_history') {
    const total = getInvoiceTotal(row);
    const matchedTransactions = transactions.filter(tx => transactionMatchesInvoice(tx, row));
    const transactionPaid = matchedTransactions.reduce((sum, tx) => sum + transactionPaidAmount(tx), 0);
    const explicitPaid = getExplicitPaidAmount(row);
    const collected = explicitPaid ?? transactionPaid;
    const explicitBalance = getExplicitInvoiceBalance(row);
    const status = String(row?.status || '').toLowerCase();
    const isClosed = CLOSED_INVOICE_STATUSES.includes(status);
    const computedBalance = Math.max(0, total - collected);
    const balance = isClosed ? 0 : Math.max(0, explicitBalance ?? computedBalance);
    const services = getInvoiceServices(row);

    return {
        type: source,
        category: row?.category || services[0]?.category || 'fees',
        id: getInvoiceId(row),
        invoice_id: getInvoiceId(row),
        invoice_number: getInvoiceReference(row),
        name: getInvoiceName(row),
        description: row?.description || row?.service_name || services[0]?.description || services[0]?.name || getInvoiceName(row),
        expected: total,
        collected,
        invoiced: total,
        balance,
        status: balance <= 0 ? 'cleared' : (row?.status || 'unpaid'),
        raw_status: row?.status || null,
        term: row?.term || row?.invoice_items?.meta?.term,
        academic_year: row?.year || row?.academic_year || row?.invoice_items?.meta?.academic_year,
        initiated_at: row?.created_at || row?.issued_at || row?.date_issued || row?.payment_date || row?.initiated_at || null,
        student_id: row?.student_id || null,
        admission_number: row?.admission_number || null,
        services,
        transactions: matchedTransactions,
        source,
    };
}

async function getStudentFinancialSnapshot(studentId: string): Promise<any> {
    const [
        studentResp,
        invoicesResp,
        historyResp,
        transactionsResp,
    ] = await Promise.all([
        supabase
            .from('students')
            .select('student_id, school_id, first_name, last_name, admission_number, student_grade(grade_id, is_active, class, grade:grades(grade_name, grade_id))')
            .eq('student_id', studentId)
            .single(),
        supabase
            .from('invoices')
            .select('*')
            .eq('student_id', studentId),
        supabase
            .from('payment_history')
            .select('*')
            .eq('student_id', studentId),
        supabase
            .from('transactions')
            .select('*')
            .eq('student_id', studentId)
            .in('status', SUCCESSFUL_TRANSACTION_STATUSES),
    ]);

    const student = studentResp.data;
    if (studentResp.error || !student) {
        if (studentResp.error) handleSupabaseError(studentResp.error, 'getStudentFinancialSnapshot - student');
        return null;
    }
    if (invoicesResp.error) handleSupabaseError(invoicesResp.error, 'getStudentFinancialSnapshot - invoices');
    if (historyResp.error) console.warn('[getStudentFinancialSnapshot] payment_history lookup failed:', historyResp.error.message);
    if (transactionsResp.error) handleSupabaseError(transactionsResp.error, 'getStudentFinancialSnapshot - transactions');

    const transactions = transactionsResp.data || [];
    const invoices = (invoicesResp.data || []).filter((row: any) => {
        const status = String(row?.status || '').toLowerCase();
        return !['void', 'cancelled', 'canceled'].includes(status);
    });
    const historyRows = (historyResp.data || []).filter((row: any) => {
        const status = String(row?.status || '').toLowerCase();
        const explicitBalance = getExplicitInvoiceBalance(row);
        return (explicitBalance !== null && explicitBalance > 0) || OPEN_INVOICE_STATUSES.includes(status);
    });

    const invoiceItems = invoices.map((row: any) => buildInvoiceSummaryItem(row, transactions, 'invoice'));
    const seenIds = new Set(invoiceItems.map(item => normalizeReference(item.invoice_id)).filter(Boolean));
    const seenRefs = new Set(invoiceItems.map(item => normalizeReference(item.invoice_number)).filter(Boolean));
    const historyItems = historyRows
        .filter((row: any) => {
            const id = normalizeReference(getInvoiceId(row));
            const ref = normalizeReference(getInvoiceReference(row));
            return (!id || !seenIds.has(id)) && (!ref || !seenRefs.has(ref));
        })
        .map((row: any) => buildInvoiceSummaryItem(row, transactions, 'payment_history'));

    const items = [...invoiceItems, ...historyItems].sort((a, b) =>
        String(a.initiated_at || '').localeCompare(String(b.initiated_at || ''))
    );

    const matchedTxIds = new Set<string>();
    items.forEach(item => {
        (item.transactions || []).forEach((tx: any) => {
            const txId = String(tx.transaction_id || tx.id || tx.reference || '');
            if (txId) matchedTxIds.add(txId);
        });
    });

    let surplus = transactions
        .filter((tx: any) => {
            const txId = String(tx.transaction_id || tx.id || tx.reference || '');
            return txId && !matchedTxIds.has(txId);
        })
        .reduce((sum: number, tx: any) => sum + transactionPaidAmount(tx), 0);

    for (const item of items) {
        if (item.balance > 0 && surplus > 0) {
            const applied = Math.min(item.balance, surplus);
            item.balance -= applied;
            item.credit_applied = applied;
            surplus -= applied;
            if (item.balance <= 0) item.status = 'cleared';
        } else {
            item.credit_applied = item.credit_applied || 0;
        }
    }

    if (surplus > 0) {
        if (items.length > 0) {
            const newest = items[items.length - 1];
            newest.balance -= surplus;
            newest.credit_applied = (newest.credit_applied || 0) + surplus;
            newest.status = 'cleared';
        } else {
            items.push({
                type: 'surplus',
                category: 'credit',
                id: `credit-${studentId}`,
                invoice_id: null,
                invoice_number: 'Account Credit',
                name: 'Account Credit / Surplus',
                expected: 0,
                collected: surplus,
                invoiced: 0,
                balance: -surplus,
                status: 'cleared',
                initiated_at: new Date().toISOString(),
                transactions: [],
            });
        }
    }

    const activeGradeData = getActiveStudentGrade(student);
    const totalBalance = items.reduce((sum, item) => sum + asAmount(item.balance), 0);

    return {
        student: {
            id: student.student_id,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            admission_number: student.admission_number,
            grade: activeGradeData?.grade?.grade_name || 'Current Grade',
            class: activeGradeData?.class || null,
        },
        items,
        totalBalance,
        totalInvoiced: items.reduce((sum, item) => sum + asAmount(item.invoiced || item.expected), 0),
        totalPaid: transactions.reduce((sum: number, tx: any) => sum + transactionPaidAmount(tx), 0),
        transactions,
    };
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
        const results = await Promise.all(
            studentIds.map(async (id) => {
                const summary = await getStudentFinancialSummary(id);
                return { id, balance: summary?.totalBalance || 0 };
            })
        );

        const map: Record<string, number> = {};
        results.forEach(r => { map[r.id] = r.balance; });
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
        const summary = await getStudentFinancialSnapshot(studentId);
        if (!summary) return [];

        return (summary.items || [])
            .filter((item: any) => Number(item.balance || 0) > 0.01)
            .map((item: any) => ({
                id: item.invoice_id || item.id,
                payment_date: item.initiated_at || '',
                reference: item.invoice_number || item.invoice_id || item.id,
                total_amount: item.expected || item.invoiced || 0,
                base_amount: item.expected || item.invoiced || 0,
                service_fee: 0,
                status: item.status || 'unpaid',
                payment_method: 'invoice',
                student_name: summary.student?.name || '',
                admission_number: summary.student?.admission_number || '',
                school_name: '',
                parent_phone: '',
                parent_id: '',
                student_id: studentId,
                school_id: '',
                term: item.term,
                academic_year: item.academic_year,
                services: item.services || [],
                completed_at: '',
                initiated_at: item.initiated_at || '',
                balance_remaining: item.balance || 0,
                invoice_number: item.invoice_number,
                service_name: item.name,
            } as PaymentHistoryRecord));
    } catch (err) { 
        console.error("[getInvoicesWithBalanceForStudent] Reconcile error:", err);
        return []; 
    }
}


export async function getStudentsUnpaidInvoicesCount(studentIds: string[]): Promise<Record<string, number>> {
    if (!studentIds.length) return {};
    try {
        const map: Record<string, number> = Object.fromEntries(studentIds.map(id => [id, 0]));
        const summaries = await Promise.all(studentIds.map(async id => ({ id, summary: await getStudentFinancialSummary(id) })));
        summaries.forEach(({ id, summary }) => {
            map[id] = Array.isArray(summary?.items)
                ? summary.items.filter((item: any) => Number(item?.balance || 0) > 0.01).length
                : 0;
        });
        return map;
    } catch { return Object.fromEntries(studentIds.map(id => [id, 0])); }
}

export interface FinancialSummary {
    student: {
        id: string;
        name: string;
        admission_number?: string;
        grade?: string;
    };
    items: any[];
    totalBalance: number;
    transactions: any[];
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
    if (studentId.startsWith('new-') || studentId.startsWith('review-')) {
        return {
            student: { id: studentId, name: 'New Student', grade: '...' },
            items: [],
            totalBalance: 0,
            transactions: []
        };
    }

    try {
        return await getStudentFinancialSnapshot(studentId);
    } catch (e) {
        console.error('Error in getStudentFinancialSummary:', e);
        return null;
    }
}

async function getStudentFinancialSummaryLegacy(studentId: string): Promise<any> {
    // If it's a temporary local ID, return an empty summary instead of querying Supabase
    if (studentId.startsWith('new-')) {
        return {
            student: { id: studentId, name: 'New Student', grade: '...' },
            items: [],
            totalBalance: 0,
            transactions: []
        };
    }
    try {
        const [
            studentResp,
            invoicesResp,
            transactionsResp,
            enrollmentsResp,
            feeItemsResp
        ] = await Promise.all([
            supabase.from('students').select('student_id, school_id, first_name, last_name, admission_number, student_grade(grade_id, grade:grades(grade_name, grade_id))').eq('student_id', studentId).single(),
            supabase.from('invoices').select('*, joined_items:invoice_items(*)').eq('student_id', studentId).neq('status', 'void'),
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

        items.push({
            type: 'tuition',
            category: 'tuition',
            name: `${activeGradeName} Tuition Fees`,
            expected: tuitionPrice,
            collected: 0,
            invoiced: 0,
            balance: tuitionPrice,
            status: 'unpaid',
            term: 1, // Fallback for estimated items
            academic_year: new Date().getFullYear()
        });

        // 2. Add Subscription Items from Enrollments
        enrollments.forEach((en: any) => {
            const item = en.fee_items;
            const price = en.override_amount !== null ? Number(en.override_amount) : Number(item?.amount || 0);
            items.push({
                type: 'subscription',
                category: ((item as any)?.category as any)?.category || item?.category || 'other',
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
            const term = (inv as any).term || inv.invoice_items?.meta?.term;
            const year = (inv as any).year || inv.invoice_items?.meta?.academic_year;

            const items = Array.isArray((inv as any).joined_items)
                ? (inv as any).joined_items
                : (Array.isArray(inv.invoice_items) 
                    ? inv.invoice_items 
                    : (inv.invoice_items?.items && Array.isArray(inv.invoice_items.items) ? inv.invoice_items.items : []));

            let name = "";
            
            // Prioritize item description over generic service_name
            if (items.length > 0) {
                const firstItem = items[0];
                name = firstItem.description || firstItem.name || "";
            }
            
            // Fallback to top-level service_name
            if (!name) {
                name = (inv as any).service_name || "";
            }
            
            if (!name && term && year) {
                name = `Term ${term} (${year}) School Fees`;
            } else if (!name && term) {
                name = `Term ${term} School Fees`;
            }
            
            if (!name) name = 'School Fees';

            return {
                type: 'invoice',
                category: (inv as any).category || 'fees',
                invoice_id: (inv as any).invoice_id || inv.id,
                invoice_number: inv.invoice_number,
                name: name,
                description: name,
                expected: total,
                collected: 0,
                invoiced: total,
                balance: total,
                status: inv.status,
                term: inv.term,
                academic_year: inv.year || inv.academic_year,
                initiated_at: (inv as any).created_at || (inv as any).issued_at || (inv as any).date_issued || null,
                transactions: [] // We'll fill this specifically
            };
        });

        const allItems = [...invoiceItems];

        // 5. Attribute payments — match each transaction to exactly ONE item
        let unallocatedPaymentsTotal = 0;
        const unallocatedTxs: any[] = [];

        transactions.forEach(tx => {
            const amount = Number(tx.amount || 0);
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
        let surplus = unallocatedPaymentsTotal; // Start with unallocated orphan payments
        
        // Phase 1: Identify all items with surplus (overpayments)
        const provisionalItems = allItems.map(it => {
            const rawBalance = Math.max(it.expected, it.invoiced) - it.collected;
            if (rawBalance < 0) {
                const cred = Math.abs(rawBalance);
                surplus += cred;
                // An overpayment means this item is 'cleared' and contributes to the global surplus.
                // We do NOT set credit_applied here because no credit was used TO pay this item; 
                // this item itself IS the source of the credit.
                return { ...it, balance: 0, status: 'cleared', credit_applied: 0 };
            }
            // Items with debt (balance > 0) start with 0 credit_applied
            return { ...it, balance: rawBalance, credit_applied: 0 };
        });

        // Phase 2: Apply cumulative surplus to older debts first (Waterfall)
        provisionalItems.sort((a,b) => (a.initiated_at || '').localeCompare(b.initiated_at || ''));

        provisionalItems.forEach(it => {
            if (it.balance > 0 && surplus > 0) {
                const deduction = Math.min(it.balance, surplus);
                it.balance -= deduction;
                // THIS is where credit is applied: to settle a debt.
                it.credit_applied = deduction; 
                surplus -= deduction;
            }
            items.push(it);
        });

        // Phase 3: Total remaining absolute surplus
        // If there's still a surplus (net positive balance for student), we keep it on the most recent item 
        // to show a net negative balance (Credit) in the statement. 
        // We handle the edge case where items might be empty by adding a placeholder surplus item.
        if (surplus > 0) {
            if (items.length > 0) {
                items[items.length - 1].balance -= surplus; 
            } else {
                items.push({
                    type: 'surplus',
                    name: 'Account Credit / Surplus',
                    expected: 0,
                    collected: surplus,
                    invoiced: 0,
                    balance: -surplus,
                    status: 'cleared',
                    initiated_at: new Date().toISOString()
                });
            }
        }

        const totalBalance = items.reduce((sum, it) => sum + (it.balance || 0), 0);

        return {
            student: {
                id: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                admission_number: student.admission_number,
                grade: activeGradeName
            },
            items,
            totalBalance,
            transactions
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
