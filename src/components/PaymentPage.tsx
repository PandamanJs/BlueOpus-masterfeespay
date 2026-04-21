/**
 * PAYMENT PAGE - REDESIGNED TO MATCH FIGMA
 * 
 * Premium glassmorphism design with decorative path elements
 * Optimized for one-screen view - minimal scrolling 
 * Designed for payment provider popup flow
 */

import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ShieldCheck, CreditCard, Wallet } from "lucide-react";
import { useLenco } from "../hooks/useLenco";
import { useOfflineManager } from "../hooks/useOfflineManager";
import { createTransaction, syncTransactionToQuickBooks } from "../lib/supabase/api/transactions";
import { getSchools, getDiscountDefinitions } from "../lib/supabase/api/schools";
import { getParentByPhone } from "../lib/supabase/api/parents";
import { useAppStore } from "../stores/useAppStore";
import type { DiscountDefinition } from "../types";
import { toast } from "sonner";
import RollingNumber from "./ui/RollingNumber";
import LogoHeader from "./common/LogoHeader";
import group16 from "../assets/decorations/Group 16.png";
import group17 from "../assets/decorations/Group 17.png";

interface PaymentPageProps {
  onBack: () => void;
  onPay: () => void;
  totalAmount: number;
}

/* ── Custom Icons from Design Spec ── */
function ReceiptItemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.66671 10.667H5.33337" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.33337 5.33301H5.33337" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6667 8H5.33337" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.66663 1.99978C2.66663 1.82297 2.73686 1.6534 2.86189 1.52838C2.98691 1.40335 3.15648 1.33311 3.33329 1.33311C3.49837 1.33221 3.66028 1.37847 3.79996 1.46645L4.42196 1.86645C4.56132 1.9555 4.72325 2.00282 4.88863 2.00282C5.05401 2.00282 5.21593 1.9555 5.35529 1.86645L5.97796 1.46645C6.11732 1.3774 6.27925 1.33008 6.44463 1.33008C6.61001 1.33008 6.77193 1.3774 6.91129 1.46645L7.53329 1.86645C7.67265 1.9555 7.83458 2.00282 7.99996 2.00282C8.16534 2.00282 8.32727 1.9555 8.46663 1.86645L9.08863 1.46645C9.22798 1.3774 9.38991 1.33008 9.55529 1.33008C9.72067 1.33008 9.8826 1.3774 10.022 1.46645L10.6446 1.86645C10.784 1.9555 10.9459 2.00282 11.1113 2.00282C11.2767 2.00282 11.4386 1.9555 11.578 1.86645L12.2 1.46645C12.3396 1.37847 12.5015 1.33221 12.6666 1.33311C12.8434 1.33311 13.013 1.40335 13.138 1.52838C13.2631 1.6534 13.3333 1.82297 13.3333 1.99978V13.9998C13.3333 14.1766 13.2631 14.3462 13.138 14.4712C13.013 14.5962 12.8434 14.6664 12.6666 14.6664C12.5015 14.6674 12.3396 14.6211 12.2 14.5331L11.578 14.1331C11.4386 14.0441 11.2767 13.9967 11.1113 13.9967C10.9459 13.9967 10.784 14.0441 10.6446 14.1331L10.022 14.5331C9.8826 14.6222 9.72067 14.6695 9.55529 14.6695C9.38991 14.6695 9.22798 14.6222 9.08863 14.5331L8.46663 14.1331C8.32727 14.0441 8.16534 13.9967 7.99996 13.9967C7.83458 13.9967 7.67265 14.0441 7.53329 14.1331L6.91129 14.5331C6.77193 14.6222 6.61001 14.6695 6.44463 14.6695C6.27925 14.6695 6.11732 14.6222 5.97796 14.5331L5.35529 14.1331C5.21593 14.0441 5.05401 13.9967 4.88863 13.9967C4.72325 13.9967 4.56132 14.0441 4.42196 14.1331L3.79996 14.5331C3.66028 14.6211 3.49837 14.6674 3.33329 14.6664C3.15648 14.6664 2.98691 14.5962 2.86189 14.4712C2.73686 14.3462 2.66663 14.1766 2.66663 13.9998V1.99978Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiscountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.33337 5.99967C1.86381 5.99967 2.37251 6.21039 2.74759 6.58546C3.12266 6.96053 3.33337 7.46924 3.33337 7.99967C3.33337 8.53011 3.12266 9.03882 2.74759 9.41389C2.37251 9.78896 1.86381 9.99967 1.33337 9.99967V11.333C1.33337 11.6866 1.47385 12.0258 1.7239 12.2758C1.97395 12.5259 2.31309 12.6663 2.66671 12.6663H13.3334C13.687 12.6663 14.0261 12.5259 14.2762 12.2758C14.5262 12.0258 14.6667 11.6866 14.6667 11.333V9.99967C14.1363 9.99967 13.6276 9.78896 13.2525 9.41389C12.8774 9.03882 12.6667 8.53011 12.6667 7.99967C12.6667 7.46924 12.8774 6.96053 13.2525 6.58546C13.6276 6.21039 14.1363 5.99967 14.6667 5.99967V4.66634C14.6667 4.31272 14.5262 3.97358 14.2762 3.72353C14.0261 3.47348 13.687 3.33301 13.3334 3.33301H2.66671C2.31309 3.33301 1.97395 3.47348 1.7239 3.72353C1.47385 3.97358 1.33337 4.31272 1.33337 4.66634V5.99967Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6H6.00667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6L6 10" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10H10.0067" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
          <span className="font-semibold text-[14px] text-[#003630]">
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
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState<DiscountDefinition[]>([]);
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);
  const [isFetchingDiscounts, setIsFetchingDiscounts] = useState(false);

  // Get data from store
  const checkoutServices = useAppStore((state) => state.checkoutServices);

  // Store instance for setting reference
  const store = useAppStore();

  const userPhone = useAppStore((state) => state.userPhone);
  const userName = useAppStore((state) => state.userName);
  const selectedSchoolId = useAppStore((state) => state.selectedSchoolId);
  const selectedSchoolLogo = useAppStore((state) => state.selectedSchoolLogo);
  const selectedSchoolName = useAppStore((state) => state.selectedSchool);
  const vatEnabled = useAppStore((state) => state.vatEnabled);
  const students = useAppStore((state) => state.students);
  const isStaff = useAppStore((state) => state.isStaff);

  // Fetch discounts from DB
  useEffect(() => {
    async function loadDiscounts() {
      if (!selectedSchoolId) return;

      setIsFetchingDiscounts(true);
      try {
        const discounts = await getDiscountDefinitions([selectedSchoolId]);
        setAvailableDiscounts(discounts.filter(d => d.is_active));
      } catch (err) {
        console.error("Error loading discounts:", err);
      } finally {
        setIsFetchingDiscounts(false);
      }
    }

    loadDiscounts();
  }, [selectedSchoolId]);

  // Identify invoice vs debt portions for VAT calculation
  const invoiceTotal = checkoutServices
    .filter(service => {
      // Primary check: explicit flag from our logic
      if (service.isDebt) return false;

      // Secondary check: keyword heuristic for safety
      const desc = service.description.toLowerCase();
      const isBalanceKeyword =
        desc.includes('balance') ||
        desc.includes('debt') ||
        desc.includes('outstanding') ||
        desc.includes('pending payment');

      if (isBalanceKeyword) return false;

      return true;
    })
    .reduce((sum, service) => sum + service.amount, 0);

  /**
   * CONTEXT-AWARE DISCOUNT LOGIC
   * 
   * 1. Sibling Discount: Verifies student count against the required number in description.
   * 2. Staff Discount: Only visible/selectable if current parent is a staff member.
   * 3. Early Bird: Restricted to full payments (no partial balances) and start-of-term.
   * 4. Service Specificity: Applies to Tuition/School Fees unless specified for "All Services".
   */

  const getDiscountDescription = (discount: DiscountDefinition) => {
    return (discount.name + " " + (discount.description || "")).toLowerCase();
  };

  const isDiscountEligible = (discount: DiscountDefinition) => {
    // Basic debt-only cart rule
    if (invoiceTotal <= 0) return false;

    const fullDesc = getDiscountDescription(discount);

    // SIBLING DISCOUNT CHECK
    // Logic: Look for "2nd", "3rd", "4th" or "2 students", etc.
    const siblingMatch = fullDesc.match(/(\d+)(?:st|nd|rd|th)?\s+(?:student|child|sibling)|(\d+)\s+(?:students|children|siblings)|sibling|child/i);
    if (siblingMatch) {
      const capturedNum = siblingMatch[1] || siblingMatch[2];
      const requiredCount = capturedNum ? parseInt(capturedNum) : 2;
      if (students.length < requiredCount) return false;
    }


    // STAFF DISCOUNT CHECK
    if (fullDesc.includes("staff")) {
      if (!isStaff) return false;
    }

    // EARLY BIRD CHECK
    if (fullDesc.includes("early bird")) {
      // 1. Must NOT be an outstanding balance (debt) payment
      const hasDebtItems = checkoutServices.some(s => s.isDebt);
      if (hasDebtItems) return false;

      // 2. Must be a full current fee payment (no keywords suggesting partial payment)
      const hasPartialKeywords = checkoutServices.some(s =>
        s.description.toLowerCase().includes("balance") ||
        s.description.toLowerCase().includes("partial") ||
        s.description.toLowerCase().includes("installment")
      );
      if (hasPartialKeywords) return false;

      // 3. Simple logic for "start of term" - check if current month is Jan, May, or Sept
      const currentMonth = new Date().getMonth(); // 0-indexed (0=Jan, 4=May, 8=Sep)
      const isStartOfTerm = [0, 4, 8].includes(currentMonth); // Allow only the first month of the term
      if (!isStartOfTerm) return false;

      // 4. Must be paying for a core fee category (unless it's an "all surfaces" discount handled later)
      const isPayingCoreFee = checkoutServices.some(s => {
        const desc = s.description.toLowerCase();
        return desc.includes("tuition") || desc.includes("school fee") || (discount.fee_category_id && s.categoryId === discount.fee_category_id);
      });

      if (!isPayingCoreFee) return false;
    }

    return true;
  };

  const getDiscountableBase = (discount: DiscountDefinition) => {
    // 1. PRECISE MATCHING: If the discount explicitly targets a category or item ID
    // This is the most accurate method and avoids keyword guesswork.
    if (discount.fee_category_id || discount.fee_item_id) {
      return checkoutServices
        .filter(s => {
          if (s.isDebt) return false; // Discounts only apply to new invoices

          // Match by categoryId (e.g., all Tuition items)
          if (discount.fee_category_id && s.categoryId === discount.fee_category_id) return true;

          // Match by pricing_id (e.g., specific Grade 5 Tuition item)
          if (discount.fee_item_id && s.pricing_id === discount.fee_item_id) return true;

          return false;
        })
        .reduce((sum, s) => sum + s.amount, 0);
    }

    const fullDesc = getDiscountDescription(discount);

    // 2. HEURISTIC FALLBACKS: For legacy discounts without explicit ID links
    // If description suggests explicitly "all services" or "everything", apply to full invoice total
    if (fullDesc.includes("all services") || fullDesc.includes("all items") || fullDesc.includes("general")) {
      return invoiceTotal;
    }

    // Default: Apply keyword search (Tuition, School Fees)
    return checkoutServices
      .filter(s => {
        if (s.isDebt) return false;
        const sDesc = s.description.toLowerCase();
        return sDesc.includes("tuition") || sDesc.includes("school fee") || sDesc.includes("fees");
      })
      .reduce((sum, s) => sum + s.amount, 0);

    return tuitionTotal;
  };

  // Calculate discount total based on eligibility and specific bases
  const calculatedDiscountAmount = selectedDiscountIds.reduce((total, id) => {
    const discount = availableDiscounts.find(d => d.discount_id === id);
    if (!discount || !isDiscountEligible(discount)) return total;

    const baseAmount = getDiscountableBase(discount);

    if (discount.discount_type === 'percentage') {
      return total + (baseAmount * (discount.amount / 100));
    } else {
      // For fixed amounts, we cap it at the base amount
      return total + Math.min(Number(discount.amount), baseAmount);
    }
  }, 0);

  const discountedTotal = Math.max(0, totalAmount - calculatedDiscountAmount);

  // Calculate VAT based only on the invoice portion of the discounted total
  const vatRate = 0.16;
  let vatAmount = 0;

  if (vatEnabled && totalAmount > 0) {
    const invoiceRatio = invoiceTotal / totalAmount;
    const discountedInvoicePortion = discountedTotal * invoiceRatio;
    // Extract inclusive VAT: Base = Total / (1 + Rate)
    vatAmount = discountedInvoicePortion - (discountedInvoicePortion / (1 + vatRate));
  }

  const platformFee = discountedTotal * 0.02; // 2% platform standard fee
  const gatewayAmount = discountedTotal + platformFee; // This is what we SEND to Lenco
  const processingFee = gatewayAmount * 0.01; // 1% Lenco processing surcharge (added by gateway)
  const serviceFee = platformFee + processingFee;
  const finalAmount = gatewayAmount + processingFee; // This is what the user VISIBLY pays (Total)
  const serviceCount = checkoutServices.length;

  const toggleDiscount = (id: string) => {
    const discount = availableDiscounts.find(d => d.discount_id === id);
    if (!discount) return;

    const isEligible = isDiscountEligible(discount);

    setSelectedDiscountIds(prev => {
      const isAlreadySelected = prev.includes(id);

      if (isAlreadySelected) {
        return prev.filter(d => d !== id);
      } else {
        // Only allow selecting if eligible
        if (!isEligible) {
          toast.error("You are not eligible for this discount.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Get unique student names from checkout services
  const studentNames = Array.from(new Set(checkoutServices.map(service => service.studentName)));

  // Lenco Hook
  const { isScriptLoaded, initiatePayment } = useLenco();
  const { isOnline } = useOfflineManager();

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
      const school = schools.find(s => s.name === selectedSchoolName);

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
        amount: gatewayAmount, // Send base + platform fee; Lenco adds 1% on top automatically
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

              // Proportional share of the unified service fee (Platform + Processing)
              // Correctly weight the total service fee across items
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
                  schoolName: selectedSchoolName,
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

  const totalWithVat = finalAmount;

  return (
    <div className="h-[100dvh] w-full flex justify-center overflow-hidden fixed inset-0 font-sans" style={{ background: "#FFFFFF" }}>
      <div className="flex flex-col w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-full relative overflow-hidden">

        {/* ── 1. Header ── */}
        <LogoHeader showBackButton={false} className="shadow-md" />

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">

          {/* ── 2. Payment Total Hero Section ── */}
          <div style={{ backgroundColor: '#F9FAFB' }} className="relative w-full h-[140px] border-b border-[#F2F2F2] flex items-center px-6 overflow-hidden">
            <div className="w-[392px] flex flex-col justify-start items-start">
              <div className="flex justify-center items-center gap-2 mb-1">
                <div className="relative">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 7.49967C2.5 7.05765 2.67559 6.63372 2.98816 6.32116C3.30072 6.0086 3.72464 5.83301 4.16667 5.83301H15.8333C16.2754 5.83301 16.6993 6.0086 17.0118 6.32116C17.3244 6.63372 17.5 7.05765 17.5 7.49967" stroke="#95E36C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z" stroke="#003630" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.5 9.16699H5C5.66667 9.16699 6.33333 9.41699 6.75 9.91699L7.66667 10.667C9 12.0003 11.0833 12.0003 12.4167 10.667L13.3333 9.91699C13.75 9.50033 14.4167 9.16699 15.0833 9.16699H17.5" stroke="#003630" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-[#003129] text-[12px] font-normal">Payment Total</div>
              </div>
              <div className="self-stretch inline-flex justify-start items-center">
                <div className="flex-1 flex justify-start items-end">
                  <div style={{ color: '#003129' }}>
                    <RollingNumber
                      value={finalAmount}
                      currency="K"
                      className="text-[40px] font-black justify-start"
                    />
                  </div>
                </div>
              </div>
            </div>

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
          </div>

          {/* ── 3. Main Breakdown Card ── */}
          <div className="p-4 flex flex-col gap-4">
            <div className="w-full bg-white rounded-2xl p-6 flex flex-col gap-9 shadow-lg outline outline-1 outline-offset-[-1px] outline-gray-200">

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <ReceiptItemIcon />
                  <span className="text-black text-[12px] font-bold">Itemized Breakdown</span>
                </div>

                <div className="flex flex-col gap-4">
                  {studentNames.map(name => {
                    const studentServices = checkoutServices.filter(s => s.studentName === name);
                    if (studentServices.length === 0) return null;

                    return (
                      <div key={name} className="flex flex-col gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{name}</div>
                        {studentServices.map(service => (
                          <div key={service.id} className="flex justify-between items-center text-[12px]">
                            <span className="text-gray-600 font-medium">{service.description}</span>
                            <span className="text-black font-semibold">K{service.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className="w-full h-[1px] bg-gray-100 my-2" />

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[#585858] text-[12px]">
                    <span>Subtotal</span>
                    <span>K{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {calculatedDiscountAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center text-[#EF4444] text-[12px] font-medium"
                    >
                      <span>Discounts (Deduction)</span>
                      <span>-K{calculatedDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </motion.div>
                  )}

                  <div className="flex justify-between items-center text-[#585858] text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <span>Transaction Fee</span>
                    </div>
                    <span>K{serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {vatEnabled && (
                    <div className="flex justify-between items-center text-[#585858] text-[12px]">
                      <span>VAT</span>
                      <span>K{vatAmount.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="w-full h-0 border-t border-[#E0E0E0] my-1" />

                  <div className="flex justify-between items-center text-black text-[12px] font-bold">
                    <span>Total</span>
                    <span>K{totalWithVat.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                  </div>
                </div>
              </div>

              {/* Discounts Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <DiscountIcon />
                  <span className="text-black text-[12px] font-bold">Discounts</span>
                </div>

                <div className="w-full px-3 py-1.5 bg-[#F9FAFB] rounded-lg flex items-center gap-4">
                  <div className="w-4 h-4 shrink-0">
                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="6.66667" stroke="#BABABA" strokeWidth="1.2" />
                      <path d="M8 10.6667V8" stroke="#BABABA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="8" cy="5.33333" r="0.666667" fill="#BABABA" />
                    </svg>
                  </div>
                  <span className="text-black text-[8px] font-normal leading-tight">
                    You can check which discounts you can get for and apply them.
                  </span>
                </div>

                {!showDiscounts ? (
                  <button
                    onClick={() => setShowDiscounts(true)}
                    className="w-full px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-[#F2F2F2] flex items-center justify-between transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3.33337 8H12.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 3.33301V12.6663" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-black text-[12px] font-medium">Add Discounts ({selectedDiscountIds.length} Selected)</span>
                    </div>
                    <ChevronDown size={14} className="text-[#445552]" />
                  </button>
                ) : (
                  <div className="self-stretch shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col justify-start items-start gap-3">
                    <div className="self-stretch px-4 py-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-100 flex flex-col justify-center items-start gap-2.5">
                      <button
                        onClick={() => setShowDiscounts(false)}
                        className="self-stretch inline-flex justify-start items-center gap-4 w-full text-left"
                      >
                        <div className="flex-1 py-px inline-flex flex-col justify-start items-start gap-1">
                          <div className="self-stretch inline-flex justify-start items-center gap-1">
                            <div className="relative">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.33337 8H12.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 3.33301V12.6663" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="text-black text-xs font-medium font-['Inter']">Add Discounts ({selectedDiscountIds.length} Selected)</div>
                          </div>
                        </div>
                        <div className="relative">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 10L8 6L12 10" stroke="#445552" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </button>



                      {isFetchingDiscounts ? (
                        <div className="self-stretch py-4 text-center text-zinc-400 text-xs">Loading discounts...</div>
                      ) : availableDiscounts.length === 0 ? (
                        <div className="self-stretch py-4 text-center text-zinc-400 text-xs">No discounts available</div>
                      ) : (
                        availableDiscounts.map(discount => {
                          const isEligible = isDiscountEligible(discount);
                          const isOnlyDebt = invoiceTotal <= 0 && totalAmount > 0;

                          // Hide staff discounts if user is not staff
                          const isStaffDiscount = getDiscountDescription(discount).includes("staff");
                          if (isStaffDiscount && !isStaff) return null;

                          const isSelectable = isEligible && !isOnlyDebt;
                          const isSelected = selectedDiscountIds.includes(discount.discount_id);

                          return (
                            <button
                              key={discount.discount_id}
                              disabled={!isSelectable && !isSelected}
                              onClick={() => toggleDiscount(discount.discount_id)}
                              className={`self-stretch p-3 bg-white rounded-2xl flex flex-col justify-start items-start gap-2.5 transition-all text-left ${!isSelectable && !isSelected ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-zinc-50'
                                }`}
                            >
                              <div className="self-stretch inline-flex justify-end items-start gap-2.5">
                                <div className="flex-1 py-px inline-flex flex-col justify-start items-start gap-1">
                                  <div className="text-black text-xs font-normal font-['Inter']">{discount.name}</div>
                                  <div className="flex items-center gap-2">
                                    {discount.description && (
                                      <div className="text-zinc-600 text-[8px] font-normal font-['Inter'] leading-tight">
                                        {discount.description}
                                      </div>
                                    )}
                                    {!isEligible && !isOnlyDebt && (
                                      <span className="text-[8px] text-red-500 font-bold uppercase tracking-wider bg-red-50 px-1 rounded">Not Eligible</span>
                                    )}
                                    {isOnlyDebt && (
                                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 px-1 rounded"> unavailable</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end items-center gap-4">
                                  <div className="text-black text-xs font-normal font-['Inter']">
                                    {discount.discount_type === 'percentage' ? `-${discount.amount}%` : `-K${discount.amount}`} Off
                                  </div>
                                  <div className="w-6 h-6 flex justify-center items-center">
                                    {isSelected ? (
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="20" height="20" rx="6" fill="#95E36C" />
                                        <path d="M17 9.5L10.5 16L7.5 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    ) : (
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="23" height="23" rx="6" stroke="#E5E7EB" strokeWidth="1.5" fill="white" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ── 4. Fixed Bottom Bar ── */}
        <div className="bg-white border-t border-neutral-200 px-6 pt-6 pb-8 flex flex-col gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.6667 10.8331C16.6667 14.9997 13.75 17.0831 10.2834 18.2914C10.1018 18.3529 9.90466 18.35 9.72504 18.2831C6.25004 17.0831 3.33337 14.9997 3.33337 10.8331V4.99972C3.33337 4.77871 3.42117 4.56675 3.57745 4.41047C3.73373 4.25419 3.94569 4.16639 4.16671 4.16639C5.83337 4.16639 7.91671 3.16639 9.36671 1.89972C9.54325 1.74889 9.76784 1.66602 10 1.66602C10.2322 1.66602 10.4568 1.74889 10.6334 1.89972C12.0917 3.17472 14.1667 4.16639 15.8334 4.16639C16.0544 4.16639 16.2663 4.25419 16.4226 4.41047C16.5789 4.56675 16.6667 4.77871 16.6667 4.99972V10.8331Z" stroke="#003129" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 9.99967L9.16667 11.6663L12.5 8.33301" stroke="#003129" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[#003630] text-[12px] font-normal">Secure payments powered by Lenco</span>
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing || !isOnline}
            style={{ backgroundColor: '#003630' }}
            className="w-full h-14 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
                <path d="M13.3334 3.33301H2.66671C1.93033 3.33301 1.33337 3.92996 1.33337 4.66634V11.333C1.33337 12.0694 1.93033 12.6663 2.66671 12.6663H13.3334C14.0698 12.6663 14.6667 12.0694 14.6667 11.333V4.66634C14.6667 3.92996 14.0698 3.33301 13.3334 3.33301Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1.33337 6.66699H14.6667" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span className="text-white text-[12px] font-bold">
              {isProcessing ? 'Opening Payment...' : isOnline ? 'Pay' : 'Go Online to Pay'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
