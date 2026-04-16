import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { hapticFeedback } from "../utils/haptics";
import LogoHeader from "./common/LogoHeader";
import { CreditCard, ChevronRight } from "lucide-react";

import type { CheckoutService as Service } from "../stores/useAppStore";

interface CheckoutPage2Props {
  services: Service[];
  inputAmounts: Record<string, number>;
  excludedServiceIds: Set<string>;
  onAmountChange: (serviceId: string, value: number) => void;
  onRemoveService: (serviceId: string) => void;
  onProceed: (amount: number) => void;
  onBack: () => void;
}



function ChildPill({ name, isActive, onClick }: { name: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={() => {
        hapticFeedback('selection');
        onClick();
      }}
      className={`h-[36px] px-[16px] rounded-[12px] transition-all duration-300 flex items-center justify-center relative shrink-0 min-w-[110px] active:scale-95 ${isActive
        ? 'bg-[#95e36c] text-[#003630] border-transparent shadow-[0px_4px_12px_-2px_rgba(149,227,108,0.3)] z-10'
        : 'bg-white border-[1.2px] border-[#f1f3f5] text-[#4b5563] shadow-[0px_2px_4px_rgba(0,0,0,0.02)]'
        }`}
    >
      <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[12px] tracking-[-0.2px] whitespace-nowrap`}>
        {name}
      </span>
    </button>
  );
}



function ServiceItem({ description, amount }: { description: string; amount: number }) {
  return (
    <div className="flex items-center justify-between w-full py-2">
      <div className="flex flex-col gap-1">
        <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[13px] text-black leading-tight">{description}</p>
      </div>
      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[13px] text-black">K{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  );
}

function AmountInput({ serviceId, value, onChange }: { serviceId: string; value: number; onChange: (serviceId: string, value: number) => void }) {
  const [inputValue, setInputValue] = useState(value.toFixed(2));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Parse the value and update parent state
    const parsed = parseFloat(newValue.replace(/,/g, ''));
    if (!isNaN(parsed)) {
      onChange(serviceId, parsed);
    } else if (newValue === '' || newValue === '0') {
      onChange(serviceId, 0);
    }
  };

  return (
    <div className="relative w-full h-[48px] mt-2">
      <div className="box-border flex items-center gap-2 h-full px-3 rounded-[12px] border-[1.5px] border-[#e5e7eb] bg-[#f9fafb] focus-within:border-[#95e36c] focus-within:bg-white transition-all shadow-sm">
        <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] text-[#6b7280] shrink-0">K</span>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          className="flex-1 min-w-0 font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[15px] text-right text-[#003630] bg-transparent outline-none pr-1 tracking-[-0.2px]"
        />
      </div>
    </div>
  );
}

function StudentInfoCard({ name, amount }: { name: string; amount: number }) {
  return (
    <div className="bg-white rounded-[20px] p-[16px] border-[1.5px] border-[#e5e7eb] shadow-sm mb-2">
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#003630] tracking-[-0.3px] leading-tight">
              {name}
            </h3>
            <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] leading-none opacity-60">
              Student
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="font-['Inter:Bold',sans-serif] text-[19px] text-[#003630] leading-none font-bold">
              K {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[9px] text-[#9ca3af] font-black uppercase tracking-[1px] leading-none">Setting up pricing</span>
          </div>
        </div>
      </div>
    </div>
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

function StudentServiceCard({
  services,
  inputAmounts,
  onAmountChange,
  onRemoveService
}: {
  services: Service[];
  inputAmounts: Record<string, number>;
  onAmountChange: (serviceId: string, value: number) => void;
  onRemoveService: (serviceId: string) => void;
}) {
  return (
    <div className="w-full flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {services.map((service) => (
          <motion.div
            key={service.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="card card-interactive rounded-[14px] p-5 group w-full border-[1.5px] border-[#e5e7eb] shadow-sm bg-white relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex-1 pr-6">
                <ServiceItem
                  description={service.description}
                  amount={service.amount}
                />
              </div>

              {/* Remove Button - Anchored Right */}
              <button
                onClick={() => {
                  hapticFeedback('medium');
                  onRemoveService(service.id);
                }}
                className="shrink-0 -mr-1 -mt-1 p-2 rounded-full bg-gray-50/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors z-30 shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100/60 pr-10">
              <AmountInput
                serviceId={service.id}
                value={inputAmounts[service.id] || 0}
                onChange={onAmountChange}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Group({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between w-full mt-4">
      <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] text-gray-500 uppercase tracking-widest">Total</p>
      <div className="bg-white/95 backdrop-blur-[12px] border-[1.5px] border-[#eef1f5] px-5 py-2 rounded-[14px] shadow-[0px_8px_16px_-4px_rgba(0,54,48,0.12)] flex items-center gap-2 relative z-20">
        <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630]/70">K</span>
        <AnimatedAmount amount={total} />
      </div>
    </div>
  );
}

function Frame20({ total }: { total: number }) {
  return (
    <div className="bg-white rounded-[24px] w-full max-w-[340px] mx-auto relative overflow-hidden ring-1 ring-[#e5e7eb] shadow-[0px_12px_24px_-8px_rgba(0,0,0,0.06)]">
      {/* Decorative Chevrons in Top Right */}
      <div className="absolute -top-4 -right-2 w-32 h-32 opacity-80 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full rotate-[-15deg]">
          {/* Light Green Chevron */}
          <path d="M40 20L65 45L40 70" stroke="#e0f7d4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          {/* Mid Green Chevron */}
          <path d="M55 20L80 45L55 70" stroke="#95e36c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
          {/* Dark Green Chevron */}
          <path d="M70 20L95 45L70 70" stroke="#003630" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="p-5 flex flex-col gap-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#95e36c]/15 to-[#7dd054]/5 border-[1.5px] border-[#95e36c]/30 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.3px]">Part Payment</h2>
        </div>

        <Group total={total} />
      </div>
    </div>
  );
}



function Group1({
  services,
  excludedServiceIds,
  inputAmounts,
  onAmountChange,
  onRemoveService,
  onProceed
}: {
  services: Service[];
  excludedServiceIds: Set<string>;
  inputAmounts: Record<string, number>;
  onAmountChange: (serviceId: string, value: number) => void;
  onRemoveService: (serviceId: string) => void;
  onProceed: (amount: number) => void;
}) {
  // Filter out excluded services
  const activeServicesList = services.filter(s => !excludedServiceIds.has(s.id));

  // Calculate total from input amounts only for non-excluded services
  const total = activeServicesList.reduce((sum, s) => sum + (inputAmounts[s.id] || 0), 0);
  const [activeStudentId, setActiveStudentId] = useState<string>("");

  // Group services by student
  const servicesByStudent = activeServicesList.reduce((acc, service) => {
    if (!acc[service.studentName]) {
      acc[service.studentName] = [];
    }
    acc[service.studentName]!.push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const studentNames = Object.keys(servicesByStudent);

  // Set initial active student
  useEffect(() => {
    if (!activeStudentId && studentNames.length > 0 && studentNames[0]) {
      setActiveStudentId(studentNames[0]);
    }
  }, [activeStudentId, studentNames]);

  const activeServices = activeStudentId ? servicesByStudent[activeStudentId] || [] : [];
  const activeStudentTotal = activeServices.reduce((sum, s) => sum + (inputAmounts[s.id] || 0), 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 px-4 pt-6 relative overflow-hidden">
      <div className="flex flex-col gap-1 mb-3 shrink-0">
        <div className="inline-flex items-center gap-[8px]">
          <div className="w-[3px] h-[24px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full" />
          <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.4px]">
            Checkout
          </h1>
        </div>
        <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[13px] text-[#6b7280] leading-[1.5] tracking-[-0.2px]">
          Modify the amounts you wish to pay for each service
        </p>
      </div>

      <div className="mb-4 shrink-0">
        <Frame20 total={total} />
      </div>

      <div className="flex-1 min-h-0 relative flex flex-col">
        <div className="bg-[#f9fafb]/50 box-border flex flex-col flex-1 min-h-0 overflow-hidden rounded-[24px] border-[1.5px] border-[#e5e7eb] w-full max-w-[360px] mx-auto relative">

          {/* Student Selector - Pill style from AddServicesPage */}
          <div className="flex-shrink-0 px-4 pt-4 bg-transparent">
            <div className="flex gap-[12px] overflow-x-auto pb-4 scrollbar-hide py-2">
              {studentNames.map(name => (
                <ChildPill
                  key={name}
                  name={name}
                  isActive={activeStudentId === name}
                  onClick={() => setActiveStudentId(name)}
                />
              ))}
            </div>

            {/* Pagination Indicators - Pill style */}
            <div className="flex justify-center gap-[7px] mb-4">
              {studentNames.map(name => (
                <div
                  key={`dot-${name}`}
                  className={`h-[5px] rounded-full transition-all duration-300 ${activeStudentId === name
                    ? 'w-[18px] bg-[#95e36c] shadow-[0px_1px_3px_rgba(149,227,108,0.2)]'
                    : 'w-[5px] bg-[#d1d5db]'
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
            <AnimatePresence mode="wait">
              {activeStudentId && (
                <motion.div
                  key={activeStudentId}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <StudentInfoCard name={activeStudentId} amount={activeStudentTotal} />

                  <div className="flex flex-col gap-2">
                    <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[12px] text-gray-400 px-1 uppercase tracking-wider">Services</p>
                    <StudentServiceCard
                      services={activeServices}
                      inputAmounts={inputAmounts}
                      onAmountChange={onAmountChange}
                      onRemoveService={onRemoveService}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-auto bg-white border-t-[1.5px] border-[#e5e7eb] px-[28px] pt-[16px] pb-[32px] shadow-[0px_-4px_16px_rgba(0,0,0,0.06)] z-50 shrink-0">
        <button
          onClick={() => {
            hapticFeedback('heavy');
            onProceed(total);
          }}
          disabled={total <= 0}
          className={`relative h-[60px] w-full max-w-[240px] mx-auto rounded-[16px] overflow-hidden touch-manipulation flex items-center justify-between px-6 transition-all duration-300 ${
            total <= 0 
              ? 'bg-gray-100 cursor-not-allowed opacity-50' 
              : 'bg-[#003630] active:scale-[0.97] shadow-[0px_20px_40px_rgba(0,54,48,0.2)]'
          }`}
          data-name="Button"
        >
          <div className="size-6 text-white/90">
            <CreditCard size={20} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col items-center">
            <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[16px] text-white">
              Proceed
            </span>
          </div>

          <div className="size-6 text-[#95e36c]">
            <ChevronRight size={24} strokeWidth={3} />
          </div>
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage2({
  services,
  inputAmounts,
  excludedServiceIds,
  onAmountChange,
  onRemoveService,
  onProceed,
  onBack
}: CheckoutPage2Props) {
  // Calculate total from input amounts for non-excluded services
  const totalAmount = services
    .filter(s => !excludedServiceIds.has(s.id))
    .reduce((sum, s) => sum + (inputAmounts[s.id] || 0), 0);

  return (
    <div className="bg-white h-[100dvh] w-full flex justify-center overflow-hidden fixed inset-0">
      <div className="flex flex-col w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-full shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] relative overflow-hidden" data-name="Checkout page 2">
        <LogoHeader showBackButton onBack={() => {
          hapticFeedback('light');
          onBack();
        }} />
        <div className="flex-1 min-h-0 relative flex flex-col">
          <Group1
            services={services}
            excludedServiceIds={excludedServiceIds}
            inputAmounts={inputAmounts}
            onAmountChange={onAmountChange}
            onRemoveService={onRemoveService}
            onProceed={() => onProceed(totalAmount)}
          />
        </div>
      </div>
    </div>
  );
}
