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

const PAYMENT_PATH = "/make-server-f6550ac6/payment/process";
const HEALTH_PATH = "/make-server-f6550ac6/health";

// Route variations to handle Supabase's path forwarding quirks
app.get(HEALTH_PATH, (c) => c.json({ status: "ok", path: c.req.path }));
app.get("/server" + HEALTH_PATH, (c) => c.json({ status: "ok", path: c.req.path }));

app.post(PAYMENT_PATH, (c) => handlePaymentProcess(c));
app.post("/server" + PAYMENT_PATH, (c) => handlePaymentProcess(c));

// Main logic
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
      // Support both field names for backward compatibility
      metadata,
      meta_data
    } = body;

    if (!school_id || !parent_id || !student_id || amount === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // Use whichever metadata field is provided
    const resolvedMeta = metadata ?? meta_data ?? null;
    const payloadRef = reference || `REF-${Date.now()}`;
    const supabase = getSupabase();

    // Build reason from selected services if not explicitly provided
    const resolvedReason = reason ||
      (resolvedMeta?.services?.length > 0
        ? resolvedMeta.services.map((s: any) => s.description || s.name || 'Service').join(', ')
        : null) ||
      'School Fees Payment';

    // Parse term/year from top-level or metadata
    const resolvedTerm = term
      ? parseInt(term)
      : (resolvedMeta?.term ? parseInt(resolvedMeta.term) : null);

    const resolvedYear = year
      ? parseInt(year)
      : (resolvedMeta?.year ? parseInt(resolvedMeta.year) : new Date().getFullYear());

    const now = new Date().toISOString();
    const normalizedStatus = status === 'successful' ? 'success' : (status === 'failed' ? 'failed' : 'success');

    // 1. Insert Transaction with all fields populated
    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .insert({
        school_id,
        parent_id,
        student_id,
        amount: parseFloat(amount),
        service_fee: parseFloat(service_fee || 0),
        status: normalizedStatus,
        payment_method: payment_method || 'mobile_money',
        reference: payloadRef,
        invoice_id: invoice_id || null,
        term: resolvedTerm,
        year: resolvedYear,
        reason: resolvedReason,
        meta_data: resolvedMeta,
        initiated_at: now,
        completed_at: normalizedStatus === 'success' ? now : null,
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // 2. Ledger entry (only on successful payment)
    if (normalizedStatus === 'success') {
      const { data: currentLedger } = await supabase
        .from('ledger_entries')
        .select('balance_after')
        .eq('student_id', student_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastBalance = parseFloat(currentLedger?.balance_after ?? 0);
      const paidAmount = parseFloat(amount) - parseFloat(service_fee || 0);
      const newBalance = Math.max(0, lastBalance - paidAmount);

      const { error: ledgerError } = await supabase.from('ledger_entries').insert({
        student_id,
        school_id,
        parent_id,
        invoice_id: invoice_id || null,
        entry_type: 'payment',
        credit: paidAmount,
        debit: 0,
        balance_after: newBalance,
        reference_table: 'transactions',
        reference_id: txn.transaction_id,
        notes: resolvedReason,
        created_at: now,
      });

      if (ledgerError) {
        console.error('Ledger insert error:', ledgerError);
        // Don't fail the whole request for a ledger error
      }
    }

    return c.json({ success: true, data: txn });

  } catch (error: any) {
    console.error("Payment error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// Fallback
app.all("*", (c) => {
  return c.json({ error: "Route not found", path: c.req.path }, 404);
});

Deno.serve(app.fetch);
