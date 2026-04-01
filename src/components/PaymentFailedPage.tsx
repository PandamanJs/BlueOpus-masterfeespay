import { motion } from "motion/react";
import svgPaths from "../imports/svg-pr0k2pgw9k";
import { ChevronLeft } from "lucide-react";
// import imgMasterFeesLogo from "../imports/Frame1707478923-18-800.tsx?url";

interface PaymentFailedPageProps {
  onTryAgain: () => void;
  onBack: () => void;
  failureReason?: string;
}

export default function PaymentFailedPage({ onTryAgain, onBack, failureReason = "Payment could not be processed. Please try again." }: PaymentFailedPageProps) {
  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* Error Icon with Animation */}
        <motion.div 
          className="relative w-[124px] h-[126px] mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
        >
          <div className="overflow-clip size-full relative">
            <div className="absolute inset-[4.167%]">
              <div className="absolute inset-0" style={{ "--fill-0": "rgba(149, 227, 108, 1)" } as React.CSSProperties}>
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 114 116">
                  <g>
                    <path d={svgPaths.p1e102200} fill="var(--fill-0, #95E36C)" />
                    <path clipRule="evenodd" d={svgPaths.p3f43b600} fill="var(--fill-0, #95E36C)" fillRule="evenodd" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Failed Text */}
        <motion.h2 
          className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[20px] text-[#003630] text-center mb-6 tracking-[-0.2px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Payment Failed
        </motion.h2>

        {/* Failure Reason */}
        <motion.p 
          className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[15px] text-black text-center max-w-[314px] mx-auto leading-[24px] tracking-[-0.15px] mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {failureReason}
        </motion.p>

        {/* Try Again Button - Premium Style */}
        <motion.button
          onClick={onTryAgain}
          className="relative w-full max-w-[308px] h-[59px] rounded-[16px] overflow-hidden group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          {/* Shadow */}
          <div className="absolute inset-0 shadow-[0px_6px_20px_rgba(0,54,48,0.25)] group-active:shadow-[0px_2px_8px_rgba(0,54,48,0.2)] transition-shadow" />
          
          {/* Content */}
          <div className="relative z-10 flex items-center justify-center gap-[10px] h-full group-active:scale-[0.97] transition-transform">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-white tracking-[-0.3px]">
              Try Again
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
