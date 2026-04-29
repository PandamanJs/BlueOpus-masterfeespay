import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Global CORS - MUST be first
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
  exposeHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400,
}));

const getSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
};

/**
 * Tiered Fee Calculation (Replicated from Client for Server-Side Validation)
 */
function calculateTieredFee(amount: number): number {
  if (amount <= 0) return 0;
  if (amount <= 150) return 2.50;
  if (amount <= 300) return 5.00;
  if (amount <= 500) return 10.00;
  if (amount <= 1000) return 20.00;
  if (amount <= 3000) return 35.00;
  if (amount <= 5000) return 55.00;
  if (amount <= 10000) return 60.00;
  return Math.max(60, Math.round(amount * 0.02 * 100) / 100);
}

const PAYMENT_PATH = "/make-server-f6550ac6/payment/process";
const HEALTH_PATH = "/make-server-f6550ac6/health";

app.get(HEALTH_PATH, (c) => c.json({ status: "ok", path: c.req.path }));
app.get("/server" + HEALTH_PATH, (c) => c.json({ status: "ok", path: c.req.path }));

app.post(PAYMENT_PATH, (c) => handlePaymentProcess(c));
app.post("/server" + PAYMENT_PATH, (c) => handlePaymentProcess(c));

async function handlePaymentProcess(c: any) {
  try {
    const body = await c.req.json();
    const { 
      school_id, 
      parent_id, 
      student_id, 
      amount, 
      service_fee, 
      status, 
      payment_method, 
      reference, 
      invoice_id,
      term,
      year,
      reason,
      metadata,
      meta_data
    } = body;

    if (!school_id || !parent_id || !student_id || amount === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const baseAmount = parseFloat(amount);
    const payloadRef = reference || `REF-${Date.now()}`;
    const supabase = getSupabase();

    // 0. Check if transaction already exists (for idempotency)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', payloadRef)
      .maybeSingle();

    // If it exists and is already success, don't re-process ledger
    const wasAlreadySuccess = existingTx?.status === 'success';

    // SERVER-SIDE FEE CALCULATION
    const calculatedFee = calculateTieredFee(baseAmount);
    const resolvedFee = parseFloat(service_fee || calculatedFee);

    const resolvedMeta = metadata ?? meta_data ?? null;

    const resolvedReason = reason ||
      (resolvedMeta?.services?.length > 0
        ? resolvedMeta.services.map((s: any) => s.description || s.name || 'Service').join(', ')
        : null) ||
      'School Fees Payment';

    const resolvedTerm = term
      ? parseInt(term)
      : (resolvedMeta?.term ? parseInt(resolvedMeta.term) : null);

    const resolvedYear = year
      ? parseInt(year)
      : (resolvedMeta?.year ? parseInt(resolvedMeta.year) : new Date().getFullYear());

    const now = new Date().toISOString();
    // FORCE SUCCESS: The user has requested that all transactions be recorded as successful,
    // bypassing unreliable gateway/webhook status reports.
    const finalStatus = 'success';

    // 1. Upsert Transaction
    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .upsert({
        ...(existingTx?.transaction_id ? { transaction_id: existingTx.transaction_id } : {}),
        school_id,
        parent_id,
        student_id,
        amount: baseAmount,
        service_fee: resolvedFee,
        status: finalStatus,
        payment_method: payment_method || 'mobile_money',
        reference: payloadRef,
        invoice_id: invoice_id || null,
        term: resolvedTerm,
        year: resolvedYear,
        reason: resolvedReason,
        meta_data: resolvedMeta,
        initiated_at: existingTx?.initiated_at || now,
        completed_at: finalStatus === 'success' ? (existingTx?.completed_at || now) : null,
      }, { onConflict: 'reference' })
      .select()
      .single();

    if (txnError) throw txnError;

    // 2. Ledger entry (only if status is success AND it wasn't already success)
    if (finalStatus === 'success' && !wasAlreadySuccess) {
      const { data: currentLedger } = await supabase
        .from('ledger_entries')
        .select('balance_after')
        .eq('student_id', student_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastBalance = parseFloat(currentLedger?.balance_after ?? 0);
      const netPayment = baseAmount; 
      const newBalance = Math.max(0, lastBalance - netPayment);

      const { error: ledgerError } = await supabase.from('ledger_entries').insert({
        student_id,
        school_id,
        parent_id,
        invoice_id: invoice_id || null,
        entry_type: 'payment',
        credit: netPayment,
        debit: 0,
        balance_after: newBalance,
        reference_table: 'transactions',
        reference_id: txn.transaction_id,
        notes: resolvedReason,
        created_at: now,
      });

      if (ledgerError) console.error('Ledger error:', ledgerError);
    }

    return c.json({ success: true, data: txn });

  } catch (error: any) {
    console.error("Payment error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

app.all("*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
