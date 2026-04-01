/**
 * PAYMENT PAGE - REDESIGNED TO MATCH FIGMA
 * 
 * Premium glassmorphism design with decorative path elements
 * Optimized for one-screen view - minimal scrolling required
 * Designed for payment provider popup flow
 */

import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { ChevronDown, ShieldCheck, CreditCard, Wallet } from "lucide-react";
import { useLenco } from "../hooks/useLenco";
import { useOfflineManager } from "../hooks/useOfflineManager";
import { createTransaction, syncTransactionToQuickBooks } from "../lib/supabase/api/transactions";
import { getSchools } from "../lib/supabase/api/schools";
import { getParentByPhone } from "../lib/supabase/api/parents";
import { useAppStore } from "../stores/useAppStore";
import { toast } from "sonner";
import RollingNumber from "./ui/RollingNumber";
import LogoHeader from "./common/LogoHeader";

interface PaymentPageProps {
  onBack: () => void;
  onPay: () => void;
  totalAmount: number;
}



// Collapsible Section Component
function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  icon
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  // ... existing implementation
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 rounded-[16px] bg-white/60 backdrop-blur-sm border border-white/80 hover:bg-white/80 transition-all shadow-sm"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-[#003630]">{icon}</div>}
          <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">
            {title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-[#003630]" />
        </motion.div>
      </button>

      {/* Content - Expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-2 overflow-y-auto max-h-[300px]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PaymentPage({ onBack, onPay, totalAmount }: PaymentPageProps) {
  const [showServicesBreakdown, setShowServicesBreakdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Get data from store
  const checkoutServices = useAppStore((state) => state.checkoutServices);

  // Store instance for setting reference
  const store = useAppStore();

  // Calculate totals
  const serviceFee = totalAmount * 0.03; // 3% service fee
  const finalAmount = totalAmount + serviceFee;
  const serviceCount = checkoutServices.length;

  // Get unique student names from checkout services
  const studentNames = Array.from(new Set(checkoutServices.map(service => service.studentName)));

  // Lenco Hook
  const { isScriptLoaded, initiatePayment } = useLenco();
  const { isOnline } = useOfflineManager();

  // Get user info from store
  const userPhone = useAppStore((state) => state.userPhone);
  const userName = useAppStore((state) => state.userName);
  const selectedSchool = useAppStore((state) => state.selectedSchool);

  // Helper to split full name
  const getNames = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };

  // Double-submission guard
  const isSubmittingRef = useRef(false);

  const handlePay = async () => {
    // 1. Check if script is loaded
    if (!isScriptLoaded) {
      toast.error("Payment system initializing. Please try again in a few moments.");
      return;
    }

    // 2. Strict guard against double clicking
    if (isSubmittingRef.current || isProcessing) {
      return;
    }

    // 3. Lock
    isSubmittingRef.current = true;
    setIsProcessing(true);

    try {
      // 4. Get the school's Lenco public key
      const schools = await getSchools();
      const school = schools.find(s => s.name === selectedSchool);

      if (!school) {
        toast.error("School not found. Please try again.");
        isSubmittingRef.current = false;
        setIsProcessing(false);
        return;
      }

      if (!school.lenco_public_key) {
        toast.error("This school hasn't configured payment processing yet. Please contact the school.");
        isSubmittingRef.current = false;
        setIsProcessing(false);
        return;
      }

      const { first, last } = getNames(userName);

      // 5. Initiate payment with SCHOOL-SPECIFIC Lenco key
      initiatePayment({
        key: school.lenco_public_key, // ✅ Each school gets their own payments
        reference: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amount: finalAmount,
        currency: "ZMW",
        email: "customer@example.com",
        channels: ["card", "mobile-money"],
        customer: {
          firstName: first || "Customer",
          lastName: last || "User",
          phone: userPhone || "0971111111",
        },
        onSuccess: async function (response: any) {
          console.log("Payment successful:", response);

          try {
            // 1. Get Parent ID
            const parent = await getParentByPhone(userPhone);
            if (!parent) throw new Error("Parent not found");

            const schoolId = String(school.id) || "00000000-0000-0000-0000-000000000000";

            // 2. Group services by INVOICE (not just student) so transport and tuition
            //    never bleed into each other. Key = studentId|invoice_id (or invoiceNo as fallback).
            type ServiceGroup = {
              studentId: string;
              invoice_id?: string;
              invoiceNo: string;
              services: typeof checkoutServices;
            };
            const invoiceGroups = new Map<string, ServiceGroup>();

            for (const svc of checkoutServices) {
              const studentId = svc.studentId || "unknown";
              // Use the explicit invoice UUID if available, otherwise fall back to invoiceNo
              const invoiceKey = svc.invoice_id || svc.invoiceNo || svc.id;
              const groupKey = `${studentId}|${invoiceKey}`;

              if (!invoiceGroups.has(groupKey)) {
                invoiceGroups.set(groupKey, {
                  studentId,
                  invoice_id: svc.invoice_id,
                  invoiceNo: svc.invoiceNo,
                  services: [],
                });
              }
              invoiceGroups.get(groupKey)!.services.push(svc);
            }

            const groups = Array.from(invoiceGroups.values());
            const results: Array<{ success: boolean; data?: any }> = [];

            // CRITICAL: totalAmount = the actual cash charged by Lenco (e.g. K4).
            // Each group's service.amount is the full INVOICE BALANCE (e.g. K7000).
            // We must record the ACTUAL money paid per invoice, not the full balance.
            // We distribute totalAmount proportionally across invoices by their balance weight.
            const allServicesTotal = checkoutServices.reduce((sum, s) => sum + s.amount, 0);

            for (let i = 0; i < groups.length; i++) {
              const group = groups[i]!;

              // Full invoice balance for this group (for reference only, NOT what we record as paid)
              const invoiceBalance = group.services.reduce((sum, s) => sum + s.amount, 0);

              // Actual money paid towards this invoice = proportion of the real Lenco charge
              const proportion = allServicesTotal > 0 ? invoiceBalance / allServicesTotal : 1 / groups.length;
              const groupAmount = Math.round(totalAmount * proportion * 100) / 100;

              // Proportional share of the 3% service fee
              const groupServiceFee = Math.round(serviceFee * proportion * 100) / 100;
              const groupTotal = groupAmount + groupServiceFee;

              // Unique reference per invoice group
              const groupRef = groups.length > 1
                ? `${response.reference}-I${i + 1}`
                : response.reference;

              const firstSvc = group.services[0]!;
              const result = await createTransaction({
                parent_id: parent.id,
                student_id: group.studentId,
                school_id: schoolId,
                amount: groupAmount,
                service_fee: groupServiceFee,
                total_amount: groupTotal,
                status: 'successful',
                payment_method: response.paymentMethod || 'mobile_money',
                reference: groupRef,
                meta_data: {
                  lencoReference: response.reference,
                  services: group.services,
                  userName,
                  userPhone,
                  schoolName: selectedSchool,
                  schoolLencoKey: school.lenco_public_key,
                  term: firstSvc.term?.toString() || "1",
                  year: firstSvc.academicYear?.toString() || new Date().getFullYear().toString(),
                  grade: firstSvc.grade || "N/A",
                  student_name: firstSvc.studentName || "Unknown",
                  parent_name: userName,
                  parent_phone: userPhone,
                  total_amount: groupTotal,
                  invoice_no: group.invoiceNo,
                  invoice_balance: invoiceBalance,  // full outstanding on the invoice
                  service_description: group.services.map(s => s.description).join(', '),
                  multi_invoice_payment: groups.length > 1,
                  original_reference: response.reference,
                },
                // Pass invoice_id so it lands in transactions.invoice_id
                ...(group.invoice_id ? { invoice_id: group.invoice_id } : {}),
                initiated_at: new Date().toISOString(),
                completed_at: undefined,
              });

              results.push(result);
              console.log(`[PaymentPage] Transaction — student: ${group.studentId}, invoice: ${group.invoiceNo}, PAID: K${groupAmount} (of K${invoiceBalance} balance)`, result);

              // QuickBooks sync per invoice transaction
              if (result.success && result.data?.id) {
                syncTransactionToQuickBooks(result.data.id).then(syncRes => {
                  if (!syncRes.success) {
                    console.error(`[PaymentPage] QuickBooks sync failed for invoice ${group.invoiceNo}:`, syncRes.error);
                  }
                });
              }
            }

            const allSuccess = results.every(r => r.success);
            if (allSuccess) {
              console.log(`[PaymentPage] All ${results.length} invoice transaction(s) captured successfully`);
            } else {
              console.error('[PaymentPage] Some transactions failed:', results);
              toast.error("Payment received but some records failed to save. Please contact support.");
            }

            store.setPaymentReference(response.reference);
            onPay();

          } catch (error) {
            console.error("Error saving payment:", error);
            toast.error("Error finalizing payment record.");
            onPay();
          } finally {
            setIsProcessing(false);
          }
        },
        onClose: function () {
          // Unlock on close
          isSubmittingRef.current = false;
          setIsProcessing(false);
          toast("Payment cancelled");
        },
        onConfirmationPending: function () {
          toast("Payment verification pending.");
          // Don't unlock here, as it's still pending?
          // Actually, if it's pending, we probably want to keep it locked or let them retry?
          // Usually pending means "wait".
          setIsProcessing(false);
          isSubmittingRef.current = false;
        },
      });
    } catch (e) {
      console.error("Payment initialization failed", e);
      isSubmittingRef.current = false;
      setIsProcessing(false);
      toast.error("Could not start payment.");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        backgroundImage: "linear-gradient(114.686deg, rgb(255, 255, 255) 0%, rgb(249, 250, 251) 50%, rgba(240, 253, 244, 0.3) 100%)"
      }}
    >
      <LogoHeader showBackButton onBack={onBack} />

      {/* Scrollable Area */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar pt-[24px] px-6 space-y-6">
        <div className="max-w-lg mx-auto space-y-6">



          {/* Clean Redesigned Payment Summary Card - iOS Inspired */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            {/* 1. Premium Design Hero Section (Inspired by Part Payment Design) */}
            <div className="relative w-full overflow-hidden bg-white border-b border-gray-100 min-h-[220px]">

              {/* Background Decorative Chevrons (Animated) */}
              <div className="absolute top-[-20px] right-[-40px] w-[300px] h-[260px] opacity-100 pointer-events-none z-0">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  {/* First Chevron (Lightest) */}
                  <motion.path
                    d="M20 10L60 50L20 90"
                    stroke="#95e36c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"
                    className="opacity-20"
                    animate={{ x: [0, 8, 0], y: [0, -5, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Second Chevron (Medium) */}
                  <motion.path
                    d="M40 10L80 50L40 90"
                    stroke="#95e36c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"
                    className="opacity-40"
                    animate={{ x: [0, -8, 0], y: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                  {/* Third Chevron (Dark Green) */}
                  <motion.path
                    d="M60 10L100 50L60 90"
                    stroke="#003630" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"
                    animate={{ x: [0, 5, 0], y: [0, -8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />
                </svg>
              </div>

              {/* Foreground Content */}
              <div className="relative z-10 p-8 flex flex-col gap-6">
                {/* Title */}
                <h2 className="text-[32px] font-black text-[#003630] tracking-[-1px] leading-tight mt-4">
                  Payment Sum<span className="text-white">mary</span>
                </h2>

                {/* Amount Pod */}
                <div className="flex items-center justify-between w-full mt-2">
                  <span className="text-[12px] font-bold text-[#64748b] uppercase tracking-widest">Total</span>
                  <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[14px] px-5 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.03)] flex items-baseline gap-2 translate-x-4">
                    <span className="text-[16px] font-bold text-[#003630]/60">K</span>
                    <RollingNumber
                      value={finalAmount}
                      className="text-[32px] font-black text-[#003630] tracking-[-1.2px] leading-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Detailed Breakdown: Row-based (Pay in Part Style) */}
            <div className="p-2">
              <div className="bg-[#f9fafb] rounded-[14px] p-4 space-y-4 border border-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#64748b]">
                      <Wallet size={17} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#334155]">Tuition & Services</span>
                      <span className="text-[10px] text-gray-400">{serviceCount} selected items</span>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-[#003630]">
                    K {totalAmount.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="h-px bg-gray-100/60 w-full" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#64748b]">
                      <CreditCard size={17} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#334155]">Transaction Fee</span>
                      <span className="text-[10px] text-gray-400">Standard 3.0% fee</span>
                    </div>
                  </div>
                  <span className="text-[14px] font-semibold text-gray-400">
                    K {serviceFee.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Student Footer: Shared Pills */}
            {studentNames.length > 0 && (
              <div className="px-6 py-6 pb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Paying for</span>
                  <div className="h-px bg-gray-50 flex-1" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(showAllStudents ? studentNames : studentNames.slice(0, 3)).map((name, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 rounded-[10px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-2 transition-all hover:border-[#95e36c]/30"
                    >
                      <div className="w-5 h-5 rounded-[5px] bg-gradient-to-tr from-[#003630] to-[#004d45] flex items-center justify-center text-[10px] font-bold text-[#95e36c] shrink-0">
                        {name.charAt(0)}
                      </div>
                      <span className="text-[12px] font-bold text-[#334155] whitespace-nowrap">{name}</span>
                    </div>
                  ))}

                  {studentNames.length > 3 && !showAllStudents && (
                    <button
                      onClick={() => setShowAllStudents(true)}
                      className="px-3 py-1.5 rounded-[10px] bg-[#f8fafc] border border-dashed border-gray-200 flex items-center gap-2 hover:border-[#95e36c]/40 hover:bg-white transition-all group"
                    >
                      <div className="w-5 h-5 rounded-[5px] bg-gray-100 group-hover:bg-[#95e36c]/10 flex items-center justify-center text-[10px] font-bold text-[#64748b] group-hover:text-[#003630]">
                        +
                      </div>
                      <span className="text-[11px] font-bold text-[#64748b] group-hover:text-[#003630]">
                        {studentNames.length - 3} more students
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Collapsible Sections */}
          <div className="space-y-3">

            {/* Services Breakdown - Collapsible */}
            <CollapsibleSection
              title={`Services Breakdown (${serviceCount})`}
              isExpanded={showServicesBreakdown}
              onToggle={() => setShowServicesBreakdown(!showServicesBreakdown)}
            >
              <div className="space-y-2">
                {checkoutServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/80">
                    <div className="flex-1">
                      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[13px] text-[#003630]">
                        {service.description}
                      </p>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[11px] text-gray-500">
                        {service.studentName}
                      </p>
                    </div>
                    <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">
                      K {service.amount.toLocaleString('en-ZM', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>

        </div>
      </div >

      {/* Fixed Bottom Section - Payment Button */}
      < div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-5 shadow-2xl z-50" >
        <div className="max-w-lg mx-auto space-y-4">

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-[#4a5565]">
            <ShieldCheck size={16} />
            <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[12px] tracking-[-0.176px]">
              Secure payment powered by Lenco
            </span>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={isProcessing || !isOnline}
            className={`w-full h-14 rounded-[16px] bg-[#003630] text-white font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[16px] shadow-lg hover:shadow-xl btn-tactile transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Opening Payment...</span>
              </>
            ) : (
              <span>{isOnline ? 'Pay' : 'Go Online to Pay'}</span>
            )}
          </button>


        </div>
      </div >
    </div >
  );
}
