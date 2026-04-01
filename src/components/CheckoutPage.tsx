import { useState } from "react";

import checkoutSvgPaths from "../imports/svg-qndngnuysv";
import CheckoutPage2 from "./CheckoutPage2";
import { hapticFeedback } from "../utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LogoHeader from "./common/LogoHeader";

import type { CheckoutService as Service } from "../stores/useAppStore";

interface CheckoutPageProps {
  services: Service[];
  onProceed: (amount: number) => void;
}

function Header() {

  return (
    <LogoHeader />
  );
}


function Digit({ digit }: { digit: string }) {
  return (
    <div className="h-[32px] overflow-hidden relative w-[min-content] flex items-center justify-center">
      <motion.div
        key={digit}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        exit={{ y: "-100%", opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.8px] leading-none font-black flex items-center h-full"
      >
        {digit}
      </motion.div>
    </div>
  );
}

function AnimatedAmount({ amount }: { amount: number }) {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className="flex items-center">
      {formatted.split("").map((char, i) => (
        <Digit key={`${i}-${char}`} digit={char} />
      ))}
    </div>
  );
}

function Group({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between w-full mt-4">
      <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] text-gray-500 uppercase tracking-widest">To Pay Now</p>
      <div className="bg-white/95 backdrop-blur-[12px] border-[1.5px] border-[#eef1f5] px-5 py-2 rounded-[14px] shadow-[0px_8px_16px_-4px_rgba(0,54,48,0.12)] flex items-center gap-2 relative z-20">
        <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630]/70">K</span>
        <AnimatedAmount amount={total} />
      </div>
    </div>
  );
}

function SummaryCard({ total, onProceed }: { total: number; onProceed: () => void }) {
  return (
    <div className="bg-white rounded-[24px] w-full max-w-[340px] mx-auto relative overflow-hidden ring-1 ring-[#e5e7eb] shadow-[0px_12px_24px_-8px_rgba(0,0,0,0.06)]">
      {/* Decorative Chevrons in Top Right */}
      <div className="absolute -top-4 -right-2 w-32 h-32 opacity-80 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full rotate-[-15deg]">
          <path d="M40 20L65 45L40 70" stroke="#e0f7d4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M55 20L80 45L55 70" stroke="#95e36c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
          <path d="M70 20L95 45L70 70" stroke="#003630" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="p-5 flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003630]/15 to-[#003630]/5 border-[1.5px] border-[#003630]/30 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          
          {/* Action Button - refined */}
          <button
            onClick={onProceed}
            className="h-10 px-5 rounded-xl bg-[#003630] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform group"
          >
            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-white text-[13px] tracking-[-0.2px]">Go to pay</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.3px]">Payment Summary</h2>
        </div>

        <Group total={total} />
      </div>
    </div>
  );
}

function ServiceItem({ studentName, description, amount }: { studentName: string; description: string; amount: number }) {
  return (
    <div className="flex items-start justify-between w-full py-1">
      <div className="flex gap-3 min-w-0">
        <div className="mt-1 shrink-0">
          <div className="w-[15px] h-[15px] rounded-full bg-[#95e36c] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#003630" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] text-[#003630] truncate">{studentName}</p>
          <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[11px] text-[#6b7280] leading-tight line-clamp-2">{description}</p>
        </div>
      </div>
      <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-[#ff6b6b] shrink-0 ml-4">
        K{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function BreakdownSection({ services }: { services: Service[] }) {
  const total = services.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="w-full bg-[#f9fafb]/80 border-[1.5px] border-[#e5e7eb] rounded-[24px] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
        <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[12px] text-gray-400 uppercase tracking-widest">Breakdown</p>
      </div>
      
      <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto scrollbar-hide py-1">
        {services.map((service, index) => (
          <div key={service.id}>
            <ServiceItem studentName={service.studentName} description={service.description} amount={service.amount} />
            {index < services.length - 1 && <div className="h-[1px] bg-gray-50 mt-3" />}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between">
        <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">Total</p>
        <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#003630]">
          K{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
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
  };

  // Use configured total if in PayInPart mode, otherwise use sum of all services
  const totalAmountValue = services
    .filter(s => !excludedServiceIds.has(s.id))
    .reduce((sum, s) => sum + (inputAmounts[s.id] || 0), 0);

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
    <div className="bg-white h-[100dvh] w-full flex justify-center overflow-hidden fixed inset-0">
      <div className="flex flex-col w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-full shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] relative overflow-hidden" data-name="Checkout page 1">
        <LogoHeader />
        
        <div className="flex flex-col flex-1 min-h-0 px-5 pt-6 relative overflow-hidden">
          <div className="flex flex-col gap-1 mb-6 shrink-0">
            <div className="inline-flex items-center gap-[8px]">
              <div className="w-[3px] h-[24px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full" />
              <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.4px]">
                Checkout
              </h1>
            </div>
            <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[13px] text-[#6b7280] leading-[1.5] tracking-[-0.2px]">
              Confirm your payment details below
            </p>
          </div>

          <div className="flex flex-col gap-6 flex-1 min-h-0">
            <div className="shrink-0">
              <SummaryCard total={totalAmountValue} onProceed={() => onProceed(totalAmountValue)} />
            </div>

            <div className="flex-1 min-h-0 py-2">
              <BreakdownSection services={services.filter(s => !excludedServiceIds.has(s.id))} />
            </div>

            <div className="shrink-0 py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-[1px] flex-1 bg-gray-100" />
                <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[13px] text-gray-400">or</p>
                <div className="h-[1px] flex-1 bg-gray-100" />
              </div>

              <button
                onClick={() => {
                  hapticFeedback('medium');
                  setShowPayInPart(true);
                }}
                className="w-full h-[56px] relative rounded-[18px] touch-manipulation group overflow-hidden transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                <div className="absolute inset-0 border-[2px] border-[#95e36c] group-hover:bg-[#95e36c]/5 rounded-[18px] transition-all" />
                <div className="relative z-10 flex items-center justify-center gap-2 h-full">
                  <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] text-[16px] tracking-[-0.3px]">
                    Pay in part
                  </p>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="group-hover:translate-x-0.5 transition-transform">
                    <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
