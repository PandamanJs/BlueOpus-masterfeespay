import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

export default function OnboardingProgressBar({ currentStep, totalSteps = 3, className }: OnboardingProgressBarProps) {
  return (
    <div className={`flex items-center gap-0 ${className || ''}`}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;
        const isLast = stepNum === totalSteps;

        return (
          <React.Fragment key={`step-${stepNum}`}>
            {/* Step Icon */}
            <div className="relative">
              {isCompleted ? (
                <div 
                  className="size-5 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: '#003129' }}
                >
                  <Check size={10} style={{ color: '#95e36c' }} strokeWidth={4} />
                </div>
              ) : isCurrent ? (
                <div 
                  className="size-5 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: '#003129' }}
                >
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0.2, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-white rounded-full"
                  />
                  <div className="size-1.5 bg-white rounded-full relative z-10" />
                </div>
              ) : (
                <div className="size-5 bg-white border border-zinc-200 rounded-full shadow-sm" />
              )}
            </div>

            {/* Connecting Line */}
            {!isLast && (
              <div className="w-6 h-[2px] bg-zinc-100 relative overflow-hidden">
                <motion.div 
                  initial={false}
                  animate={{ 
                    width: isCompleted ? '100%' : '0%' 
                  }}
                  className="absolute inset-0"
                  style={{ backgroundColor: '#003129' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
