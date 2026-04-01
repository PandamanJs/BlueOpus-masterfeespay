import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function serveHttp(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const body = await req.json();
        const school_id = body.school_id;

        if (!school_id) {
            throw new Error("Missing school_id");
        }

        // 1. Fetch School Details
        const { data: school, error: schoolError } = await supabase
            .from('schools')
            .select('school_name, qbo_refresh_token, qbo_realm_id, qbo_access_token')
            .eq('school_id', school_id)
            .single();

        if (schoolError || !school) {
            throw new Error(`School not found: ${schoolError?.message}`);
        }

        // 2. Check if School is connected to QBO
        if (!school.qbo_refresh_token || !school.qbo_realm_id) {
            return new Response(JSON.stringify({
                error: "School not connected to QuickBooks",
                school_name: school.school_name,
                has_refresh_token: !!school.qbo_refresh_token,
                has_realm_id: !!school.qbo_realm_id
            }), {
                status: 400,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // 3. Get Fresh Access Token
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
            return new Response(JSON.stringify({
                error: "Failed to refresh QBO token",
                details: tokenData,
                school_name: school.school_name
            }), {
                status: 401,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        const newAccessToken = tokenData.access_token;
        const newRefreshToken = tokenData.refresh_token;

        // 4. Update Database with new tokens
        await supabase
            .from('schools')
            .update({
                qbo_access_token: newAccessToken,
                qbo_refresh_token: newRefreshToken,
                qbo_connected_at: new Date().toISOString()
            })
            .eq('school_id', school_id);

        // 5. STEP 1 — Basic Connection Test: Fetch Company Info
        const companyInfoUrl = `${qboBaseUrl}/v3/company/${school.qbo_realm_id}/companyinfo/${school.qbo_realm_id}?minorversion=65`;

        const companyInfoResponse = await fetch(companyInfoUrl, {
            headers: {
                "Authorization": `Bearer ${newAccessToken}`,
                "Accept": "application/json"
            }
        });

        const companyInfoData = await companyInfoResponse.json();

        if (!companyInfoResponse.ok) {
            console.error("QBO Company Info Failed:", companyInfoData);
            return new Response(JSON.stringify({
                error: "Failed to fetch company info",
                status: companyInfoResponse.status,
                details: companyInfoData,
                realm_id: school.qbo_realm_id,
                school_name: school.school_name
            }), {
                status: companyInfoResponse.status,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            });
        }

        // ✅ SUCCESS - Connection is good!
        return new Response(JSON.stringify({
            success: true,
            message: "✅ QuickBooks connection verified!",
            school_name: school.school_name,
            realm_id: school.qbo_realm_id,
            company_info: {
                company_name: companyInfoData.CompanyInfo?.CompanyName,
                legal_name: companyInfoData.CompanyInfo?.LegalName,
                country: companyInfoData.CompanyInfo?.Country,
                email: companyInfoData.CompanyInfo?.Email?.Address
            },
            token_refreshed: true,
            base_url: qboBaseUrl
        }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("QuickBooks Test Error:", error);
        return new Response(JSON.stringify({
            error: error.message || "Unknown Error",
            stack: error.stack
        }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }
}
