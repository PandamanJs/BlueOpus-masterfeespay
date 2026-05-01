import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  History,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Users,
  X,
  ChevronLeft
} from 'lucide-react';


import { toast } from 'sonner';
import { useAppStore } from '../stores/useAppStore';
import { hapticFeedback } from '../utils/haptics';
import LogoHeader from './common/LogoHeader';
import type { PageType } from '../stores/useAppStore';
import {
  getSchoolReviewCenterData,
  logDispute,
  type BalanceReviewRequest,
  type DuplicateReviewRequest
} from '../lib/supabase/api/parents';
import posthog from '../lib/posthog';

type ReviewTab = 'duplicates' | 'balances' | 'history' | 'new-dispute';

function NewDisputeForm({ 
  onSuccess 
}: { 
  onSuccess: () => void 
}) {
  const students = useAppStore(state => state.students);
  const userId = useAppStore(state => state.userId);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [disputeType, setDisputeType] = useState<'balance' | 'identity' | 'payment'>('balance');
  const [reason, setReason] = useState('');
  
  // Specific fields
  const [claimedBalance, setClaimedBalance] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('Please select a student.');
      return;
    }

    let finalReason = `[Type: ${disputeType.toUpperCase()}]\n`;
    let metaData: any = { disputeType };

    if (disputeType === 'balance') {
      if (!claimedBalance) {
        toast.error('Please enter what you believe is the correct balance.');
        return;
      }
      finalReason += `Claimed Balance: ZMW ${claimedBalance}\n`;
      metaData.claimedBalance = claimedBalance;
      metaData.currentBalance = selectedStudent?.balances;
    } else if (disputeType === 'payment') {
      if (!paymentAmount || !paymentReference) {
        toast.error('Please provide payment amount and reference number.');
        return;
      }
      finalReason += `Payment Date: ${paymentDate}\nAmount: ZMW ${paymentAmount}\nRef: ${paymentReference}\n`;
      metaData.paymentDate = paymentDate;
      metaData.paymentAmount = paymentAmount;
      metaData.paymentReference = paymentReference;
    }

    if (!reason.trim()) {
      toast.error('Please provide a brief explanation.');
      return;
    }
    finalReason += `Note: ${reason.trim()}`;
    metaData.note = reason.trim();

    setIsSubmitting(true);
    try {
      await logDispute(selectedStudentId, userId, finalReason, metaData);
      posthog.capture({
        distinctId: userId || 'anonymous',
        event: 'dispute_submitted',
        properties: {
          dispute_type: disputeType,
          student_id: selectedStudentId,
          student_name: selectedStudent?.name,
        },
      });
      toast.success('Dispute submitted successfully.');
      hapticFeedback('success');
      setReason('');
      setClaimedBalance('');
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentDate('');
      setSelectedStudentId('');
      onSuccess();
    } catch (error) {
      console.error('[NewDispute] Submission failed:', error);
      toast.error('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-10"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Student */}
        <div className="flex flex-col gap-4">
          <label className="text-zinc-500 text-[11px] font-bold font-['Inter'] uppercase tracking-[0.1em]">Select Student</label>
          <div className="space-y-3">
            {students.map(student => (
              <button
                key={student.id}
                type="button"
                onClick={() => { hapticFeedback('light'); setSelectedStudentId(student.id); }}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  selectedStudentId === student.id 
                    ? 'bg-[#95e36c]/5 border-[#95e36c] shadow-sm' 
                    : 'bg-white border-neutral-100 hover:border-neutral-200'
                }`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center transition-colors ${
                  selectedStudentId === student.id ? 'bg-[#95e36c] text-[#003630]' : 'bg-gray-50 text-neutral-400'
                }`}>
                  <Users size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-[13px] font-bold font-['Inter'] transition-colors ${selectedStudentId === student.id ? 'text-black' : 'text-neutral-500'}`}>
                    {student.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider mt-0.5">
                    {student.grade}
                  </p>
                </div>
                <div className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                  selectedStudentId === student.id ? 'border-[#95e36c] bg-[#003630]' : 'border-neutral-200'
                }`}>
                  {selectedStudentId === student.id && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* What's the problem? */}
        <div className="flex flex-col gap-4">
          <label className="text-zinc-500 text-[11px] font-bold font-['Inter'] uppercase tracking-[0.1em]">What's the problem?</label>
          <div className="space-y-3">
            {[
              { id: 'balance', label: 'My balance is wrong', desc: 'The amount shown does not match my records', icon: FileWarning },
              { id: 'payment', label: 'Payment not showing', desc: 'I made a payment but it\'s not reflected here', icon: CheckCircle2 },
              { id: 'identity', label: 'Not my child', desc: 'This student record should not be linked to me', icon: Users },
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => { hapticFeedback('light'); setDisputeType(type.id as any); }}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  disputeType === type.id 
                    ? 'bg-[#95e36c]/5 border-[#95e36c] shadow-sm' 
                    : 'bg-white border-neutral-100 hover:border-neutral-200'
                }`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center transition-colors ${
                  disputeType === type.id ? 'bg-[#95e36c] text-[#003630]' : 'bg-gray-50 text-neutral-400'
                }`}>
                  <type.icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-[13px] font-bold font-['Inter'] transition-colors ${disputeType === type.id ? 'text-black' : 'text-neutral-500'}`}>
                    {type.label}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-medium leading-tight mt-0.5">
                    {type.desc}
                  </p>
                </div>
                <div className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                  disputeType === type.id ? 'border-[#95e36c] bg-[#003630]' : 'border-neutral-200'
                }`}>
                  {disputeType === type.id && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category Specific Fields */}
        {disputeType === 'balance' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="p-4 rounded-xl bg-[#f9fafb] border border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-1">Current Balance</p>
                <p className={`font-black tracking-tight ${selectedStudent ? 'text-[22px] text-black' : 'text-[14px] text-neutral-300'}`}>
                  {selectedStudent ? formatCurrency(selectedStudent.balances) : 'Select student...'}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-white border border-neutral-100 flex items-center justify-center text-neutral-400">
                <FileWarning size={20} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-zinc-500 text-xs font-normal font-['Inter']">What should the correct balance be?</label>
              <div className="flex items-center h-12 bg-white rounded-xl border border-neutral-100 overflow-hidden focus-within:border-[#003630] focus-within:ring-4 focus-within:ring-[#003630]/5 transition-all">
              <div className="px-4 flex items-center gap-2 bg-neutral-50 border-r border-neutral-100 h-full">
                <span className="text-neutral-400 font-bold text-[10px] uppercase tracking-wider">ZMW</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={claimedBalance}
                onChange={(e) => setClaimedBalance(e.target.value.replace(/[^0-9.]/g, ''))}
                className="flex-1 h-full px-4 bg-transparent text-black text-sm font-bold font-['Inter'] placeholder:text-neutral-300 focus:outline-none"
              />
            </div>
            </div>
          </div>
        )}

        {disputeType === 'payment' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-zinc-500 text-xs font-normal font-['Inter']">Amount Paid</label>
                <div className="flex items-center h-12 bg-white rounded-xl border border-neutral-100 overflow-hidden focus-within:border-[#003630] focus-within:ring-4 focus-within:ring-[#003630]/5 transition-all">
                  <div className="px-3 flex items-center bg-neutral-50 border-r border-neutral-100 h-full">
                    <span className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">ZMW</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="flex-1 h-full px-3 bg-transparent text-black text-sm font-bold font-['Inter'] placeholder:text-neutral-300 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-zinc-500 text-xs font-normal font-['Inter']">Date of Payment</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-neutral-100 text-black text-[13px] font-bold font-['Inter'] focus:outline-none focus:border-[#003630] focus:ring-4 focus:ring-[#003630]/5 transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-zinc-500 text-xs font-normal font-['Inter']">Receipt or Reference Number</label>
              <input
                type="text"
                placeholder="Enter transaction ID or Reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full h-12 px-4 bg-white rounded-xl border border-neutral-100 text-black text-sm font-bold font-['Inter'] placeholder:text-neutral-300 focus:outline-none focus:border-[#003630] focus:ring-4 focus:ring-[#003630]/5 transition-all"
              />
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="flex flex-col gap-2">
          <label className="text-zinc-500 text-xs font-normal font-['Inter']">Tell us more (Optional)</label>
          <textarea
            placeholder="Tell us why this needs to be checked..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-28 p-4 bg-white rounded-xl border border-neutral-100 text-black text-sm font-medium font-['Inter'] placeholder:text-neutral-300 focus:outline-none focus:border-[#003630] focus:ring-4 focus:ring-[#003630]/5 transition-all resize-none shadow-inner shadow-gray-50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: isSubmitting ? '#E6E6E6' : '#003630' }}
          className="w-full h-12 text-white rounded-xl flex items-center justify-center text-[14px] font-bold font-['Inter'] shadow-lg shadow-[#003630]/10 active:scale-[0.98] transition-all disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Send to School'}
        </button>
      </form>
    </motion.div>
  );
}

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
      return 'bg-transparent text-red-700 border-red-100';
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
      <p className="text-[14px] font-bold text-[#003630] text-center">{title}</p>
      <p className="text-[12px] text-gray-500 leading-relaxed mt-1 max-w-[280px] text-center">{detail}</p>
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

function DuplicateCard({ item }: { item: DuplicateReviewRequest }) {
  const isGuardianConflict = isGuardianConflictRequest(item);
  return (
    <div className="w-full p-3 bg-white rounded-xl border border-neutral-100 shadow-sm flex flex-col gap-3 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-black text-[13px] font-bold font-['Inter'] line-clamp-1">
            {item.requestedStudent.name || item.existingStudent.name}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isGuardianConflict ? 'text-amber-600' : 'text-neutral-400'}`}>
              {isGuardianConflict ? 'Needs Verification' : 'Duplicate Found'}
            </span>
            <div className="w-1 h-1 rounded-full bg-neutral-200" />
            <span className="text-neutral-400 text-[11px]">{formatDate(item.createdAt)}</span>
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#f9fafb] rounded-xl border border-neutral-50">
          <p className="text-neutral-400 text-[9px] font-bold uppercase tracking-widest mb-1">Existing</p>
          <p className="text-black text-[11px] font-bold font-['Inter'] line-clamp-1">{item.existingStudent.name}</p>
          <p className="text-neutral-500 text-[10px] mt-0.5">{item.existingStudent.grade}</p>
        </div>
        <div className="p-3 bg-[#f9fafb] rounded-xl border border-neutral-50">
          <p className="text-neutral-400 text-[9px] font-bold uppercase tracking-widest mb-1">New Claim</p>
          <p className="text-black text-[11px] font-bold font-['Inter'] line-clamp-1">{item.requestedStudent.name || 'Unknown'}</p>
          <p className="text-neutral-500 text-[10px] mt-0.5">{item.requestedStudent.grade}</p>
        </div>
      </div>
    </div>
  );
}

function BalanceCard({ item }: { item: BalanceReviewRequest }) {
  return (
    <div className="w-full p-3 bg-white rounded-xl border border-neutral-100 shadow-sm flex flex-col gap-3 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-black text-[13px] font-bold font-['Inter'] line-clamp-1">
            {item.student.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Balance Check</span>
            <div className="w-1 h-1 rounded-full bg-neutral-200" />
            <span className="text-neutral-400 text-[11px]">{formatDate(item.createdAt)}</span>
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#f9fafb] rounded-xl border border-neutral-50">
          <p className="text-neutral-400 text-[9px] font-bold uppercase tracking-widest mb-1">Recorded</p>
          <p className="text-black text-[11px] sm:text-[13px] font-black font-['Inter']">{formatCurrency(item.recordedBalance)}</p>
        </div>
        <div className="p-3 bg-[#f9fafb] rounded-xl border border-neutral-50">
          <p className="text-neutral-400 text-[9px] font-bold uppercase tracking-widest mb-1">Parent Claim</p>
          <p className="text-black text-[11px] sm:text-[13px] font-black font-['Inter']">{formatCurrency(item.claimedBalance)}</p>
        </div>
      </div>
    </div>
  );
}

export default function AuditDisputesPage({ navigateToPage }: { navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void }) {
  const selectedSchoolId = useAppStore(state => state.selectedSchoolId);
  const selectedSchool = useAppStore(state => state.selectedSchool);
  const userId = useAppStore(state => state.userId);
  const isStaff = useAppStore(state => state.isStaff);

  const [activeTab, setActiveTab] = useState<ReviewTab>('balances');
  const [duplicates, setDuplicates] = useState<DuplicateReviewRequest[]>([]);
  const [balances, setBalances] = useState<BalanceReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDispute, setShowNewDispute] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // If user is staff, show everything for the school.
      // If user is a parent, only show their own requests.
      const parentFilter = isStaff ? null : userId;
      const data = await getSchoolReviewCenterData(selectedSchoolId, parentFilter);
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

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* ── Fixed Header ── */}
      <header className="w-full h-[50px] pt-safe px-6 bg-white border-b border-neutral-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="size-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                <path d="M9 13L12 10L15 13" />
              </svg>
            </div>
            <h1 className="text-black text-[22px] font-bold font-['Inter'] tracking-tight">masterfees</h1>
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


      <main className="w-full max-w-[600px] flex flex-col pb-32">
        {/* ── Hero Section ── */}
        <section className="px-6 py-8 bg-[#f9fafb]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-black shadow-sm">
              <ClipboardCheck size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-smart-h2 font-bold font-['Inter'] text-black">{isStaff ? 'Review Center' : 'Support & Help'}</h2>
          </div>
          <p className="text-black text-smart-body leading-relaxed font-normal font-['Inter'] opacity-80 max-w-[400px]">
            {isStaff 
              ? 'Review and manage all pending student record disputes and balance discrepancies submitted by parents.'
              : 'Something doesn\'t look right? Let us know and the school will look into it.'}
          </p>
        </section>


        {/* ── Tabs ── */}
        <div className="px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => { hapticFeedback('light'); setActiveTab('balances'); }}
            className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'balances' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
          >
            {activeTab === 'balances' && <div className="w-1.5 h-1.5 bg-[#4FE501] rounded-full" />}
            <span className={`text-[12px] font-bold font-['Space_Grotesk'] ${activeTab === 'balances' ? 'text-black' : ''}`}>
              {isStaff ? 'Pending Reviews' : 'Waiting for School'}
            </span>
          </button>
          <button
            onClick={() => { hapticFeedback('light'); setActiveTab('history'); }}
            className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
          >
            {activeTab === 'history' && <div className="w-1.5 h-1.5 bg-[#4FE501] rounded-full" />}
            <span className={`text-[12px] font-bold font-['Space_Grotesk'] ${activeTab === 'history' ? 'text-black' : ''}`}>
              Resolved
            </span>
          </button>
        </div>

        <div className="px-6 space-y-6">
          {activeTab === 'balances' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw size={24} className="animate-spin text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Updating data...</p>
                </div>
              ) : pendingBalances.length > 0 ? (
                pendingBalances.map(item => (
                  <BalanceCard key={item.id} item={item} />
                ))
              ) : (
                <div className="py-12 border border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center text-center px-8 bg-gray-50/30">
                  <div className="size-14 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 mb-4 shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-smart-h3 font-black text-[#003630] mb-1">All Clear</h3>
                  <p className="text-smart-small text-gray-400 font-bold leading-relaxed">
                    You don't have any pending requests at the moment.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw size={24} className="animate-spin text-gray-300 mb-2" />
                </div>
              ) : historyItems.length > 0 ? (
                historyItems.map(entry => {
                  const req = entry.item;
                  return (
                    <div key={req.id} className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-black text-[13px] font-bold font-['Inter']">
                          {'student' in req ? `${req.student?.first_name} ${req.student?.last_name}` : 'Investigation Request'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                        <span>ID: <span className="text-black font-semibold uppercase">{req.id.slice(0,8)}</span></span>
                        <span>{new Date('reviewedAt' in req ? req.reviewedAt || req.createdAt : req.updatedAt || req.createdAt).toLocaleDateString()}</span>
                      </div>
                      {('reason' in req || 'note' in req) && (
                        <p className="text-neutral-400 text-[11px] leading-relaxed border-t border-neutral-50 pt-2 mt-1 whitespace-pre-wrap line-clamp-2">
                          {('reason' in req ? req.reason : (req as any).note) || 'No details provided.'}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 border border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center text-center px-8 bg-gray-50/30">
                  <div className="size-14 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 mb-4 shadow-sm">
                    <History size={24} />
                  </div>
                  <h3 className="text-[14px] font-black text-[#003630] mb-1">No History</h3>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    Your previous disputes will appear here once submitted.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {!isStaff && (
        <div className="w-full fixed bottom-0 left-0 right-0 p-6 pb-safe bg-white border-t border-neutral-100 shadow-[0px_-10px_30px_rgba(0,0,0,0.03)] flex flex-col items-center z-[60]">
          <div className="w-full max-w-[552px]">
            <button
              onClick={() => { hapticFeedback('medium'); setShowNewDispute(true); }}
              style={{ backgroundColor: '#003630' }}
              className="w-full h-14 text-white rounded-xl flex items-center justify-center gap-3 text-sm font-semibold font-['Inter'] shadow-xl shadow-teal-950/30 active:scale-[0.98] transition-all"
            >
              <AlertCircle size={18} />
              Report an Issue
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showNewDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end justify-center sm:items-center sm:p-4"
            onClick={() => setShowNewDispute(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-[600px] bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col pb-safe"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-6 border-b border-gray-50 flex items-center relative bg-white z-10">
                <button
                  onClick={() => setShowNewDispute(false)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="size-10 rounded-xl bg-[#003630]/5 flex items-center justify-center text-[#003630]">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#003630]">Report an Issue</h3>
                </div>
              </div>

              
              <div className="flex-1 overflow-y-auto p-6">
                <NewDisputeForm 
                  onSuccess={() => {
                    setShowNewDispute(false);
                    loadData();
                  }} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
