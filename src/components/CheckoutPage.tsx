import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import CheckoutPage2 from "./CheckoutPage2";
import { hapticFeedback } from "../utils/haptics";
import LogoHeader from "./common/LogoHeader";
import { Trash2, ChevronRight, CreditCard } from "lucide-react";
import type { CheckoutService as Service } from "../stores/useAppStore";

interface CheckoutPageProps {
  services: Service[];
  onProceed: (amount: number) => void;
}

/**
 * High-fidelity L-shaped geometric patterns from the design
 */
function HeroDecorations() {
  return (
    <div className="absolute right-0 top-0 h-full pointer-events-none overflow-hidden select-none">
      <div className="relative w-[135px] h-full">
        {/* Path 1 */}
        <div style={{ left: '45.72px', top: '8.51px', position: 'absolute' }}>
          <svg width="29" height="52" viewBox="0 0 29 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="100" d="M14.8926 49.492C13.1021 48.4367 12.2026 46.2023 11.6092 44.2039L1.81191 11.2082L1.7562 11.0133C0.647145 6.91531 2.91031 2.80212 6.88449 1.76482C10.8586 0.727664 15.0624 3.1529 16.3714 7.1986L16.432 7.39225L23.9917 32.8525L48.9707 26.3328L49.1604 26.2859C53.141 25.3582 57.3018 27.8636 58.5182 31.9602C59.7537 36.1217 57.4829 40.3493 53.4459 41.4031L21.1566 49.8313L20.9742 49.8762C19.0871 50.3172 16.6271 50.5142 14.8926 49.492Z" stroke="#95E36C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Path 2 */}
        <div style={{ left: '58.11px', top: '43.55px', position: 'absolute' }}>
          <svg width="15" height="37" viewBox="0 0 15 37" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="100" d="M2.33713 14.0488C3.42937 12.2807 5.68196 11.4277 7.69228 10.8759L40.8841 1.76548L41.0802 1.71382C45.2003 0.690052 49.2656 3.03809 50.2202 7.03294C51.1747 11.0277 48.6627 15.1803 44.5907 16.4051L44.3959 16.4616L18.7842 23.4914L24.7842 48.6002L24.827 48.7909C25.672 52.7899 23.0808 56.8977 18.9598 58.0289C14.7735 59.1778 10.594 56.8197 9.62423 52.7617L1.86792 20.3045L1.82678 20.1211C1.42511 18.2253 1.27911 15.7617 2.33713 14.0488Z" stroke="#95E36C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Path 3 */}
        <div style={{ left: '16.90px', top: '59.38px', position: 'absolute' }}>
          <svg width="61" height="20" viewBox="0 0 61 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="100" d="M45.6075 2.30502C47.3858 3.3806 48.2599 5.62508 48.8306 7.63012L58.2524 40.7349L58.3059 40.9305C59.3683 45.0408 57.0586 49.128 53.0729 50.1201C49.0873 51.112 44.9113 48.6392 43.6483 44.5789L43.59 44.3846L36.3199 18.8401L11.2685 25.0756L11.0782 25.1203C7.08736 26.0028 2.95533 23.4503 1.78556 19.3401C0.597366 15.1648 2.91606 10.9634 6.96479 9.95547L39.3477 1.89459L39.5307 1.85173C41.4226 1.43228 43.8847 1.26313 45.6075 2.30502Z" stroke="#95E36C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Path 4 */}
        <div style={{ left: '8.74px', top: '14.99px', position: 'absolute' }}>
          <svg width="52" height="61" viewBox="0 0 52 61" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path opacity="100" d="M49.5598 45.6072C48.4843 47.3856 46.2398 48.2597 44.2347 48.8304L11.1299 58.2522L10.9344 58.3057C6.82408 59.3681 2.73686 57.0583 1.74478 53.0726C0.752835 49.087 3.22567 44.911 7.28598 43.6481L7.4803 43.5897L33.0248 36.3196L26.7892 11.2682L26.7446 11.078C25.8621 7.08712 28.4146 2.95509 32.5248 1.78531C36.7001 0.597121 40.9015 2.91582 41.9094 6.96454L49.9703 39.3475L50.0131 39.5304C50.4326 41.4224 50.6017 43.8845 49.5598 45.6072Z" stroke="#95E36C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage({ services, onProceed }: CheckoutPageProps) {
  const [showPayInPart, setShowPayInPart] = useState(false);

  // Lifted state from CheckoutPage2 to persist across toggles
  const [excludedServiceIds, setExcludedServiceIds] = useState<Set<string>>(new Set());
  const [inputAmounts, setInputAmounts] = useState<Record<string, number>>(() => {
    const amounts: Record<string, number> = {};
    services.forEach(service => {
      amounts[service.id] = service.amount;
    });
    return amounts;
  });

  const handleAmountChange = (serviceId: string, value: number) => {
    setInputAmounts(prev => ({
      ...prev,
      [serviceId]: value
    }));
  };

  const handleRemoveService = (serviceId: string) => {
    setExcludedServiceIds(prev => {
      const next = new Set(prev);
      next.add(serviceId);
      return next;
    });
    hapticFeedback('light');
  };

  const activeServices = services.filter(s => !excludedServiceIds.has(s.id));
  const totalAmountValue = activeServices.reduce((sum, s) => sum + (inputAmounts[s.id] || 0), 0);

  if (showPayInPart) {
    return (
      <CheckoutPage2
        services={services}
        inputAmounts={inputAmounts}
        excludedServiceIds={excludedServiceIds}
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
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/>
                          <path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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
