import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  ChevronDown,
  Info,
  ShieldCheck,
  CreditCard,
  Percent,
  History,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { haptics } from '../utils/haptics';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase/client';
import { getParentByPhone } from '../lib/supabase/api/parents';
import { getFeePolicies, getDiscountDefinitions } from '../lib/supabase/api/schools';
import type { Student } from '../data/students';

interface PolicyItem {
  id: string;
  title: string;
  description: string;
  discount?: string;
}

interface PolicyCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: PolicyItem[];
}

interface PoliciesPageProps {
  onBack: () => void;
  students: Student[];
  userPhone: string;
  userName: string;
}

interface RefundRequest {
  id: string;
  student_name: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reason: string;
}

// We'll replace the static CATEGORIES with a dynamic state

export default function PoliciesPage({ onBack, students, userPhone, userName }: PoliciesPageProps) {
  const [activeTab, setActiveTab] = useState<'policies' | 'refund'>('policies');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['payment', 'discounts', 'refunds']);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [refundHistory, setRefundHistory] = useState<RefundRequest[]>([]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<PolicyCategory[]>([]);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'bank'>('mobile_money');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);

  // Fetch Parent ID and History
  React.useEffect(() => {
    async function init() {
      if (!userPhone) return;
      try {
        const parent = await getParentByPhone(userPhone);
        if (parent) {
          setParentId(parent.id);
          fetchHistory(parent.id);
        }
        
        // Fetch Policies
        if (students.length > 0) {
          const schoolIds = Array.from(new Set(students.map(s => s.schoolId).filter(Boolean))) as string[];
          if (schoolIds.length > 0) {
            fetchPolicies(schoolIds);
          }
        }
      } catch (err) {
        console.error('Error initializing PoliciesPage:', err);
      }
    }
    init();
  }, [userPhone, students]);

  const fetchPolicies = async (schoolIds: string[]) => {
    setIsLoadingPolicies(true);
    try {
      const [policies, discounts] = await Promise.all([
        getFeePolicies(schoolIds),
        getDiscountDefinitions(schoolIds)
      ]);

      const mappedCategories: PolicyCategory[] = [
        {
          id: 'payment',
          title: 'School Fee Payment Policies',
          icon: <CreditCard size={18} />,
          items: []
        },
        {
          id: 'discounts',
          title: 'Discount Policies',
          icon: <Percent size={18} />,
          items: []
        },
        {
          id: 'refunds',
          title: 'Refund Policies',
          icon: <History size={18} />,
          items: [
            {
              id: 'r_default',
              title: 'General Refund Policy',
              description: 'Refunds are subject to school approval. Requests must be submitted through this dashboard with valid justification.'
            }
          ]
        }
      ];

      // Map fee_policies
      policies.forEach(p => {
        const item: PolicyItem = {
          id: p.id,
          title: p.name,
          description: `Policy for **${p.category}**. ${p.strict_enforcement ? 'This policy is **strictly enforced**.' : ''} ` +
            (p.charge_late_fee ? `Late payments attract a fee of **K${p.late_fee_amount}** after a **${p.late_fee_grace_days} day** grace period.` : '') +
            (p.allow_installments ? ` Installment payments are permitted with a minimum of **${p.min_payment_percent}%**.` : '')
        };

        if (p.charge_late_fee || p.allow_installments || p.strict_enforcement) {
          mappedCategories[0].items.push(item);
        }

        if (p.early_payment_discount) {
          mappedCategories[1].items.push({
            id: p.id + '_discount',
            title: `${p.name} (Early Payment)`,
            description: `Receive a discount for payments made **${p.early_discount_days_before} days** before the due date.`,
            discount: `-${p.early_discount_percent}% Off`
          });
        }
      });

      // Map discount_definitions
      discounts.forEach(d => {
        mappedCategories[1].items.push({
          id: d.discount_id,
          title: d.name,
          description: d.description || `Applicable for eligible students.`,
          discount: d.discount_type === 'percentage' ? `-${d.amount}% Off` : `-K${d.amount} Off`
        });
      });

      // Add default payment policy if empty
      if (mappedCategories[0].items.length === 0) {
        mappedCategories[0].items.push({
          id: 'p_default',
          title: 'Standard Payment Terms',
          description: 'All fees are payable by the start of the term unless a payment plan is approved.'
        });
      }

      setDynamicCategories(mappedCategories);
      // Ensure all categories with items are expanded
      setExpandedCategories(mappedCategories.filter(c => c.items.length > 0).map(c => c.id));
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  const fetchHistory = async (pid: string) => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          id,
          amount,
          status,
          created_at,
          reason,
          student:students(first_name, last_name)
        `)
        .eq('parent_id', pid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData: RefundRequest[] = (data || []).map((r: any) => ({
        id: r.id,
        amount: r.amount,
        status: r.status,
        created_at: r.created_at,
        reason: r.reason || '',
        student_name: `${r.student?.first_name || ''} ${r.student?.last_name || ''}`.trim()
      }));

      setRefundHistory(mappedData);
    } catch (err) {
      console.error('Error fetching refund history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleApplyRefund = async () => {
    if (!parentId || !selectedStudentId || !amount || !reason || !accountNumber) {
      toast.error("Please fill in all details");
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    haptics.medium?.();

    try {
      const student = students.find(s => s.id === selectedStudentId);
      const { error } = await supabase
        .from('refund_requests')
        .insert({
          student_id: selectedStudentId,
          parent_id: parentId,
          school_id: student?.schoolId,
          amount: numericAmount,
          reason: reason,
          meta_data: {
            payment_method: paymentMethod,
            account_number: accountNumber,
            submitted_by: userName
          }
        });

      if (error) throw error;

      toast.success("Refund request submitted successfully!");
      setShowRefundForm(false);
      // Reset form
      setAmount('');
      setReason('');
      setAccountNumber('');
      // Refresh history
      fetchHistory(parentId);
    } catch (err) {
      console.error('Error submitting refund:', err);
      toast.error("Failed to submit refund request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (id: string) => {
    haptics.light?.();
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* ── Fixed Header ── */}
      <header className="w-full h-24 px-6 bg-white border-b border-neutral-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              haptics.medium?.();
              if (showRefundForm) {
                setShowRefundForm(false);
              } else {
                onBack();
              }
            }}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black active:scale-90 transition-transform"
          >
            <ChevronRight className="rotate-180" size={20} strokeWidth={2.5} />
          </button>
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
      </header>

      <main className="w-full max-w-[600px] flex flex-col pb-32">
        {/* ── Hero Section ── */}
        <section className="px-6 py-8 bg-[#f9fafb]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-black shadow-sm">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold font-['Inter'] text-black">Policies & Refunds</h2>
          </div>
          <p className="text-black text-[13px] leading-relaxed font-normal font-['Inter'] opacity-80 max-w-[340px]">
            You can read through the School's Different Policies related to school fees from here. You can also make a Request to get a Refund.
          </p>
        </section>

        {/* ── Tabs ── */}
        {!showRefundForm && (
          <div className="px-6 py-6 flex items-center gap-4">
            <button
              onClick={() => { haptics.light?.(); setActiveTab('policies'); }}
              className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'policies' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
            >
              {activeTab === 'policies' && <div className="w-1.5 h-1.5 bg-[#4FE501] rounded-full" />}
              <span className={`text-xs font-bold font-['Space_Grotesk'] ${activeTab === 'policies' ? 'text-black' : ''}`}>Policies</span>
            </button>
            <button
              onClick={() => { haptics.light?.(); setActiveTab('refund'); }}
              className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'refund' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
            >
              {activeTab === 'refund' && <div className="w-1.5 h-4.5 bg-[#4FE501] rounded-full" />}
              <span className={`text-xs font-bold font-['Space_Grotesk'] ${activeTab === 'refund' ? 'text-black' : ''}`}>Refunds</span>
            </button>
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-6 space-y-4 gap-4">
          {activeTab === 'policies' ? (
            <div className="space-y-4">
              {isLoadingPolicies ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="animate-spin text-teal-600 mb-2" size={32} />
                  <p className="text-neutral-500 text-sm">Loading policies...</p>
                </div>
              ) : dynamicCategories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full p-4 flex items-center justify-between group active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-neutral-400 group-hover:text-black transition-colors">
                        {cat.icon}
                      </div>
                      <span className="text-black text-sm font-bold font-['Inter']">{cat.title}</span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-neutral-400 transition-transform duration-300 ${expandedCategories.includes(cat.id) ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedCategories.includes(cat.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          <div className="h-px bg-neutral-100 w-full mb-3" />
                          {cat.items.length > 0 ? cat.items.map((item) => (
                            <div key={item.id} className="p-4 bg-[#f9fafb] rounded-[20px] border border-neutral-50 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-black text-[13px] font-semibold font-['Inter']">{item.title}</span>
                                {item.discount && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-bold text-[#003630] bg-[#95e36c]/20 px-2 py-0.5 rounded-md">{item.discount}</span>
                                    <div className="w-5 h-5 rounded-md bg-white border border-neutral-200 shadow-inner flex items-center justify-center">
                                      <Check size={12} className="text-[#003630]" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p
                                className="text-neutral-500 text-[11px] leading-relaxed font-['Inter']"
                                dangerouslySetInnerHTML={{
                                  __html: item.description.replace(/\*\*(.*?)\*\*/g, '<span class="text-black font-bold">$1</span>')
                                }}
                              />
                            </div>
                          )) : (
                            <div className="p-4 text-center">
                              <p className="text-neutral-400 text-[11px]">No specific policies found for this category.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : !showRefundForm ? (
            <div className="flex flex-col gap-4 h-full">
              {/* Info Banner */}
              <div className="p-4 bg-[#F7F7F7] rounded-xl flex items-center gap-4 border border-neutral-100 shadow-sm">
                <div className="w-5 h-5 flex items-center justify-center text-neutral-600">
                  <Info size={18} />
                </div>
                <p className="flex-1 text-neutral-600 text-[12px] leading-relaxed font-normal font-['Inter']">
                  Once you make a refund request, it will be sent to the school, and once approved, the money will be disbursed into your designated account.
                </p>
              </div>

              {/* History / Requests List Area */}
              <div className="flex-1 min-h-[400px] flex flex-col gap-4">
                {isLoadingHistory ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <Loader2 className="animate-spin text-teal-600 mb-2" size={32} />
                    <p className="text-neutral-500 text-sm font-medium">Loading requests...</p>
                  </div>
                ) : refundHistory.length > 0 ? (
                  <div className="space-y-3">
                    {refundHistory.map((req) => (
                      <div key={req.id} className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-black text-[13px] font-bold font-['Inter']">{req.student_name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                          <span>Amount: <span className="text-black font-semibold">K{req.amount.toLocaleString()}</span></span>
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        {req.reason && <p className="text-neutral-400 text-[10px] italic border-t border-neutral-50 pt-2 mt-1 line-clamp-1">{req.reason}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 min-h-[400px] rounded-xl border border-[#E6E6E6] gap-4 border-dashed bg-gray-50/30 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 mb-4 shadow-sm border border-neutral-100">
                      <History size={24} />
                    </div>
                    <p className="text-neutral-500 text-[12px] font-medium font-['Space_Grotesk'] max-w-[200px]">
                      The Requests you submit will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Refund Request Form ── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8 pt-4 pb-20"
            >
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="text-black text-base font-bold font-['Inter']">Please Fill in the Details</h3>
              </div>

              <div className="space-y-6">
                {/* Select Account */}
                <div className="flex flex-col gap-2 relative">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Select Account(s)</label>
                  <button
                    onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                    className="w-full px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 flex items-center justify-between group active:bg-gray-50 transition-colors"
                  >
                    <span className="text-black text-xs font-medium font-['Inter']">
                      {students.find(s => s.id === selectedStudentId)?.name || 'Select a student'}
                    </span>
                    <ChevronDown size={16} className={`text-neutral-600 transition-transform ${showStudentDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showStudentDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-100 shadow-xl z-50 overflow-hidden"
                      >
                        {students.map(student => (
                          <button
                            key={student.id}
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setShowStudentDropdown(false);
                              haptics.light?.();
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-neutral-50 last:border-0"
                          >
                            <span className="text-xs font-medium text-black">{student.name}</span>
                            {selectedStudentId === student.id && <Check size={14} className="text-[#003630]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Destination Details */}
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Enter Destination Account Details</label>
                  <div className="grid grid-cols-2 gap-3 relative">
                    <button
                      onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                      className="px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 flex items-center justify-between"
                    >
                      <span className="text-black text-xs font-medium font-['Inter']">
                        {paymentMethod === 'mobile_money' ? 'M-Money' : 'Bank'}
                      </span>
                      <ChevronDown size={16} className={`text-neutral-600 transition-transform ${showMethodDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <input
                      type="text"
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 text-black text-xs font-medium font-['Inter'] placeholder:text-zinc-400 focus:outline-[#003630] transition-all"
                    />

                    <AnimatePresence>
                      {showMethodDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 w-1/2 mt-2 bg-white rounded-xl border border-neutral-100 shadow-xl z-50 overflow-hidden"
                        >
                          {(['mobile_money', 'bank'] as const).map(method => (
                            <button
                              key={method}
                              onClick={() => {
                                setPaymentMethod(method);
                                setShowMethodDropdown(false);
                                haptics.light?.();
                              }}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-neutral-50 last:border-0"
                            >
                              <span className="text-xs font-medium text-black">{method === 'mobile_money' ? 'M-Money' : 'Bank'}</span>
                              {paymentMethod === method && <Check size={14} className="text-[#003630]" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Enter the Amount you want to Request</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black font-bold text-sm">K</span>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setAmount(val);
                      }}
                      className="w-full px-8 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 text-black text-sm font-bold font-['Inter'] placeholder:text-zinc-400 focus:outline-[#003630] transition-all text-right"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Reason for Refund Request</label>
                  <textarea
                    placeholder="Please state the reason for your Refund Request"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-32 px-4 py-4 bg-white rounded-xl shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black text-xs font-medium font-['Inter'] placeholder:text-zinc-400 focus:outline-[#003630] transition-all resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* ── Fixed Bottom Action Bar ── */}
      {activeTab === 'refund' && (
        <div className="w-full fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-neutral-100 shadow-[0px_-10px_30px_rgba(0,0,0,0.03)] flex flex-col items-center z-[60]">
          <div className="w-full max-w-[552px]">
            {!showRefundForm ? (
              <button
                onClick={() => {
                  haptics.medium?.();
                  setShowRefundForm(true);
                }}
                style={{ backgroundColor: '#003630' }}
                className="w-full h-14 text-white rounded-xl flex items-center justify-center text-sm font-semibold font-['Inter'] shadow-xl shadow-teal-950/30 active:scale-[0.98] transition-all"
              >
                Request a Refund
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    haptics.light?.();
                    setShowRefundForm(false);
                  }}
                  className="flex-1 h-14 bg-transparent border border-neutral-200 text-black rounded-xl flex items-center justify-center gap-2 text-sm font-bold font-['Inter'] active:scale-[0.98] transition-all"
                >
                  <div className="w-3 h-3 flex items-center justify-center border border-neutral-400 rounded-sm scale-75 rotate-45" />
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleApplyRefund}
                  style={{ backgroundColor: isSubmitting ? '#E6E6E6' : '#003129' }}
                  className="flex-1 h-14 text-white rounded-xl flex items-center justify-center text-sm font-medium font-['Inter'] shadow-lg active:scale-[0.98] transition-all disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
