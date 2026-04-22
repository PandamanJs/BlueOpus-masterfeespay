import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Users,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';
import { hapticFeedback } from '../utils/haptics';
import type { PageType } from '../stores/useAppStore';
import {
  getSchoolReviewCenterData,
  updateBalanceReviewStatus,
  updateGuardianLinkRequestStatus,
  type BalanceReviewRequest,
  type DuplicateReviewRequest
} from '../lib/supabase/api/parents';

type ReviewTab = 'duplicates' | 'balances' | 'history';
type ActiveReview =
  | { kind: 'duplicate'; item: DuplicateReviewRequest }
  | { kind: 'balance'; item: BalanceReviewRequest }
  | null;

function formatDate(value?: string | null) {
  if (!value) return 'Not reviewed';
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatCurrency(value?: number | null) {
  const amount = Number(value || 0);
  return `K${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function statusClasses(status: string) {
  switch (status) {
    case 'approved':
    case 'resolved':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-100';
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-[8px] border text-[10px] font-black uppercase tracking-[0.12em] ${statusClasses(status)}`}>
      {status}
    </span>
  );
}

function isGuardianConflictRequest(item: DuplicateReviewRequest) {
  return item.reason === 'two_guardians_full';
}

function EmptyState({ icon: Icon, title, detail }: { icon: any; title: string; detail: string }) {
  return (
    <div className="min-h-[260px] rounded-[16px] border border-dashed border-gray-200 bg-gray-50/40 flex flex-col items-center justify-center text-center px-8">
      <div className="size-12 rounded-[12px] bg-white border border-gray-100 flex items-center justify-center text-gray-300 mb-4">
        <Icon size={24} />
      </div>
      <p className="text-[14px] font-bold text-[#003630]">{title}</p>
      <p className="text-[12px] text-gray-500 leading-relaxed mt-1 max-w-[280px]">{detail}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="text-[13px] font-bold text-[#003630] mt-1 break-words">{value || 'Not provided'}</p>
    </div>
  );
}

function DuplicateCard({ item, onOpen }: { item: DuplicateReviewRequest; onOpen: () => void }) {
  const isGuardianConflict = isGuardianConflictRequest(item);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-black text-[#003630] truncate">
            {item.requestedStudent.name || item.existingStudent.name}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Requested by {item.parent.name}
          </p>
          <p className={`text-[10px] font-black uppercase tracking-[0.12em] mt-2 ${isGuardianConflict ? 'text-amber-700' : 'text-gray-400'}`}>
            {isGuardianConflict ? 'Two guardians already linked' : 'Possible duplicate'}
          </p>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[12px] bg-gray-50 p-3">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.12em]">Existing</p>
          <p className="text-[12px] font-bold text-gray-900 mt-1">{item.existingStudent.name}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {item.existingStudent.grade || 'Grade unknown'} {item.existingStudent.className || ''}
          </p>
          {item.existingGuardianNames && item.existingGuardianNames.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
              Guardians: {item.existingGuardianNames.join(' and ')}
            </p>
          )}
        </div>
        <div className="rounded-[12px] bg-amber-50 p-3">
          <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.12em]">Parent Entered</p>
          <p className="text-[12px] font-bold text-gray-900 mt-1">{item.requestedStudent.name || 'Unknown'}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {item.requestedStudent.grade || 'Grade unknown'} {item.requestedStudent.className || ''}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
        <span>{formatDate(item.createdAt)}</span>
        <span className="flex items-center gap-1 font-bold text-[#003630]">
          Review <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

function BalanceCard({ item, onOpen }: { item: BalanceReviewRequest; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-black text-[#003630] truncate">{item.student.name}</p>
          <p className="text-[11px] text-gray-500 mt-1">Submitted by {item.parent.name}</p>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[12px] bg-gray-50 p-3">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.12em]">Recorded</p>
          <p className="text-[15px] font-black text-gray-900 mt-1">{formatCurrency(item.recordedBalance)}</p>
        </div>
        <div className="rounded-[12px] bg-amber-50 p-3">
          <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.12em]">Parent Says</p>
          <p className="text-[15px] font-black text-gray-900 mt-1">{formatCurrency(item.claimedBalance)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
        <span>{formatDate(item.createdAt)}</span>
        <span className="flex items-center gap-1 font-bold text-[#003630]">
          Review <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

export default function AuditDisputesPage({ navigateToPage }: { navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void }) {
  const selectedSchoolId = useAppStore(state => state.selectedSchoolId);
  const selectedSchool = useAppStore(state => state.selectedSchool);
  const userId = useAppStore(state => state.userId);

  const [activeTab, setActiveTab] = useState<ReviewTab>('duplicates');
  const [duplicates, setDuplicates] = useState<DuplicateReviewRequest[]>([]);
  const [balances, setBalances] = useState<BalanceReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeReview, setActiveReview] = useState<ActiveReview>(null);
  const [reviewerNote, setReviewerNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSchoolReviewCenterData(selectedSchoolId);
      setDuplicates(data.duplicates);
      setBalances(data.balances);
    } catch (error) {
      console.error('[ReviewCenter] Failed to load:', error);
      toast.error('Could not load review center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSchoolId]);

  const pendingDuplicates = duplicates.filter(item => item.status === 'pending');
  const pendingBalances = balances.filter(item => item.status === 'pending');
  const historyItems = useMemo(() => [
    ...duplicates.filter(item => item.status !== 'pending').map(item => ({ kind: 'duplicate' as const, item })),
    ...balances.filter(item => item.status !== 'pending').map(item => ({ kind: 'balance' as const, item })),
  ].sort((a, b) => {
    const left = 'reviewedAt' in a.item ? a.item.reviewedAt || a.item.createdAt : a.item.updatedAt || a.item.createdAt;
    const right = 'reviewedAt' in b.item ? b.item.reviewedAt || b.item.createdAt : b.item.updatedAt || b.item.createdAt;
    return new Date(right || 0).getTime() - new Date(left || 0).getTime();
  }), [duplicates, balances]);

  const openReview = (review: ActiveReview) => {
    hapticFeedback('light');
    setActiveReview(review);
    setReviewerNote('');
  };

  const closeReview = () => {
    setActiveReview(null);
    setReviewerNote('');
  };

  const handleDuplicateAction = async (status: 'approved' | 'rejected') => {
    if (!activeReview || activeReview.kind !== 'duplicate') return;
    setIsUpdating(true);
    try {
      await updateGuardianLinkRequestStatus({
        requestId: activeReview.item.id,
        status,
        reviewerParentId: userId || null,
        reviewerNote,
      });
      toast.success(
        status === 'approved'
          ? (isGuardianConflictRequest(activeReview.item) ? 'Guardian conflict review approved' : 'Duplicate review approved')
          : 'Duplicate request rejected'
      );
      hapticFeedback('success');
      closeReview();
      await loadData();
    } catch (error) {
      console.error('[ReviewCenter] Duplicate action failed:', error);
      toast.error(status === 'approved' ? 'Could not approve request' : 'Could not reject request');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBalanceAction = async (status: 'resolved' | 'rejected') => {
    if (!activeReview || activeReview.kind !== 'balance') return;
    setIsUpdating(true);
    try {
      await updateBalanceReviewStatus({
        requestId: activeReview.item.id,
        status,
        reviewerNote,
      });
      toast.success(status === 'resolved' ? 'Balance review resolved' : 'Balance review rejected');
      hapticFeedback('success');
      closeReview();
      await loadData();
    } catch (error) {
      console.error('[ReviewCenter] Balance action failed:', error);
      toast.error('Could not update balance review');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabButton = (tab: ReviewTab, label: string, count: number) => (
    <button
      type="button"
      onClick={() => {
        hapticFeedback('light');
        setActiveTab(tab);
      }}
      className={`h-11 px-4 rounded-[10px] border text-[12px] font-black transition-all flex items-center gap-2 ${
        activeTab === tab
          ? 'bg-[#003630] border-[#003630] text-white'
          : 'bg-white border-gray-200 text-gray-500'
      }`}
    >
      {label}
      <span className={`min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center ${
        activeTab === tab ? 'bg-[#95e36c] text-[#003630]' : 'bg-gray-100 text-gray-500'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center font-['Inter',sans-serif]">
      <header className="w-full h-20 px-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticFeedback('medium');
              navigateToPage('services', 'back');
            }}
            className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-[#003630] active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-[20px] font-black text-[#003630] tracking-[-0.3px]">Review Center</h1>
            <p className="text-[11px] font-bold text-gray-400">{selectedSchool || 'All schools'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            hapticFeedback('light');
            loadData();
          }}
          className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 active:scale-95 transition-transform"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="w-full max-w-[680px] px-5 pt-6 pb-24">
        <section className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-11 rounded-[12px] bg-[#003630]/5 border border-[#003630]/10 flex items-center justify-center text-[#003630]">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h2 className="text-[22px] font-black text-black tracking-[-0.5px]">Pending Reviews</h2>
              <p className="text-[12px] text-gray-500">Resolve duplicate pupil requests and balance investigations.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[12px] bg-gray-50 border border-gray-100 p-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.12em]">Duplicates</p>
              <p className="text-[22px] font-black text-[#003630] mt-1">{pendingDuplicates.length}</p>
            </div>
            <div className="rounded-[12px] bg-gray-50 border border-gray-100 p-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.12em]">Balances</p>
              <p className="text-[22px] font-black text-[#003630] mt-1">{pendingBalances.length}</p>
            </div>
            <div className="rounded-[12px] bg-gray-50 border border-gray-100 p-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.12em]">Closed</p>
              <p className="text-[22px] font-black text-[#003630] mt-1">{historyItems.length}</p>
            </div>
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
          {tabButton('duplicates', 'Duplicates', pendingDuplicates.length)}
          {tabButton('balances', 'Balance Reviews', pendingBalances.length)}
          {tabButton('history', 'History', historyItems.length)}
        </div>

        {loading ? (
          <div className="min-h-[360px] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-[#003630] mb-3" size={30} />
            <p className="text-[13px] text-gray-500 font-bold">Loading review queue...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'duplicates' && (
              pendingDuplicates.length > 0
                ? pendingDuplicates.map(item => (
                  <DuplicateCard key={item.id} item={item} onOpen={() => openReview({ kind: 'duplicate', item })} />
                ))
                : <EmptyState icon={Users} title="No duplicate requests" detail="When parents submit clear duplicate-looking pupils for school review, they will appear here." />
            )}

            {activeTab === 'balances' && (
              pendingBalances.length > 0
                ? pendingBalances.map(item => (
                  <BalanceCard key={item.id} item={item} onOpen={() => openReview({ kind: 'balance', item })} />
                ))
                : <EmptyState icon={FileWarning} title="No balance reviews" detail="Parent balance disputes and account investigations will appear here." />
            )}

            {activeTab === 'history' && (
              historyItems.length > 0
                ? historyItems.map(entry => entry.kind === 'duplicate'
                  ? <DuplicateCard key={`d-${entry.item.id}`} item={entry.item} onOpen={() => openReview({ kind: 'duplicate', item: entry.item })} />
                  : <BalanceCard key={`b-${entry.item.id}`} item={entry.item} onOpen={() => openReview({ kind: 'balance', item: entry.item })} />
                )
                : <EmptyState icon={ShieldAlert} title="No closed reviews" detail="Approved, rejected, and resolved reviews will be kept here." />
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {activeReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center px-0 sm:px-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full sm:max-w-[560px] max-h-[92dvh] bg-white rounded-t-[16px] sm:rounded-[16px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">
                    {activeReview.kind === 'duplicate' ? 'Duplicate Review' : 'Balance Review'}
                  </p>
                  <h3 className="text-[18px] font-black text-[#003630] mt-1">
                    {activeReview.kind === 'duplicate'
                      ? activeReview.item.requestedStudent.name || activeReview.item.existingStudent.name
                      : activeReview.item.student.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeReview}
                  className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4">
                {activeReview.kind === 'duplicate' ? (
                  <>
                    <div className="rounded-[12px] bg-amber-50 border border-amber-100 p-4 mb-4 flex gap-3">
                      <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-amber-800 leading-relaxed">
                        {isGuardianConflictRequest(activeReview.item)
                          ? 'The parent entered details that match an existing pupil who already has two guardians linked. Review the guardian names below and use this request to decide whether the school should intervene in the guardian assignment.'
                          : 'The parent entered details that match an existing pupil. Approving marks the request as valid against the existing record; it does not create a duplicate student.'}
                      </p>
                    </div>
                    <Field label="Parent" value={`${activeReview.item.parent.name}${activeReview.item.parent.phone ? ` - ${activeReview.item.parent.phone}` : ''}`} />
                    <Field label="Existing pupil" value={`${activeReview.item.existingStudent.name} (${activeReview.item.existingStudent.grade || 'Grade unknown'} ${activeReview.item.existingStudent.className || ''})`} />
                    <Field label="Admission number" value={activeReview.item.existingStudent.admissionNumber} />
                    {activeReview.item.existingGuardianNames && activeReview.item.existingGuardianNames.length > 0 && (
                      <Field label="Existing guardians" value={activeReview.item.existingGuardianNames.join(' and ')} />
                    )}
                    <Field label="Parent-entered pupil" value={`${activeReview.item.requestedStudent.name || 'Unknown'} (${activeReview.item.requestedStudent.grade || 'Grade unknown'} ${activeReview.item.requestedStudent.className || ''})`} />
                    <Field label="Submitted" value={formatDate(activeReview.item.createdAt)} />
                  </>
                ) : (
                  <>
                    <div className="rounded-[12px] bg-[#f9fafb] border border-gray-100 p-4 mb-4">
                      <p className="text-[12px] text-gray-600 leading-relaxed">
                        Compare the account snapshot recorded when the parent disputed the balance. Resolving or rejecting unlocks the pupil profile for payments again.
                      </p>
                    </div>
                    <Field label="Parent" value={`${activeReview.item.parent.name}${activeReview.item.parent.phone ? ` - ${activeReview.item.parent.phone}` : ''}`} />
                    <Field label="Student" value={`${activeReview.item.student.name} (${activeReview.item.student.grade || 'Grade unknown'} ${activeReview.item.student.className || ''})`} />
                    <Field label="Parent claimed balance" value={formatCurrency(activeReview.item.claimedBalance)} />
                    <Field label="Recorded balance" value={formatCurrency(activeReview.item.recordedBalance)} />
                    <Field label="Recorded charges" value={formatCurrency(activeReview.item.recordedChargedAmount)} />
                    <Field label="Recorded paid" value={formatCurrency(activeReview.item.recordedPaidAmount)} />
                    <Field label="Parent note" value={activeReview.item.reason} />
                  </>
                )}

                <div className="mt-5">
                  <label className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Reviewer note</label>
                  <textarea
                    value={reviewerNote}
                    onChange={(event) => setReviewerNote(event.target.value)}
                    placeholder="Optional note for the audit trail"
                    className="mt-2 w-full min-h-[110px] rounded-[12px] border border-gray-200 px-4 py-3 text-[13px] text-[#003630] outline-none focus:border-[#003630] resize-none"
                  />
                </div>
              </div>

              <div className="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-white shrink-0">
                {activeReview.kind === 'duplicate' ? (
                  activeReview.item.status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleDuplicateAction('rejected')}
                        className="h-12 rounded-[10px] border border-red-100 bg-red-50 text-red-700 text-[13px] font-black disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleDuplicateAction('approved')}
                        className="h-12 rounded-[10px] bg-[#003630] text-white text-[13px] font-black disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {isGuardianConflictRequest(activeReview.item) ? 'Approve Review' : 'Approve Request'}
                      </button>
                    </div>
                  ) : (
                    <StatusPill status={activeReview.item.status} />
                  )
                ) : activeReview.item.status === 'pending' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleBalanceAction('rejected')}
                      className="h-12 rounded-[10px] border border-red-100 bg-red-50 text-red-700 text-[13px] font-black disabled:opacity-50"
                    >
                      Reject Claim
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleBalanceAction('resolved')}
                      className="h-12 rounded-[10px] bg-[#003630] text-white text-[13px] font-black disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Mark Resolved
                    </button>
                  </div>
                ) : (
                  <StatusPill status={activeReview.item.status} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
