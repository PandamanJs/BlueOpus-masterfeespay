import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Loader2 } from 'lucide-react';
import { type StudentData, getStudentFinancialSummary } from '../../lib/supabase/api/registration';
import { haptics } from '../../utils/haptics';
import LogoHeader from '../common/LogoHeader';
import OnboardingProgressBar from './OnboardingProgressBar';
import type { ParentData } from './ParentInformationPage';

interface ReviewPageProps {
  parentData: ParentData;
  students: StudentData[];
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export default function ReviewPage({ students, onBack, onConfirm, isSubmitting }: ReviewPageProps) {
  useEffect(() => {
    console.log('[Registration] ReviewPage mounted with students:', students.length);
  }, []);
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || '');
  const [financialData, setFinancialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set());
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});
  const isTemporaryStudentId = (studentId: string) => studentId.startsWith('new-') || studentId.startsWith('review-');

  useEffect(() => {
    async function fetchData() {
      if (!activeStudentId) return;
      if (isTemporaryStudentId(activeStudentId)) {
        setFinancialData(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await getStudentFinancialSummary(activeStudentId);
        setFinancialData(data);
      } catch (error) {
        console.error('Failed to fetch financial data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [activeStudentId]);

  const activeStudent = students.find(s => s.id === activeStudentId);

  const handleToggleConfirm = () => {
    if (!activeStudentId) return;
    haptics.selection();
    setConfirmedIds(prev => {
      const next = new Set(prev);
      if (next.has(activeStudentId)) next.delete(activeStudentId);
      else next.add(activeStudentId);
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 1
    }).format(Math.abs(amount)).replace('ZMW', 'K');
  };

  // A student is considered "processed" if they are in confirmedIds
  const allConfirmed = students.length > 0 && students.every(s => confirmedIds.has(s.id));

  return (
    <div className="bg-white min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader showBackButton onBack={onBack} />
      <div className="w-full flex justify-center border-b border-gray-100">
         <OnboardingProgressBar currentStep={3} totalSteps={3} />
      </div>

      <div className="flex-1 px-6 pt-8 pb-32 max-w-lg mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#000000] leading-tight mb-4">
            Please Review your<br />Child’s School Account
          </h1>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            Please review the information carefully and confirm whether the records are correct or need to be corrected.
          </p>
        </div>

        {/* Dynamic Student Tabs */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => { haptics.light(); setActiveStudentId(student.id); }}
              className={`
                h-[48px] px-6 rounded-[12px] whitespace-nowrap transition-all flex items-center justify-center font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px]
                ${activeStudentId === student.id 
                  ? 'bg-transparent border-[1.5px] border-[#95e36c] text-[#003630] font-bold' 
                  : confirmedIds.has(student.id) || disputedIds.has(student.id)
                    ? 'bg-transparent border-[1.5px] border-green-100 text-green-700'
                    : 'bg-white border-[1px] border-gray-200 text-gray-400'
                }
              `}
            >
              <span>{student.name}</span>
              {confirmedIds.has(student.id) && (
                <div className={`ml-2 size-1.5 rounded-full ${activeStudentId === student.id ? 'bg-[#95e36c]' : 'bg-green-500'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Balance Card Container */}
        <div className="bg-white rounded-[24px] border-[1px] border-[#e5e7eb] p-5 shadow-[0px_8px_24px_rgba(0,0,0,0.04)] min-h-[480px] relative">
          <AnimatePresence mode="wait">            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center p-12"
              >
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-[#95e36c]" size={32} />
                  <p className="text-[13px] text-gray-400 font-medium">Fetching child records...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeStudentId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Header Section */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#000000] mb-1">
                      {financialData?.student?.name || activeStudent?.name} - School Fees
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium">
                      Grade {(financialData?.student?.grade || activeStudent?.grade || '...')?.toString().replace(/^(grade\s+)/i, '')}
                    </p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full ${(financialData?.totalBalance || 0) > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'} text-[11px] font-bold whitespace-nowrap border ${(financialData?.totalBalance || 0) > 0 ? 'border-red-100' : 'border-green-100'}`}>
                    {(financialData?.totalBalance || 0) > 0 ? `${formatCurrency(financialData.totalBalance)} Balance` : 'CLEAN ACCOUNT'}
                  </div>
                </div>

                {!financialData && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                      <Info size={24} className="text-gray-300" />
                    </div>
                    {activeStudentId.startsWith('review-') ? (
                      <p className="text-[14px] text-gray-500 max-w-[240px]">
                        This learner request is pending school confirmation. Charges and payments will appear after approval.
                      </p>
                    ) : (
                      <p className="text-[14px] text-gray-500 max-w-[200px]">
                        No financial records found for this student. Please confirm to proceed.
                      </p>
                    )}
                    <button 
                      onClick={handleToggleConfirm}
                      className="mt-6 h-11 px-8 rounded-xl bg-[#003630] text-white text-[14px] font-bold"
                    >
                      Confirm Record
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Explanation Box */}
                    <div className="bg-[#f9fafb] rounded-[12px] p-4 border border-[#f0f0f0] flex gap-4">
                      <div className="size-8 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info size={18} className="text-gray-400" />
                      </div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">
                        You currently have a <span className="font-bold text-black">{formatCurrency(financialData.totalBalance)} balance</span> on your child's school fees. 
                        We charged <span className="font-bold text-black">{formatCurrency(financialData.items[0]?.expected || 0)}</span>, 
                        and recorded payments totaling <span className="font-bold text-black">{formatCurrency(financialData.items[0]?.collected || 0)}</span>.
                        If our records are incorrect, please select "Reject" and share your payment history so we can correct the records.
                      </p>
                    </div>

                    {/* Dynamic Content: Table or Dispute Form */}
                    {disputedIds.has(activeStudentId) ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative">
                          <textarea
                            value={disputeNotes[activeStudentId] || ''}
                            onChange={(e) => setDisputeNotes(prev => ({ ...prev, [activeStudentId]: e.target.value }))}
                            placeholder="Please type in your actual total payment..."
                            className="w-full min-h-[220px] p-5 rounded-[16px] border border-gray-200 bg-white text-[15px] outline-none focus:border-[#006e33] transition-all resize-none shadow-inner text-gray-700 placeholder:text-gray-300"
                          />
                        </div>
                        
                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              haptics.light();
                              setDisputedIds(prev => {
                                const next = new Set(prev);
                                next.delete(activeStudentId);
                                return next;
                              });
                            }}
                            className="flex-1 h-[48px] rounded-[10px] bg-transparent text-[#000000] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] active:scale-95 transition-all"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => {
                              haptics.heavy();
                              // In a real app we'd submit to DB. For now mark as processed
                              setConfirmedIds(prev => {
                                const next = new Set(prev);
                                next.add(activeStudentId);
                                return next;
                              });
                            }}
                            className="flex-1 h-[48px] rounded-[12px] border-[1px] border-gray-200 shadow-sm flex items-center justify-center font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#000000] bg-white active:scale-95 transition-all"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Account Details Table */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between text-[14px]">
                            <span className="text-gray-600">Term 1 School Fees Service Charge</span>
                            <span className="font-medium text-black">{formatCurrency(financialData.items[0]?.expected || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[14px]">
                            <span className="text-gray-600">Total Cash Paid So Far</span>
                            <span className="font-medium text-black">-{formatCurrency(financialData.items[0]?.collected || 0)}</span>
                          </div>
                          
                          <div className="h-[1px] bg-gray-100 mt-2" />
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className="font-bold text-red-500 text-[14px]">Balance Owing</span>
                            <span className="font-bold text-red-500 text-[16px]">{formatCurrency(financialData.totalBalance)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-6">
                          <button 
                            onClick={() => { 
                              haptics.medium(); 
                              setDisputedIds(prev => {
                                const next = new Set(prev);
                                next.add(activeStudentId);
                                return next;
                              });
                            }}
                            className="flex-1 h-[48px] rounded-[10px] bg-transparent text-[#000000] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={handleToggleConfirm}
                            className={`
                              flex-1 h-[48px] rounded-[10px] border-[1.5px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] transition-all
                              ${confirmedIds.has(activeStudentId)
                                ? 'bg-green-50 border-green-500 text-green-600'
                                : 'bg-white border-[#e5e7eb] text-[#000000] active:scale-95 shadow-sm'
                              }
                            `}
                          >
                            {confirmedIds.has(activeStudentId) ? 'Confirmed' : 'Confirm'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#f0f1f3] px-[28px] pt-[20px] pb-16 shadow-[0px_-8px_24px_rgba(0,0,0,0.04)] z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { haptics.heavy(); onConfirm(); }}
            disabled={!allConfirmed || isSubmitting}
            className={`
              w-full h-14 rounded-[18px] bg-[#003630] border border-[#003630] 
              transition-all flex items-center justify-center gap-3 group/btn 
              ${(!allConfirmed || isSubmitting) 
                ? 'opacity-30 shadow-none grayscale pointer-events-none' 
                : 'shadow-[0_8px_20px_rgba(0,54,48,0.2)] hover:shadow-[0px_12px_32px_rgba(0,54,48,0.3)] active:scale-[0.98]'
              }
            `}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin text-white" size={20} />
            ) : (
              <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] font-bold text-white">
                Next
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
