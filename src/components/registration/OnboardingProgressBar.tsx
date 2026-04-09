import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export default function OnboardingProgressBar({ currentStep, totalSteps = 3 }: OnboardingProgressBarProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-2 py-4">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;

        return (
          <div key={`step-${stepNum}`} className="flex items-center">
            {/* Circle */}
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isCompleted ? '#95e36c' : isCurrent ? '#f9fafb' : '#ffffff',
                borderColor: isCompleted ? '#95e36c' : isCurrent ? '#003630' : '#e5e7eb',
                scale: isCurrent ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={`
                flex items-center justify-center rounded-full border-[1.5px] transition-all
                ${isCompleted ? 'size-[24px]' : 'size-[24px]'}
              `}
            >
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Check size={14} className="text-[#003630] font-bold" strokeWidth={3} />
                </motion.div>
              )}
              {isCurrent && (
                <motion.div 
                  layoutId="active-step-dot"
                  className="size-[8px] rounded-full bg-[#003630]" 
                />
              )}
            </motion.div>

            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <div className="w-[33px] h-[1.5px] mx-1 overflow-hidden bg-[#e5e7eb] rounded-full">
                 <motion.div 
                    initial={false}
                    animate={{ 
                      width: isCompleted ? '100%' : '0%' 
                    }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-[#95e36c]"
                 />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
