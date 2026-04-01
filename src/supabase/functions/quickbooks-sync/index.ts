import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Rate Limit Helper ---
async function fetchWithBackoff(url: string, options: any, maxRetries = 3) {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
        const res = await fetch(url, options);
        if (res.status === 429) {
            console.warn(`Rate limited (429). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
        }
        return res;
    }
    throw new Error(`Failed after ${maxRetries} retries due to rate limiting or errors.`);
}

export async function serveHttp(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS });
    }

    let supabase: any;
    let transaction_id: string | undefined;

    try {
        supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const body = await req.json();
        transaction_id = body.transaction_id;

        if (!transaction_id) {
            throw new Error("Missing transaction_id");
        }

        // 1. Fetch Transaction + School Details
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select(`
        *,
        schools:school_id (
          school_name,
          qbo_refresh_token,
          qbo_realm_id,
          qbo_access_token
        ),
        parents:parent_id (
          first_name,
          last_name,
          email,
          phone_number
        ),
        students:student_id (
          first_name,
          last_name,
          admission_number
        )
      `)
            .eq('id', transaction_id)
            .single();

        if (txError || !transaction) {
            throw new Error(`Transaction not found: ${txError?.message}`);
        }

        // --- 1a. Improved Sync Lock Guard with Retry Logic ---
        const SYNC_TIMEOUT_MINUTES = 5;
        const syncAttemptTime = transaction.qbo_last_sync_attempt ? new Date(transaction.qbo_last_sync_attempt) : null;
        const isStuck = syncAttemptTime && ((Date.now() - syncAttemptTime.getTime()) / 1000 / 60) > SYNC_TIMEOUT_MINUTES;

        // If already successfully synced with a payment ID, skip
        if (transaction.qbo_sync_status === 'completed' && transaction.qb_payment_id) {
            console.log(`Transaction ${transaction.reference} already synced (Payment ID: ${transaction.qb_payment_id})`);
            return new Response(JSON.stringify({
                success: true,
                message: `Already synced`,
                payment_id: transaction.qb_payment_id,
                invoice_id: transaction.qb_invoice_id
            }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // If currently syncing and not stuck, skip
        if (transaction.qbo_sync_status === 'syncing' && !isStuck) {
            console.log(`Transaction ${transaction.reference} currently syncing (started ${syncAttemptTime?.toISOString()})`);
            return new Response(JSON.stringify({
                message: `Currently syncing (started ${syncAttemptTime?.toISOString()})`
            }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // If stuck in syncing, log and retry
        if (isStuck) {
            console.warn(`Transaction ${transaction_id} stuck in syncing for ${SYNC_TIMEOUT_MINUTES}+ minutes. Retrying...`);
        }

        // Set status to syncing (Atomic-ish lock)
        await supabase
            .from('transactions')
            .update({
                qbo_sync_status: 'syncing',
                qbo_last_sync_attempt: new Date().toISOString(),
                qbo_sync_error: null // Clear previous errors on retry
            })
            .eq('id', transaction_id);

        const school = transaction.schools;

        // 2. Check if School is connected to QBO
        if (!school?.qbo_refresh_token || !school?.qbo_realm_id) {
            const errorMsg = `School "${school?.school_name}" is not connected to QuickBooks. Missing ${!school?.qbo_refresh_token ? 'refresh_token' : ''} ${!school?.qbo_realm_id ? 'realm_id' : ''}`.trim();
            console.error(errorMsg);

            // Mark transaction as error so it can be retried after school connects
            await supabase
                .from('transactions')
                .update({
                    qbo_sync_status: 'error',
                    qbo_sync_error: errorMsg
                })
                .eq('id', transaction_id);

            return new Response(JSON.stringify({
                error: errorMsg,
                school_name: school?.school_name,
                has_refresh_token: !!school?.qbo_refresh_token,
                has_realm_id: !!school?.qbo_realm_id
            }), {
                status: 400,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // 3. Refresh Access Token (Always refresh to be safe or check expiry if we stored it)
        // For simplicity, we'll try to use the refresh token to get a fresh access token every time
        // In production, you might optimize this to reuse valid access tokens.

        const clientId = Deno.env.get("QBO_CLIENT_ID");
        const clientSecret = Deno.env.get("QBO_CLIENT_SECRET");
        const isSandbox = false; // PRODUCTION
        const qboBaseUrl = isSandbox
            ? "https://sandbox-quickbooks.api.intuit.com"
            : "https://quickbooks.api.intuit.com";

        if (!clientId || !clientSecret) {
            throw new Error("Missing QBO_CLIENT_ID or QBO_CLIENT_SECRET env vars");
        }

        // Encode Basic Auth
        const basicAuth = btoa(`${clientId}:${clientSecret}`);

        const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${basicAuth}`,
                "Accept": "application/json"
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: school.qbo_refresh_token
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("QBO Token Refresh Failed:", tokenData);
            throw new Error("Failed to refresh QBO token");
        }

        const newAccessToken = tokenData.access_token;
        const newRefreshToken = tokenData.refresh_token;

        // 4. Update Database with new tokens
        await supabase
            .from('schools')
            .update({
                qbo_access_token: newAccessToken,
                qbo_refresh_token: newRefreshToken, // Rotate refresh token
                qbo_connected_at: new Date().toISOString()
            })
            .eq('school_id', transaction.school_id);


        // 5. Sync to QBO
        // 5a. Find or Create Customer
        const parentName = `${transaction.parents?.first_name} ${transaction.parents?.last_name}`.trim() || "Unknown Parent";
        const parentEmail = transaction.parents?.email || "no-email@example.com";

        let customerId = await findCustomer(qboBaseUrl, school.qbo_realm_id, newAccessToken, parentName);

        if (!customerId) {
            customerId = await createCustomer(qboBaseUrl, school.qbo_realm_id, newAccessToken, parentName, parentEmail);
        }

        // --- Idempotency Guardrails ---
        const refNumber = transaction.reference;

        // 1. Check if Payment already exists
        const existingPayment = await findPayment(qboBaseUrl, school.qbo_realm_id, newAccessToken, refNumber);
        if (existingPayment) {
            console.log(`Payment for transaction ${refNumber} already exists. Skipping.`);
            return new Response(JSON.stringify({
                success: true,
                message: "Skipped: Payment already exists",
                payment_id: existingPayment.Id
            }), {
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // 2. Check if Invoice already exists
        let invoiceId: string;
        const existingInvoice = await findInvoice(qboBaseUrl, school.qbo_realm_id, newAccessToken, refNumber);

        if (existingInvoice) {
            console.log(`Invoice for transaction ${refNumber} already exists. Proceeding to payment retry.`);
            invoiceId = existingInvoice.Id;
        } else {
            // 5b. Create Invoice
            const studentName = transaction.students ? `${transaction.students.first_name} ${transaction.students.last_name}` : "Unknown Student";
            const serviceList = transaction.meta_data?.services?.map((s: any) => s.description).join(', ') || "Full Fees payment";

            // Find the "School Fees" service item
            const schoolFeesItemId = await findServiceItem(qboBaseUrl, school.qbo_realm_id, newAccessToken, "School Fees");

            const invoice = await createInvoice(qboBaseUrl, school.qbo_realm_id, newAccessToken, {
                customerId,
                amount: transaction.amount,
                serviceFee: transaction.service_fee,
                refNumber,
                description: `Student: ${studentName}. Services: ${serviceList}`,
                serviceItemId: schoolFeesItemId,
            });
            invoiceId = invoice.Id;
        }

        // 5c. Find Deposit Account (Master-fees)
        const depositAccountId = await findAccount(qboBaseUrl, school.qbo_realm_id, newAccessToken, "Master-fees", "02152802");

        // 5d. Find Payment Method
        const rawMethod = transaction.meta_data?.payment_method || transaction.payment_method || "mobile_money";
        const methodName = rawMethod === 'card' ? 'Credit Card' :
            rawMethod === 'mobile_money' ? 'Mobile Money' : 'Other';
        const paymentMethodId = await findPaymentMethod(qboBaseUrl, school.qbo_realm_id, newAccessToken, methodName);

        // 5e. Create Linked Payment
        const studentName = transaction.students ? `${transaction.students.first_name} ${transaction.students.last_name}` : "Unknown Student";
        const payment = await createPayment(qboBaseUrl, school.qbo_realm_id, newAccessToken, {
            customerId,
            invoiceId,
            depositAccountId,
            paymentMethodId,
            amount: transaction.total_amount, // Use total amount paid for the payment
            refNumber,
            txnDate: new Date(transaction.created_at).toISOString().split('T')[0],
            note: `Student: ${studentName}. Reference: ${transaction.reference} via Master-Fees`
        });

        // --- 6. Post-Sync Verification & Logging ---

        // 6a. Verify Invoice Balance is 0
        const verifiedInvoice = await findInvoice(qboBaseUrl, school.qbo_realm_id, newAccessToken, refNumber);
        const balance = verifiedInvoice?.Balance ?? 1; // Default to non-zero if not found

        if (balance !== 0) {
            console.error(`Post-Sync Verification Failed: Invoice ${invoiceId} has remaining balance ${balance}`);
            // Update status but keep IDs for debugging
            await supabase
                .from('transactions')
                .update({
                    qbo_sync_status: 'error',
                    qbo_sync_error: `Verification mismatch: Balance ${balance} is not 0`,
                    qb_invoice_id: invoiceId,
                    qb_payment_id: payment.Id,
                    qb_customer_id: customerId
                })
                .eq('id', transaction_id);

            throw new Error(`Verification failed: Invoice ${invoiceId} not fully paid in QBO.`);
        }

        // 6b. Permanent Logging of IDs
        await supabase
            .from('transactions')
            .update({
                qbo_sync_status: 'completed',
                qb_invoice_id: invoiceId,
                qb_payment_id: payment.Id,
                qb_customer_id: customerId,
                qbo_synced_at: new Date().toISOString()
            })
            .eq('id', transaction_id);

        return new Response(JSON.stringify({
            success: true,
            invoice_id: invoiceId,
            payment_id: payment.Id,
            deposit_account_found: !!depositAccountId,
            retried: !!existingInvoice
        }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("QuickBooks Sync Error:", error);

        // Attempt to log the error to the transaction
        if (typeof transaction_id !== 'undefined') {
            await supabase
                .from('transactions')
                .update({
                    qbo_sync_status: 'error',
                    qbo_sync_error: error.message
                })
                .eq('id', transaction_id);
        }

        return new Response(JSON.stringify({ error: error.message || "Unknown Error" }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }
}

// --- Helpers ---

async function findAccount(baseUrl: string, realmId: string, token: string, name: string, accountNumber: string) {
    const query = `select * from Account where Name = '${name.replace(/'/g, "\\'")}' or AcctNum = '${accountNumber.replace(/'/g, "\\'")}'`;
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const res = await fetchWithBackoff(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const data = await res.json();
    if (data.QueryResponse && data.QueryResponse.Account && data.QueryResponse.Account.length > 0) {
        return data.QueryResponse.Account[0].Id;
    }
    return null;
}

async function findInvoice(baseUrl: string, realmId: string, token: string, refNumber: string) {
    const query = `select * from Invoice where DocNumber = '${refNumber.replace(/'/g, "\\'")}'`;
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const res = await fetchWithBackoff(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const data = await res.json();
    if (data.QueryResponse && data.QueryResponse.Invoice && data.QueryResponse.Invoice.length > 0) {
        return data.QueryResponse.Invoice[0];
    }
    return null;
}

async function findPayment(baseUrl: string, realmId: string, token: string, refNumber: string) {
    const query = `select * from Payment where PaymentRefNum = '${refNumber.replace(/'/g, "\\'")}'`;
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const res = await fetchWithBackoff(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const data = await res.json();
    if (data.QueryResponse && data.QueryResponse.Payment && data.QueryResponse.Payment.length > 0) {
        return data.QueryResponse.Payment[0];
    }
    return null;
}

async function findPaymentMethod(baseUrl: string, realmId: string, token: string, name: string) {
    const query = `select * from PaymentMethod where Name = '${name.replace(/'/g, "\\'")}'`;
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const res = await fetchWithBackoff(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const data = await res.json();
    if (data.QueryResponse && data.QueryResponse.PaymentMethod && data.QueryResponse.PaymentMethod.length > 0) {
        return data.QueryResponse.PaymentMethod[0].Id;
    }
    return null;
}

async function findServiceItem(baseUrl: string, realmId: string, token: string, name: string) {
    const query = `select * from Item where Name = '${name.replace(/'/g, "\\'")}'`;
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const res = await fetchWithBackoff(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const data = await res.json();
    if (data.QueryResponse && data.QueryResponse.Item && data.QueryResponse.Item.length > 0) {
        return data.QueryResponse.Item[0].Id;
    }
    // Fallback to ID "1" if not found
    console.warn(`Service item "${name}" not found in QuickBooks. Using fallback ID "1"`);
    return "1";
}


async function findCustomer(baseUrl: string, realmId: string, token: string, name: string) {
    const query = `select * from Customer where DisplayName = '${name.replace(/'/g, "\\'")}'`;
    const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

    const res = await fetchWithBackoff(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const data = await res.json();
    if (data.QueryResponse && data.QueryResponse.Customer && data.QueryResponse.Customer.length > 0) {
        return data.QueryResponse.Customer[0].Id;
    }
    return null;
}

async function createCustomer(baseUrl: string, realmId: string, token: string, name: string, email: string) {
    const url = `${baseUrl}/v3/company/${realmId}/customer?minorversion=65`;

    const res = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            DisplayName: name,
            PrimaryEmailAddr: { Address: email }
        })
    });

    const data = await res.json();
    if (data.Fault) {
        throw new Error(`QBO Create Customer Failed: ${JSON.stringify(data.Fault)}`);
    }
    return data.Customer.Id;
}

async function createInvoice(baseUrl: string, realmId: string, token: string, data: any) {
    const url = `${baseUrl}/v3/company/${realmId}/invoice?minorversion=65`;

    const lines = [];

    // Line 1: School Fees
    lines.push({
        Amount: data.amount,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
            ItemRef: { value: data.serviceItemId || "1", name: "School Fees" },
            Qty: 1
        },
        Description: data.description
    });

    // Line 2: Service Fee (if applicable)
    if (data.serviceFee > 0) {
        lines.push({
            Amount: data.serviceFee,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
                ItemRef: { value: data.serviceItemId || "1", name: "School Fees" },
                Qty: 1
            },
            Description: "Platform Transaction Fee"
        });
    }

    const payload = {
        CustomerRef: { value: data.customerId },
        Line: lines,
        TotalAmt: data.amount + (data.serviceFee || 0),
        DocNumber: data.refNumber
    };

    const res = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (body.Fault) {
        throw new Error(`QBO Create Invoice Failed: ${JSON.stringify(body.Fault)}`);
    }
    return body.Invoice;
}

async function createPayment(baseUrl: string, realmId: string, token: string, data: any) {
    const url = `${baseUrl}/v3/company/${realmId}/payment?minorversion=65`;

    const payload: any = {
        CustomerRef: { value: data.customerId },
        TotalAmt: data.amount,
        TxnDate: data.txnDate,
        PaymentRefNum: data.refNumber,
        PrivateNote: data.note,
        Line: [
            {
                Amount: data.amount,
                LinkedTxn: [
                    {
                        TxnId: data.invoiceId,
                        TxnType: "Invoice"
                    }
                ]
            }
        ]
    };

    if (data.depositAccountId) {
        payload.DepositToAccountRef = { value: data.depositAccountId };
    }

    if (data.paymentMethodId) {
        payload.PaymentMethodRef = { value: data.paymentMethodId };
    }

    const res = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (body.Fault) {
        throw new Error(`QBO Create Payment Failed: ${JSON.stringify(body.Fault)}`);
    }
    return body.Payment;
}
