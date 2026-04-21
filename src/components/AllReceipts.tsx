import { useState } from "react";
import { motion } from "motion/react";

import { generateReceiptPDF } from "../utils/pdfGenerator";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import LogoHeader from "./common/LogoHeader";

export interface PaymentData {
  date: string;
  day: string;
  title: string;
  subtitle: string;
  amount: string;
}

interface AllReceiptsProps {
  onBack: () => void;
  studentName?: string;
  studentId?: string;
  studentGrade?: string;
  parentName?: string;
  paymentData?: Record<string, PaymentData[]>;
}

// ─── Logo ────────────────────────────────────────────────────────────────────


// ─── Service icon by keyword ─────────────────────────────────────────────────
function ServiceIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  const isTuition = t.includes("tuition") || t.includes("school fees") || t.includes("fees");
  const isCanteen = t.includes("canteen") || t.includes("lunch") || t.includes("meal");
  const isTransport = t.includes("transport") || t.includes("bus") || t.includes("zone");
  const isUniform = t.includes("uniform") || t.includes("jersey") || t.includes("tracksuit");

  const bg = isTuition ? ["#1c1c1e", "#2c2c2e"]
    : isCanteen ? ["#1c2b1a", "#223320"]
      : isTransport ? ["#1a1c2b", "#1e2035"]
        : isUniform ? ["#2b1a1c", "#352024"]
          : ["#1c1c1e", "#2c2c2e"];

  return (
    <div style={{
      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
      background: `linear-gradient(135deg, ${bg[0]}, ${bg[1]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    }}>
      {isTuition ? (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <path d="M12 14l9-5-9-5-9 5 9 5z" stroke="#95e36c" strokeWidth={1.8} strokeLinejoin="round" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke="#95e36c" strokeWidth={1.8} strokeLinejoin="round" />
        </svg>
      ) : isCanteen ? (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <path d="M3 2l1.5 8.5M3 2h18M21 2l-1.5 8.5M4.5 10.5A7.5 7.5 0 0012 18a7.5 7.5 0 007.5-7.5" stroke="#95e36c" strokeWidth={1.8} strokeLinecap="round" />
          <path d="M12 18v4M8 22h8" stroke="#95e36c" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      ) : isTransport ? (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="7" width="20" height="13" rx="2" stroke="#95e36c" strokeWidth={1.8} />
          <path d="M16 20v2M8 20v2M2 11h20" stroke="#95e36c" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx="7" cy="16" r="1.5" fill="#95e36c" />
          <circle cx="17" cy="16" r="1.5" fill="#95e36c" />
          <path d="M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2" stroke="#95e36c" strokeWidth={1.8} />
        </svg>
      ) : (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#95e36c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}



function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      padding: "10px 24px",
    }}>
      <p style={{
        margin: 0, fontFamily: '-apple-system,"SF Pro Display","Inter",sans-serif',
        fontWeight: 700, fontSize: 22, color: "#fff", letterSpacing: -0.8, lineHeight: 1,
      }}>{value}</p>
      <p style={{
        margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
        fontWeight: 500, fontSize: 10, color: "rgba(255,255,255,0.72)",
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>{label}</p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AllReceipts({
  onBack,
  studentName = "Unknown Student",
  studentId = "",
  studentGrade = "Class Not Specified",
  parentName = "Valued Parent",
  paymentData = {},
}: AllReceiptsProps) {
  const schoolName = "Twalumbu Education Centre";

  const getMonthName = (monthKey: string) => {
    const parts = monthKey.split("-");
    const year = parts[0] ?? "";
    const month = parts[1] ?? "1";
    const names = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return { month: names[parseInt(month) - 1] ?? "Month", year };
  };

  const sortedMonthKeys = Object.keys(paymentData).sort((a, b) => {
    const [ya = 0, ma = 0] = a.split("-").map(Number);
    const [yb = 0, mb = 0] = b.split("-").map(Number);
    return yb !== ya ? yb - ya : mb - ma;
  });


  const totalReceipts = Object.values(paymentData).flat().length;
  const totalPaid = Object.values(paymentData).flat().reduce((sum, p) => {
    return sum + (parseFloat(p.amount.replace("K", "").replace(/,/g, "")) || 0);
  }, 0);





  return (
    <div style={{
      minHeight: "100dvh", width: "100%", backgroundColor: "#f2f2f7",
      display: "flex", flexDirection: "column", overflowX: "hidden",
    }}>


      {/* ── Nav bar ── */}
      <div className="sticky top-0 z-50">
        <LogoHeader showBackButton onBack={onBack} />
      </div>

      <div style={{ flex: 1, padding: "0 16px 40px", maxWidth: 600, margin: "0 auto", width: "100%" }}>

        {/* ── Hero stats card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            marginTop: 20, marginBottom: 28,
            background: "linear-gradient(145deg, #00201C 0%, #002E28 50%, #003630 100%)",
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,54,48,0.35)",
            position: "relative",
          }}
        >
          {/* subtle shimmer blob */}
          <div style={{
            position: "absolute", top: -40, right: -40, width: 180, height: 180,
            background: "radial-gradient(circle, rgba(149,227,108,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Student identity row */}
          <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(149,227,108,0.15)",
              border: "1px solid rgba(149,227,108,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#95e36c" strokeWidth={1.8} />
                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#95e36c" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p style={{
                margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                fontWeight: 600, fontSize: 15, color: "#fff", letterSpacing: -0.3,
              }}>{studentName}</p>
              {studentId && (
                <p style={{
                  margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                  fontWeight: 400, fontSize: 11.5, color: "rgba(255,255,255,0.55)",
                }}>{schoolName}</p>
              )}
            </div>
          </div>

          {/* Total paid */}
          <div style={{ padding: "16px 20px 0", textAlign: "center" }}>
            <p style={{
              margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 400, fontSize: 11, color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>Total Paid</p>
            <p style={{
              margin: "4px 0 0", fontFamily: '-apple-system,"SF Pro Display","Inter",sans-serif',
              fontWeight: 700, fontSize: 36, color: "#fff", letterSpacing: -1.5, lineHeight: 1,
            }}>
              K{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "0.5px", background: "rgba(255,255,255,0.1)", margin: "16px 20px 0" }} />

          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
            <StatPill value={totalReceipts} label="Receipts" />
            <div style={{ width: "0.5px", height: 36, background: "rgba(255,255,255,0.15)" }} />
            <StatPill value={sortedMonthKeys.length} label="Months" />
            <div style={{ width: "0.5px", height: 36, background: "rgba(255,255,255,0.15)" }} />
            <StatPill
              value={new Date().getFullYear()}
              label="Year"
            />
          </div>
        </motion.div>

        {/* ── Page title ── */}
        <p style={{
          margin: "0 4px 16px", fontFamily: '-apple-system,"SF Pro Display","Inter",sans-serif',
          fontWeight: 700, fontSize: 20, color: "#111", letterSpacing: -0.6,
        }}>Payment Receipts</p>

        {/* ── Empty state ── */}
        {sortedMonthKeys.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "#fff", borderRadius: 20, padding: "48px 24px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "0.5px solid rgba(0,0,0,0.07)",
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#f2f2f7", margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#8e8e93" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{
              margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 600, fontSize: 16, color: "#111",
            }}>No receipts yet</p>
            <p style={{
              margin: "6px 0 0", fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
              fontWeight: 400, fontSize: 13, color: "#8e8e93", lineHeight: 1.5,
            }}>Receipts will appear here after payments are made</p>
          </motion.div>
        )}

        {/* ── Month sections ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {sortedMonthKeys.map((monthKey, monthIndex) => {
            const payments = paymentData[monthKey];
            if (!payments || payments.length === 0) return null;
            const { month, year } = getMonthName(monthKey);

            return (
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: monthIndex * 0.07 }}
              >
                {/* Month header — iOS floating label style */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 10, padding: "0 4px",
                }}>
                  <p style={{
                    margin: 0,
                    fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                    fontWeight: 600, fontSize: 13, color: "#8e8e93",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{month} {year}</p>
                  <div style={{ flex: 1, height: "0.5px", background: "rgba(0,0,0,0.1)" }} />
                  <p style={{
                    margin: 0,
                    fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
                    fontWeight: 500, fontSize: 12, color: "#c7c7cc",
                  }}>{payments.length} {payments.length === 1 ? "receipt" : "receipts"}</p>
                </div>

                {/* Receipt cards — iOS inset grouped style */}
                <div style={{
                  background: "#fff", borderRadius: 16, overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                  border: "0.5px solid rgba(0,0,0,0.07)",
                }}>
                  {payments.map((payment, i) => (
                    <div key={`${monthKey}-${i}`}>
                      {i > 0 && (
                        <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: 72 }} />
                      )}
                      <ReceiptRowInline
                        payment={payment}
                        monthKey={monthKey}
                        index={i + monthIndex * 5}
                        studentName={studentName}
                        studentGrade={studentGrade}
                        parentName={parentName}
                        studentId={studentId}
                        schoolName={schoolName}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

// ─── Inline receipt row (inside the grouped card) ────────────────────────────
function ReceiptRowInline({
  payment, monthKey, index, studentName, studentGrade, parentName, studentId, schoolName
}: {
  payment: PaymentData;
  monthKey: string;
  index: number;
  studentName: string;
  studentGrade: string;
  parentName: string;
  studentId: string;
  schoolName: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const extractReceiptNumber = (subtitle: string) => {
    const m = subtitle.match(/Receipt No\.\s*(\d+)/);
    return m ? m[1] : "0000";
  };

  const [year = "", month = "1"] = monthKey.split("-");
  const day = payment.day.padStart(2, "0");
  const formattedDate = `${day}/${month.padStart(2, "0")}/${year}`;
  const receiptNo = extractReceiptNumber(payment.subtitle);
  const amountVal = parseFloat(payment.amount.replace("K", "").replace(/,/g, "")) || 0;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      generateReceiptPDF({
        schoolName,
        totalAmount: amountVal,
        parentName: parentName,
        grade: studentGrade,
        admissionNumber: studentId,
        refNumber: `000${receiptNo}`.slice(-12),
        dateTime: formattedDate,
        scheduleId: `#${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
        services: [{
          id: "1",
          description: String((payment.title || "").split(" - ")[0] || ""),
          amount: amountVal,
          invoiceNo: String(receiptNo || "0000"),
          studentName: String((studentName || "").split(" - ")[0] || ""),
          grade: studentGrade,
          studentId: studentId
        }],
      });
      toast.success("Receipt downloaded!");
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 16px",
      }}
    >
      <ServiceIcon title={payment.title} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
          fontWeight: 600, fontSize: 14, color: "#111", letterSpacing: -0.2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {(payment.title || "").split(" - ")[0]}
        </p>
        <p style={{
          margin: "2px 0 0", fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
          fontWeight: 400, fontSize: 12, color: "#8e8e93",
        }}>
          {payment.date} {payment.day} · {formattedDate}
        </p>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{
          margin: 0, fontFamily: '-apple-system,"SF Pro Display","Inter",sans-serif',
          fontWeight: 700, fontSize: 15, color: "#003630", letterSpacing: -0.4,
        }}>
          {payment.amount}
        </p>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleDownload}
          disabled={downloading}
          style={{
            marginTop: 4, background: "none", border: "none",
            cursor: "pointer", padding: "2px 0",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {downloading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{ width: 12, height: 12, border: "1.5px solid rgba(0,54,48,0.25)", borderTopColor: "#003630", borderRadius: "50%" }}
            />
          ) : (
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M7 12l5 5 5-5M3 19h18" stroke="#003630" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span style={{
            fontFamily: '-apple-system,"SF Pro Text","Inter",sans-serif',
            fontWeight: 500, fontSize: 11, color: "#003630",
          }}>PDF</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
