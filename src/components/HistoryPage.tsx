import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Info,
  ChevronRight,
  ChevronLeft,
  Receipt,
  Search,
  Settings2,
  Trash2,
  Wallet,
  X,
  Bus,
  GraduationCap,
  Utensils,
  Shirt,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { SkeletonList } from "./SkeletonLoader";
import { haptics } from "../utils/haptics";
import DynamicIslandComponent, { useDynamicIsland } from "./DynamicIsland";
import { generateReceiptPDF } from "../utils/pdfGenerator";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { getStudentsByPhone } from "../data/students";
import { getStudentFinancialSummary } from "../lib/supabase/api/transactions";
import { getParentByPhone } from "../lib/supabase/api/parents";
import { supabase } from "../lib/supabase/client";
import { phoneOrFilter } from "../utils/reconciliation";

export interface PaymentData {
  id: string;
  date: string;
  day: string;
  title: string;
  subtitle: string;
  amount: string;
  balanceRaw: number;
  appliedCredit?: number;
  isInvoice?: boolean;
  isTransaction?: boolean;
  isOpeningBalance?: boolean;
  isLegacy?: boolean;
  status?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  receipts?: {
    date: string;
    day: string;
    receiptNo: string;
    paymentMethod: string;
    amount: string;
    balanceAfter: string;
  }[];
  initiatedAt: string;
  termInfo: string;
  currentBalance: string;
  metadataServices?: any[]; // For accurate PDF balance calculation
  parentName?: string;
}

interface HistoryPageProps {
  userPhone: string;
  onBack: () => void;
  schoolName?: string;
  schoolLogo?: string;
  onViewAllReceipts?: (
    studentName: string,
    studentId: string,
    studentGrade: string,
    parentName: string,
    paymentData: Record<string, PaymentData[]>
  ) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────



function getServiceConfig(title: string): {
  icon: React.ReactNode;
  color: string;
  bg: string;
  label: string;
} {
  const t = title.toLowerCase();
  if (t.includes("tuition") || t.includes("school fees"))
    return {
      icon: <GraduationCap size={18} />,
      color: "#4f46e5",
      bg: "#eef2ff",
      label: "Tuition",
    };
  if (t.includes("bus") || t.includes("transport"))
    return {
      icon: <Bus size={18} />,
      color: "#d97706",
      bg: "#fef3c7",
      label: "Transport",
    };
  if (t.includes("boarding") || t.includes("lodge"))
    return {
      icon: <FileText size={18} />,
      color: "#7c3aed",
      bg: "#f5f3ff",
      label: "Boarding",
    };
  if (t.includes("canteen") || t.includes("food"))
    return {
      icon: <Utensils size={18} />,
      color: "#dc2626",
      bg: "#fef2f2",
      label: "Canteen",
    };
  return {
    icon: <Wallet size={18} />,
    color: "#0d9488",
    bg: "#f0fdfa",
    label: "Payment",
  };
}

// ─── Balance Hero Card ────────────────────────────────────────────────────────

function BalanceHero({
  balance,
  studentName,
  schoolName,
  schoolLogo,
  onBack,
  onViewAllReceipts,
}: {
  balance: string;
  studentName: string;
  schoolName?: string;
  schoolLogo?: string | null;
  onBack?: () => void;
  onViewAllReceipts?: () => void;
}) {
  // Preserve negative sign for credit balance detection
  const balanceNum = parseFloat(balance.replace(/[^-0-9.]/g, "")) || 0;
  const isCredit = balanceNum < 0;

  return (
    <div className="mx-5 mt-0 mb-4 rounded-[32px] overflow-hidden bg-[#003630] shadow-[0_15px_40px_rgba(0,54,48,0.25)] relative">
      {/* Floating Back Button removed as per user request */}

      {/* Premium Design Hero Section - Dark Version with Background Image */}
      <div
        className="relative w-full overflow-hidden min-h-[310px] flex flex-col justify-between p-8"
        style={{ paddingTop: '110px' }}
      >
        {/* Real background image texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: "url('/receivables-card-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Foreground Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between">
          <div>
            {/* Title */}
            <h2 className="text-[28px] font-black text-white tracking-[-0.8px] leading-tight mb-1 uppercase">
              {isCredit ? 'Credit' : 'Total'} Bal<span className={isCredit ? "text-[#95e36c]" : "text-[#ef4444]"}>ance</span>
            </h2>

            {/* Student context pill */}
            <div className="flex items-center gap-3 mb-4">
              <div className="px-2.5 py-1 rounded-[8px] bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-2 transition-all hover:border-[#95e36c]/30">
                <div className="w-3.5 h-3.5 rounded-[4px] bg-[#95e36c] flex items-center justify-center text-[8px] font-black text-[#003630]">
                  {studentName?.charAt(0)}
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">{studentName}</span>
              </div>
              
              {onViewAllReceipts && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.light?.();
                    onViewAllReceipts();
                  }}
                  className="px-2.5 py-1 rounded-[8px] bg-[#95e36c]/10 border border-[#95e36c]/20 flex items-center gap-2 transition-all hover:bg-[#95e36c]/20 group"
                >
                  <FileText size={12} className="text-[#95e36c]" />
                  <span className="text-[10px] font-bold text-[#95e36c] uppercase tracking-wider">View All Receipts</span>
                </button>
              )}
            </div>
          </div>

          {/* Amount Pod - Dynamic styling based on Credit/Debt status */}
          <div className="flex flex-col items-end w-full mt-auto">
            <div
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
              }}
              className="backdrop-blur-xl border border-white/20 rounded-[14px] px-5 py-3 flex items-baseline gap-2 translate-x-4 transition-all duration-500"
            >
              <span className="text-[12px] font-bold text-white/70 tracking-[-0.5px]">ZMW</span>
              <span className="text-[36px] font-bold tracking-[-1.5px] leading-none font-['Inter:Bold',sans-serif] drop-shadow-md">
                {isCredit && "+ "}{Math.abs(balanceNum).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Row ─────────────────────────────────────────────────────────────

function ServiceIcon({ title, isTransaction }: { title: string, isTransaction?: boolean }) {
  const isTuition = title.toLowerCase().includes("tuition") || title.toLowerCase().includes("fees") || title.toLowerCase().includes("school");
  const isCanteen = title.toLowerCase().includes("canteen") || title.toLowerCase().includes("food") || title.toLowerCase().includes("meal");
  const isTransport = title.toLowerCase().includes("transport") || title.toLowerCase().includes("bus");
  const isUniform = title.toLowerCase().includes("uniform") || title.toLowerCase().includes("shirt") || title.toLowerCase().includes("wear");

  // Dashboard-parity Brand Emerald color system
  const iconColor = "#004D40"; // Dark Emerald for icons
  const brandMint = "#E7F9DE"; // Signature Mint background

  const iconSize = 20;
  const strokeWidth = 2.4;

  let iconNode;

  // Use Wallet icon for all payments (transactions)
  if (isTransaction) {
    iconNode = <Wallet size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  } else if (isTuition) {
    iconNode = <GraduationCap size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  } else if (isCanteen) {
    iconNode = <Utensils size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  } else if (isTransport) {
    iconNode = <Bus size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  } else if (isUniform) {
    iconNode = <Shirt size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  } else {
    iconNode = <CreditCard size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  }

  return (
    <div style={{
      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
      background: brandMint, // Mint base from dashboard
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid rgba(149, 227, 108, 0.2)", // Subtle brand border
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      {iconNode}
    </div>
  );
}

function InvoiceRow({
  payment,
  onClick,
  index,
}: {
  payment: PaymentData;
  onClick: () => void;
  index: number;
}) {
  const isInvoice = payment.isInvoice;
  const isTransaction = payment.isTransaction;
  const isCleared = isInvoice && payment.balanceRaw <= 0;
  const isCredit = isInvoice && payment.balanceRaw < 0;
  const isOpening = payment.isOpeningBalance;

  // Dashboard-parity colors & typography
  const primaryText = "#003630"; // Dark Emerald
  const successGreen = "#004D40"; // Success Emerald
  const brandMint = "#E7F9DE"; // Success tint
  const accentBorder = "rgba(149, 227, 108, 0.2)";
  const brandBright = "#95e36c"; // Light Green

  // Status Badge Rendering (Dashboard Spec)
  const renderStatusBadge = () => {
    if (isInvoice || isOpening) {
      const isPaid = payment.balanceRaw <= 0;
      return (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 8px", borderRadius: 8,
          background: isPaid ? brandMint : "#fef2f2",
          color: isPaid ? successGreen : "#991b1b",
          border: `1px solid ${isPaid ? accentBorder : "#fee2e2"}`,
          fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.8,
        }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: isPaid ? successGreen : "#ef4444" }} />
          {isPaid ? (isOpening ? "INITIAL DEBT" : "STATEMENT CLEARED") : "INVOICE DUE"}
        </div>
      );
    }
    const status = payment.status?.toLowerCase() || "successful";
    const isSuccess = status === "successful" || status === "success" || status === "completed";

    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 8px", borderRadius: 8,
        background: isSuccess ? brandMint : "#fffbeb",
        color: isSuccess ? successGreen : "#92400e",
        border: `1px solid ${isSuccess ? accentBorder : "#fef3c7"}`,
        fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.8,
      }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSuccess ? successGreen : "#f59e0b" }} />
        RECEIPT {payment.status || "SUCCESS"}
      </div>
    );
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px", paddingLeft: isTransaction ? 24 : 16,
        width: isTransaction ? "calc(100% - 10px)" : "100%",
        marginLeft: isTransaction ? 10 : 0,
        textAlign: "left", borderRadius: 16,
        background: isInvoice ? "white" : "rgba(255,255,255,0.49)",
        border: isInvoice ? "1px solid rgba(0,54,48,0.06)" : "1px solid rgba(0,0,0,0.02)",
        marginBottom: 8, cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
      whileHover={{ scale: 1.01, background: "rgba(255,255,255,0.8)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
    >
      {/* Type-Indicator Bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: isInvoice ? primaryText : brandBright,
        opacity: isInvoice ? 1 : 0.6,
      }} />
      <ServiceIcon title={payment.title} isTransaction={isTransaction} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontFamily: 'inherit',
          fontWeight: 700, fontSize: 13, color: primaryText, letterSpacing: -0.3,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {payment.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{
            fontFamily: 'inherit', fontWeight: 800, fontSize: 9,
            color: "rgba(0,54,48,0.4)", textTransform: "uppercase", letterSpacing: 1.2,
          }}>
            {payment.subtitle?.split('Via')[0]?.trim() || "School Service"}
          </span>
          <span style={{ color: "rgba(0,54,48,0.15)", fontSize: 12 }}>·</span>
          <span style={{
            fontFamily: 'inherit', fontWeight: 600, fontSize: 9,
            color: "rgba(0,54,48,0.4)", textTransform: "uppercase", letterSpacing: 1,
          }}>
            {payment.subtitle?.includes("Via") ? payment.subtitle.split("Via")[1]?.trim() : "Internal"}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <p style={{
          margin: 0, fontFamily: 'inherit',
          fontWeight: 900, fontSize: 14,
          color: (isInvoice || isOpening) ? (isCleared ? primaryText : "#ef4444") : (isTransaction ? successGreen : primaryText),
          letterSpacing: -0.4,
        }}>
          {(isInvoice || isOpening) ? `- ${payment.amount}` : (isTransaction ? `+ ${payment.amount}` : payment.amount)}
        </p>
        {renderStatusBadge()}
      </div>
    </motion.button>
  );
}

// ─── Credit Management Drawer ────────────────────────────────────────────────

function CreditManagementDrawer({
  mode,
  onClose,
  balance,
  studentId,
  parentPhone,
  unpaidInvoices = []
}: {
  mode: 'allocate' | 'refund';
  onClose: () => void;
  balance: number;
  studentId: string;
  parentPhone: string;
  unpaidInvoices?: PaymentData[];
}) {
  const [refundAmount, setRefundAmount] = useState(Math.abs(balance).toString());
  const [refundReason, setRefundReason] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState(parentPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const creditAmount = Math.abs(balance);

  useEffect(() => {
    if (mode === 'refund') {
      fetchActiveRequest();
    }
  }, [mode, studentId]);

  const fetchActiveRequest = async () => {
    const { data, error } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveRequest(data);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    
    setIsSubmitting(true);
    haptics.medium?.();

    try {
      const { error } = await supabase
        .from('refund_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', activeRequest.id);

      if (error) throw error;

      toast.success("Request Cancelled", {
        description: "Your refund request has been successfully cancelled."
      });
      setActiveRequest(null);
    } catch (err: any) {
      toast.error("Cancellation Failed", {
        description: err.message || "Failed to cancel request."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyCredit = (invoice: PaymentData) => {
    haptics.success?.();
    toast.success(`Allocated K${Math.min(creditAmount, invoice.balanceRaw).toLocaleString()} to ${invoice.title}`, {
      description: "Credit has been successfully applied to this service."
    });
    onClose();
  };

  const handleSubmitRefund = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error("Invalid Amount", { description: "Please enter a valid amount to refund." });
      return;
    }

    if (parseFloat(refundAmount) > creditAmount) {
      toast.error("Limit Exceeded", { description: `Maximum refundable amount is K${creditAmount.toLocaleString()}.` });
      return;
    }

    if (!mobileMoneyNumber || mobileMoneyNumber.length < 9) {
      toast.error("Missing Info", { description: "Please enter a valid mobile money number." });
      return;
    }

    if (!refundReason || refundReason.length < 3) {
      toast.error("Missing Info", { description: "Please provide a reason for the refund." });
      return;
    }

    setIsSubmitting(true);
    haptics.medium?.();

    try {
      // 1. Identify parent from phone
      const orQuery = phoneOrFilter('phone_number', parentPhone);
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('parent_id')
        .or(orQuery)
        .limit(1)
        .maybeSingle();

      if (parentError || !parent) {
        throw new Error("We couldn't identify your profile. Please contact support.");
      }

      // 2. Submit request to new table
      const { error: insertError } = await supabase
        .from('refund_requests')
        .insert({
          student_id: studentId,
          parent_id: parent.parent_id,
          amount: parseFloat(refundAmount),
          status: 'pending',
          reason: refundReason,
          meta_data: {
            mobile_money_number: mobileMoneyNumber,
            platform: 'mobile_history_page'
          }
        });

      if (insertError) throw insertError;

      toast.success("Refund Request Submitted", {
        description: `Your request for K${parseFloat(refundAmount).toLocaleString()} is being processed.`,
      });
      onClose();
    } catch (error: any) {
      console.error('Refund submission error:', error);
      toast.error("Submission Failed", {
        description: error.message || "Something went wrong while sending your request. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[1000]"
      />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.8 }}
        className="fixed bottom-0 left-0 right-0 z-[1001] mx-auto max-w-[600px] flex flex-col"
      >
        <div className="flex justify-center pt-[12px] pb-[6px]">
          <div className="w-[36px] h-[5px] bg-white/90 rounded-full shadow-sm" />
        </div>

        <div className="bg-[#f9fafb] rounded-t-[32px] shadow-[0px_-12px_44px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[85vh]">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#95e36c]/60 to-transparent" />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[#f0f1f3] bg-white">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#95e36c]/10 flex items-center justify-center text-[#01403c]">
                  {mode === 'allocate' ? <ArrowRightLeft size={20} /> : <Banknote size={20} />}
                </div>
                <div>
                  <h2 className="text-[18px] font-black text-[#003630] tracking-[-0.5px]">
                    {mode === 'allocate' ? 'Apply Surplus Credit' : 'Request a Refund'}
                  </h2>
                  <p className="text-[11px] text-[#003630]/50 font-medium uppercase tracking-[0.5px]">
                    Surplus: K{creditAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f1f3f5] flex items-center justify-center text-[#6b7280]">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'allocate' ? (
              <div className="flex flex-col gap-4">
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                  Choose an outstanding invoice to settle using your surplus balance.
                </p>

                {unpaidInvoices.length > 0 ? (
                  unpaidInvoices.map((invoice, idx) => (
                    <motion.button
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleApplyCredit(invoice)}
                      className="w-full bg-white border border-[#e5e7eb] rounded-[18px] p-4 flex items-center justify-between hover:border-[#95e36c] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[14px] bg-[#f9fafb] border border-[#f1f3f5] flex items-center justify-center text-[#004D40] group-hover:bg-[#95e36c]/10">
                          {getServiceIconConfig(invoice.title)}
                        </div>
                        <div className="text-left">
                          <p className="text-[13px] font-bold text-[#003630]">{invoice.title}</p>
                          <p className="text-[11px] text-gray-400 capitalize">{invoice.termInfo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-black text-[#ef4444]">K{invoice.balanceRaw.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-[#95e36c] uppercase tracking-wider">Settle with Credit →</p>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="text-[14px] font-bold text-[#003630]">No Invoices Due</p>
                    <p className="text-[12px] text-gray-400 mt-1 max-w-[200px]">
                      Your account is all caught up! You can keep your credit or request a refund.
                    </p>
                  </div>
                )}
              </div>
            ) : activeRequest ? (
              <div className="flex flex-col gap-8 pb-4">
                {/* Active Request Status Card */}
                <div className="bg-white rounded-[24px] w-full relative overflow-hidden ring-1 ring-[#e5e7eb] shadow-[0px_12px_24px_-8px_rgba(0,0,0,0.06)]">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full rotate-[-15deg]">
                      <path d="M40 20L65 45L40 70" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M55 20L80 45L55 70" stroke="#fbbf24" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
                    </svg>
                  </div>

                  <div className="p-6 flex flex-col gap-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <Clock size={24} className="animate-[pulse_2s_infinite]" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200">
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Pending Approval</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#003630] tracking-[-0.4px]">Refund in Progress</h2>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                        Your request for <span className="text-[#003630] font-bold">K{activeRequest.amount.toLocaleString()}</span> is currently being reviewed by the administration.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2">
                       <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#f1f3f5]">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Recipient Number</p>
                          <p className="text-[13px] font-bold text-[#003630]">{activeRequest.meta_data?.mobile_money_number || 'N/A'}</p>
                       </div>
                       <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#f1f3f5]">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Submitted On</p>
                          <p className="text-[13px] font-bold text-[#003630]">
                            {new Date(activeRequest.created_at).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' })}
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Info size={16} />
                    </div>
                    <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
                      Refunds are usually processed within 3-5 business days. You will be notified once the funds have been settled to your mobile wallet.
                    </p>
                  </div>

                  <button
                    onClick={handleCancelRequest}
                    disabled={isSubmitting}
                    className={`relative h-[56px] w-full rounded-[16px] overflow-hidden group shadow-[0px_6px_20px_rgba(239,68,68,0.15)] active:scale-[0.98] transition-all ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="absolute inset-0 bg-white group-hover:bg-gray-50 border-[1.5px] border-[#ef4444] transition-colors" />
                    <div className="relative z-10 flex items-center justify-center gap-3 h-full group-active:scale-[0.98] transition-transform">
                      <Trash2 size={18} className="text-[#ef4444]" />
                      <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#ef4444] tracking-[-0.2px]">
                        {isSubmitting ? 'Cancelling...' : 'Cancel Refund Request'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8 pb-4">
                {/* Pay in Part / Checkout Aesthetic Surplus Card */}
                <div className="bg-white rounded-[24px] w-full relative overflow-hidden ring-1 ring-[#e5e7eb] shadow-[0px_12px_24px_-8px_rgba(0,0,0,0.06)]">
                  {/* Decorative Chevrons from CheckoutPage2 */}
                  <div className="absolute -top-4 -right-2 w-32 h-32 opacity-80 pointer-events-none">
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full rotate-[-15deg]">
                      <path d="M40 20L65 45L40 70" stroke="#e0f7d4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M55 20L80 45L55 70" stroke="#95e36c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
                      <path d="M70 20L95 45L70 70" stroke="#003630" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div className="p-5 flex flex-col gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#95e36c]/15 to-[#7dd054]/5 border-[1.5px] border-[#95e36c]/30 flex items-center justify-center">
                      <Banknote size={20} className="text-[#003630]" strokeWidth={2.5} />
                    </div>

                    <div className="flex flex-col gap-1">
                      <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630] tracking-[-0.3px]">Total Account Surplus</h2>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] text-gray-400 uppercase tracking-wider">Available for Refund</p>
                    </div>

                    <div className="flex items-center justify-between w-full mt-2">
                       <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] text-gray-400 uppercase tracking-widest leading-none">Status: Settled</p>
                       <div className="bg-white/95 backdrop-blur-[12px] border-[1.5px] border-[#eef1f5] px-4 py-2 rounded-[14px] shadow-[0px_8px_16px_-4px_rgba(0,54,48,0.12)] flex items-center gap-2 relative z-20">
                         <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630]/70">K</span>
                         <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.8px] leading-none font-black">
                           {creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Amount Input Section (CheckoutPage2 Style) */}
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[12px] text-gray-400 px-1 uppercase tracking-wider">How much would you like refunded?</label>
                    <div className="relative w-full h-[60px]">
                      <div className="box-border flex items-center gap-3 h-full px-5 rounded-[18px] border-[1.5px] border-[#e5e7eb] bg-[#f9fafb] focus-within:border-[#95e36c] focus-within:bg-white transition-all shadow-sm">
                        <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[14px] text-[#6b7280] shrink-0">ZMW</span>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          className="flex-1 min-w-0 font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[20px] text-right text-[#003630] bg-transparent outline-none pr-1 tracking-[-0.3px]"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[12px] text-gray-400 px-1 uppercase tracking-wider">Mobile Money Number</label>
                    <div className="relative w-full h-[60px]">
                      <div className="box-border flex items-center gap-3 h-full px-5 rounded-[18px] border-[1.5px] border-[#e5e7eb] bg-[#f9fafb] focus-within:border-[#95e36c] focus-within:bg-white transition-all shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <input
                          type="tel"
                          value={mobileMoneyNumber}
                          onChange={(e) => setMobileMoneyNumber(e.target.value)}
                          className="flex-1 min-w-0 font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[18px] text-right text-[#003630] bg-transparent outline-none pr-1 tracking-[-0.3px]"
                          placeholder="e.g. 09xxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[12px] text-gray-400 px-1 uppercase tracking-wider">Reason for Refund</label>
                    <div className="relative w-full">
                      <div className="box-border flex items-start gap-3 w-full p-4 rounded-[18px] border-[1.5px] border-[#e5e7eb] bg-[#f9fafb] focus-within:border-[#95e36c] focus-within:bg-white transition-all shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mt-1">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <textarea
                          rows={2}
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="flex-1 min-w-0 font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[15px] text-left text-[#003630] bg-transparent outline-none tracking-[-0.2px] resize-none"
                          placeholder="Why are you requesting this refund?"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Proceed / Confirm Action from CheckoutPage2 */}
                  <div className="pt-2">
                    <button
                      onClick={handleSubmitRefund}
                      disabled={isSubmitting}
                      className={`relative h-[56px] w-full rounded-[16px] overflow-hidden touch-manipulation block group shadow-[0px_6px_20px_rgba(0,54,48,0.25)] active:shadow-[0px_2px_8px_rgba(0,54,48,0.2)] active:scale-[0.98] transition-all ${isSubmitting ? 'opacity-80 pointer-events-none' : ''}`}
                    >
                      <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      
                      <div className="relative z-10 flex items-center justify-center gap-[10px] h-full transition-transform group-active:scale-[0.97]">
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] tracking-[-0.3px] text-white/90">Submitting...</p>
                          </div>
                        ) : (
                          <>
                            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] tracking-[-0.3px] text-white">Confirm Refund Request</p>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 15L12.5 10L7.5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function getServiceIconConfig(title: string) {
  const iconSize = 20;
  const iconColor = "#004D40";
  const strokeWidth = 2.4;
  const isTuition = title.toLowerCase().includes("tuition") || title.toLowerCase().includes("fees") || title.toLowerCase().includes("school");
  const isCanteen = title.toLowerCase().includes("canteen") || title.toLowerCase().includes("food") || title.toLowerCase().includes("meal");
  const isTransport = title.toLowerCase().includes("transport") || title.toLowerCase().includes("bus");
  const isUniform = title.toLowerCase().includes("uniform") || title.toLowerCase().includes("shirt") || title.toLowerCase().includes("wear");

  if (isTuition) return <GraduationCap size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  if (isCanteen) return <Utensils size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  if (isTransport) return <Bus size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  if (isUniform) return <Shirt size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
  return <CreditCard size={iconSize} color={iconColor} strokeWidth={strokeWidth} />;
}

// ─── Payment Detail Sheet ─────────────────────────────────────────────────────

function PaymentSheet({
  payment,
  onClose,
  schoolName,
  parentName,
}: {
  payment: PaymentData;
  onClose: () => void;
  schoolName?: string;
  parentName?: string;
}) {
  const isCleared = payment.balanceRaw === 0;
  const isCredit = payment.balanceRaw < 0;
  const config = getServiceConfig(payment.title);

  const handleDownload = () => {
    haptics.medium?.();

    // 1. Calculate amount paid today
    const totalPaidVal = (payment.receipts || []).reduce(
      (acc, r) => acc + (parseFloat(r.amount.replace(/[^0-9.]/g, "")) || 0),
      0
    ) || parseFloat(payment.amount.replace(/[^0-9.]/g, "")) || 0;

    // 2. Prepare services (Original items vs. Payment line item)
    // If we have metadata services, they represent the original line items (e.g. 1700, 400)
    // Otherwise fallback to the payment amount itself
    const services = (payment.metadataServices && payment.metadataServices.length > 0)
      ? payment.metadataServices.map(s => ({
          id: s.id || payment.studentId,
          description: s.description || payment.title,
          amount: parseFloat(String(s.amount)) || 0, // FULL COST of the service
          invoiceNo: s.invoiceNo || payment.admissionNumber || "N/A",
          studentName: payment.studentName,
          class: s.class || s.grade || payment.grade || "Class Not Specified",
        }))
      : [{
          id: payment.studentId,
          description: payment.title,
          amount: totalPaidVal, // In this case, we treat paid as total cost for simple receipts
          invoiceNo: payment.admissionNumber,
          studentName: payment.studentName,
          class: payment.grade || "Class Not Specified",
        }];

    const receiptData = {
      schoolName: schoolName || "Twalumbu Education Centre",
      totalAmount: totalPaidVal,
      refNumber: (payment.receipts && payment.receipts[0]?.receiptNo) || payment.id?.slice(0, 8) || `REF-${Date.now()}`,
      dateTime: payment.date || new Date().toLocaleString(),
      scheduleId: `#${payment.admissionNumber || "N/A"}`,
      parentName: payment.parentName || parentName || "Valued Parent",
      paymentMethod: (payment.receipts && payment.receipts[0]?.paymentMethod) || "Mobile Money",
      admissionNumber: payment.admissionNumber,
      services: services
    };

    try {
      generateReceiptPDF(receiptData as any);
      toast.success("Receipt downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[1000]"
      />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{
          type: "spring",
          damping: 32,
          stiffness: 380,
          mass: 0.8
        }}
        className="fixed bottom-0 left-0 right-0 z-[1001] mx-auto max-w-[600px] max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-center pt-[12px] pb-[6px]">
          <div className="w-[36px] h-[5px] bg-white/90 rounded-full shadow-sm" />
        </div>

        <div className="bg-white rounded-t-[32px] shadow-[0px_-12px_44px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#95e36c]/60 to-transparent" />

          {/* Header (Checkout Style) - Increased Padding for Air */}
          <div className="relative px-6 pt-10 pb-7 border-b border-[#f0f1f3] bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#95e36c]/5 to-transparent rounded-bl-[40px] pointer-events-none" />

            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-[3px] h-6 bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full" />
                  <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[19px] text-[#003630] tracking-[-0.6px] leading-tight">
                    {payment.isTransaction ? 'Official Receipt' : 'Service Statement'} • {payment.studentName}
                  </h2>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="font-['Inter:Medium',sans-serif] text-[12px] text-gray-400 tracking-[-0.1px] leading-none">
                    {payment.isTransaction ? 'Official Receipt' : 'Service Statement'} • Detailed View
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  haptics.selection?.();
                  onClose();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f1f3f5] text-[#6b7280] hover:bg-gray-200 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
            {/* Redesigned Hero Card: Matching Refund Drawer Style */}
            <div className="bg-white rounded-[24px] w-full relative overflow-hidden ring-1 ring-[#e5e7eb] shadow-[0px_12px_24px_-8px_rgba(0,0,0,0.06)] mb-8">
              {/* Decorative Chevrons from CheckoutPage2 */}
              <div className="absolute -top-4 -right-2 w-32 h-32 opacity-80 pointer-events-none">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full rotate-[-15deg]">
                  <path d="M40 20L65 45L40 70" stroke="#e0f7d4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M55 20L80 45L55 70" stroke="#95e36c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
                  <path d="M70 20L95 45L70 70" stroke="#003630" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="p-5 flex flex-col gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#95e36c]/15 to-[#7dd054]/5 border-[1.5px] border-[#95e36c]/30 flex items-center justify-center text-[#003630]">
                  <FileText size={20} strokeWidth={2.5} />
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630] tracking-[-0.3px]">Detailed Payment Receipt</h2>
                  <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] text-gray-400 uppercase tracking-wider">Verified Student Statement</p>
                </div>

                <div className="flex items-center justify-between w-full mt-2">
                   <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] text-gray-400 uppercase tracking-widest leading-none">
                      Status: {isCredit ? 'Credit Adj' : (isCleared ? 'Cleared' : 'Due')}
                   </p>
                   <div className="bg-white/95 backdrop-blur-[12px] border-[1.5px] border-[#eef1f5] px-4 py-2 rounded-[14px] shadow-[0px_8px_16px_-4px_rgba(0,54,48,0.12)] flex items-center gap-2 relative z-20">
                     <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630]/70">K</span>
                     <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.8px] leading-none font-black">
                        {isCredit 
                          ? Math.abs(payment.balanceRaw).toLocaleString() 
                          : (isCleared ? (parseFloat(payment.amount.replace(/[^0-9.]/g, "")) || 0).toLocaleString() : payment.currentBalance.replace('K','').trim())}
                     </span>
                   </div>
                </div>
              </div>
            </div>

            {/* Details table style */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] overflow-hidden shadow-sm mb-8">
              {[
                { label: "Student", value: payment.studentName },
                { label: "Period", value: payment.termInfo },
                {
                  label: "Invoiced",
                  value: new Date(payment.initiatedAt).toLocaleDateString("en-ZM", { day: "numeric", month: "long", year: "numeric" }),
                },
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between px-5 py-4 ${idx !== arr.length - 1 ? "border-b border-[#f1f3f5]" : ""}`}
                >
                  <span className="font-['Inter:Medium',sans-serif] text-[13px] text-gray-400 tracking-[-0.1px]">
                    {row.label}
                  </span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630]">
                    {row.value}
                  </span>
                </div>
              ))}

              {payment.appliedCredit! > 0 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-dashed border-[#f1f3f5]">
                  <span className="text-[13px] font-medium text-gray-400">Global Credit Applied</span>
                  <span className="text-[14px] font-black text-[#95e36c]">
                    - K{payment.appliedCredit?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Fixed Bottom Action — Download Styled like Checkout Proceed */}
          <div className="mt-auto px-6 pt-4 pb-10 bg-white border-t border-[#e5e7eb] shadow-[0px_-4px_16px_rgba(0,0,0,0.04)]">
            <button
              onClick={handleDownload}
              className="relative h-[56px] w-full rounded-[16px] overflow-hidden group shadow-[0px_6px_20px_rgba(0,54,48,0.25)] transition-all active:scale-[0.96]"
            >
              <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                <Download size={18} className="text-white/80" />
                <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white tracking-[-0.3px]">
                  Download Official Receipt
                </p>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HistoryPage({
  userPhone,
  onBack,
  schoolName,
  schoolLogo,
  onViewAllReceipts,
}: HistoryPageProps) {
  const [students, setStudents] = useState<{ id: string; name: string; grade: string }[]>([]);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [allPaymentData, setAllPaymentData] = useState<Record<string, Record<string, PaymentData[]>>>({});
  const [studentFinalBalances, setStudentFinalBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [creditAction, setCreditAction] = useState<'allocate' | 'refund' | null>(null);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
  const [parentName, setParentName] = useState("");

  const dynamicIsland = useDynamicIsland();

  // All flattened payments for logic
  const allFlattenedPayments = useMemo(() => {
    return Object.values(allPaymentData).flatMap(studentMonths =>
      Object.values(studentMonths).flat()
    );
  }, [allPaymentData]);

  // Identify unpaid invoices across all payment data
  const unpaidInvoices = useMemo(() => {
    return allFlattenedPayments.filter(p => p.studentId === selectedStudentId && (p.isInvoice || p.isOpeningBalance) && p.balanceRaw > 0);
  }, [allFlattenedPayments, selectedStudentId]);
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userPhone) return;
      try {
        // 1. Fetch Students
        const studentData = await getStudentsByPhone(userPhone);
        const formatted = studentData.map((s) => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
        }));
        setStudents(formatted);
        if (formatted.length > 0) {
          setSelectedStudentId((cur) => {
            if (cur && formatted.some((s) => s.id === cur)) return cur;
            return formatted[0]?.id || "";
          });
        }

        // 2. Fetch Parent Details (for professional receipts)
        const parent = await getParentByPhone(userPhone);
        if (parent) {
          setParentName(parent.name);
        }
      } catch (e) {
        console.error("Error loading history initial data", e);
      }
    };
    fetchInitialData();
  }, [userPhone]);

  useEffect(() => {
    async function loadHistory() {
      if (students.length === 0) return;
      setIsLoading(true);
      try {
        const newData: Record<string, Record<string, PaymentData[]>> = {};

        for (const student of students) {
          try {
            const summary = await getStudentFinancialSummary(student.id);
            if (summary) {
              const studentMonths: Record<string, PaymentData[]> = {};

              const addToMonth = (dateStr: string, item: PaymentData) => {
                const d = new Date(dateStr);
                const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
                if (!studentMonths[key]) studentMonths[key] = [];
                studentMonths[key].push(item);
              };

              const currentBalStr = `K${(summary.totalBalance || 0).toLocaleString()}`;
              setStudentFinalBalances(prev => ({
                ...prev,
                [student.id]: summary.totalBalance || 0
              }));

              // 1. All Invoiced Items (Debts)
              (summary.items || []).forEach((it: any) => {
                addToMonth(it.initiated_at || new Date().toISOString(), {
                  id: it.id || it.invoice_id || Math.random().toString(),
                  date: it.initiated_at ? new Date(it.initiated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Pending",
                  day: it.initiated_at ? new Date(it.initiated_at).toLocaleDateString("en-GB", { weekday: "long" }) : "",
                  title: it.name || it.title || "School Fees",
                  subtitle: "Service Invoice",
                  amount: `K${(it.invoiced || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  balanceRaw: it.balance || 0,
                  isInvoice: true,
                  appliedCredit: it.credit_applied || 0,
                  studentId: student.id,
                  studentName: student.name,
                  admissionNumber: summary.student?.admission_number || "N/A",
                  initiatedAt: it.initiated_at || new Date().toISOString(),
                  termInfo: it.term_info || `Term ${it.term || "N/A"}`,
                  currentBalance: currentBalStr,
                });
              });

              // 2. All Raw Transactions (Payments/Credits recorded in Ledger)
              (summary.transactions || []).forEach((tx: any) => {
                const services = tx.metadata?.services || [];
                const dashboardDesc = services.map((s: any) => s.description).join(", ")
                  || tx.metadata?.description
                  || tx.metadata?.notes
                  || tx.metadata?.service_name
                  || tx.reason
                  || "Standard Registry Record";

                const type = tx.transaction_type?.toLowerCase() || '';
                const isDebit = type.includes('debit') || type.includes('invoice') || type.includes('fee');
                const isOpening = type === 'opening_balance';
                const isCredit = type.includes('payment') || type.includes('credit') || !isDebit;

                // Absolute value for the basic display string if needed
                const absAmount = Math.abs(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

                addToMonth(tx.created_at || tx.initiated_at, {
                  id: tx.id || tx.transaction_id || Math.random().toString(),
                  date: new Date(tx.created_at || tx.initiated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
                  day: new Date(tx.created_at || tx.initiated_at).toLocaleDateString("en-GB", { weekday: "long" }),
                  title: isOpening ? "Opening Balance" : dashboardDesc,
                  subtitle: isCredit
                    ? `${tx.payment_method?.replace("_", " ") || tx.channel || "Standard Entry"} Payment`
                    : `Financial Charge • Entry #${tx.id?.slice(-4) || 'N/A'}`,
                  amount: `K${absAmount}`,
                  balanceRaw: 0,
                  isTransaction: isCredit && !isOpening,
                  isInvoice: isDebit && !isOpening,
                  isOpeningBalance: isOpening,
                  status: tx.status,
                  studentId: student.id,
                  studentName: student.name,
                  admissionNumber: summary.student?.admission_number || "N/A",
                  initiatedAt: tx.created_at || tx.initiated_at,
                  termInfo: "N/A",
                  currentBalance: currentBalStr,
                  metadataServices: services,
                  parentName: tx.metadata?.parent_name || tx.metadata?.parentName || "",
                });
              });

              // Sort newest first
              Object.values(studentMonths).forEach((monthItems) => {
                monthItems.sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());
              });

              newData[student.id] = studentMonths;
            }
          } catch (studentErr) {
            console.error(`Error loading history for student ${student.id}:`, studentErr);
          }
        }
        setAllPaymentData(newData);
      } catch (err) {
        console.error("Global history error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [userPhone, students]);

  const getMonths = () => {
    const studentData = allPaymentData[selectedStudentId] || {};
    const keys = Object.keys(studentData);
    if (keys.length === 0) {
      const now = new Date();
      return [{ key: `${now.getFullYear()}-${now.getMonth() + 1}`, label: "This Month", year: now.getFullYear(), month: now.getMonth() + 1 }];
    }
    return keys.map((key) => {
      const parts = key.split("-").map(Number);
      const y = parts[0] ? Number(parts[0]) : 0;
      const m = parts[1] ? Number(parts[1]) : 1;
      const date = new Date(y, m - 1, 1);
      const now = new Date();
      const isCurrent = y === now.getFullYear() && (m - 1) === now.getMonth();
      const label = isCurrent ? "This Month" : date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      return { key, label, year: y, month: m };
    }).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  };

  const months = getMonths();
  const paymentsByMonth = allPaymentData[selectedStudentId] || {};

  const totalBalance = useMemo(() => {
    const val = studentFinalBalances[selectedStudentId] ?? 0;
    return val.toLocaleString(undefined, { minimumFractionDigits: 2 });
  }, [studentFinalBalances, selectedStudentId]);

  return (
    <div className="bg-[#F8FAFC] h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="relative w-full max-w-lg h-screen mx-auto flex flex-col shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {students.length > 0 && (
            <>
              <BalanceHero
                balance={totalBalance}
                studentName={students.find((s) => s.id === selectedStudentId)?.name || ""}
                schoolName={schoolName}
                schoolLogo={schoolLogo}
                onBack={onBack}
                onViewAllReceipts={() => {
                  if (onViewAllReceipts) {
                    const student = students.find(s => s.id === selectedStudentId);
                    if (student) {
                      onViewAllReceipts(
                        student.name,
                        student.id,
                        student.grade,
                        parentName || "Valued Parent",
                        allPaymentData[selectedStudentId] || {}
                      );
                    }
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center mt-2">
                <div className="flex gap-[10px] items-center overflow-x-auto scrollbar-hide px-5 pt-2 pb-2">
                  {students.map((student) => {
                    const active = student.id === selectedStudentId;
                    return (
                      <button
                        key={student.id}
                        onClick={() => {
                          haptics.selection?.();
                          setSelectedStudentId(student.id);
                        }}
                        className={`h-[36px] px-[16px] rounded-[12px] transition-all duration-300 flex items-center justify-center relative shrink-0 min-w-[110px] active:scale-95 ${active ? "bg-[#95e36c] text-[#003630] border-transparent shadow-[0px_4px_12px_-2px_rgba(149,227,108,0.3)] z-10" : "bg-white border-[1.2px] border-[#f1f3f5] text-[#4b5563] shadow-[0px_2px_4px_rgba(0,0,0,0.02)]"}`}
                      >
                        <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[12px] tracking-[-0.2px] whitespace-nowrap">
                          {student.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-[7px] mt-1 mb-2">
                  {students.map((student) => (
                    <div
                      key={`dot-page-${student.id}`}
                      className={`h-[5px] rounded-full transition-all duration-300 ${student.id === selectedStudentId ? "w-[18px] bg-[#95e36c]" : "w-[5px] bg-[#d1d5db]"}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="px-4 pt-6 pb-12 w-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-black text-[#003630]/40 uppercase tracking-[0.25em] italic">Transactions</p>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Clock size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">History</span>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <SkeletonList count={5} />
              </div>
            ) : (
              <div className="space-y-8">
                {months.map((month) => {
                  const items = paymentsByMonth[month.key] || [];
                  if (items.length === 0 && month.label !== "This Month") return null;
                  return (
                    <div key={month.key} className="mb-6">
                      <p className="text-[10px] font-black text-[#003630]/60 uppercase tracking-[0.2em] mb-3 px-2 italic">{month.label}</p>
                      <div style={{
                        background: "#fff", borderRadius: 16, overflow: "hidden",
                        padding: "4px 0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                        border: "0.5px solid rgba(0,0,0,0.07)",
                      }}>
                        {items.length > 0 ? (
                          items.map((payment, idx) => (
                            <div key={`${month.key}-${idx}`}>
                              {idx > 0 && (
                                <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: 72 }} />
                              )}
                              <InvoiceRow
                                payment={payment}
                                index={idx}
                                onClick={() => {
                                  haptics.light?.();
                                  setSelectedPayment(payment);
                                  setOpenPopupId(`${month.key}-${idx}`);
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="bg-white rounded-3xl py-12 text-center border border-gray-100 shadow-sm">
                            <div className="size-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                              <FileText size={20} className="text-gray-300" />
                            </div>
                            <p className="text-[13px] text-gray-400 font-medium">No transactions this month</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Dynamic spacer that matches the footer state to prevent over-scrolling when collapsed */}
                <div className={`${isFooterCollapsed ? 'h-[120px]' : 'h-[380px]'} w-full pointer-events-none transition-all duration-500`} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Components (Not affected by scroller) */}
        <Toaster position="top-center" />
        <DynamicIslandComponent data={dynamicIsland.islandData} {...dynamicIsland} />

        {/* Absolute Footer for Credit Management (Pinned to parent container bottom) */}
        {(studentFinalBalances[selectedStudentId] ?? 0) < 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`absolute bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#e5e7eb] px-[20px] shadow-[0px_-10px_40px_rgba(0,0,0,0.15)] z-50 rounded-t-[32px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFooterCollapsed ? 'translate-y-[calc(100%-50px)] pb-2 pt-[4px]' : 'translate-y-0 pb-[32px] pt-[12px]'}`}
          >
            {/* Highly Prominent Centered Toggle Pod */}
            <div
              className="w-full flex flex-col items-center justify-center mb-1 cursor-pointer group"
              onClick={() => {
                haptics.impact?.();
                setIsFooterCollapsed(!isFooterCollapsed);
              }}
            >
              <div className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-full hover:bg-gray-50 active:scale-95 transition-all">
                <div className="h-1 w-10 bg-gray-200 rounded-full group-hover:bg-gray-300 transition-colors" />
                <motion.div
                  animate={{ rotate: isFooterCollapsed ? 180 : 0, scale: isFooterCollapsed ? 1.2 : 1 }}
                  className="text-[#9ca3af]/60 group-hover:text-[#95e36c] transition-colors"
                >
                  <ChevronDown size={20} strokeWidth={3} />
                </motion.div>
              </div>
            </div>

            <motion.div
              animate={{
                opacity: isFooterCollapsed ? 0 : 1,
                y: isFooterCollapsed ? 10 : 0,
                pointerEvents: isFooterCollapsed ? 'none' : 'auto'
              }}
              className="w-full flex flex-col gap-[12px]"
            >
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[2px] leading-none mb-1">Account Credit</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-['Inter:Bold',sans-serif] text-[#003630]">
                      ZMW {Math.abs(studentFinalBalances[selectedStudentId] ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[#95e36c] uppercase tracking-wider opacity-80">Available Surplus</span>
                </div>
              </div>

              <motion.div
                animate={{
                  opacity: isFooterCollapsed ? 0 : 1,
                  height: isFooterCollapsed ? 0 : 'auto',
                  marginTop: isFooterCollapsed ? 0 : 8
                }}
                className="grid grid-cols-2 gap-[10px] overflow-hidden"
              >
                <button
                  onClick={() => {
                    haptics.medium();
                    setCreditAction('allocate');
                  }}
                  className="relative flex-1 h-[56px] rounded-[18px] transition-all touch-manipulation overflow-hidden group shadow-sm active:scale-[0.96]"
                >
                  <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="relative z-10 flex items-center justify-center gap-[8px] h-full px-2 text-center">
                    <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                      <ArrowRightLeft size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[12px] text-white tracking-[-0.2px] leading-tight">
                      Apply to Service
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    haptics.medium();
                    setCreditAction('refund');
                  }}
                  className="flex-1 h-[56px] bg-white transition-all touch-manipulation active:scale-[0.96] flex items-center justify-center shadow-sm group px-2 rounded-[18px] hover:border-[#d1d5db] active:bg-gray-50 border-[1.5px] border-[#e5e7eb]"
                >
                  <div className="bg-[#f0fdf4] p-1.5 rounded-lg mr-[8px] shrink-0">
                    <Banknote size={16} className="text-[#003630]" strokeWidth={3} />
                  </div>
                  <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] text-[#003630] tracking-[-0.2px] text-left leading-tight">
                    Request Refund
                  </span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {openPopupId && selectedPayment && (
          <PaymentSheet
            payment={selectedPayment}
            schoolName={schoolName}
            parentName={parentName}
            onClose={() => setOpenPopupId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {creditAction && (
          <CreditManagementDrawer
            mode={creditAction}
            onClose={() => setCreditAction(null)}
            balance={studentFinalBalances[selectedStudentId] ?? 0}
            unpaidInvoices={unpaidInvoices}
            studentId={selectedStudentId}
            parentPhone={userPhone}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
