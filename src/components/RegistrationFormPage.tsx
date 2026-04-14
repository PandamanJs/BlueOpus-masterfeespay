import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ParentInformationPage, { type ParentData } from './registration/ParentInformationPage';
import StudentsPage from './registration/StudentsPage';
import ReviewPage from './registration/ReviewPage';
import { type StudentData, registerParent, linkStudentsToParent, rollbackParentCreation } from '../lib/supabase/api/registration';
import { getSchools } from '../lib/supabase/api/schools';
import type { School } from '../types';
import { useAppStore } from '../stores/useAppStore';

interface RegistrationFormPageProps {
  onBack: () => void;
  onComplete: (data: { name: string; phone: string; schoolName: string; parentId: string }) => void;
}

type RegistrationStep = 'parent' | 'students' | 'review';

export default function RegistrationFormPage({ onBack, onComplete }: RegistrationFormPageProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('parent');
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate account detection state
  const [duplicateAccountName, setDuplicateAccountName] = useState<string | null>(null);
  const [duplicateAccountField, setDuplicateAccountField] = useState<'phone' | 'email' | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // ── Back-navigation fix ──────────────────────────────────────────────────
  // We need a ref so the popstate handler always sees the CURRENT step without
  // needing to re-register the listener on every render.
  const currentStepRef = useRef<RegistrationStep>('parent');
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  // Capture fires before App.tsx's bubble-phase listener, so we can handle
  // inter-step navigation first and stop propagation when appropriate.
  const setNavigationDirection = useAppStore((state) => state.setNavigationDirection);

  /*
  useEffect(() => {
    const handleInternalBack = (e: PopStateEvent) => {
      const step = currentStepRef.current;
      if (step === 'students' || step === 'review') {
        e.stopImmediatePropagation(); // prevent App.tsx from also handling it
        setNavigationDirection('back'); // Let any animated components know we're moving back
        if (step === 'students') setCurrentStep('parent');
        else if (step === 'review') setCurrentStep('students');
      }
    };
    // true = capture phase
    window.addEventListener('popstate', handleInternalBack, true);
    return () => window.removeEventListener('popstate', handleInternalBack, true);
  }, [setNavigationDirection]); // Uses setNavigationDirection from hook
  */

  useEffect(() => {
    async function fetchSchools() {
      const data = await getSchools();
      setSchools(data);
    }
    fetchSchools();
  }, []);

  // Push a history entry so browser back has something to pop back through.
  // Without this, the first back swipe would exit the registration page entirely.
  const handleParentNext = (data: ParentData) => {
    console.log('[Registration] Step 1 -> 2 (Parent info confirmed)', data);
    setParentData(data);
    setCurrentStep('students');
    window.history.pushState({ page: 'registration-form', step: 'students' }, '', '#registration-form');
  };

  const handleStudentsBack = () => {
    console.log('[Registration] Step 2 -> 1 (Back to parent info)');
    window.history.back();
  };

  const handleStudentsNext = (students: StudentData[]) => {
    console.log('[Registration] Step 2 -> 3 (Students confirmed, going to review)', students);
    setStudentsData(students);
    setCurrentStep('review');
    window.history.pushState({ page: 'registration-form', step: 'review' }, '', '#registration-form');
  };

  const handleReviewBack = () => { window.history.back(); };

  const handleFinalConfirm = async () => {
    if (parentData && studentsData.length > 0) {
      console.log('[Registration] handleFinalConfirm started:', { studentsCount: studentsData.length });
      setIsSubmitting(true);
      let createdParentId: string | null = null;
      try {
        let resolvedParentId: string;

        console.log('[Registration] Registering/looking up parent...');
        // 1. Register / look up parent
        const result = await registerParent(parentData);
        console.log('[Registration] Parent register result:', result);

        if (result.isExisting) {
          console.log('[Registration] Existing account detected by credential:', result.duplicateField);
          setDuplicateAccountName(result.existingName || 'Unknown');
          setDuplicateAccountField(result.duplicateField || null);
          setShowDuplicateModal(true);
          setIsSubmitting(false);
          return;
        }

        resolvedParentId = result.parentId;
        createdParentId = result.wasCreated ? result.parentId : null;
        console.log('[Registration] Proceeding with parentId:', resolvedParentId);

        // 2. Link Students
        await linkStudentsToParent(resolvedParentId, studentsData, parentData.schoolId);
        console.log('[Registration] Students linked successfully');

        // Success!
        toast.success("Registration completed successfully!");

        const schoolName = schools.find(s => s.id === parentData.schoolId)?.name || "";
        console.log('[Registration] Finalizing with school:', schoolName);

        onComplete({
          name: parentData.fullName,
          phone: parentData.phone,
          schoolName: schoolName,
          parentId: resolvedParentId
        });

      } catch (error) {
        console.error('[Registration] CRITICAL FAILURE:', error);
        if (createdParentId) {
          try {
            await rollbackParentCreation(createdParentId);
          } catch (rollbackError) {
            console.error('[Registration] Rollback failed:', rollbackError);
          }
        }
        toast.error('Registration failed and no partial account was kept.', {
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.warn('[Registration] handleFinalConfirm called but data missing:', { parentData: !!parentData, studentsCount: studentsData.length });
    }
  };

  const handleDismissDuplicate = async () => {
    setShowDuplicateModal(false);
    setDuplicateAccountName(null);
    setDuplicateAccountField(null);
  };

  if (isSubmitting) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <Loader2 className="size-16 text-[#95e36c] animate-spin mb-6" />
        <h2 className="text-[28px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] tracking-[-0.6px]">Registering...</h2>
        <p className="text-[15px] text-[#003630]/60 mt-3 max-w-[280px] leading-relaxed">
          Verifying your secure connection and linking student records to your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white relative">

      {/* ── Duplicate Account Confirmation Modal ── */}
      <AnimatePresence>
        {showDuplicateModal && duplicateAccountName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-sm bg-white rounded-[28px] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-amber-50 border-b border-amber-100 px-6 pt-6 pb-5">
                <div className="size-12 rounded-[16px] bg-amber-400/20 flex items-center justify-center mb-3">
                  <AlertTriangle size={24} className="text-amber-600" />
                </div>
                <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#003630] tracking-[-0.4px]">
                  Account Already Exists
                </h2>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                  This {duplicateAccountField || 'credential'} already belongs to an account under the name:
                </p>
                <p className="text-[17px] font-bold text-[#003630] mt-1 tracking-[-0.3px]">
                  {duplicateAccountName}
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Please log in with that account or go back and use different contact details.
                </p>

                {/* Close button */}
                <button
                  onClick={handleDismissDuplicate}
                  className="w-full h-13 rounded-[16px] bg-[#003630] text-white font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_6px_16px_rgba(0,54,48,0.2)] py-3"
                >
                  <X size={18} className="text-[#95e36c]" />
                  Go Back and Edit
                </button>

                <p className="text-[11px] text-center text-gray-400 pt-1">
                  If you're unsure, contact your school's administration.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">

      {currentStep === 'parent' && (
        <motion.div
          key="step-parent"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="relative h-full"
        >
          <ParentInformationPage
            onNext={handleParentNext}
            onBack={onBack}
            initialData={parentData || undefined}
          />
        </motion.div>
      )}

      {currentStep === 'students' && parentData && (
        <motion.div
          key="step-students"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="relative h-full"
        >
          <StudentsPage
            parentData={parentData}
            onComplete={handleStudentsNext}
            onBack={handleStudentsBack}
            initialStudents={studentsData}
          />
        </motion.div>
      )}

      {currentStep === 'review' && parentData && studentsData.length > 0 && (
        <motion.div
          key="step-review"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="relative h-full"
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
