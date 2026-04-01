/**
 * ============================================================
 * RECONCILIATION UTILITIES
 * ============================================================
 *
 * Centralised helpers for the payment reconciliation pipeline.
 * Keeps phone normalisation, metadata sanitisation, and
 * idempotency checks in a single place so every caller stays
 * consistent.
 */

import type { TransactionInput } from '../lib/supabase/api/transactions';

// ─────────────────────────────────────────────────────────────
// 1. PHONE NORMALISATION  (International-aware)
// ─────────────────────────────────────────────────────────────

/** Default country when no country code can be detected. */
const DEFAULT_COUNTRY_CODE = '260'; // Zambia

/**
 * Country-code metadata for generating DB search variants.
 * Add more entries here as the platform expands to new markets.
 */
const COUNTRY_CONFIGS: Record<string, { localPrefix: string; localLength: number }> = {
    '260': { localPrefix: '0', localLength: 10 },  // Zambia        e.g. 0978253506
    '27':  { localPrefix: '0', localLength: 10 },  // South Africa  e.g. 0821234567
    '254': { localPrefix: '0', localLength: 10 },  // Kenya         e.g. 0712345678
    '255': { localPrefix: '0', localLength: 10 },  // Tanzania      e.g. 0712345678
    '263': { localPrefix: '0', localLength: 10 },  // Zimbabwe      e.g. 0771234567
    '44':  { localPrefix: '0', localLength: 11 },  // UK            e.g. 07911123456
    '1':   { localPrefix: '',  localLength: 10 },  // US/Canada     e.g. 2025551234
};

/**
 * Parse any phone string into its constituent parts.
 *
 * Handles:
 *  - E.164:          "+260978253506"  → { cc: '260', local: '0978253506' }
 *  - International:  "260978253506"   → { cc: '260', local: '0978253506' }
 *  - Local (ZM):     "0978253506"     → { cc: '260', local: '0978253506' }
 *  - Bare digits:    "978253506"      → { cc: '260', local: '0978253506' }
 *  - Foreign E.164:  "+447911123456"  → { cc: '44',  local: '07911123456' }
 */
export function parsePhone(raw: string): { countryCode: string; local: string; e164: string } {
    const digits = raw.replace(/\D/g, '');

    // Try to match a known country code (longest match first)
    const sortedCodes = Object.keys(COUNTRY_CONFIGS).sort((a, b) => b.length - a.length);

    for (const cc of sortedCodes) {
        if (digits.startsWith(cc)) {
        const config = COUNTRY_CONFIGS[cc]!;
            const remainder = digits.substring(cc.length);
            const local = remainder.startsWith('0') ? remainder : `${config.localPrefix}${remainder}`;
            return { countryCode: cc, local, e164: `+${cc}${remainder}` };
        }
    }

    // No country code found — assume default (Zambia)
    const cc = DEFAULT_COUNTRY_CODE;
    const config = COUNTRY_CONFIGS[cc]!;
    const local = digits.startsWith('0') ? digits : `${config.localPrefix}${digits}`;
    const bare = local.startsWith('0') ? local.substring(1) : local;
    return { countryCode: cc, local, e164: `+${cc}${bare}` };
}

/**
 * Convert any phone input to the canonical E.164 storage format.
 *
 * This is what should be written to the database going forward.
 * e.g. "0978253506" → "+260978253506"
 *      "+447911123456" → "+447911123456"
 */
export function toE164(raw: string): string {
    return parsePhone(raw).e164;
}

/**
 * Build ALL plausible stored variants for a phone number so we can
 * match against legacy rows that were saved in non-E.164 formats.
 *
 * For Zambian numbers this produces:
 *   "+260978253506", "260978253506", "0978253506", "978253506"
 *
 * For international numbers (e.g. UK) this produces:
 *   "+447911123456", "447911123456", "07911123456"
 *
 * This ensures we always find the parent regardless of how their
 * number was stored historically.
 */
export function phoneVariants(raw: string): string[] {
    const { local, e164 } = parsePhone(raw);
    const set = new Set<string>();

    // Modern canonical form
    set.add(e164);
    // Without the '+' prefix (common storage format)
    set.add(e164.substring(1));
    // Local form (with leading 0 if applicable)
    if (local) set.add(local);
    // Bare national number without leading 0 (legacy Zambian data)
    if (local.startsWith('0')) set.add(local.substring(1));

    return Array.from(set);
}

/**
 * Build a Supabase `.or()` filter string for a phone column,
 * covering all historical storage variants.
 *
 * e.g. phoneOrFilter('phone_number', '+260978253506')
 *      → "phone_number.eq.+260978253506,phone_number.eq.260978253506,..."
 */
export function phoneOrFilter(column: string, raw: string): string {
    return phoneVariants(raw).map(v => `${column}.eq.${v}`).join(',');
}

/**
 * @deprecated Use toE164() for new storage. Kept for backward compatibility.
 */
export function normaliseZambianPhone(raw: string): string {
    return parsePhone(raw).local;
}

// ─────────────────────────────────────────────────────────────
// 2. METADATA SANITIZER
// ─────────────────────────────────────────────────────────────

export interface SanitizedMetadata {
    term: string;           // always a string like "1", "2", "3"
    year: string;           // always a string like "2025"
    grade: string;          // always a string like "Grade 4"
    student_name: string;
    parent_name: string;
    parent_phone: string;
    total_amount: number;
    service_description: string;
    base_amount: number;
    initiated_at: string;   // ISO-8601
    completed_at?: string;  // ISO-8601
    [key: string]: unknown; // allow extra fields to pass through
}

/**
 * Guarantee that all required metadata fields are present and
 * correctly typed before we write a transaction to the DB.
 *
 * Converts numeric term / year to strings, applies fallbacks,
 * and merges any extra ad-hoc fields the caller passes in.
 */
export function sanitizeTransactionMetadata(
    input: Partial<TransactionInput['meta_data']> & {
        term?: string | number;
        year?: string | number;
        grade?: string;
        student_name?: string;
        parent_name?: string;
        parent_phone?: string;
        total_amount?: number;
        service_description?: string;
        base_amount?: number;
        initiated_at?: string;
        completed_at?: string;
    },
    base: Pick<TransactionInput, 'amount' | 'total_amount' | 'initiated_at' | 'completed_at'>
): SanitizedMetadata {
    const currentYear = new Date().getFullYear().toString();

    return {
        term: String(input.term ?? '1'),
        year: String(input.year ?? currentYear),
        grade: input.grade ?? '',
        student_name: input.student_name ?? '',
        parent_name: input.parent_name ?? '',
        parent_phone: input.parent_phone ? toE164(input.parent_phone) : '',
        total_amount: input.total_amount ?? base.total_amount,
        service_description: input.service_description ?? '',
        base_amount: input.base_amount ?? base.amount,
        initiated_at: input.initiated_at ?? base.initiated_at,
        ...(base.completed_at ? { completed_at: base.completed_at } : {}),
        // Spread any additional fields at the end so core fields win
        ...Object.fromEntries(
            Object.entries(input).filter(([k]) =>
                !['term', 'year', 'grade', 'student_name', 'parent_name',
                  'parent_phone', 'total_amount', 'service_description',
                  'base_amount', 'initiated_at', 'completed_at'].includes(k)
            )
        ),
    };
}

// ─────────────────────────────────────────────────────────────
// 3. IDEMPOTENCY HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Check whether a transaction with the given reference already
 * exists in Supabase.  Used by the offline queue manager to
 * avoid double-inserts when connectivity is intermittent.
 *
 * Returns the existing row's ID if found, otherwise null.
 */
export async function findExistingTransaction(
    supabase: any,
    reference: string
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference', reference)
            .maybeSingle();

        if (error || !data) return null;
        return data.id as string;
    } catch {
        return null;
    }
}

/**
 * Generate a collision-resistant reference number for a
 * transaction if one hasn't been assigned yet.
 *
 * Format: MFP-<YYYYMMDD>-<6 random HEX chars>
 * e.g.    MFP-20250317-a3f9c1
 */
export function generateTransactionReference(): string {
    const date = new Date();
    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('');
    const rand = Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');
    return `MFP-${datePart}-${rand}`;
}
