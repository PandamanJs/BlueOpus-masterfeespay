import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

export default function OnboardingProgressBar({ currentStep, totalSteps = 3, className }: OnboardingProgressBarProps) {
  return (
    <div className={`w-full max-w-[300px] mx-auto flex items-center justify-between relative px-2 ${className || 'py-4'}`}>
      {/* Background Line (Grey) - Loading in animation */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "circOut" }}
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-gray-100 z-0 mx-8 origin-left" 
      />

      {/* Active Progress Line (Dark Green with Liquid Gradient) */}
      <motion.div 
        className="absolute left-8 top-1/2 -translate-y-1/2 h-[2px] bg-[#003630] z-0 origin-left rounded-full overflow-hidden shadow-[0_0_8px_rgba(0,54,48,0.2)]"
        initial={{ width: 0 }}
        animate={{ 
          width: `calc(${((currentStep - 1) / (totalSteps - 1)) * 100}% - ${currentStep > 1 ? '16px' : '0px'})`
        }}
        transition={{ 
          type: "spring",
          stiffness: 70,
          damping: 15,
          mass: 1,
          restDelta: 0.001
        }}
        style={{ maxWidth: 'calc(100% - 64px)' }}
      >
        {/* Animated Gloss Effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-20"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
        />
      </motion.div>

      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;

        return (
          <div key={`step-${stepNum}`} className="relative z-10">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isCompleted ? '#003630' : isCurrent ? '#ffffff' : '#ffffff',
                borderColor: isCompleted ? '#003630' : isCurrent ? '#003630' : '#e5e7eb',
                scale: isCurrent ? 1.15 : 1,
                borderWidth: isCurrent || isCompleted ? '1.5px' : '1px'
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className="flex items-center justify-center rounded-full transition-all size-[18px] relative"
            >
              {/* Sophisticated Ambient Glow for active step */}
              {isCurrent && (
                <>
                  <motion.div 
                    className="absolute inset-[-4px] rounded-full border border-[#003630]/20 bg-[#003630]/5"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="absolute inset-[-8px] rounded-full border border-[#003630]/10"
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />
                </>
              )}

              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <Check size={11} className="text-white" strokeWidth={4} />
                </motion.div>
              ) : isCurrent ? (
                <motion.div 
                  className="size-2 rounded-full bg-[#003630]"
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
