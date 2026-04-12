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
import { getStudentFinancialSummary } from "../lib/supabase/api/registration";
import { getStudentsByPhone } from "../data/students";
import type { Student } from "../data/students";
import type { FinancialSummary } from "../lib/supabase/api/registration";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";
import cardBg from "../assets/background images/Frame 1707478741.png";

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
  }, [selectedStudentId]);

  const hasOutstandingBalance = (financialSummary?.totalBalance ?? 0) > 0;
  const currentStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="bg-[#f8fafc] min-h-screen w-full overflow-hidden flex flex-col">
      <div className="relative w-full max-w-lg h-screen mx-auto flex flex-col bg-[#f9fafb]">

        {/* Header */}
        <LogoHeader onBack={onBack} showBackButton={false} />

        {/* Dash Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-8">

          {/* Emerald Card — with Settle All Balances button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundImage: `url(${cardBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '24px',
              padding: '32px 28px',
              minHeight: '160px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -12px rgba(0,54,48,0.35)',
              margin: '0 16px 24px 16px',
            }}
          >


            <div className="flex flex-col gap-4 -translate-y-1 relative z-10 w-full">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#95e36c] shadow-[0_0_8px_rgba(149,227,108,0.4)]" />
                <p className="font-['Space_Grotesk',sans-serif] font-bold text-[12px] text-[#95e36c] tracking-[0px] m-0 uppercase">
                  {currentStudent?.name?.split(' ')[0] || 'Student'}'s Current Balance
                </p>
              </div>
              <div className="overflow-hidden">
                <p className="font-['Space_Grotesk',sans-serif] font-bold text-[40px] text-white tracking-[-1px] leading-[1] m-0">
                  {isLoading ? "---" : (
                    <AnimatedNumber value={financialSummary?.totalBalance ?? 0} />
                  )}
                </p>
              </div>
            </div>

            {/* Settle All Balances Button */}
            {hasOutstandingBalance && !isLoading && (
              <button
                onClick={() => {
                  haptics.heavy();
                  if (onClearBalances) {
                    const studentIds = students.map(s => s.id);
                    onClearBalances(studentIds);
                  } else {
                    toast.info('Going to checkout...');
                  }
                }}
                className="bg-[#95e36c] relative z-10 rounded-[14px] px-5 py-3 flex items-center justify-center shadow-[0px_8px_16px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
              >
                <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] text-[9px] tracking-[-0.2px] whitespace-nowrap">
                  Settle All Balances
                </span>
              </button>
            )}
          </motion.div>

          {/* Child Selector Tabs */}
          <div className="flex items-center gap-6 px-4 mt-6 mb-8 overflow-x-auto no-scrollbar">
            {students.map(student => {
              const isActive = selectedStudentId === student.id;

              return (
                <button
                  key={student.id}
                  onClick={() => {
                    haptics.selection();
                    setSelectedStudentId(student.id);
                  }}
                  className={`
                    group flex items-center gap-3 shrink-0 transition-all duration-300
                    ${isActive
                      ? "bg-[#F5F7F9] border-2 border-[#BCBCBC] rounded-[12px] px-6 py-3.5 shadow-[0_4px_0_0_#BCBCBC,0_8px_16px_-4px_rgba(0,0,0,0.1)] translate-y-[-1px]"
                      : "bg-transparent px-4 py-3.5"
                    }
                  `}
                >
                  <div className={`
                    w-[12px] h-[12px] rounded-full transition-all duration-500 shrink-0
                    ${isActive ? "bg-[#95e36c] scale-100 opacity-100 shadow-[0_0_8px_rgba(149,227,108,0.3)]" : "bg-[#95e36c] scale-0 opacity-0"}
                  `} />
                  <span className={`
                    font-['Space_Grotesk',sans-serif] text-[10px] whitespace-nowrap transition-colors
                    ${isActive ? "font-bold text-[#000000]" : "font-medium text-[#000000CC]"}
                  `}>
                    {student.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#95e36c]" size={32} />
                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">Reconciling Ledger...</p>
              </div>
            ) : !hasOutstandingBalance ? (
              <div className="space-y-4">
                <div className="pt-2">
                  <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Service History</p>
                  {financialSummary?.items && financialSummary.items.length > 0 && (
                    financialSummary.items.map((item, idx) => (
                      <ServiceCategoryCard
                        key={item.id || idx}
                        item={item}
                        studentName={currentStudent?.name || "Student"}
                        userName={userName || "Parent"}
                        grade={currentStudent?.grade || "N/A"}
                        transactions={financialSummary.transactions || []}
                        hasOutstandingBalance={hasOutstandingBalance}
                        onPay={() => { }}
                      />
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">Action Required</p>
                {financialSummary?.items?.map((item, idx) => (
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
                      } else {
                        toast.info('Pay action clicked!');
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function ServiceCategoryCard({ item, grade, transactions, hasOutstandingBalance, onPay, studentName, userName }: { item: any, grade: string, transactions: any[], hasOutstandingBalance: boolean, onPay: () => void, studentName: string, userName: string }) {
  // Use user's design styles exactly
  const [isExpanded, setIsExpanded] = useState(false);
  const isCleared = (item.balance || 0) <= 0;

  const extractDate = (obj: any) => {
    if (!obj) return 'N/A';

    // Try to find any date-like string property
    const keys = ['initiated_at', 'created_at', 'invoice_date', 'payment_date', 'date', 'issue_date', 'timestamp'];
    let val = null;
    for (let k of keys) {
      if (obj[k]) { val = obj[k]; break; }
    }

    if (!val) {
      // Fallback: look for any key ending in _at, _date, or containing date
      for (let k of Object.keys(obj)) {
        if ((k.endsWith('_at') || k.includes('date')) && typeof obj[k] === 'string' && /[0-9]/.test(obj[k])) {
          val = obj[k]; break;
        }
      }
    }

    if (!val) return 'N/A';

    // If it's already in DD/MM/YYYY format, keep it as is
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(val)) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? val : parsed.toLocaleDateString('en-GB');
  };

  const relatedTxs = transactions.filter(tx =>
    tx.invoice_id === item.invoice_id
  );

  const handleDownload = () => {
    try {
      const amountPaid = item.expected - (item.balance || 0);
      generateReceiptPDF({
        schoolName: "School Fees Payment",
        totalAmount: amountPaid,
        refNumber: item.invoice_id?.substring(0, 12).toUpperCase() || 'REF-HIST',
        dateTime: new Date().toLocaleString(),
        scheduleId: `#${(item.invoice_id || '0').substring(0, 5)}`,
        services: [{
          id: item.id,
          description: item.name,
          amount: amountPaid,
          invoiceNo: item.invoice_number || 'N/A',
          studentName: studentName
        }],
        parentName: userName
      });
      toast.success("Receipt downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    }
  };

  return (
    <div className="bg-white rounded-[24px] mx-4 mb-4 ring-1 ring-[#e1e4e8] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)] p-5 flex flex-col relative overflow-hidden">
      {/* Decorative Accent */}
      {isCleared && <div className="absolute top-0 right-0 w-24 h-24 bg-[#95e36c]/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />}

      {/* Card Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex flex-col gap-1 pr-2">
          <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-[18px] text-[#003630] tracking-[-0.3px] leading-tight">
            {item.name} {item.term && `- Term ${item.term}`}
          </h3>
          <p className="font-['Space_Grotesk',sans-serif] font-medium text-[13px] text-[#6b7280]">
            {grade.toLowerCase().includes('grade') ? grade : `Grade ${grade}`}
          </p>
        </div>

        {/* Badge */}
        {isCleared ? (
          <div className="flex items-center gap-2 px-1 py-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#95e36c] shadow-[0_0_8px_rgba(149,227,108,0.4)]" />
            <span className="font-['Space_Grotesk',sans-serif] font-bold text-[11px] text-[#003630] uppercase tracking-wider">Cleared</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-1 py-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] shadow-[0_0_8px_rgba(255,107,107,0.3)]" />
            <span className="font-['Space_Grotesk',sans-serif] font-bold text-[11px] text-[#003630] uppercase tracking-wider">Not Cleared</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden relative z-10"
          >
            <div className="mt-5 flex flex-col gap-3">
              {/* Transaction Row */}
              <div className="flex justify-between items-center bg-[#f9fafb] p-3 rounded-[14px]">
                <div className="flex flex-col gap-1 min-w-0 pr-2">
                  <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] text-[#003630] truncate">{item.name} Charge</span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[11px] text-[#6b7280]">
                    {extractDate(item)}
                  </span>
                </div>
                <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630] shrink-0">
                  K{item.expected?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {relatedTxs.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 pl-3">
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[13px] text-[#6b7280] truncate">Paid via {tx.payment_method?.replace('_', ' ') || 'Office'}</span>
                    <span className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[11px] text-gray-400">
                      {extractDate(tx)}
                    </span>
                  </div>
                  <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630] shrink-0">
                    -K{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}

              <div className="h-px w-full bg-gray-100 my-1" />

              <div className="flex justify-between items-center pb-1 px-1 mt-1">
                <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] text-[#6b7280] uppercase tracking-widest">Balance</span>
                <span className={`font-['IBM_Plex_Sans_Devanagari:ExtraBold',sans-serif] font-[900] text-[24px] tracking-[-0.5px] ${isCleared ? 'text-[#d1d5db]' : 'text-[#ff6b6b]'}`}>
                  {isCleared ? "K0.00" : `K${(item.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {hasOutstandingBalance && !isCleared && (
        <div className="relative mt-5 w-full z-10">
          <div className="absolute -top-1 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-20"></div>
          <button
            onClick={onPay}
            style={{
              backgroundColor: '#E0F7D4',
              borderColor: '#003630',
              borderWidth: '1.5px',
              borderStyle: 'solid'
            }}
            className="w-full h-[46px] rounded-[8px] flex items-center justify-center gap-2 shadow-[0px_2px_8px_rgba(0,0,0,0.05)] active:scale-95 transition-all group relative z-10"
          >
            <span style={{ color: '#003630' }} className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] tracking-[-0.2px]">Pay Now</span>
          </button>
        </div>
      )}

      <div className={`flex items-center gap-3 relative z-10 ${isExpanded || (!isCleared && hasOutstandingBalance) ? 'mt-4' : 'mt-5'}`}>
        <button
          onClick={() => {
            haptics.light();
            setIsExpanded(!isExpanded);
          }}
          className="flex-1 h-12 bg-[#F5F7F9] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Space_Grotesk',sans-serif] font-bold text-[#003630] text-[14px] active:scale-[0.98] transition-all flex items-center justify-center shadow-sm"
        >
          {isExpanded ? "Hide Details" : "Show Details"}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 h-12 bg-transparent font-['Space_Grotesk',sans-serif] font-semibold flex text-[14px] items-center justify-center gap-2 text-[#003630]/70 active:scale-[0.98] transition-all hover:bg-gray-50 rounded-[16px]"
        >
          <Download size={16} />
          <span>Receipt</span>
        </button>
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
          style={{ paddingTop: '10px' }}
          className="mx-4 mt-2 mb-4 pb-12 px-12 bg-white border-[1.5px] border-[#e5e7eb] rounded-[24px] flex flex-col items-center text-center gap-6 shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.08)] relative overflow-hidden origin-top"
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
