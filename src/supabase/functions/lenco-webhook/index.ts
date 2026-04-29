import { createClient } from "jsr:@supabase/supabase-js@2";

export async function serveHttp(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();

  const signature = req.headers.get('x-lenco-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  // 1. Get all schools with their secret keys
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('lenco_secret_key, school_name')
    .not('lenco_secret_key', 'is', null);

  if (schoolsError || !schools) {
    console.error('Failed to fetch school configuration', schoolsError);
    return new Response('Server Configuration Error', { status: 500 });
  }

  // 2. Try to verify signature against ANY of the schools
  let isValidSignature = false;
  let matchingSchoolName = null;

  for (const school of schools) {
    const secretKey = school.lenco_secret_key;
    if (!secretKey) continue;

    const webhookHashKey = new TextEncoder().encode(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secretKey))
    );
    const hash = await crypto.subtle.digest('SHA-512', new Uint8Array([
      ...webhookHashKey,
      ...new TextEncoder().encode(body)
    ]));
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === signature.toLowerCase()) {
      isValidSignature = true;
      matchingSchoolName = school.school_name;
      break;
    }
  }

  // Fallback to global ENV key if set (for backward compatibility or single-tenant setups)
  if (!isValidSignature) {
    const globalSecret = Deno.env.get('LENCO_SECRET_KEY');
    if (globalSecret) {
      const webhookHashKey = new TextEncoder().encode(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(globalSecret))
      );
      const hash = await crypto.subtle.digest('SHA-512', new Uint8Array([
        ...webhookHashKey,
        ...new TextEncoder().encode(body)
      ]));
      const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (hashHex === signature.toLowerCase()) {
        isValidSignature = true;
        matchingSchoolName = "Global Config";
      }
    }
  }

  if (!isValidSignature) {
    console.warn('Received webhook with invalid signature');
    return new Response('Invalid signature', { status: 401 });
  }

  console.log(`Webhook verified for school: ${matchingSchoolName}`);

  const event = JSON.parse(body);

  try {
    if (event.event === 'transaction.successful') {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'success', completed_at: new Date().toISOString() })
        .eq('reference', event.data.transactionReference);

      if (error) throw error;

      // --- Trigger QuickBooks Sync ---
      try {
        console.log(`Triggering QBO sync for transaction ${event.data.transactionReference}`);
        // We need the ID we just updated. 
        // Ideally we select it back or use the reference to lookup in the sync fx.
        // But the sync function expects 'transaction_id'.
        // Let's first fetch the ID for this reference.
        const { data: tx } = await supabase
          .from('transactions')
          .select('id')
          .eq('reference', event.data.transactionReference)
          .single();

        if (tx) {
          const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/quickbooks-sync`;
          // Fire and forget (don't await response to keep webhook fast)
          fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ transaction_id: tx.id })
          }).catch(err => console.error("QBO Sync Launch Error:", err));
        }
      } catch (e) {
        console.error("Failed to initiate QBO sync", e);
      }
      // -------------------------------
    } else if (event.event === 'transaction.failed') {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'failed', failed_at: new Date().toISOString() })
        .eq('reference', event.data.transactionReference);

      if (error) throw error;
    } else {
      return new Response('Event not handled', { status: 200 });
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    return new Response('Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
