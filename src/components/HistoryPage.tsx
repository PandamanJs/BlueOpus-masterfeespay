import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useSpring, useTransform } from "motion/react";
import { generateReceiptPDF } from "../utils/pdfGenerator";
import {
  CheckCircle2,
  AlertCircle,
  Download,
  Wallet,
  Settings,
  ChevronLeft,
  CreditCard,
  Loader2,
  BadgeCheck,
  BadgeX
} from "lucide-react";
import LogoHeader from "./common/LogoHeader";
import { getStudentFinancialSummary } from "../lib/supabase/api/transactions";
import { getStudentsByPhone } from "../data/students";
import type { Student } from "../data/students";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";
import cardBg from "../assets/background images/Frame 1707478741.png";

type FinancialSummary = any;

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15
  });

  const display = useTransform(spring, (current) =>
    `K${current.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

interface HistoryPageProps {
  userPhone: string;
  onBack: () => void;
  schoolName?: string;
  schoolLogo?: string;
  userName?: string;
  onClearBalances?: (studentIds: string[]) => void;
  onIndividualPay?: (service: any) => void;
  onViewAllReceipts?: (
    studentName: string,
    studentId: string,
    studentGrade: string,
    parentName: string,
    paymentData: any
  ) => void;
}

export default function HistoryPage({
  userPhone,
  onBack,
  schoolName,
  schoolLogo,
  userName,
  onClearBalances,
  onIndividualPay
}: HistoryPageProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Students on Mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudentsByPhone(userPhone);
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      } catch (e) {
        console.error("Error loading students:", e);
      }
    };
    loadStudents();
  }, [userPhone]);

  // 2. Fetch Financial Summary when selected student changes
  useEffect(() => {
    if (!selectedStudentId) return;
    const selectedStudent = students.find(s => s.id === selectedStudentId);
    if (selectedStudent?.verificationStatus === 'unverified') {
      setFinancialSummary(null);
      setIsLoading(false);
      return;
    }

    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const summary = await getStudentFinancialSummary(selectedStudentId);
        setFinancialSummary(summary);
      } catch (e) {
        console.error("Error loading summary:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSummary();
  }, [selectedStudentId, students]);

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const isSelectedUnverified = currentStudent?.verificationStatus === 'unverified';
  const hasOutstandingBalance = !isSelectedUnverified && (financialSummary?.totalBalance ?? 0) > 0;

  return (
    <div className="bg-[#f8fafc] min-h-screen w-full overflow-hidden flex flex-col">
      <div className="relative w-full max-w-lg h-screen mx-auto flex flex-col bg-[#f9fafb]">

        {/* Brand Header — from design */}
        <div className="bg-white border-b border-[#e4e4e4] px-7 py-6 flex items-center justify-center relative z-20">
          <p className="font-['Space_Grotesk',sans-serif] font-bold text-[24px] text-black tracking-[-0.5px]">masterfees</p>
        </div>

        {/* Dash Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">

          {/* Emerald Card — from design (Frame17/Frame1 style) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-6 mb-8 p-6 rounded-[12px] relative overflow-hidden min-h-[131px] flex flex-col justify-end gap-1 shadow-[0_8px_32px_-8px_rgba(0,54,48,0.3)]"
          >
            <img
              alt=""
              className="absolute inset-0 object-cover w-full h-full pointer-events-none z-0"
              src={cardBg}
            />

            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[12px] text-[#95e36c] tracking-[-0.2px] relative z-10 m-0">
              {currentStudent?.name}'s Current Balance
            </p>

            <div className="flex items-center justify-between gap-4 mt-1 relative z-10">
              <div className="overflow-hidden">
                <p className="font-['Space_Grotesk',sans-serif] font-bold text-[40px] text-white tracking-[-1px] leading-tight m-0">
                  {isLoading ? "---" : (
                    <AnimatedNumber value={financialSummary?.totalBalance ?? 0} />
                  )}
                </p>
              </div>

              {hasOutstandingBalance && !isLoading && (
                <button
                  onClick={() => {
                    haptics.heavy();
                    if (onClearBalances) {
                      onClearBalances([selectedStudentId]);
                    } else {
                      toast.info('Going to checkout...');
                    }
                  }}
                  className="bg-[#95e36c] rounded-[8px] px-6 py-2 shadow-[0px_4px_12px_rgba(0,0,0,0.15)] active:scale-95 transition-transform"
                >
                  <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#003630] text-[12px]">
                    Settle All
                  </span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Child Selector Tabs — EXACTLY from design (Frame14 style) */}
          <div className="flex items-center gap-[16px] h-[50px] px-4 overflow-x-auto no-scrollbar">
            {students.map(student => {
              const isActive = selectedStudentId === student.id;

              return (
                <button
                  key={student.id}
                  onClick={() => {
                    haptics.selection();
                    setSelectedStudentId(student.id);
                  }}
                  className={`h-full relative rounded-[12px] shrink-0 transition-all ${isActive ? 'bg-[#f5f7f9]' : 'bg-transparent'}`}
                >
                  {isActive && (
                    <div aria-hidden="true" className="absolute border-[2px] border-[#a3a3a3] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_10px_20px_0px_rgba(0,0,0,0.25)]" />
                  )}
                  <div className="flex flex-row items-center justify-center h-full">
                    <div className="flex gap-[10px] items-center justify-center px-[25px] py-[4px] relative h-full">
                      {isActive && (
                        <div className="relative shrink-0 w-[10px] h-[10px]">
                          <svg className="absolute block inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                            <circle cx="5" cy="5" fill="#95E36C" r="5" />
                          </svg>
                        </div>
                      )}
                      <div className={`flex flex-col justify-end leading-[normal] relative shrink-0 text-[10px] text-black whitespace-nowrap ${isActive ? "font-['Space_Grotesk',sans-serif] font-bold" : "font-['Space_Grotesk',sans-serif] font-medium"}`}>
                        <p className="m-0">{student.name}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content Area — from design (FeesSection style) */}
          <div className="mt-8 px-4 space-y-4">
            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[12px] text-gray-400 uppercase tracking-[0.2em] mb-4">

            </p>

            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <Loader2 className="animate-spin text-[#95e36c]" size={40} strokeWidth={1.5} />
                  <div className="absolute inset-0 blur-md bg-[#95e36c]/20 rounded-full animate-pulse" />
                </div>
                <p className="font-['Space_Grotesk',sans-serif] text-[13px] text-gray-400 font-bold uppercase tracking-[0.2em] animate-pulse">
                  Reconciling Ledger
                </p>
              </div>
            ) : isSelectedUnverified ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                <BadgeX className="text-amber-500" size={28} />
                <p className="font-['Space_Grotesk',sans-serif] text-[14px] text-gray-600 font-bold uppercase tracking-[0.12em]">
                  No payment history
                </p>
                <p className="text-[12px] text-gray-400 max-w-[320px] leading-relaxed">
                  This profile is pending school confirmation, so invoices and payment history are not available yet. Please contact your school to confirm the student details.
                </p>
                <button
                  onClick={onBack}
                  className="mt-2 bg-[#003630] text-white rounded-[8px] px-5 py-2 text-[12px] font-bold uppercase tracking-[0.1em] active:scale-95 transition-transform"
                >
                  Go Back
                </button>
              </div>
            ) : (financialSummary?.items?.length ? financialSummary.items.map((item, idx) => (
              <ServiceCategoryCard
                key={item.id || idx}
                item={item}
                studentName={currentStudent?.name || "Student"}
                userName={userName || "Parent"}
                grade={currentStudent?.grade || "N/A"}
                transactions={financialSummary.transactions || []}
                hasOutstandingBalance={hasOutstandingBalance}
                onPay={() => {
                  if (onIndividualPay) {
                    onIndividualPay({
                      id: item.invoice_id || item.id || crypto.randomUUID(),
                      description: item.name,
                      amount: item.balance || 0,
                      invoiceNo: item.invoice_number || `INV-${(item.invoice_id || item.id || '').substring(0, 4)}`,
                      invoice_id: item.invoice_id,
                      studentName: currentStudent?.name || "Student",
                      studentId: selectedStudentId,
                      term: item.term,
                      academicYear: item.academic_year,
                      grade: currentStudent?.grade || "N/A"
                    });
                  }
                }}
              />
            )) : (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                <BadgeCheck className="text-[#95e36c]" size={28} />
                <p className="font-['Space_Grotesk',sans-serif] text-[13px] text-gray-500 font-bold uppercase tracking-[0.12em]">
                  No uncleared balances
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

function ServiceCategoryCard({ item, grade, transactions, onPay, studentName, userName }: { item: any, grade: string, transactions: any[], onPay: () => void, studentName: string, userName: string }) {
  const [showDetails, setShowDetails] = useState(false);
  const isCleared = (item.balance || 0) <= 0;

  const extractDate = (obj: any) => {
    if (!obj) return 'N/A';
    const keys = ['initiated_at', 'created_at', 'invoice_date', 'payment_date', 'date'];
    let val = null;
    for (let k of keys) { if (obj[k]) { val = obj[k]; break; } }
    if (!val) return 'N/A';
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(val)) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? val : parsed.toLocaleDateString('en-GB');
  };

  const relatedTxs = transactions.filter(tx => tx.invoice_id === item.invoice_id);

  const handleDownload = () => {
    try {
      const amountPaid = (item.expected || 0) - (item.balance || 0);
      generateReceiptPDF({
        schoolName: schoolName || "Master Fees Payment",
        totalAmount: amountPaid,
        refNumber: item.invoice_id?.substring(0, 12).toUpperCase() || 'REF-HIST',
        dateTime: new Date().toLocaleString(),
        scheduleId: `#${(item.invoice_id || '0').substring(0, 5)}`,
        services: [{
          id: item.id,
          description: `${item.name} ${item.term ? `(Term ${item.term})` : ''}`,
          amount: item.expected || 0,
          invoiceNo: item.invoice_number || 'N/A',
          studentName: studentName
        }],
        parentName: userName,
        admissionNumber: item.admission_number || '', // Try to find admission number in item
        isPaid: isCleared
      });
      toast.success("Receipt downloaded!");
    } catch (e) {
      toast.error("Download failed");
    }
  };

  return (
    <div
      className="rounded-[12px] p-4 relative overflow-hidden flex flex-col gap-4 shadow-[0px_8px_32px_rgba(0,0,0,0.06)] border border-white/40"
      style={{
        background: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        boxShadow: isCleared ? "inset 0 4px 0 0 #95e36c, 0 8px 32px rgba(0,0,0,0.06)" : "0 8px 32px rgba(0,0,0,0.06)"
      }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <p className="font-['Space_Grotesk',sans-serif] font-bold text-[16px] text-black m-0">{item.name}</p>
          <p className="font-['Space_Grotesk',sans-serif] font-normal text-[8px] text-black m-0">
            {grade.toLowerCase().includes('grade') ? grade : `Grade ${grade}`}
          </p>
        </div>

        {/* Status Badge — from design (Frame12 style) */}
        <div className={`flex items-center justify-center px-4 py-1.5 rounded-full gap-1 shrink-0 ${isCleared ? 'bg-[#e0f7d4]' : 'bg-[#fff0f0]'}`}>
          <div className="shrink-0">
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
              <path d="M1.4 3.8C1.4 3.1 1.6 2.5 2 2C2.4 1.5 3 1.3 3.8 1.4M3.8 1.4C4.2 1.1 4.8 0.5 5.5 0.5C6.2 0.5 6.8 1.1 7.2 1.4M7.2 1.4C8 1.3 8.6 1.5 9 2C9.4 2.5 9.6 3.1 9.6 3.8M9.6 3.8C9.9 4.2 10.5 4.8 10.5 5.5C10.5 6.2 9.9 6.8 9.6 7.2M9.6 7.2C9.7 8 9.5 8.6 9 9C8.6 9.4 8 9.6 7.2 9.6M7.2 9.6C6.8 9.9 6.2 10.5 5.5 10.5C4.8 10.5 4.2 9.9 3.8 9.6M3.8 9.6C3.1 9.7 2.5 9.5 2 9C1.6 8.6 1.4 8 1.4 7.2M1.4 7.2C1.1 6.8 0.5 6.2 0.5 5.5C0.5 4.8 1.1 4.2 1.4 3.8Z" stroke={isCleared ? "black" : "#EA3030"} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 5.5L5 6.5L7 4.5" stroke={isCleared ? "black" : "#EA3030"} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className={`font-['Space_Grotesk',sans-serif] font-bold text-[8px] m-0 ${isCleared ? 'text-[#003630]' : 'text-[#ea3030]'}`}>
            {isCleared ? 'Cleared' : 'Not Cleared'}
          </p>
        </div>
      </div>

      {/* Transactions Area — from design (Frame21/TransactionRow style) */}
      {showDetails && (
        <div className="bg-[#F5F7F9] rounded-[8px] p-3 flex flex-col gap-2">
          {/* Main Charge */}
          <div className="flex items-center justify-between gap-4 text-[12px]">
            <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal w-16 shrink-0">{extractDate(item)}</p>
            <p className="font-['Inter',sans-serif] text-[#8e8e93] font-normal flex-1 truncate">
              {item.description || `${item.name} Invoice`}
            </p>
            <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal text-right">K{item.expected?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>

          {/* Related Payments */}
          {relatedTxs.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-[12px]">
              <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal w-16 shrink-0">{extractDate(tx)}</p>
              <p className="font-['Inter',sans-serif] text-[#8e8e93] font-normal flex-1 truncate">
                {tx.description || `Paid via ${tx.payment_method?.replace('_', ' ') || 'Office'}`}
              </p>
              <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal text-right truncate">-K{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          ))}

          {/* Balance — from design (Frame19 style) */}
          <div className="mt-1 pt-2 border-t border-[#dad9d9] flex items-center justify-between gap-4">
            <p className={`font-['Space_Grotesk',sans-serif] font-bold text-[12px] ${!isCleared ? 'text-[#ea3030]' : 'text-[#b3b3b3]'}`}>Balance</p>
            <p className={`font-['Space_Grotesk',sans-serif] font-bold text-[12px] text-right ${!isCleared ? 'text-[#ea3030]' : 'text-[#b3b3b3]'}`}>
              {isCleared ? "-" : `K${(item.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </p>
          </div>
        </div>
      )}

      {/* Action Area — from design (Frame22, Frame23, PayNowButton) */}
      <div className="flex flex-col gap-[10px] mt-2">
        {!isCleared && (
          <button
            onClick={onPay}
            className="bg-[#e0f7d4] h-[50px] rounded-[8px] border-[0.5px] border-[#003630] font-['Space_Grotesk',sans-serif] font-bold text-[10px] text-black active:scale-[0.98] transition-all flex items-center justify-center shadow-sm"
          >
            Pay Now
          </button>
        )}
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => { haptics.light(); setShowDetails(!showDetails); }}
            className="flex-1 bg-[#f5f7f9] h-[50px] rounded-[8px] border border-[#d6d6d6] font-['Space_Grotesk',sans-serif] font-bold text-[10px] text-black active:scale-[0.98] transition-all flex items-center justify-center shadow-sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 h-[50px] rounded-[8px] font-['Space_Grotesk',sans-serif] font-medium text-[10px] text-[#003630] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Download size={16} className="opacity-70" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptySummaryState() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500); // Disappear after 4.5 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.9, marginTop: 0, marginBottom: 0, padding: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            paddingTop: '10px',
            boxShadow: "inset 0 4px 0 0 #95e36c, 0 12px 32px -8px rgba(0,0,0,0.08)"
          }}
          className="mx-4 mt-2 mb-4 pb-12 px-12 bg-white border-[1.5px] border-[#e5e7eb] rounded-[24px] flex flex-col items-center text-center gap-6 relative overflow-hidden origin-top"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#95e36c]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#95e36c] border-[1.5px] border-[#95e36c]/40 shadow-sm"
          >
            <CheckCircle2 size={24} />
          </motion.div>

          <div className="flex flex-col gap-2">
            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[26px] text-[#003630] tracking-[-0.5px]">Congratulations!</h3>
            <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[16px] text-[#6b7280]">
              You have no outstanding balance.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
