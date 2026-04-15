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
              onBack();
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

      <main className="w-full max-w-[600px] flex flex-col">
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
        <div className="px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => { haptics.light?.(); setActiveTab('policies'); }}
            className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'policies' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
          >
            {activeTab === 'policies' && <div className="w-1.5 h-3.5 bg-[#4FE501] rounded-full" />}
            <span className={`text-xs font-bold font-['Space_Grotesk'] ${activeTab === 'policies' ? 'text-black' : ''}`}>Policies</span>
          </button>
          <button
            onClick={() => { haptics.light?.(); setActiveTab('refund'); }}
            className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'refund' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
          >
            {activeTab === 'refund' && <div className="w-1.5 h-4.5 bg-[#4FE501] rounded-full" />}
            <span className={`text-xs font-bold font-['Space_Grotesk'] ${activeTab === 'refund' ? 'text-black' : ''}`}>Request a Refund</span>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="px-6 pb-12 space-y-4">
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
          ) : (
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
          )}
        </div>
      </main>

      {/* ── Fixed Bottom Action Bar ── */}
      {activeTab === 'refund' && (
        <div className="w-full fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-neutral-100 shadow-[0px_-10px_30px_rgba(0,0,0,0.03)] flex flex-col items-center">
          <div className="w-full max-w-[552px]">
            <button
              onClick={() => {
                haptics.medium?.();
                toast.info("Refund requests coming soon!");
              }}
              style={{ backgroundColor: '#003630' }}
              className="w-full h-14 text-white rounded-xl flex items-center justify-center text-sm font-semibold font-['Inter'] shadow-xl shadow-teal-950/30 active:scale-[0.98] transition-all"
            >
              Request a Refund
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
