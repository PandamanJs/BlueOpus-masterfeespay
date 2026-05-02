import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Loader2, CheckCircle2 } from 'lucide-react';
import { type StudentData, saveLedgerVerification } from '../../lib/supabase/api/registration';
import { getStudentFinancialSummary } from '../../lib/supabase/api/transactions';
import { toast } from 'sonner';
import { haptics } from '../../utils/haptics';
import LogoHeader from '../common/LogoHeader';
import OnboardingProgressBar from './OnboardingProgressBar';
import type { ParentData } from './ParentInformationPage';

interface ReviewPageProps {
  parentData: ParentData;
  students: StudentData[];
  onBack: () => void;
  onConfirm: () => void;
  onDisputeSubmit?: (studentId: string, note: string, details: BalanceDisputeDetails) => void;
  isSubmitting?: boolean;
}

export interface BalanceDisputeDetails {
  claimedBalance: number;
  recordedBalance: number;
  recordedChargedAmount: number;
  recordedPaidAmount: number;
}

export default function ReviewPage({ parentData, students, onBack, onConfirm, onDisputeSubmit, isSubmitting }: ReviewPageProps) {
  useEffect(() => {
    console.log('[Registration] ReviewPage mounted with students:', students.length);
  }, []);
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || '');
  const [financialData, setFinancialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set());
  const [submittedDisputeIds, setSubmittedDisputeIds] = useState<Set<string>>(new Set());
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});
  const [disputeClaimedBalances, setDisputeClaimedBalances] = useState<Record<string, string>>({});
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

  const handleToggleConfirm = async () => {
    if (!activeStudentId || !activeStudent) return;

    const isCurrentlyConfirmed = confirmedIds.has(activeStudentId);
    haptics.selection();

    try {
      // Toggle local state
      const isNowConfirmed = !isCurrentlyConfirmed;
      setConfirmedIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyConfirmed) next.delete(activeStudentId);
        else next.add(activeStudentId);
        return next;
      });

      if (isNowConfirmed) {
        toast.success(`Confirmed ${activeStudent?.name}`);
        autoAdvance();
      }

      // If we are confirming an existing database student, write a best-effort audit.
      // New manual registrations still use temporary IDs here, so they cannot be
      // inserted into ledger_verifications until the final submit creates the row.
      if (!isCurrentlyConfirmed && !isTemporaryStudentId(activeStudentId)) {
        const result = await saveLedgerVerification({
          studentId: activeStudentId,
          parentId: parentData.parentId,
          schoolId: parentData.schoolId,
          status: 'confirmed',
          metadata: {
            balance: financialData?.totalBalance || 0,
            verified_at: new Date().toISOString()
          }
        });

        if (!result.success) {
          console.warn('[Registration] Confirmation audit was not saved, continuing with local confirmation.');
        }
      }
    } catch (error) {
      console.error('Failed to save confirmation:', error);
      toast.error('Failed to save confirmation. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 1
    }).format(Math.abs(amount)).replace('ZMW', 'K');
  };

  // A student is processed once the parent confirms the balance or submits it for school review.
  const reviewedCount = students.filter(s => confirmedIds.has(s.id) || submittedDisputeIds.has(s.id)).length;
  const allConfirmed = students.length > 0 && reviewedCount === students.length;

  const autoAdvance = () => {
    const nextUnreviewed = students.find(s =>
      s.id !== activeStudentId &&
      !confirmedIds.has(s.id) &&
      !submittedDisputeIds.has(s.id)
    );
    if (nextUnreviewed) {
      setTimeout(() => {
        setActiveStudentId(nextUnreviewed.id);
        haptics.light();
      }, 600);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      <LogoHeader>
        <OnboardingProgressBar currentStep={3} totalSteps={3} className="py-0" />
      </LogoHeader>

      <div className="flex-1 px-6 pt-8 pb-32 max-w-lg mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-medium text-smart-h1 text-[#000000] leading-tight mb-4">
            Please Review your<br />Child’s School Account
          </h1>
          <p className="text-smart-small text-gray-500 leading-relaxed">
            Please review the information carefully and confirm whether the records are correct or need to be corrected.
          </p>
        </div>

        {/* Step Header & Progress Tracker */}
        <div className="mb-8 px-1">
          <div className="flex justify-between items-end mb-4">
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Step 2 of 2</span>
              <h2 className="text-[18px] font-bold text-[#003630] tracking-tight">Review Records</h2>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-black text-[#003630]">{reviewedCount}</span>
                <span className="text-[13px] font-medium text-gray-300">/</span>
                <span className="text-[13px] font-medium text-gray-400">{students.length}</span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Verified</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 h-1.5">
            {students.map((student) => {
              const isVerified = confirmedIds.has(student.id) || submittedDisputeIds.has(student.id);
              const isActive = activeStudentId === student.id;
              
              return (
                <div 
                  key={student.id}
                  className="flex-1 relative rounded-full overflow-hidden bg-gray-100"
                >
                  <motion.div 
                    initial={false}
                    animate={{ 
                      width: isVerified ? '100%' : isActive ? '100%' : '0%',
                      backgroundColor: isVerified ? '#95e36c' : isActive ? '#003630' : '#f3f4f6'
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                  />
                  {isActive && !isVerified && (
                    <motion.div 
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-white/40"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* Balance Card Container */}
        <div className="bg-white rounded-[16px] border-[1.5px] border-[#f1f3f6] p-4 sm:p-5 shadow-[0px_8px_24px_rgba(0,0,0,0.02)] min-h-[320px] relative">
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
                  <h2 className="font-medium text-[13px]! text-[#000000] mb-0.5">
                    {activeStudent?.name}
                  </h2>
                  <p className="text-[8px]! text-gray-400 font-medium">
                    {activeStudent?.grade} {activeStudent?.class ? `• ${activeStudent.class}` : ''}
                  </p>
                </div>
                {(financialData?.totalBalance || 0) > 0 && (
                  <div className="px-3 py-1 rounded-[8px] bg-red-50 text-red-600 text-[9px]! font-black uppercase tracking-wider">
                    {formatCurrency(financialData.totalBalance)} Balance
                  </div>
                )}
              </div>

              {(!financialData || (financialData.items.length === 0 && financialData.totalBalance === 0)) && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-full h-[250px] bg-[#f9fafb] rounded-[12px] p-8  relative overflow-hidden mb-8 shadow-sm">

                    <h3 className="text-[#003630] font-['IBM_Plex_Sans_Devanagari:medium',sans-serif] text-[13px] mb-3 tracking-[-0.4px]">
                      New account Detected
                    </h3>

                    <p className="text-[8px] text-gray-500 leading-relaxed max-w-[300px] mx-auto">
                      We've confirmed that <span className="text-[#003630] font-medium">{activeStudent?.name}</span> has a completely fresh account with a <span className="text-[#95e36c] font-black underline decoration-2 underline-offset-4">K0.00 Balance</span>.
                    </p>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
                      <div className="size-1.5 rounded-full bg-[#95e36c]" />
                      <span className="text-[8px] font-medium text-gray-400 uppercase tracking-widest">Fresh Admission</span>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleConfirm}
                    className={`
                      w-full h-10 rounded-[12px] font-['IBM_Plex_Sans_Devanagari:medium',sans-serif] text-[8px] transition-all flex items-center justify-center gap-3 active:scale-[0.98] group
                      ${confirmedIds.has(activeStudentId)
                        ? 'bg-[#95e36c] text-[#003630] shadow-sm'
                        : 'bg-[#003630] text-white shadow-[0_12px_30px_rgba(0,54,48,0.2)] hover:shadow-[0_16px_40px_rgba(0,54,48,0.25)]'
                      }
                    `}
                  >
                    {confirmedIds.has(activeStudentId) ? (
                      <>
                        <CheckCircle2 size={22} className="text-[#003630]" />
                        <span className="font-medium -translate-y-0.5">Ready to Review</span>
                      </>
                    ) : (
                      <span className="font-medium -translate-y-0.5">Confirm & Activate Account</span>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {/* Explanation Box */}
                  <div className="bg-[#f9fafb] rounded-[8px] p-3 border-l-[3px] border-[#95e36c] flex gap-3">
                    <div className="size-6 rounded-[6px] border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 bg-white">
                      <Info size={14} className="text-[#95e36c]" />
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed">
                      You currently have a <span className="font-medium text-[#003630]">{formatCurrency(financialData.totalBalance)} balance</span> on your child's school fees.
                      We recorded a total charge of <span className="font-medium text-[#003630]">{formatCurrency(financialData.items.reduce((s: number, i: any) => s + (i.expected || i.invoiced || 0), 0))}</span>,
                      and payments totaling <span className="font-medium text-[#003630]">{formatCurrency(financialData.items.reduce((s: number, i: any) => s + (i.collected || 0), 0))}</span>.
                      If records are incorrect, please select "Reject" to correct them.
                    </p>
                  </div>

                  {/* Dynamic Content: Table or Dispute Form */}
                  {disputedIds.has(activeStudentId) ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div>
                        <label className="block text-[8px] text-gray-500 font-medium mb-2">
                          What balance do you believe is correct?
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={disputeClaimedBalances[activeStudentId] || ''}
                          onChange={(e) => setDisputeClaimedBalances(prev => ({ ...prev, [activeStudentId]: e.target.value }))}
                          placeholder="Example: 1200"
                          className="w-full h-[54px] px-5 rounded-[16px] border border-gray-200 bg-white text-[8px] outline-none focus:border-[#006e33] transition-all text-gray-700 placeholder:text-gray-300"
                        />
                        <p className="text-[8px] text-gray-400 mt-2">
                          This is the amount the school will compare against the current recorded balance.
                        </p>
                      </div>
                      <div className="relative">
                        <textarea
                          value={disputeNotes[activeStudentId] || ''}
                          onChange={(e) => setDisputeNotes(prev => ({ ...prev, [activeStudentId]: e.target.value }))}
                          placeholder="Please type in your actual total payment..."
                          className="w-full min-h-[220px] p-5 rounded-[16px] border border-gray-200 bg-white text-[8px] outline-none focus:border-[#006e33] transition-all resize-none shadow-inner text-gray-700 placeholder:text-gray-300"
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
                          className="flex-1 h-[40px] rounded-[8px] bg-transparent text-[#000000] font-['IBM_Plex_Sans_Devanagari:medium',sans-serif] text-[8px] active:scale-95 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={async () => {
                            if (!activeStudentId || !activeStudent) return;
                            const note = (disputeNotes[activeStudentId] || '').trim();
                            const claimedBalanceText = (disputeClaimedBalances[activeStudentId] || '').trim();
                            const claimedBalance = Number(claimedBalanceText);
                            if (!note || !claimedBalanceText || !Number.isFinite(claimedBalance) || claimedBalance < 0) return;
                            const recordedChargedAmount = Number(financialData?.totalInvoiced ?? financialData?.items?.[0]?.expected ?? 0);
                            const recordedPaidAmount = Number(financialData?.totalPaid ?? financialData?.items?.[0]?.collected ?? 0);
                            haptics.heavy();

                            try {
                              setIsLoading(true); // Small UX feedback
                              onDisputeSubmit?.(activeStudentId, note, {
                                claimedBalance,
                                recordedBalance: Number(financialData?.totalBalance || 0),
                                recordedChargedAmount,
                                recordedPaidAmount,
                              });

                              if (!isTemporaryStudentId(activeStudentId)) {
                                await saveLedgerVerification({
                                  studentId: activeStudentId,
                                  parentId: parentData.parentId,
                                  schoolId: parentData.schoolId,
                                  status: 'disputed',
                                  notes: note,
                                  metadata: {
                                    balance: financialData?.totalBalance || 0,
                                    parent_claimed_balance: claimedBalance,
                                    disputed_at: new Date().toISOString()
                                  }
                                });
                              }


                              setSubmittedDisputeIds(prev => {
                                const next = new Set(prev);
                                next.add(activeStudentId);
                                return next;
                              });
                              setConfirmedIds(prev => {
                                const next = new Set(prev);
                                next.delete(activeStudentId);
                                return next;
                              });

                              setDisputedIds(prev => {
                                const next = new Set(prev);
                                next.delete(activeStudentId);
                                return next;
                              });

                              toast.success("Dispute submitted successfully");
                              autoAdvance();
                            } catch (error) {
                              console.error('Failed to save dispute:', error);
                              toast.error('Failed to submit dispute. Please try again.');
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          disabled={
                            !(disputeNotes[activeStudentId] || '').trim()
                            || !(disputeClaimedBalances[activeStudentId] || '').trim()
                            || !Number.isFinite(Number(disputeClaimedBalances[activeStudentId]))
                            || Number(disputeClaimedBalances[activeStudentId]) < 0
                          }
                          className="flex-1 h-[48px] rounded-[12px] border-[1px] border-gray-200 shadow-sm flex items-center justify-center font-['IBM_Plex_Sans_Devanagari:medium',sans-serif] text-[8px] text-[#000000] bg-white active:scale-95 transition-all disabled:opacity-40"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                  {/* Account Details Table */}
                  <div className="space-y-3 pt-1">
                    {/* List all items except those labeled as service charges */}
                    {financialData.items
                      .filter((item: any) => !item.name.toLowerCase().includes('service charge') && !item.name.toLowerCase().includes('gateway fee'))
                      .map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 font-medium">{item.name}</span>
                        <span className="font-bold text-[#003630]">{formatCurrency(item.expected || item.invoiced || 0)}</span>
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-gray-500 font-medium">Total Payments Recorded</span>
                      <span className="font-bold text-[#38A169]">-{formatCurrency(financialData.items.reduce((sum: number, it: any) => sum + (it.collected || 0), 0))}</span>
                    </div>

                    <div className="h-[1px] bg-gray-100 my-2" />

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-black text-red-500 text-[9px] uppercase tracking-tight">Closing Balance</span>
                      <span className="font-black text-red-500 text-[11px]">{formatCurrency(financialData.totalBalance)}</span>
                    </div>
                  </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => {
                              haptics.medium();
                              setDisputedIds(prev => {
                                const next = new Set(prev);
                                next.add(activeStudentId);
                                return next;
                              });
                            }}
                            className="flex-1 h-12 rounded-[14px] bg-[#f9fafb] border border-gray-100 text-gray-500 font-bold text-[11px]! active:scale-95 transition-all flex items-center justify-center"
                          >
                            <span>Reject</span>
                          </button>
                        
                        <button
                          onClick={handleToggleConfirm}
                          className={`
                            flex-1 h-12 rounded-[14px] font-black text-[11px] transition-all flex items-center justify-center gap-2
                            ${confirmedIds.has(activeStudentId)
                              ? 'bg-[#95e36c] text-[#003630] shadow-[0_4px_12px_rgba(149,227,108,0.2)]'
                              : 'bg-[#003630] text-white active:scale-95'
                            }
                          `}
                        >
                          {confirmedIds.has(activeStudentId) ? (
                            <>
                              <CheckCircle2 size={14} strokeWidth={3} />
                              <span>Confirmed</span>
                            </>
                          ) : (
                            <span>Confirm</span>
                          )}
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

      {/* Fixed Footer - Synchronized with StudentsPage */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 pt-4 pb-8 shadow-[0px_-10px_30px_rgba(0,0,0,0.04)] z-50">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => {
              const currentIndex = students.findIndex(s => s.id === activeStudentId);
              if (currentIndex > 0) {
                const previousStudent = students[currentIndex - 1];
                if (!previousStudent) return;
                setActiveStudentId(previousStudent.id);
                haptics.light();
              } else {
                onBack();
              }
            }}
            className="flex-1 h-14 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-300 flex justify-center items-center active:scale-[0.98] transition-all"
          >
            <span className="text-center text-black text-xs font-normal font-['Inter']">Back</span>
          </button>

          <button
            onClick={allConfirmed ? () => onConfirm() : () => {
              const currentIndex = students.findIndex(s => s.id === activeStudentId);
              const nextIndex = (currentIndex + 1) % students.length;
              const nextStudent = students[nextIndex];
              if (!nextStudent) return;
              setActiveStudentId(nextStudent.id);
              haptics.light();
            }}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-xl bg-[#003630] text-white shadow-lg active:scale-[0.98] hover:bg-[#004d45] flex justify-center items-center transition-all"
          >
            <span className="text-base font-bold font-['Space_Grotesk'] text-white">
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                allConfirmed ? 'Submit Application' : 'Next'
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
