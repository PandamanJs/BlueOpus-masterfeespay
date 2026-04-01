import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { type StudentData } from '../../lib/supabase/api/registration';
import { getStudentsOutstandingBalances } from '../../lib/supabase/api/transactions';
import { haptics } from '../../utils/haptics';
import LogoHeader from '../common/LogoHeader';

interface ReviewPageProps {
  students: StudentData[];
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export default function ReviewPage({ students, onBack, onConfirm, isSubmitting }: ReviewPageProps) {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);

  useEffect(() => {
    async function fetchBalances() {
      setIsLoadingBalances(true);
      try {
        const studentIds = students.map(s => s.id);
        const data = await getStudentsOutstandingBalances(studentIds);
        setBalances(data);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      } finally {
        setIsLoadingBalances(false);
      }
    }
    fetchBalances();
  }, [students]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 2
    }).format(amount).replace('ZMW', 'K');
  };

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader showBackButton onBack={onBack} />

      <div className="flex-1 px-6 pt-10 pb-40 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-[10px] mb-[12px]">
            <div className="w-[4px] h-[28px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full shadow-[0_2px_8px_rgba(149,227,108,0.3)]" />
            <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.8px]">
              Final Review
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 tracking-[-0.2px] leading-relaxed pl-[14px]">
            Please confirm your records and institutional financial standing below.
          </p>
        </motion.div>

        {/* Accuracy Disclaimer - High Trust Header */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="mb-8 px-4"
        >
          <p className="text-[12px] text-center text-gray-400 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-relaxed">
            Please ensure the balances below are accurate. If you notice a discrepancy, contact the school administrator before proceeding.
          </p>
        </motion.div>

        {/* Students List - Luxe Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-[8px] pl-2 mb-2">
            <div className="w-[3px] h-[16px] bg-[#95e36c] rounded-full" />
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">
              Verifying Records ({students.length})
            </label>
          </div>

          {students.map((student, index) => {
            const balance = balances[student.id] || 0;
            const hasOverdue = balance > 0;

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (index * 0.05) }}
                className="bg-white rounded-[24px] p-5 border-[1.5px] border-[#e5e7eb] shadow-sm relative overflow-hidden group"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${hasOverdue ? 'bg-amber-400' : 'bg-[#95e36c]'}`} />
                
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630] tracking-[-0.4px] leading-tight mb-1">
                      {student.name}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-0.5">
                       <span className="text-[12px] font-medium text-gray-400">{student.grade} — {student.class}</span>
                       {student.parentName && (
                        <span className="text-[12px] text-[#95e36c] font-bold border-l border-gray-200 pl-3">
                          Guardian: {student.parentName}
                        </span>
                       )}
                    </div>
                  </div>
                  <div className="size-10 rounded-[14px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                    <GraduationCap size={20} />
                  </div>
                </div>

                {/* Financial State - High Trust Section */}
                <div className={`
                  rounded-[16px] p-4 flex items-center justify-between
                  ${hasOverdue 
                    ? 'bg-amber-50 border-[1.2px] border-amber-100' 
                    : 'bg-[#95e36c]/5 border-[1.2px] border-[#95e36c]/20'
                  }
                `}>
                  <div className="flex items-center gap-3">
                    {hasOverdue ? (
                      <div className="size-8 rounded-full bg-amber-400/20 flex items-center justify-center">
                        <AlertCircle size={16} className="text-amber-600" />
                      </div>
                    ) : (
                      <div className="size-8 rounded-full bg-[#95e36c]/20 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-[#008000]" />
                      </div>
                    )}
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${hasOverdue ? 'text-amber-600' : 'text-[#008000]'}`}>
                        {hasOverdue ? 'Outstanding Balance' : 'Account Status'}
                      </p>
                      <p className={`text-[14px] font-bold ${hasOverdue ? 'text-amber-900' : 'text-[#003630]'}`}>
                        {isLoadingBalances ? 'Fetching...' : hasOverdue ? formatCurrency(balance) : 'CLEAN ACCOUNT'}
                      </p>
                    </div>
                  </div>
                  
                  {!isLoadingBalances && !hasOverdue && (
                     <div className="size-2.5 rounded-full bg-[#95e36c] shadow-[0_0_8px_rgba(149,227,108,0.5)]" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#f0f1f3] px-[28px] pt-[20px] pb-16 shadow-[0px_-8px_24px_rgba(0,0,0,0.04)] z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { haptics.heavy(); onConfirm(); }}
            disabled={isSubmitting || isLoadingBalances}
            className={`
              w-full h-14 rounded-[18px] bg-[#003630] border border-[#003630] 
              shadow-[0_8px_20px_rgba(0,54,48,0.2)] hover:shadow-[0px_12px_32px_rgba(0,54,48,0.3)] 
              active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn 
              ${(isSubmitting || isLoadingBalances) ? 'opacity-70 pointer-events-none' : ''}
            `}
          >
            {(isSubmitting || isLoadingBalances) && (
              <div className="size-7 rounded-full bg-[#95e36c]/20 flex items-center justify-center">
                <Loader2 size={16} className="text-[#95e36c] animate-spin" />
              </div>
            )}
            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] font-bold text-white">
              {isSubmitting ? 'Finalizing...' : isLoadingBalances ? 'Verifying Records...' : 'Confirm & Register'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
