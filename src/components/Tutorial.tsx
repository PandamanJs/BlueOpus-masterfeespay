import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

/**
 * Interface for each tutorial step
 */
interface TutorialStep {
  title: string;        // Step heading
  description: string;  // Detailed explanation
  position: "center" | "top" | "bottom";  // Vertical positioning
}

/**
 * Tutorial step content
 * Guides users through the main features of the app
 * Designed with Apple's minimalist aesthetic
 */
const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Master-Fees",
    description: "A better way to manage school fee payments. Fast, secure, and effortlessly simple.",
    position: "center",
  },
  {
    title: "Find Students Instantly",
    description: "Search by name and see instant results. The students you select most often appear first.",
    position: "top",
  },
  {
    title: "Select What You Need",
    description: "Choose services for one or more students. Everything is organized, clear, and easy to review.",
    position: "center",
  },
  {
    title: "Review Before You Pay",
    description: "Check your selection and total amount. Make changes if needed, then proceed with confidence.",
    position: "center",
  },
  {
    title: "Pay Your Way",
    description: "Mobile Money or Card. Choose what works for you. All transactions are encrypted and secure.",
    position: "bottom",
  },
  {
    title: "Access Receipts Anytime",
    description: "Download receipts instantly or view your complete payment history, organized by month.",
    position: "center",
  },
  {
    title: "Ready to Begin",
    description: "Everything you need is just a tap away. Let's get started.",
    position: "center",
  }
];

interface TutorialProps {
  onComplete: () => void;  // Callback when tutorial is finished
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  /**
   * Handle next button click
   * Advances to next step or completes the tutorial
   */
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  /**
   * Handle skip button click
   * Immediately completes the tutorial
   */
  const handleSkip = () => {
    handleComplete();
  };

  /**
   * Complete the tutorial
   * Animates out and calls the onComplete callback
   */
  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  const currentStepData = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  /**
   * Get positioning classes based on step configuration
   * Controls where the tutorial card appears on screen
   */
  const getPositionClasses = () => {
    switch (currentStepData.position) {
      case "top":
        return "items-start pt-24";
      case "bottom":
        return "items-end pb-24";
      default:
        return "items-center justify-center";
    }
  };

  // Apple's signature spring animation config
  const springConfig = {
    type: "spring" as const,
    damping: 40,
    stiffness: 400,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleSkip();
            }
          }}
        >
          <div className={`w-full h-full flex px-6 relative ${getPositionClasses()}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ 
                  scale: 0.92, 
                  opacity: 0,
                  y: 20,
                }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  y: 0,
                }}
                exit={{ 
                  scale: 0.92, 
                  opacity: 0, 
                  y: -20,
                }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="max-w-[580px] w-full relative"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(60px) saturate(200%)",
                  WebkitBackdropFilter: "blur(60px) saturate(200%)",
                  boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.5) inset",
                  borderRadius: "24px",
                  padding: "48px 40px",
                }}
              >
                {/* Close Button - Apple style */}
                <motion.button
                  whileHover={{ 
                    scale: 1.1,
                    backgroundColor: "rgba(0, 0, 0, 0.06)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkip}
                  transition={springConfig}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <X className="w-4 h-4 text-black/40" strokeWidth={2} />
                </motion.button>

                {/* Content */}
                <div className="mb-8">
                  <motion.h2
                    key={`title-${currentStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="font-['SF_Pro_Display:Bold',system-ui,-apple-system,sans-serif] text-[34px] tracking-[-0.02em] text-black mb-4 leading-[1.15]"
                    style={{
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {currentStepData.title}
                  </motion.h2>
                  
                  <motion.p
                    key={`desc-${currentStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="font-['SF_Pro_Text:Regular',system-ui,-apple-system,sans-serif] text-[17px] text-black/70 leading-[1.47]"
                    style={{
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {currentStepData.description}
                  </motion.p>
                </div>

                {/* Progress Indicators - Apple style dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex gap-2 mb-8 justify-center"
                >
                  {tutorialSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{
                        width: index === currentStep ? "28px" : "6px",
                        opacity: index === currentStep ? 1 : index < currentStep ? 0.4 : 0.2,
                      }}
                      transition={{ 
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="h-[6px] rounded-full"
                      style={{
                        backgroundColor: index === currentStep ? "#003630" : "#000000",
                      }}
                    />
                  ))}
                </motion.div>

                {/* Step Counter - Apple style */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="flex items-center justify-center mb-8"
                >
                  <p className="font-['SF_Pro_Text:Medium',system-ui,-apple-system,sans-serif] text-[13px] text-black/40 tracking-[-0.01em]">
                    {currentStep + 1} of {tutorialSteps.length}
                  </p>
                </motion.div>

                {/* Actions - Apple style buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex flex-col gap-3"
                >
                  <motion.button
                    whileHover={{ 
                      scale: 1.01,
                      backgroundColor: "#002420",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    transition={springConfig}
                    className="w-full px-6 py-[14px] rounded-full font-['SF_Pro_Text:Semibold',system-ui,-apple-system,sans-serif] text-[17px] text-white tracking-[-0.01em]"
                    style={{
                      backgroundColor: "#003630",
                      boxShadow: "0 2px 8px rgba(0, 54, 48, 0.25), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset",
                      fontWeight: 600,
                    }}
                  >
                    {isLastStep ? "Get Started" : "Continue"}
                  </motion.button>
                  
                  {!isLastStep && (
                    <motion.button
                      whileHover={{ 
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkip();
                      }}
                      transition={springConfig}
                      className="w-full px-6 py-[14px] rounded-full font-['SF_Pro_Text:Regular',system-ui,-apple-system,sans-serif] text-[17px] text-black/60 tracking-[-0.01em]"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.02)",
                        fontWeight: 400,
                      }}
                    >
                      Skip
                    </motion.button>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
