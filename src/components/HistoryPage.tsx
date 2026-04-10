import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Download,
  Wallet,
  Settings,
  ChevronLeft,
  CreditCard,
  Loader2
} from "lucide-react";
import LogoHeader from "./common/LogoHeader";
import { getStudentFinancialSummary } from "../lib/supabase/api/registration";
import { getStudentsByPhone } from "../data/students";
import type { Student } from "../data/students";
import type { FinancialSummary } from "../lib/supabase/api/registration";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";

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
    paymentData: any
  ) => void;
}

export default function HistoryPage({ 
  userPhone, 
  onBack, 
  schoolName,
  schoolLogo
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
        <LogoHeader onBack={onBack} showBackButton={true} />

        {/* Dash Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          <div className="px-5 pt-4 space-y-6">
            
            {/* Balance Hero */}
            <BalanceHero 
              summary={financialSummary} 
              studentName={currentStudent?.name || "Student"} 
              isLoading={isLoading}
              onSettleAll={() => {
                haptics.heavy();
                toast.info('Going to checkout...');
              }}
              hasOutstandingBalance={hasOutstandingBalance}
            />

            {/* Student Select Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
              {students.map(student => (
                <StudentTab 
                  key={student.id}
                  name={student.name}
                  isActive={selectedStudentId === student.id}
                  onClick={() => {
                    haptics.selection();
                    setSelectedStudentId(student.id);
                  }}
                />
              ))}
            </div>

            {/* Content Logic based on User Prompt (State 1 vs State 2) */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-[#95e36c]" size={32} />
                  <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">Reconciling Ledger...</p>
                </div>
              ) : !hasOutstandingBalance ? (
                // State 1: No Balance
                <div className="space-y-4">
                  <EmptySummaryState />
                  
                  {/* Keep the history intact as requested (rest of list) */}
                  <div className="pt-2">
                    <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Service History</p>
                    {financialSummary?.items && financialSummary.items.length > 0 && (
                      financialSummary.items.map((item, idx) => (
                        <ServiceCategoryCard 
                          key={item.id || idx}
                          item={item}
                          grade={currentStudent?.grade || "N/A"}
                          transactions={financialSummary.transactions || []}
                          hasOutstandingBalance={hasOutstandingBalance}
                          onPay={() => {}}
                        />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // State 2: Has Balance
                <div className="space-y-4 pt-2">
                  <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-2">Action Required</p>
                  {financialSummary?.items && financialSummary.items.length > 0 ? (
                    financialSummary.items.map((item, idx) => (
                      <ServiceCategoryCard 
                        key={item.id || idx}
                        item={item}
                        grade={currentStudent?.grade || "N/A"}
                        transactions={financialSummary.transactions || []}
                        hasOutstandingBalance={hasOutstandingBalance}
                        onPay={() => {
                          toast.info('Pay action clicked!');
                        }}
                      />
                    ))
                  ) : (
                    <EmptySummaryState />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentTab({ name, isActive, onClick }: { name: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-[42px] px-5 rounded-[12px] flex items-center gap-2.5 transition-all shrink-0 active:scale-95 ${
        isActive 
          ? "bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.05)] border border-[#f1f3f5] z-10" 
          : "bg-transparent border border-gray-200 text-[#9ca3af]"
      }`}
    >
      {isActive && (
        <div className="relative">
          <div className="size-[6px] rounded-full bg-[#95e36c] shadow-[0_0_8px_#95e36c]" />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 size-[6px] rounded-full bg-[#95e36c]"
          />
        </div>
      )}
      <span className={`text-[13px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] ${isActive ? "text-[#003630]" : ""}`}>
        {name.split(' ')[0]} {name.split(' ').slice(-1)}
      </span>
    </button>
  );
}

function BalanceHero({ summary, studentName, isLoading, onSettleAll, hasOutstandingBalance }: { summary: FinancialSummary | null, studentName: string, isLoading: boolean, onSettleAll: () => void, hasOutstandingBalance: boolean }) {
  const balance = summary?.totalBalance ?? 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-[120px] rounded-[16px] bg-gradient-to-br from-[#0c513f] to-[#043329] p-5 flex flex-col justify-center overflow-hidden shadow-md"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#95e36c]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex justify-between items-center w-full relative z-10">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold text-[#95e36c] uppercase tracking-wider font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">
            {studentName.split(' ')[0]}'s Current Balance
          </p>
          <span className="text-white text-[32px] font-black tracking-tight font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-tight">
            {isLoading ? "---" : `K${balance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
          </span>
        </div>

        {hasOutstandingBalance && !isLoading && (
          <button 
            onClick={onSettleAll}
            className="bg-[#95e36c] text-[#003630] h-10 px-4 rounded-[8px] text-[12px] font-black tracking-wide active:scale-95 transition-all font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]"
          >
            Settle All Balances
          </button>
        )}
      </div>

    </motion.div>
  );
}

function ServiceCategoryCard({ item, grade, transactions, hasOutstandingBalance, onPay }: { item: any, grade: string, transactions: any[], hasOutstandingBalance: boolean, onPay: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCleared = (item.balance || 0) <= 0;
  
  const relatedTxs = transactions.filter(tx => 
    tx.invoice_id === item.invoice_id
  );

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-5 shadow-sm mb-4 transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-1">
          <h3 className="text-[15px] font-black text-[#003630] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-none">{item.name} - Term {item.term || '1'}</h3>
          <p className="text-[10px] text-gray-500 font-medium font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">Grade {grade}</p>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          isCleared 
          ? "bg-[#f0fdf4] border-emerald-100 text-emerald-600" 
          : "bg-red-50 border-red-100 text-red-500"
        }`}>
          {isCleared ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
          <span className="text-[9px] font-bold uppercase tracking-wide leading-none">
            {isCleared ? "Cleared" : "Not Cleared"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 opacity-80 font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif]">
                  <span className="shrink-0 w-20 text-gray-400">{new Date(item.initiated_at).toLocaleDateString('en-GB')}</span>
                  <span className="flex-1 truncate pr-2">{item.name} Service Charge</span>
                  <span className="font-semibold text-gray-600">K{item.expected?.toLocaleString(undefined, { minimumFractionDigits: 1 }) || '0.0'}</span>
                </div>
                
                {relatedTxs.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] text-gray-500 opacity-80 font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif]">
                    <span className="shrink-0 w-20 text-gray-400">{new Date(tx.created_at).toLocaleDateString('en-GB')}</span>
                    <span className="flex-1 truncate pr-2">Paid through {tx.payment_method?.replace('_', ' ') || 'Office'}</span>
                    <span className="font-semibold text-gray-600">-K{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                  </div>
                ))}

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-red-500 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">Balance</span>
                  <span className="text-[13px] font-black text-red-500 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">{isCleared ? "-" : `K${(item.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-col gap-3 ${isExpanded ? "pt-2" : "pt-4"}`}>
        {/* DO NOT SHOW PAY NOW IF hasOutstandingBalance IS FALSE */}
        {hasOutstandingBalance && !isCleared && (
          <button
            onClick={onPay}
            className="w-full h-11 rounded-[8px] bg-[#e0f7d4] text-[#003630] font-bold text-[14px] active:scale-[0.98] transition-all flex items-center justify-center font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] hover:bg-[#d0edc2]"
          >
            Pay Now
          </button>
        )}

        <div className="flex items-center justify-between w-full relative gap-2">
          <button
            onClick={() => {
              haptics.light();
              setIsExpanded(!isExpanded);
            }}
            className="flex-1 h-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[#003630] text-[12px] font-bold active:scale-95 transition-all flex items-center justify-center hover:bg-gray-100 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif]"
          >
            {isExpanded ? "Hide Details" : "Show Details"}
          </button>

          <button className="flex-1 h-10 flex items-center justify-center text-[12px] font-bold text-[#003630] active:scale-95 transition-all font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif]">
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptySummaryState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-12 bg-white border border-[#e5e7eb] rounded-[16px] flex flex-col items-center justify-center text-center gap-4 px-6 shadow-sm mb-4"
    >
      <div className="size-16 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#95e36c] shadow-inner border border-emerald-50">
        <CheckCircle2 size={32} />
      </div>
      <div className="space-y-1">
        <h3 className="text-[18px] font-black text-[#003630] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">You're all caught up 🎉</h3>
        <p className="text-[12px] text-gray-400 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
          You have no outstanding balance.
        </p>
      </div>
    </motion.div>
  );
}
