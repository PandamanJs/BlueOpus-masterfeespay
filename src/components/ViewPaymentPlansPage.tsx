import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getInstitutionType } from "../data/students";
import { getPoliciesBySchool } from "../lib/supabase/api/policies";
import { getSchools } from "../lib/supabase/api/schools";
import type { Policy } from "../types";
import { getSchoolByName } from "../lib/supabase/api/schools";
import LogoHeader from "./common/LogoHeader";

interface PaymentPlan extends Policy { }

interface ViewPaymentPlansPageProps {
  onBack: () => void;
  schoolName: string;
}

// ── Compute current academic term dynamically ──────────────────────────────
// Zambian calendar: Term 1 = Jan–Apr, Term 2 = May–Aug, Term 3 = Sep–Dec
function getCurrentTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const term = month <= 4 ? 1 : month <= 8 ? 2 : 3;
  const ranges = ["", "January – April", "May – August", "September – December"];
  return { term, year, label: ranges[term] };
}

// ── Plan type icon ────────────────────────────────────────────────────────────
function PlanIcon({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", padding: 3
      }}>
        <img src={logo} alt="Plan Icon" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    );
  }

  const n = (name || "").toLowerCase();
  const isInstallment = n.includes("install") || n.includes("monthly") || n.includes("term");
  const isCredit = n.includes("credit") || n.includes("loan") || n.includes("facility");

  const [bg1, bg2] = isCredit ? ["#1a1c2b", "#1e2035"]
    : isInstallment ? ["#1c2b1a", "#223320"]
      : ["#1a2b28", "#1e3530"];

  return (
    <div style={{
      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
      background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
    }}>
      {isCredit ? (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="#95e36c" strokeWidth={1.7} />
          <path d="M2 10h20" stroke="#95e36c" strokeWidth={1.7} />
          <circle cx="7" cy="15" r="1.5" fill="#95e36c" />
        </svg>
      ) : isInstallment ? (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="#95e36c" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      ) : (
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#95e36c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px", borderRadius: 6,
      background: accent ? "rgba(149,227,108,0.15)" : "rgba(0,0,0,0.05)",
      border: `0.5px solid ${accent ? "rgba(149,227,108,0.4)" : "rgba(0,0,0,0.08)"}`,
      fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
      fontWeight: 500, fontSize: 10, letterSpacing: "0.04em",
      color: accent ? "#003630" : "#6b7280",
      textTransform: "uppercase" as const,
    }}>
      {label}
    </span>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: 1, padding: "12px 14px", borderRadius: 12,
      background: "#f2f2f7", border: "0.5px solid rgba(0,0,0,0.06)",
    }}>
      <p style={{
        margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
        fontWeight: 400, fontSize: 10, color: "#8e8e93",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
      }}>{label}</p>
      <p style={{
        margin: 0, fontFamily: '-apple-system,"SF Pro Display","Inter",sans-serif',
        fontWeight: 700, fontSize: 18, color: "#003630", letterSpacing: -0.5, lineHeight: 1,
      }}>{value}</p>
    </div>
  );
}

// ── Info row (label / value) ──────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0" }}>
      <p style={{
        margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
        fontWeight: 400, fontSize: 13, color: "#8e8e93",
      }}>{label}</p>
      <p style={{
        margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
        fontWeight: 500, fontSize: 13, color: "#111",
      }}>{value}</p>
    </div>
  );
}

// ── Payment Plan Card ─────────────────────────────────────────────────────────
function PaymentPlanCard({ plan, index, logo }: { plan: PaymentPlan; index: number; logo?: string | null }) {
  const [expanded, setExpanded] = useState(false);

  const freq = plan.frequency === "one-time" ? "One-Off" : `Per ${plan.frequency}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: "#fff", borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.05)",
        border: "0.5px solid rgba(0,0,0,0.07)",
      }}
    >
      {/* Card header */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <PlanIcon name={plan.name} logo={logo} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <p style={{
                margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                fontWeight: 700, fontSize: 15, color: "#111", letterSpacing: -0.3,
              }}>{plan.name}</p>
              <Chip label={plan.plan_code || freq} accent />
            </div>
            <p style={{
              margin: "4px 0 0", fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 400, fontSize: 12, color: "#8e8e93", lineHeight: 1.5,
            }}>{plan.description}</p>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ padding: "14px 16px", display: "flex", gap: 10 }}>
        <StatTile label="Total" value={`K${(plan.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <StatTile label={freq} value={`K${(plan.per_installment ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
      </div>

      {/* Schedule rows */}
      <div style={{ margin: "0 16px", borderRadius: 12, background: "#f9fbf9", border: "0.5px solid rgba(149,227,108,0.25)", overflow: "hidden" }}>
        {[
          { label: "Installments", value: `${plan.installments ?? 1} payment${(plan.installments ?? 1) > 1 ? "s" : ""}` },
          { label: "Frequency", value: plan.frequency === "one-time" ? "Full Payment Once" : `Every ${plan.frequency}` },
          { label: "Effective", value: plan.effective_date ?? "—" },
          { label: "Due Date", value: plan.due_date ?? "—" },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ padding: "0 14px", borderBottom: i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
            <InfoRow label={row.label} value={row.value} />
          </div>
        ))}
      </div>

      {/* Terms accordion */}
      {plan.terms && plan.terms.length > 0 && (
        <div style={{ padding: "12px 16px 16px" }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%", padding: "10px 0",
              background: "none", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "pointer",
            }}
          >
            <p style={{
              margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 500, fontSize: 12.5, color: "#003630",
            }}>
              {expanded ? "Hide Terms & Conditions" : "View Terms & Conditions"}
            </p>
            <motion.svg
              width={14} height={14} viewBox="0 0 16 16" fill="none"
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <path d="M4 6l4 4 4-4" stroke="#003630" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </motion.button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  padding: "14px", borderRadius: 12,
                  background: "#f2f2f7", border: "0.5px solid rgba(0,0,0,0.06)",
                }}>
                  <p style={{
                    margin: "0 0 10px", fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                    fontWeight: 600, fontSize: 11, color: "#003630",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>Terms & Conditions</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {plan.terms.map((term: string, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          marginTop: 5, flexShrink: 0,
                          width: 5, height: 5, borderRadius: "50%", background: "#95e36c",
                        }} />
                        <p style={{
                          margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                          fontWeight: 400, fontSize: 12, color: "#444", lineHeight: 1.6, flex: 1,
                        }}>{term}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: 16, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "0.5px solid rgba(0,0,0,0.06)",
    }}>
      {[80, 120, 44].map((w, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
          style={{
            height: i === 0 ? 16 : i === 1 ? 12 : 36,
            width: `${w}%`, borderRadius: 8,
            background: "#e5e5ea", marginTop: i > 0 ? 12 : 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ViewPaymentPlansPage({ onBack, schoolName }: ViewPaymentPlansPageProps) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const institutionType = getInstitutionType(schoolName);
  const isUniversity = institutionType === "university";

  // Dynamic term from today's date – never hardcoded



  useEffect(() => {
    async function fetchPolicies() {
      try {
        setLoading(true);
        const school = await getSchoolByName(schoolName);
        if (!school) return;

        const category = isUniversity ? "credit_facility" : "payment_plan";
        const data = await getPoliciesBySchool(String(school.id), category);
        setPlans(data as PaymentPlan[]);
      } catch (e) {
        console.error("Error fetching policies:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, [isUniversity, schoolName]);

  // ── Fetch real school contact details ─────────────────────────────────────
  const [schoolContact, setSchoolContact] = useState<{ email?: string; phone?: string; logo?: string }>({});
  useEffect(() => {
    getSchools().then(schools => {
      const match = schools.find(s =>
        s.name?.toLowerCase().trim() === schoolName.toLowerCase().trim()
      );
      if (match) setSchoolContact({ email: match.email, phone: match.phone, logo: match.logo || undefined });
    }).catch(() => {/* fail silently */ });
  }, [schoolName]);


  return (
    <div style={{ minHeight: "100dvh", width: "100%", backgroundColor: "#f2f2f7", display: "flex", flexDirection: "column" }}>

      {/* LogoHeader removed for premium immersion */}

      {/* ── Redesigned Hero Banner (History Page Style) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          width: '100%',
          background: '#003630',
          backgroundImage: 'url("/receivables-card-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '260px',
          borderBottomLeftRadius: '32px',
          borderBottomRightRadius: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 54, 48, 0.2)'
        }}
      >
        {/* Decorative glass overlay */}
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]" />

        {/* Floating back button removed for cleaner aesthetic as per user request */}

        {/* Main Content with Spacing matching History Page */}
        <div 
          className="relative z-10 px-8 flex flex-col items-center text-center"
          style={{ paddingTop: '100px' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[#95e36c] text-[13px] uppercase tracking-[0.2em] mb-3 opacity-90">
              Available Facilities
            </p>
            <h2 className="font-['Agrandir:Grand_Heavy',sans-serif] text-[36px] text-white tracking-[-1px] leading-[1.1]">
              {isUniversity ? "Flexible Credit" : "Payment"}<br />
              <span className="text-[#95e36c]">
                {isUniversity ? "Facilities" : "Plans"}
              </span>
            </h2>
          </motion.div>
        </div>

        {/* Bottom subtle accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-gradient-to-r from-transparent via-[#95e36c]/30 to-transparent" />
      </motion.div>


      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, padding: "20px 16px 40px", maxWidth: 600, margin: "0 auto", width: "100%" }}>


        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <p style={{
            margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
            fontWeight: 600, fontSize: 13, color: "#8e8e93",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            Available Plans
          </p>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
          {!loading && (
            <p style={{
              margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 500, fontSize: 12, color: "#c7c7cc",
            }}>{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Plan cards */}
        {!loading && plans.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {plans.map((plan, index) => (
              // Plans carry their own total_amount / per_installment from the DB
              <PaymentPlanCard key={`${plan.policy_id}-${index}`} plan={plan} index={index} logo={schoolContact.logo} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && plans.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#fff", borderRadius: 18, padding: "48px 24px",
              textAlign: "center", border: "0.5px solid rgba(0,0,0,0.07)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "#f2f2f7", margin: "0 auto 14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", border: schoolContact.logo ? "1px solid rgba(0,0,0,0.06)" : "none",
            }}>
              {schoolContact.logo ? (
                <img src={schoolContact.logo} alt={schoolName} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff" }} />
              ) : (
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#8e8e93" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p style={{
              margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 600, fontSize: 15, color: "#111",
            }}>No Plans Available</p>
            <p style={{
              margin: "6px 0 0", fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 400, fontSize: 13, color: "#8e8e93",
            }}>No active {isUniversity ? "credit facilities" : "payment plans"} found.</p>
          </motion.div>
        )}

        {/* Contact footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 28, padding: "14px 16px", borderRadius: 14,
            background: "#fff", border: "0.5px solid rgba(0,0,0,0.07)",
            display: "flex", alignItems: "flex-start", gap: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "rgba(0,54,48,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#003630" strokeWidth={1.8} />
              <path d="M12 8v4M12 16h.01" stroke="#003630" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p style={{
              margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 600, fontSize: 13, color: "#111", marginBottom: 3,
            }}>
              {isUniversity ? "Student Financial Services" : "Bursar's Office"}
            </p>
            {(schoolContact.email || schoolContact.phone) ? (
              <>
                {schoolContact.email && (
                  <p style={{
                    margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                    fontWeight: 400, fontSize: 12, color: "#8e8e93", lineHeight: 1.6,
                  }}>
                    {schoolContact.email}
                  </p>
                )}
                {schoolContact.phone && (
                  <p style={{
                    margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                    fontWeight: 400, fontSize: 12, color: "#8e8e93", lineHeight: 1.6,
                  }}>
                    {schoolContact.phone}
                  </p>
                )}
              </>
            ) : (
              <p style={{
                margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                fontWeight: 400, fontSize: 12, color: "#c7c7cc", lineHeight: 1.5,
              }}>Contact details not available</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
