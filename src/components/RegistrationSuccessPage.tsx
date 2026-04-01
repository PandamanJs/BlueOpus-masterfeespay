import { motion } from "motion/react";
import svgPaths from "../imports/svg-6d9pc8dvdi";
import { ChevronRight } from "lucide-react";
import { haptics } from "../utils/haptics";

interface RegistrationSuccessPageProps {
  onContinue: () => void;
}

export default function RegistrationSuccessPage({ onContinue }: RegistrationSuccessPageProps) {
  const handleContinue = () => {
    haptics.buttonPress();
    onContinue();
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* Animated Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          duration: 0.8,
        }}
        className="mb-8"
      >
        <div className="size-[147px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 147 147">
            <g id="Warning / Circle_Check">
              <motion.path
                d={svgPaths.pfd993f0}
                id="Vector"
                stroke="#95E36C"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  ease: "easeInOut",
                }}
              />
            </g>
          </svg>
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="font-['IBM_Plex_Sans:SemiBold',sans-serif] text-2xl text-[#003630] mb-2">
          Registration Successful
        </h1>
        <p className="font-['IBM_Plex_Sans:Regular',sans-serif] text-sm text-black/50">
          Your account has been created successfully
        </p>
      </motion.div>

      {/* Continue Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        onClick={handleContinue}
        className="relative w-full max-w-sm h-14 rounded-2xl overflow-hidden group shadow-lg"
        style={{
          touchAction: "manipulation",
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

        {/* Shadow */}
        <div className="absolute inset-0 shadow-[0px_6px_0px_0px_rgba(0,54,48,0.25)] group-active:shadow-[0px_2px_0px_0px_rgba(0,54,48,0.25)] transition-shadow" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center gap-2 h-full px-6 group-active:translate-y-[2px] transition-transform">
          <span className="font-['IBM_Plex_Sans:SemiBold',sans-serif] text-base text-white">
            Pay for School Fee's
          </span>
          <ChevronRight className="size-5 text-white" />
        </div>
      </motion.button>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute top-20 left-10 size-32 bg-[#95e36c]/5 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-20 right-10 size-40 bg-[#95e36c]/5 rounded-full blur-3xl"
      />
    </div>
  );
}
