import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useSpring, useTransform } from "motion/react";
import { generateReceiptPDF } from "../utils/pdfGenerator";
import {
  CheckCircle2,
  AlertTriangle,
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
import type { FinancialSummary } from "../lib/supabase/api/transactions";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";
import cardBg from "../assets/background images/Frame 1707478741.png";
import posthog from "../lib/posthog";
import { useAppStore } from "../stores/useAppStore";


function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15
  });

  const display = useTransform(spring, (current) =>
    `ZMW ${current.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

function StudentTab({
  name,
  isActive,
  isUnverified,
  onClick,
}: {
  name: string;
  isActive: boolean;
  isUnverified: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        haptics.selection();
        onClick();
      }}
      className={`flex items-center gap-[10px] px-[25px] h-[42px] rounded-xl shrink-0 transition-all active:scale-95 ${isActive ? "bg-[#F3FCF0] outline outline-1 outline-[#95E36C]" : ""
        }`}
      style={{
        outline: isActive ? "1px solid #95E36C" : "1px solid #F2F2F2",
        outlineOffset: "0px",
        background: isActive ? "#F3FCF0" : "#FFFFFF",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
      }}
    >
      {isActive && (
        <div data-svg-wrapper>
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="3" cy="3" r="3" fill="#4FE501" />
          </svg>
        </div>
      )}
      <div
        className="text-[12px] font-['Space_Grotesk'] whitespace-nowrap flex items-center gap-2"
        style={{
          color: isActive ? "black" : "#2D2D2D",
          fontWeight: isActive ? 700 : 500,
        }}
      >
        <span>{name}</span>
        {isUnverified && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-black uppercase tracking-tighter">
            Review
          </span>
        )}
      </div>
    </button>
  );
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const syncVersion = useAppStore((state) => state.syncVersion);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const selectedSchoolId = useAppStore(state => state.selectedSchoolId);
  const historyStudents = students; // Include all students, even unverified ones, for history visibility

  // 1. Fetch Students on Mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudentsByPhone(userPhone, selectedSchoolId || undefined);
        setStudents(data);
        const eligibleStudents = data; // Allow selection of all students
        if (eligibleStudents.length > 0) {
          setSelectedStudentId(eligibleStudents[0].id);
        } else {
          setSelectedStudentId('');
          setFinancialSummary(null);
        }
      } catch (e) {
        console.error("Error loading students:", e);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadStudents();
  }, [userPhone, syncVersion]);

  // 2. Fetch Financial Summary when selected student changes
  useEffect(() => {
    if (!selectedStudentId) return;

    posthog.capture({
      event: 'history_student_switched',
      properties: { student_id: selectedStudentId }
    });

    const loadSummary = async () => {
      setIsSummaryLoading(true);
      try {
        const summary = await getStudentFinancialSummary(selectedStudentId);
        setFinancialSummary(summary);
      } catch (e) {
        console.error("Error loading summary:", e);
      } finally {
        setIsSummaryLoading(false);
      }
    };
    loadSummary();
  }, [selectedStudentId, syncVersion]);


  useEffect(() => {
    if (!selectedStudentId) return;
    const stillVisible = historyStudents.some(student => student.id === selectedStudentId);
    if (!stillVisible) {
      setSelectedStudentId(historyStudents[0]?.id || '');
    }
  }, [historyStudents, selectedStudentId]);

  const hasOutstandingBalance = (financialSummary?.totalBalance ?? 0) > 0;
  const currentStudent = historyStudents.find(s => s.id === selectedStudentId);

  return (
    <div className="bg-[#f8fafc] min-h-screen w-full overflow-hidden flex flex-col">
      <div className="relative w-full max-w-lg h-screen mx-auto flex flex-col bg-[#f9fafb]">

        <LogoHeader />

        {/* Dash Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">

          {isInitialLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Loader2 className="animate-spin text-[#95e36c]" size={40} strokeWidth={1.5} />
                <div className="absolute inset-0 blur-md bg-[#95e36c]/20 rounded-full animate-pulse" />
              </div>
              <p className="font-['Space_Grotesk',sans-serif] text-[13px] text-gray-400 font-bold uppercase tracking-[0.2em] animate-pulse">
                Fetching Profiles
              </p>
            </div>
          ) : historyStudents.length === 0 ? (
            <EmptyHistoryState onBack={onBack} />
          ) : (
            <>
              {/* Emerald Card — from design (Frame17/Frame1 style) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
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
                  <div className="flex-1 overflow-hidden">
                    <div className="font-['Space_Grotesk',sans-serif] font-bold text-[32px] tracking-[-1px] leading-tight m-0 text-white flex items-center gap-3">
                      {isSummaryLoading ? (
                        <div className="flex items-center gap-2">
                          <span className="opacity-50 text-[24px]">ZMW</span>
                          <Loader2 className="animate-spin size-6 text-[#95e36c]" />
                        </div>
                      ) : currentStudent?.verificationStatus === 'unverified' ? (
                        "Under Review"
                      ) : hasOutstandingBalance ? (
                        <AnimatedNumber value={financialSummary?.totalBalance ?? 0} />
                      ) : (
                        "ZMW 0"
                      )}
                    </div>
                  </div>

                  {!isSummaryLoading && hasOutstandingBalance && currentStudent?.verificationStatus !== 'unverified' && (
                    <button
                      onClick={() => {
                        haptics.heavy();
                        if (onClearBalances) {
                          const studentIds = historyStudents.map(s => s.id);
                          onClearBalances(studentIds);
                        } else {
                          toast.info('Going to checkout...');
                        }
                      }}
                      className="bg-[#95e36c] rounded-[8px] px-6 py-2 shadow-[0px_4px_12px_rgba(0,0,0,0.15)] active:scale-95 transition-transform shrink-0"
                    >
                      <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#003630] text-[12px]">
                        Settle All
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Child Selector Tabs — Moved below Emerald Card */}
              <div className="h-[70px] flex items-center gap-4 px-6 overflow-x-auto no-scrollbar bg-transparent mt-4">
                {historyStudents.map(student => (
                  <StudentTab
                    key={student.id}
                    name={student.name}
                    isUnverified={student.verificationStatus === 'unverified'}
                    isActive={selectedStudentId === student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                  />
                ))}
              </div>

              {/* Content Area — from design (FeesSection style) */}
              <div className="mt-8 px-4 space-y-4">
                <p className="font-['Space_Grotesk',sans-serif] font-bold text-[12px] text-gray-400 uppercase tracking-[0.2em] mb-4">
                  Fees & Payments
                </p>

                {isSummaryLoading ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-[#95e36c]" size={24} />
                    <p className="text-[12px] text-gray-400">Loading payment history...</p>
                  </div>
                ) : (!financialSummary || !financialSummary.items || financialSummary.items.length === 0) ? (
                  <EmptySummaryState onBack={onBack} />
                ) : (
                  financialSummary.items.map((item, idx) => (
                    <ServiceCategoryCard
                      key={item.id || idx}
                      item={item}
                      schoolName={schoolName || currentStudent?.schoolName || "Institutional Fees"}
                      schoolLogo={schoolLogo}
                      studentName={currentStudent?.name || "Student"}
                      userName={userName || "Parent"}
                      grade={currentStudent?.grade || "N/A"}
                      transactions={financialSummary.transactions || []}
                      hasOutstandingBalance={hasOutstandingBalance}
                      onPay={(txs) => {
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
                            grade: currentStudent?.grade || "N/A",
                            paymentHistory: txs.map(tx => ({
                              date: extractDate(tx),
                              method: tx.payment_method?.replace('_', ' ') || 'Office',
                              amount: tx.amount,
                              description: tx.description
                            }))
                          });
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function ServiceCategoryCard({ item, grade, transactions, onPay, studentName, userName, schoolName, schoolLogo }: { item: any, grade: string, transactions: any[], onPay: (txs: any[]) => void, studentName: string, userName: string, schoolName: string, schoolLogo?: string | null }) {
  const [showDetails, setShowDetails] = useState(false);
  const normalizedBalance = Math.max(0, Number(item.balance || 0));
  const isCleared = normalizedBalance <= 0;
  const relatedTxs = Array.isArray(item.transactions) && item.transactions.length > 0
    ? item.transactions
    : transactions.filter(tx =>
      tx.invoice_id === item.invoice_id
      || tx.linked_invoice_id === item.invoice_id
      || tx.meta_data?.invoice_id === item.invoice_id
      || tx.meta_data?.invoice_no === item.invoice_number
      || tx.meta_data?.invoice_number === item.invoice_number
    );
  const amountPaid = Number(
    item.collected
    ?? relatedTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  );
  const creditApplied = Number(item.credit_applied || 0);

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

  const handleDownload = () => {
    try {
      posthog.capture({
        event: 'history_receipt_downloaded',
        properties: {
          invoice_number: item.invoice_number,
          student_name: studentName,
          amount_paid: amountPaid
        }
      });
      generateReceiptPDF({
        schoolName: schoolName,
        totalAmount: amountPaid,
        refNumber: item.invoice_id?.substring(0, 12).toUpperCase() || 'REF-HIST',
        dateTime: new Date().toLocaleString(),
        scheduleId: `#${(item.invoice_id || '0').substring(0, 5)}`,
        grade: grade,
        services: [{
          id: item.id,
          description: `${item.name} ${item.term ? `(Term ${item.term})` : ''}`,
          amount: item.expected || 0,
          invoiceNo: item.invoice_number || 'N/A',
          studentName: studentName,
          studentId: item.student_id || item.admission_number || '',
          grade: grade
        }],
        parentName: userName,
        admissionNumber: item.admission_number || '', // Try to find admission number in item
        isPaid: isCleared,
        schoolLogo: schoolLogo,
        paymentHistory: relatedTxs.map(tx => ({
          date: extractDate(tx),
          method: tx.payment_method?.replace('_', ' ') || 'Office',
          amount: tx.amount,
          description: tx.description
        }))
      });
      toast.success("Receipt downloaded!");
    } catch (e) {
      toast.error("Download failed");
    }
  };


  return (
    <div
      className="rounded-[12px] p-4 relative overflow-hidden flex flex-col gap-4 border border-white/40"
      style={{
        background: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        boxShadow: isCleared
          ? "inset 0 4px 0 0 #95e36c, 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05), 0 20px 25px -5px rgba(0,0,0,0.05)"
          : "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05), 0 20px 25px -5px rgba(0,0,0,0.05)"
      }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-black m-0" style={{ fontSize: '13px' }}>{item.name}</p>
          <p className="font-['Space_Grotesk',sans-serif] font-normal text-black m-0" style={{ fontSize: '8px' }}>
            {grade.toLowerCase().includes('grade') ? grade : `Grade ${grade}`}
          </p>
        </div>

        {/* Status Badge — from design (Frame12 style) */}
        <div className={`flex items-center justify-center px-4 py-1.5 rounded-full gap-1 shrink-0 ${isCleared ? 'bg-[#e0f7d4]' : 'bg-[#fff0f0]'}`}>
          <div className="shrink-0">
            {isCleared ? (
              <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                <path d="M1.4 3.8C1.4 3.1 1.6 2.5 2 2C2.4 1.5 3 1.3 3.8 1.4M3.8 1.4C4.2 1.1 4.8 0.5 5.5 0.5C6.2 0.5 6.8 1.1 7.2 1.4M7.2 1.4C8 1.3 8.6 1.5 9 2C9.4 2.5 9.6 3.1 9.6 3.8M9.6 3.8C9.9 4.2 10.5 4.8 10.5 5.5C10.5 6.2 9.9 6.8 9.6 7.2M9.6 7.2C9.7 8 9.5 8.6 9 9C8.6 9.4 8 9.6 7.2 9.6M7.2 9.6C6.8 9.9 6.2 10.5 5.5 10.5C4.8 10.5 4.2 9.9 3.8 9.6M3.8 9.6C3.1 9.7 2.5 9.5 2 9C1.6 8.6 1.4 8 1.4 7.2M1.4 7.2C1.1 6.8 0.5 6.2 0.5 5.5C0.5 4.8 1.1 4.2 1.4 3.8Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 5.5L5 6.5L7 4.5" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <AlertTriangle size={10} color="#ea3030" />
            )}
          </div>
          <p
            className="font-['Space_Grotesk',sans-serif] font-bold text-[8px] m-0"
            style={{ color: isCleared ? '#003630' : '#ea3030' }}
          >
            {isCleared ? 'Cleared' : `ZMW ${normalizedBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
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
            <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal text-right">ZMW {item.expected?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>

          {/* Related Payments */}
          {relatedTxs.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-[12px]">
              <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal w-16 shrink-0">{extractDate(tx)}</p>
              <p className="font-['Inter',sans-serif] text-[#8e8e93] font-normal flex-1 truncate">
                {tx.description || `Paid via ${tx.payment_method?.replace('_', ' ') || 'Office'}`}
              </p>
              <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal text-right truncate">-ZMW {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          ))}

          {creditApplied > 0 && (
            <div className="flex items-center justify-between gap-4 text-[12px]">
              <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal w-16 shrink-0">Auto</p>
              <p className="font-['Inter',sans-serif] text-[#8e8e93] font-normal flex-1 truncate">
                Credit applied from previous payments
              </p>
              <p className="font-['Space_Grotesk',sans-serif] text-[#8e8e93] font-normal text-right truncate">-ZMW {creditApplied.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          )}

          {/* Balance — from design (Frame19 style) */}
          <div className="mt-1 pt-2 border-t border-[#dad9d9] flex items-center justify-between gap-4">
            <p className={`font-['Space_Grotesk',sans-serif] font-bold text-[12px] ${!isCleared ? 'text-[#ea3030]' : 'text-[#b3b3b3]'}`}>{isCleared ? 'Balance Settled' : 'Balance Due'}</p>
            <p className={`font-['Space_Grotesk',sans-serif] font-bold text-[12px] text-right ${!isCleared ? 'text-[#ea3030]' : 'text-[#b3b3b3]'}`}>
              {`ZMW ${normalizedBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </p>
          </div>
        </div>
      )}

      {/* Action Area — from design (Frame22, Frame23, PayNowButton) */}
      <div className="flex flex-col gap-[10px] mt-2">
        {!isCleared && (
          <button
            onClick={() => onPay(relatedTxs)}
            className="bg-[#e0f7d4] h-[40px] rounded-[8px] border-[0.5px] border-[#003630] font-['Space_Grotesk',sans-serif] font-bold text-black active:scale-[0.98] transition-all flex items-center justify-center shadow-[0px_4px_12px_rgba(0,0,0,0.08)]"
            style={{ fontSize: '9px' }}
          >
            Pay Now
          </button>
        )}
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => { haptics.light(); setShowDetails(!showDetails); }}
            className="flex-1 bg-[#f5f7f9] h-[40px] rounded-[8px] border border-[#d6d6d6] font-['Space_Grotesk',sans-serif] font-bold text-black active:scale-[0.98] transition-all flex items-center justify-center shadow-[0px_4px_12px_rgba(0,0,0,0.08)]"
            style={{ fontSize: '9px' }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 h-[40px] rounded-[8px] font-['Space_Grotesk',sans-serif] font-bold text-[#003630] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(0,0,0,0.03)]"
            style={{ fontSize: '9px' }}
          >
            <Download size={14} className="opacity-70" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptySummaryState({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-4 mt-4 mb-6 px-5 pt-7 pb-8 bg-white/80 border border-white/40 rounded-[12px] flex flex-col items-center text-center relative overflow-hidden shadow-[0px_8px_32px_rgba(0,0,0,0.06)]"
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#d1d5db]" />
      <div className="flex flex-col gap-1.5">
        <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-[20px] text-[#6b7280] tracking-[-0.4px]">
          No Balance
        </h3>
        <p className="font-['Inter',sans-serif] text-[12px] text-[#9ca3af] max-w-[250px] leading-relaxed">
          This student has no outstanding fees right now. When new invoices are posted, they will appear here.
        </p>
      </div>

      <button
        onClick={() => {
          haptics.light();
          onBack();
        }}
        className="mt-5 px-4 py-2 rounded-[10px] border border-[#d1d5db] bg-[#f9fafb] text-[#6b7280] font-['Space_Grotesk',sans-serif] font-bold text-[8px] uppercase tracking-[0.16em] hover:bg-[#f3f4f6] transition-all"
      >
        Go Back
      </button>
    </motion.div>
  );
}

function EmptyHistoryState({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-4 mt-6 mb-6 rounded-[12px] border border-white/40 bg-white/80 px-5 pt-7 pb-8 text-center shadow-[0px_8px_32px_rgba(0,0,0,0.06)]"
    >
      <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-[17px] text-[#003630] tracking-[-0.3px]">
        No students to show
      </h3>
      <p className="mt-2 font-['Inter',sans-serif] text-[12px] leading-relaxed text-[#6b7280] max-w-[260px] mx-auto">
        Financial history appears here only for students already linked to your account and eligible for payments.
      </p>
      <button
        onClick={() => {
          haptics.light();
          onBack();
        }}
        className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-[#003630] px-4 py-2 font-['Space_Grotesk',sans-serif] font-bold text-[8px] uppercase tracking-[0.16em] text-white shadow-[0_8px_20px_rgba(0,54,48,0.2)] transition-all hover:bg-[#06483f]"
      >
        Go Back
      </button>
    </motion.div>
  );
}

function extractDate(row: any) {
  const rawDate = row.created_at || row.payment_date || row.date;
  if (!rawDate) return 'N/A';
  try {
    return new Date(rawDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return String(rawDate);
  }
}
