import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import CheckoutPage2 from "./CheckoutPage2";
import { hapticFeedback } from "../utils/haptics";
import LogoHeader from "./common/LogoHeader";
import { Trash2, ChevronRight, CreditCard } from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
import type { CheckoutService as Service } from "../stores/useAppStore";
import group16 from "../assets/decorations/Group 16.png";
import group17 from "../assets/decorations/Group 17.png";

interface CheckoutPageProps {
  services: Service[];
  onProceed: (amount: number) => void;
}

/**
 * High-fidelity L-shaped geometric patterns from the design
 */
function HeroDecorations() {
  return (
    <div className="absolute right-0 top-0 h-full w-full pointer-events-none overflow-hidden select-none z-0">
      <div className="relative w-full h-full">
        {/* Decorative Assets from right corner */}
        <div
          className="absolute right-[10px] w-[120px] h-[120px] opacity-[0.08]"
          style={{ top: '-60px', transform: 'rotate(25deg)', zIndex: 0 }}
        >
          <img src={group16} alt="" className="w-full h-full object-contain" />
        </div>
        <div
          className="absolute right-[8px] w-[120px] h-[120px] opacity-[0.15]"
          style={{ bottom: '-50px', transform: 'translateY(5px) rotate(-12deg)', zIndex: 1 }}
        >
          <img src={group17} alt="" className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage({ services, onProceed }: CheckoutPageProps) {
  const [showPayInPart, setShowPayInPart] = useState(false);

  // Global state from useAppStore to persist across page navigations
  const excludedServiceIds = useAppStore(state => state.excludedServiceIds);
  const setExcludedServiceIds = useAppStore(state => state.setExcludedServiceIds);
  const inputAmounts = useAppStore(state => state.inputAmounts);
  const setInputAmounts = useAppStore(state => state.setInputAmounts);

  // Initialize input amounts from services if not already set
  useEffect(() => {
    if (services.length > 0) {
      const missingKeys = services.filter(s => inputAmounts[s.id] === undefined);
      if (missingKeys.length > 0) {
        setInputAmounts(prev => {
          const next = { ...prev };
          missingKeys.forEach(s => {
            if (next[s.id] === undefined) next[s.id] = s.amount;
          });
          return next;
        });
      }
    }
  }, [services, inputAmounts, setInputAmounts]);

  const handleAmountChange = (serviceId: string, value: number) => {
    setInputAmounts(prev => ({
      ...prev,
      [serviceId]: value
    }));
  };

  const handleRemoveService = (serviceId: string) => {
    setExcludedServiceIds(prev => {
      if (prev.includes(serviceId)) return prev;
      return [...prev, serviceId];
    });
    hapticFeedback('light');
  };

  const excludedSet = useMemo(() => new Set(excludedServiceIds), [excludedServiceIds]);
  const activeServices = services.filter(s => !excludedSet.has(s.id));
  const totalAmountValue = activeServices.reduce((sum, s) => sum + (inputAmounts[s.id] || 0), 0);

  if (showPayInPart) {
    return (
      <CheckoutPage2
        services={services}
        inputAmounts={inputAmounts}
        excludedServiceIds={excludedSet}
        onAmountChange={handleAmountChange}
        onRemoveService={handleRemoveService}
        onProceed={onProceed}
        onBack={() => setShowPayInPart(false)}
      />
    );
  }

  return (
    <div className="bg-white h-[100dvh] w-full flex justify-center fixed inset-0 overflow-hidden font-['Inter',sans-serif]">
      <div className="flex flex-col w-full max-w-[440px] h-full relative" data-name="Checkout page 1">

        {/* ── Header ── */}
        <div className="h-20 w-full  flex items-center border-b border-[#E6E6E6] bg-white sticky top-0 z-30">
          <LogoHeader />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          {/* ── Hero Section (Total) ── */}
          <section className="h-[120px] w-full bg-[#f9fafb] relative overflow-hidden flex items-center px-8 border-b border-[#F0F0F0]">
            <HeroDecorations />
            <div className="relative z-10 flex flex-col gap-0.5 mt-2">
              <div className="px-6 flex items-center gap-2 mb-1">
                <div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Bag body — dark green */}
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="#003630" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Bag bottom line — dark green */}
                    <line x1="3" y1="6" x2="21" y2="6" stroke="#003630" strokeWidth="2" strokeLinecap="round" />
                    {/* Handles — light green */}
                    <path d="M16 10a4 4 0 0 1-8 0" stroke="#95E36C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-brand-dark text-xs font-light tracking-tight">Cart Total</span>
              </div>
              <motion.div
                key={totalAmountValue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 text-[#003630] text-[48px] font-extrabold leading-none tracking-[-0.04em]"
              >
                K{totalAmountValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </motion.div>
            </div>
          </section>

          {/* ── Checkout Summary ── */}
          <div className="px-4 py-4 mt-6 mb-4">
            <h2 className="text-black text-[16px] font-bold font-['Inter']">Checkout Summary</h2>
          </div>

          <div className="px-4 flex flex-col gap-0 pb-6">
            {activeServices.map((service, index) => (
              <div key={service.id}>
                {/* Individual Card Row */}
                <div className="w-full py-3 bg-white rounded-2xl flex flex-col gap-2.5">
                  <div className="self-stretch inline-flex justify-end items-start gap-2.5">
                    {/* Number */}
                    <div className="px-2.5 pt-0.5 pb-2.5 flex flex-col justify-start items-center gap-2.5">
                      <span className="text-center text-black text-[12px] font-normal font-['Inter']">{index + 1}.</span>
                    </div>

                    {/* Name + Pupil */}
                    <div className="py-px flex flex-col justify-start items-start gap-1">
                      <div className="flex flex-col justify-center items-start gap-1">
                        <span className="text-black text-[12px] font-normal font-['Inter']">{service.description}</span>
                      </div>
                      <div className="flex flex-col justify-center items-start gap-1">
                        <span className="text-[#808080] text-[8px] font-normal font-['Inter']">{service.studentName}</span>
                      </div>
                    </div>

                    {/* Price + Trash */}
                    <div className="flex-1 flex justify-end items-start gap-4">
                      <div className="px-2.5 pb-2.5 flex flex-col justify-start items-end gap-2.5">
                        <span className="text-center text-black text-[12px] font-normal font-['Inter']">
                          K{service.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                      </div>
                      {/* Custom trash icon matching design spec */}
                      <button
                        onClick={() => handleRemoveService(service.id)}
                        className="w-4 h-4 relative cursor-pointer flex-shrink-0 mr-2 hover:opacity-60 active:scale-90 transition-all"
                        aria-label="Remove item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AEAEAE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider between rows */}
                {index < activeServices.length - 1 && (
                  <div style={{ borderBottom: '1px dashed #95E36C' }} className="self-stretch" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom Action Bar ── */}
        {/* ── Bottom Action Area ── */}
        <div className="px-6 pt-2 pb-4 bg-white border-t border-[#F0F0F0] flex flex-col gap-4 shadow-[0_-15px_40px_-20px_rgba(0,0,0,0.05)]">

          {/* Unified Checkout Bar (Transformed into a single full-width button) */}
          <button
            onClick={() => {
              hapticFeedback('medium');
              onProceed(totalAmountValue);
            }}
            className="w-full h-[60px] bg-[#003630] text-white rounded-[16px] flex items-center justify-center gap-3 active:scale-[0.97] transition-all group relative overflow-hidden shadow-[0px_25px_60px_rgba(0,54,48,0.2),0px_4px_12px_rgba(0,54,48,0.1)]"
          >
            <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-tight">
              Pay in full
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>

          {/* Elegant 'or' Separator */}
          <div className="flex justify-center items-center gap-4 py-1">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <span className="text-[#808080] text-[10px] font-bold uppercase tracking-[1px] px-1">or</span>
            <div className="h-[1px] flex-1 bg-gray-100" />
          </div>

          {/* Part Payment Bar (Simplified) */}
          <div
            onClick={() => {
              hapticFeedback('medium');
              setShowPayInPart(true);
            }}
            className="bg-white rounded-[16px] p-2 flex items-center justify-center h-[60px] active:scale-[0.98] transition-all cursor-pointer"
          >
            <p className="font-['Inter',sans-serif] font-medium text-[16px] text-black leading-none tracking-tight">
              Part Payments
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
