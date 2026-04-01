import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ParentInformationPage, { type ParentData } from './ParentInformationPage';
import StudentsPage from './StudentsPage';
import ReviewPage from './ReviewPage';
import { type StudentData } from '../../lib/supabase/api/registration';

interface RegistrationFlowProps {
  onComplete: (data: RegistrationCompleteData) => void;
}

export interface RegistrationCompleteData {
  parent: ParentData;
  students: StudentData[];
}

type RegistrationStep = 'parent' | 'students' | 'review';

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function RegistrationFlow({ onComplete }: RegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('parent');
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleParentNext = (data: ParentData) => {
    setParentData(data);
    setDirection(1);
    setCurrentStep('students');
  };

  const handleStudentsBack = () => {
    setDirection(-1);
    setCurrentStep('parent');
  };

  const handleStudentsNext = (students: StudentData[]) => {
    setStudentsData(students);
    setDirection(1);
    setCurrentStep('review');
  };

  const handleReviewBack = () => {
    setDirection(-1);
    setCurrentStep('students');
  };

  const handleFinalConfirm = async () => {
    if (parentData && studentsData.length > 0) {
      setIsSubmitting(true);
      try {
        await onComplete({
          parent: parentData,
          students: studentsData,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        {currentStep === 'parent' && (
          <motion.div
            key="parent"
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <ParentInformationPage onNext={handleParentNext} />
          </motion.div>
        )}

        {currentStep === 'students' && parentData && (
          <motion.div
            key="students"
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <StudentsPage
              parentData={parentData}
              onComplete={handleStudentsNext}
              onBack={handleStudentsBack}
            />
          </motion.div>
        )}

        {currentStep === 'review' && parentData && studentsData.length > 0 && (
          <motion.div
            key="review"
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <ReviewPage
              parentData={parentData}
              students={studentsData}
              onBack={handleReviewBack}
              onConfirm={handleFinalConfirm}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
