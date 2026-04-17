import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { hapticFeedback } from "../utils/haptics";
import LogoHeader from "./common/LogoHeader";
import { Trash2, AlertTriangle, LogIn, Loader2 } from "lucide-react";
import { getFeePolicies } from "../lib/supabase/api/schools";
import type { CheckoutService as Service } from "../stores/useAppStore";
import group16 from "../assets/decorations/Group 16.png";
import group17 from "../assets/decorations/Group 17.png";

interface CheckoutPage2Props {
  services: Service[];
  inputAmounts: Record<string, number>;
  excludedServiceIds: Set<string>;
  onAmountChange: (serviceId: string, value: number) => void;
  onRemoveService: (serviceId: string) => void;
  onProceed: (amount: number) => void;
  onBack: () => void;
}

/* ── Receipt / Invoice icon (from design spec) ── */
function ReceiptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.66671 10.667H5.33337" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.33337 5.33301H5.33337" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6667 8H5.33337" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.66663 1.99978C2.66663 1.82297 2.73686 1.6534 2.86189 1.52838C2.98691 1.40335 3.15648 1.33311 3.33329 1.33311C3.49837 1.33221 3.66028 1.37847 3.79996 1.46645L4.42196 1.86645C4.56132 1.9555 4.72325 2.00282 4.88863 2.00282C5.05401 2.00282 5.21593 1.9555 5.35529 1.86645L5.97796 1.46645C6.11732 1.3774 6.27925 1.33008 6.44463 1.33008C6.61001 1.33008 6.77193 1.3774 6.91129 1.46645L7.53329 1.86645C7.67265 1.9555 7.83458 2.00282 7.99996 2.00282C8.16534 2.00282 8.32727 1.9555 8.46663 1.86645L9.08863 1.46645C9.22798 1.3774 9.38991 1.33008 9.55529 1.33008C9.72067 1.33008 9.8826 1.3774 10.022 1.46645L10.6446 1.86645C10.784 1.9555 10.9459 2.00282 11.1113 2.00282C11.2767 2.00282 11.4386 1.9555 11.578 1.86645L12.2 1.46645C12.3396 1.37847 12.5015 1.33221 12.6666 1.33311C12.8434 1.33311 13.013 1.40335 13.138 1.52838C13.2631 1.6534 13.3333 1.82297 13.3333 1.99978V13.9998C13.3333 14.1766 13.2631 14.3462 13.138 14.4712C13.013 14.5962 12.8434 14.6664 12.6666 14.6664C12.5015 14.6674 12.3396 14.6211 12.2 14.5331L11.578 14.1331C11.4386 14.0441 11.2767 13.9967 11.1113 13.9967C10.9459 13.9967 10.784 14.0441 10.6446 14.1331L10.022 14.5331C9.8826 14.6222 9.72067 14.6695 9.55529 14.6695C9.38991 14.6695 9.22798 14.6222 9.08863 14.5331L8.46663 14.1331C8.32727 14.0441 8.16534 13.9967 7.99996 13.9967C7.83458 13.9967 7.67265 14.0441 7.53329 14.1331L6.91129 14.5331C6.77193 14.6222 6.61001 14.6695 6.44463 14.6695C6.27925 14.6695 6.11732 14.6222 5.97796 14.5331L5.35529 14.1331C5.21593 14.0441 5.05401 13.9967 4.88863 13.9967C4.72325 13.9967 4.56132 14.0441 4.42196 14.1331L3.79996 14.5331C3.66028 14.6211 3.49837 14.6674 3.33329 14.6664C3.15648 14.6664 2.98691 14.5962 2.86189 14.4712C2.73686 14.3462 2.66663 14.1766 2.66663 13.9998V1.99978Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Amount input with %-badge | divider | K value ── */
function AmountInput({
  serviceId,
  value,
  fullAmount,
  onChange,
  disabled = false,
}: {
  serviceId: string;
  value: number;
  fullAmount: number;
  onChange: (serviceId: string, value: number) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value > 0 ? value.toFixed(2) : "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseFloat(raw.replace(/,/g, ""));
    if (!isNaN(parsed)) {
      onChange(serviceId, parsed);
    } else if (raw === "" || raw === "0") {
      onChange(serviceId, 0);
    }
  };

  const percentage =
    fullAmount > 0 && value > 0
      ? `${Math.round((value / fullAmount) * 100)}%`
      : "-%";

  return (
    <div className="self-stretch flex flex-col gap-3">
      <p className="text-[#050505] text-[12px] font-normal font-['Inter']">
        Enter Amount
      </p>
      <div
        className={`self-stretch px-4 py-3 rounded-lg flex items-center gap-2.5 transition-opacity ${disabled ? 'opacity-50 grayscale-[0.5]' : ''}`}
        style={{ outline: "1px solid #95E36C", outlineOffset: "0px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)" }}
      >
        {/* %-badge */}
        <span className="text-black text-[12px] font-medium font-['Inter'] shrink-0">
          {percentage}
        </span>
        {/* Vertical divider */}
        <div className="w-px shrink-0" style={{ height: "11px", background: "#F2F2F2" }} />
        {/* K input — right-aligned */}
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          placeholder="K0.00"
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 text-right text-[#585858] text-[12px] font-bold font-['Inter'] bg-transparent border-none outline-none focus:ring-0 disabled:cursor-not-allowed"
          style={{ border: 'none', outline: 'none' }}
        />
      </div>
    </div>
  );
}

/* ── Single service card ── */
function ServiceCard({
  service,
  inputAmount,
  onAmountChange,
  policies,
}: {
  service: Service;
  inputAmount: number;
  onAmountChange: (serviceId: string, value: number) => void;
  policies: any[];
}) {
  const schoolId = (service as any).schoolId;
  const policy = policies.find(p => p.school_id === schoolId);
  const allowInstallments = policy?.allow_installments ?? true;
  const minPercentValue = policy?.min_payment_percent ?? 50;
  const isStrict = policy?.strict_enforcement ?? true;

  return (
    <div
      className={`w-full bg-white rounded-xl flex flex-col gap-4 transition-all ${
        !allowInstallments ? "opacity-60 saturate-[0.8]" : ""
      }`}
      style={{
        outline: "1px solid #EDECEC",
        padding: "16px 16px 24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Header: name + amount */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-black text-[12px] font-bold font-['Inter']">
            {service.description}
          </span>
          {service.studentName && (
            <span className="text-[#808080] text-[10px] font-normal font-['Inter']">
              {service.studentName}
            </span>
          )}
        </div>
        <span className="text-black text-[12px] font-bold font-['Inter']">
          K{service.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
      </div>

      {/* Divider */}
      <div className="self-stretch" style={{ height: 0, outline: "0.5px solid #F2F2F2" }} />

      {/* Amount input */}
      <AmountInput
        serviceId={service.id}
        value={inputAmount}
        fullAmount={service.amount}
        onChange={onAmountChange}
        disabled={!allowInstallments}
      />

      {/* Policy Messages */}
      {(() => {
        if (!allowInstallments) {
          return (
            <div className="flex items-center gap-2 text-[11px] font-['Inter'] leading-normal mt-3 animate-in fade-in" style={{ color: "#6B7280" }}>
              <AlertTriangle size={14} className="shrink-0" />
              <span>This service must be paid in full (installments not allowed).</span>
            </div>
          );
        }

        const minPercent = minPercentValue / 100;
        if (service.amount > 0 && inputAmount > 0 && inputAmount < service.amount * minPercent && isStrict) {
          return (
            <div className="flex items-center gap-2 text-[11px] font-['Inter'] leading-normal mt-3 animate-in fade-in slide-in-from-top-1" style={{ color: "#EF4444" }}>
              <AlertTriangle size={14} className="shrink-0" style={{ color: "#EF4444" }} />
              <span>You cannot make a part payment less than {minPercentValue}% for this service.</span>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

/* ── Student pill tab ── */
function StudentTab({
  name,
  isActive,
  onClick,
}: {
  name: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        hapticFeedback("selection");
        onClick();
      }}
      className={`flex items-center gap-[10px] px-[25px] h-[42px] rounded-xl shrink-0 transition-all active:scale-95 ${
        isActive ? "bg-[#F3FCF0] outline outline-1 outline-[#95E36C]" : ""
      }`}
      style={{
        outline: isActive ? "1px solid #95E36C" : "1px solid #F2F2F2",
        outlineOffset: "0px",
        background: isActive ? "#F3FCF0" : "#FFFFFF",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
      }}
    >
      {isActive && (
        <div data-svg-wrapper>
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="3" cy="3" r="3" fill="#4FE501" />
          </svg>
        </div>
      )}
      <div
        className="text-[12px] font-['Space_Grotesk'] whitespace-nowrap flex flex-col justify-end"
        style={{
          color: isActive ? "black" : "#2D2D2D",
          fontWeight: isActive ? 700 : 500,
        }}
      >
        {name}
      </div>
    </button>
  );
}

/* ── Main export ── */
export default function CheckoutPage2({
  services,
  inputAmounts,
  excludedServiceIds,
  onAmountChange,
  onRemoveService,
  onProceed,
  onBack,
}: CheckoutPage2Props) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);

  // Fetch policies for the schools involved
  useEffect(() => {
    async function fetchPolicies() {
      // Find all unique school IDs. Fallback to a query if student has schoolId.
      const schoolIds = Array.from(new Set(services.map(s => s.studentId ? (s as any).schoolId : null).filter(Boolean))) as string[];
      
      if (schoolIds.length > 0) {
        setIsLoadingPolicies(true);
        const fetched = await getFeePolicies(schoolIds);
        setPolicies(fetched);
        setIsLoadingPolicies(false);
      } else {
        // Fallback or try to get from services some other way
        setIsLoadingPolicies(false);
      }
    }
    fetchPolicies();
  }, [services]);

  const activeServices = services.filter((s) => !excludedServiceIds.has(s.id));

  // Determine if any service violates its school's policy
  const hasPolicyViolation = activeServices.some((service) => {
    const amount = inputAmounts[service.id] || 0;
    if (amount <= 0) return false;
    
    // Find policy for this school
    const schoolId = (service as any).schoolId;
    const policy = policies.find(p => p.school_id === schoolId);
    
    // Use the fetched min_payment_percent or default to 50
    const minPercent = (policy?.min_payment_percent ?? 50) / 100;
    const isStrict = policy?.strict_enforcement ?? true;

    return isStrict && amount < service.amount * minPercent;
  });

  const total = activeServices.reduce(
    (acc, s) => acc + (excludedServiceIds.has(s.id) ? 0 : inputAmounts[s.id] || 0),
    0
  );

  // Group by student
  const servicesByStudent = activeServices.reduce((acc, service) => {
    if (!acc[service.studentName]) acc[service.studentName] = [];
    acc[service.studentName]!.push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const studentNames = Object.keys(servicesByStudent);
  const [activeStudent, setActiveStudent] = useState(studentNames[0] || "");

  useEffect(() => {
    if (!activeStudent && studentNames.length > 0 && studentNames[0]) {
      setActiveStudent(studentNames[0]);
    }
  }, [activeStudent, studentNames]);

  const visibleServices = activeStudent
    ? servicesByStudent[activeStudent] || []
    : [];

  return (
    <div className="h-[100dvh] w-full flex justify-center overflow-hidden fixed inset-0" style={{ background: "#F9FAFB" }}>
      <div className="flex flex-col w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-full relative overflow-hidden">

        {/* ── Header ── */}
        <LogoHeader />

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* White info block */}
          <div className="bg-white px-6 pt-6 pb-6 flex flex-col gap-6 relative overflow-hidden">
            {/* Decorative Assets from right corner */}
            <div className="absolute right-0 top-0 h-full w-full pointer-events-none overflow-hidden select-none z-0">
              <div className="relative w-full h-full">
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

            {/* Title + description */}
            <div className="self-stretch flex flex-col">
              <div className="self-stretch flex items-center gap-3">
                {/* Credit card icon — spec */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 5H4C2.89543 5 2 5.89543 2 7V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V7C22 5.89543 21.1046 5 20 5Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 10H22" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1 py-1 flex justify-start items-center gap-2.5">
                  <h1 className="text-black text-[20px] font-bold font-['Inter']">Pay in Part</h1>
                </div>
              </div>
              <div className="self-stretch py-1.5 rounded-md flex justify-center items-center gap-2.5">
                <p className="flex-1 text-black text-[12px] font-normal font-['Inter']">
                  You can read through the School's Different Policies related to school fees from here. You can also make a Request to get a Refund.
                </p>
              </div>
            </div>

            {/* Student tabs row — h-[50px], gap-4 */}
            {studentNames.length > 0 && (
              <div className="h-[60px] flex items-center gap-4 overflow-x-auto scrollbar-hide">
                {studentNames.map((name) => (
                  <StudentTab
                    key={name}
                    name={name}
                    isActive={activeStudent === name}
                    onClick={() => setActiveStudent(name)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Service cards ── */}
          <div className="px-6 py-4 flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {visibleServices.map((service) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <ServiceCard
                    service={service}
                    inputAmount={inputAmounts[service.id] || 0}
                    onAmountChange={onAmountChange}
                    policies={policies}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>

        {/* ── Bottom action bar ── */}
        <div className="bg-white px-6 pt-5 pb-5" style={{ borderTop: "1px solid #E6E6E6" }}>
          <button
            onClick={() => {
              hapticFeedback("heavy");
              onProceed(total);
            }}
            disabled={total <= 0 || hasPolicyViolation}
            className={`w-full h-[60px] rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              background: total <= 0 || hasPolicyViolation ? "#E5E7EB" : "#003129",
            }}
          >
            <span className="text-white text-[12px] font-bold font-['Inter']">
              Proceed to Payment
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 10L8.5 6L4.5 2" stroke="#8FF957" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
