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
  Check
} from 'lucide-react';
import { haptics } from '../utils/haptics';
import { toast } from 'sonner';

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
}

const CATEGORIES: PolicyCategory[] = [
  {
    id: 'payment',
    title: 'School Fee Payment Policies',
    icon: <CreditCard size={18} />,
    items: [
      {
        id: 'p1',
        title: 'Three Child Discount',
        description: 'You need at least **three children** and **pay in full** to be applicable for this discount.'
      },
      {
        id: 'p2',
        title: 'Staff member discount',
        description: 'You need at least **three children** and **pay in full** to be applicable for this discount.'
      }
    ]
  },
  {
    id: 'discounts',
    title: 'Discount Policies',
    icon: <Percent size={18} />,
    items: [
      {
        id: 'd1',
        title: 'Three Child Discount',
        description: 'You need at least **three children** and **pay in full** to be applicable for this discount.',
        discount: '-K200 Off'
      },
      {
        id: 'd2',
        title: 'Staff member discount',
        description: 'You need at least **three children** and **pay in full** to be applicable for this discount.',
        discount: '-23% Off'
      }
    ]
  },
  {
    id: 'refunds',
    title: 'Refund Policies',
    icon: <History size={18} />,
    items: [
      {
        id: 'r1',
        title: 'Time from Payment',
        description: 'You need at least **three children** and **pay in full** to be applicable for this discount.'
      }
    ]
  }
];

export default function PoliciesPage({ onBack }: PoliciesPageProps) {
  const [activeTab, setActiveTab] = useState<'policies' | 'refund'>('policies');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['payment', 'discounts', 'refunds']);
  const [showRefundForm, setShowRefundForm] = useState(false);

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
              {CATEGORIES.map((cat) => (
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
                          {cat.items.map((item) => (
                            <div key={item.id} className="p-4 bg-[#f9fafb] rounded-[20px] border border-neutral-50 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-black text-[13px] font-semibold font-['Inter']">{item.title}</span>
                                {item.discount && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-bold text-[#003630] bg-[#95e36c]/20 px-2 py-0.5 rounded-md">{item.discount}</span>
                                    <div className="w-5 h-5 rounded-md bg-white border border-neutral-200 shadow-inner flex items-center justify-center">
                                      {/* Mock Checkbox */}
                                      <div className="w-3 h-3 rounded-[2px] bg-neutral-100" />
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
                          ))}
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

              {/* Empty State / Requests List Area */}
              <div className="flex-1 min-h-[400px] rounded-xl border border-[#E6E6E6] gap-4 border-dashed bg-gray-50/30 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 mb-4 shadow-sm border border-neutral-100">
                  <History size={24} />
                </div>
                <p className="text-neutral-500 text-[12px] font-medium font-['Space_Grotesk'] max-w-[200px]">
                  The Requests you submit will appear here
                </p>
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
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Select Account(s)</label>
                  <div className="w-full px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 flex items-center justify-between group active:bg-gray-50 transition-colors">
                    <span className="text-black text-xs font-medium font-['Inter']">Shana Siwale</span>
                    <ChevronDown size={16} className="text-neutral-600" />
                  </div>
                </div>

                {/* Destination Details */}
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Enter Destination Account Details</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 flex items-center justify-between">
                      <span className="text-black text-xs font-medium font-['Inter']">Payment Method</span>
                      <ChevronDown size={16} className="text-neutral-600" />
                    </div>
                    <div className="px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 flex items-center justify-end">
                      <span className="text-zinc-400 text-xs font-medium font-['Inter']">Account Number</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Enter the Amount you want to Request</label>
                  <div className="w-full px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 flex items-center justify-end">
                    <span className="text-zinc-400 text-xs font-medium font-['Inter']">K0.00</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Reason for Refund Request</label>
                  <div className="w-full h-32 px-4 py-4 bg-white rounded-xl shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-neutral-200">
                    <span className="text-zinc-400 text-xs font-medium font-['Inter']">Please state the reason for your Refund Request</span>
                  </div>
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
                  onClick={() => {
                    haptics.medium?.();
                    toast.success("Refund request submitted!");
                    setShowRefundForm(false);
                  }}
                  style={{ backgroundColor: '#003129' }}
                  className="flex-1 h-14 text-white rounded-xl flex items-center justify-center text-sm font-medium font-['Inter'] shadow-lg active:scale-[0.98] transition-all"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
