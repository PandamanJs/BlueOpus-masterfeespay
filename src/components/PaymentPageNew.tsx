/**
 * PAYMENT PAGE - REDESIGNED FOR LENCO POPUP
 * 
 * Premium glassmorphism design with collapsible sections
 * Optimized for one-screen view - minimal scrolling required
 * Designed for payment provider popup flow
 */

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ChevronDown, CreditCard, Smartphone, ShieldCheck, Receipt } from "lucide-react";
import { useAppStore } from "../stores/useAppStore";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 hover:bg-white/80 transition-all shadow-sm"
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
            <div className="p-4 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PaymentPage({ onBack, onPay, totalAmount }: PaymentPageProps) {
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showServicesBreakdown, setShowServicesBreakdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get data from store
  const checkoutServices = useAppStore((state) => state.checkoutServices);
  const selectedStudentIds = useAppStore((state) => state.selectedStudentIds);
  const userName = useAppStore((state) => state.userName);

  // Calculate totals
  const serviceFee = totalAmount * 0.01; // 1% service fee
  const finalAmount = totalAmount + serviceFee;
  const serviceCount = checkoutServices.length;

  const handlePay = async () => {
    setIsProcessing(true);
    // Simulate opening Lenco popup
    await new Promise(resolve => setTimeout(resolve, 500));
    onPay();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-gray-50 to-green-50/30 flex flex-col">
      <LogoHeader showBackButton onBack={onBack} />

      {/* Main Content - Optimized for one screen */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-32">
        <div className="max-w-lg mx-auto space-y-4">
          
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[24px] text-[#003630] mb-1">
              Complete Payment
            </h1>
            <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[14px] text-gray-600">
              Review your payment and proceed to checkout
            </p>
          </motion.div>

          {/* Glassmorphism Payment Summary Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl p-6 bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl border border-white/80 shadow-xl overflow-hidden"
          >
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#95e36c]/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#003630]/10 to-transparent rounded-full blur-2xl" />

            {/* Content */}
            <div className="relative z-10 space-y-5">
              
              {/* Total Amount - Large and Prominent */}
              <div className="text-center pb-5 border-b border-gray-200/50">
                <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[12px] text-gray-500 mb-2 uppercase tracking-wide">
                  Total Payment
                </p>
                <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[48px] leading-none text-[#003630]">
                  {finalAmount.toLocaleString('en-UG', { maximumFractionDigits: 0 })}
                  <span className="text-[24px] ml-2 text-gray-600">UGX</span>
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[14px] text-gray-700">
                    Services ({serviceCount})
                  </span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">
                    {totalAmount.toLocaleString('en-UG', { maximumFractionDigits: 0 })} UGX
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[14px] text-gray-700">
                    Service Fee (1%)
                  </span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-gray-600">
                    {serviceFee.toLocaleString('en-UG', { maximumFractionDigits: 0 })} UGX
                  </span>
                </div>

                {selectedStudentIds.length > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                    <span className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[14px] text-gray-700">
                      Students
                    </span>
                    <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">
                      {selectedStudentIds.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Collapsible Sections */}
          <div className="space-y-3">
            
            {/* Student Details - Collapsible */}
            <CollapsibleSection
              title={`Student Details (${selectedStudentIds.length})`}
              isExpanded={showStudentDetails}
              onToggle={() => setShowStudentDetails(!showStudentDetails)}
              icon={<Receipt size={20} />}
            >
              <div className="space-y-2">
                {selectedStudentIds.map((id, index) => (
                  <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-white/80">
                    <div>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[13px] text-[#003630]">
                        Student {index + 1}
                      </p>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[11px] text-gray-500">
                        ID: {id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Services Breakdown - Collapsible */}
            <CollapsibleSection
              title={`Services Breakdown (${serviceCount})`}
              isExpanded={showServicesBreakdown}
              onToggle={() => setShowServicesBreakdown(!showServicesBreakdown)}
              icon={<Receipt size={20} />}
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
                      {service.amount.toLocaleString('en-UG', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>

        </div>
      </div>

      {/* Fixed Bottom Section - Payment Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-5 shadow-2xl">
        <div className="max-w-lg mx-auto space-y-4">
          
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <ShieldCheck size={16} />
            <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[12px]">
              Secure payment powered by Lenco
            </span>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-[#003630] to-[#004d42] text-white font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[16px] shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
              <>
                <CreditCard size={20} />
                <span>Pay {finalAmount.toLocaleString('en-UG', { maximumFractionDigits: 0 })} UGX</span>
              </>
            )}
          </button>

          {/* What happens next */}
          <p className="text-center font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[11px] text-gray-500 leading-relaxed">
            Clicking "Pay" will open Lenco's secure payment window
          </p>
        </div>
      </div>
    </div>
  );
}
