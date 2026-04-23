import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ParentInformationPage, { type ParentData } from './registration/ParentInformationPage';
import StudentsPage from './registration/StudentsPage';
import ReviewPage, { type BalanceDisputeDetails } from './registration/ReviewPage';
import { type StudentData, registerParent, linkStudentsToParent } from '../lib/supabase/api/registration';
import { getSchools } from '../lib/supabase/api/schools';
import type { School } from '../types';
import { useAppStore } from '../stores/useAppStore';

interface RegistrationFormPageProps {
  onBack: () => void;
  onComplete: (data: { name: string; phone: string; schoolName: string; userId: string }) => void;
  initialParentData?: ParentData | null;
  initialStep?: RegistrationStep;
}

type RegistrationStep = 'parent' | 'students' | 'review';
type StudentBalanceDispute = BalanceDisputeDetails & { note: string };

export default function RegistrationFormPage({ onBack, onComplete, initialParentData = null, initialStep = 'parent' }: RegistrationFormPageProps) {
  const PERSISTENCE_KEY = 'masterfees_registration_v1';
  const isAddStudentEntry = Boolean(initialParentData?.parentId && initialStep === 'students');

  const [currentStep, setCurrentStep] = useState<RegistrationStep>(() => {
    if (initialParentData?.schoolId) return initialStep;
    const saved = localStorage.getItem(`${PERSISTENCE_KEY}_step`);
    return (saved as RegistrationStep) || 'parent';
  });

  const [parentData, setParentData] = useState<ParentData | null>(() => {
    if (initialParentData?.schoolId) return initialParentData;
    const saved = localStorage.getItem(`${PERSISTENCE_KEY}_parent`);
    return saved ? JSON.parse(saved) : null;
  });

  const [studentsData, setStudentsData] = useState<StudentData[]>(() => {
    const saved = localStorage.getItem(`${PERSISTENCE_KEY}_students`);
    return saved ? JSON.parse(saved) : [];
  });

  const [studentBalanceDisputes, setStudentBalanceDisputes] = useState<Record<string, StudentBalanceDispute>>({});
  const [schools, setSchools] = useState<School[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate account detection state
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);
  const [duplicateAccountName, setDuplicateAccountName] = useState<string | null>(null);
  const [duplicateMatchType, setDuplicateMatchType] = useState<'phone' | 'email' | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  useEffect(() => {
    const hasParentContext = Boolean(parentData?.schoolId);
    const hasStudentsContext = studentsData.length > 0;

    if (!hasParentContext && currentStep !== 'parent') {
      setCurrentStep('parent');
      return;
    }

    if (currentStep === 'review' && !hasStudentsContext) {
      setCurrentStep('students');
    }
  }, [currentStep, parentData, studentsData]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(`${PERSISTENCE_KEY}_step`, currentStep);
    if (parentData) localStorage.setItem(`${PERSISTENCE_KEY}_parent`, JSON.stringify(parentData));
    if (studentsData.length > 0) localStorage.setItem(`${PERSISTENCE_KEY}_students`, JSON.stringify(studentsData));
  }, [currentStep, parentData, studentsData]);

  const clearPersistence = () => {
    localStorage.removeItem(`${PERSISTENCE_KEY}_step`);
    localStorage.removeItem(`${PERSISTENCE_KEY}_parent`);
    localStorage.removeItem(`${PERSISTENCE_KEY}_students`);
  };

  useEffect(() => {
    if (!initialParentData?.schoolId) return;
    clearPersistence();
    setParentData(initialParentData);
    setStudentsData([]);
    setStudentBalanceDisputes({});
    setCurrentStep(initialStep);
  }, [initialParentData, initialStep]);

  // ── Back-navigation fix ──────────────────────────────────────────────────
  // We need a ref so the popstate handler always sees the CURRENT step without
  // needing to re-register the listener on every render.
  const currentStepRef = useRef<RegistrationStep>(currentStep);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  const setNavigationDirection = useAppStore((state) => state.setNavigationDirection);

  useEffect(() => {
    window.history.replaceState(
      { page: 'registration-form', step: currentStep },
      '',
      '#registration-form'
    );
  }, [currentStep]);

  useEffect(() => {
    const handleInternalBack = (e: PopStateEvent) => {
      const targetPage = e.state?.page || window.location.hash.slice(1);
      if (targetPage !== 'registration-form') return;

      const targetStep = e.state?.step as RegistrationStep | undefined;
      const activeStep = currentStepRef.current;

      if (targetStep && targetStep !== activeStep) {
        e.stopImmediatePropagation();
        setNavigationDirection('back');
        setCurrentStep(targetStep);
        return;
      }

      if (!targetStep && (activeStep === 'students' || activeStep === 'review')) {
        e.stopImmediatePropagation();
        setNavigationDirection('back');
        setCurrentStep(activeStep === 'review' ? 'students' : 'parent');
      }
    };
    window.addEventListener('popstate', handleInternalBack, true);
    return () => window.removeEventListener('popstate', handleInternalBack, true);
  }, [setNavigationDirection]);

  useEffect(() => {
    async function fetchSchools() {
      const data = await getSchools();
      setSchools(data);
    }
    fetchSchools();
  }, []);

  // Push a history entry so browser back has something to pop back through.
  // Without this, the first back swipe would exit the registration page entirely.
  const handleParentNext = async (data: ParentData) => {
    console.log('[Registration] Step 1 -> 2 (Parent info confirmed)', data);
    setIsSubmitting(true);
    try {
      const result = await registerParent(data);
      console.log('[Registration] Parent register result:', result);

      if (result.isExisting) {
        console.log('[Registration] Existing account detected during Step 1, showing modal');
        setPendingParentId(result.parentId);
        setDuplicateAccountName(result.existingName || 'Unknown');
        setDuplicateMatchType(result.matchType || result.duplicateField || null);
        setParentData(data); // Save data temporarily to resume after modal
        setShowDuplicateModal(true);
        return;
      }

      setParentData({ ...data, parentId: result.parentId });
      setCurrentStep('students');
      window.history.pushState({ page: 'registration-form', step: 'students' }, '', '#registration-form');
    } catch (error) {
      console.error('[Registration] Parent registration error:', error);
      toast.error('Failed to register parent details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentsBack = () => {
    console.log('[Registration] Step 2 -> 1 (Back to parent info)');
    if (isAddStudentEntry) {
      onBack();
      return;
    }
    window.history.back();
  };

  const handleStudentsNext = (students: StudentData[]) => {
    console.log('[Registration] Step 2 -> 3 (Students confirmed, going to review)', students);
    setStudentsData(students);
    setCurrentStep('review');
    window.history.pushState({ page: 'registration-form', step: 'review' }, '', '#registration-form');
  };

  const handleReviewBack = () => {
    window.history.back();
  };

  const handleFinalConfirm = async (confirmedParentId?: string) => {
    if (parentData && studentsData.length > 0) {
      console.log('[Registration] handleFinalConfirm started:', { confirmedParentId, studentsCount: studentsData.length });
      setIsSubmitting(true);
      try {
        let resolvedParentId: string;

        if (confirmedParentId) {
          console.log('[Registration] Using confirmed existing parentId:', confirmedParentId);
          resolvedParentId = confirmedParentId;
        } else {
          if (!parentData?.parentId) {
            console.log('[Registration] Parent not registered, registering now...');
            const result = await registerParent(parentData);
            resolvedParentId = result.parentId;
          } else {
            console.log('[Registration] Using pre-registered parentId:', parentData.parentId);
            resolvedParentId = parentData.parentId;
          }
        }

        console.log('[Registration] Proceeding with parentId:', resolvedParentId);

        // 2. Link Students
        const studentsWithDisputes = studentsData.map((student) => ({
          ...student,
          balanceDisputeNote: studentBalanceDisputes[student.id]?.note,
          balanceDisputeClaimedBalance: studentBalanceDisputes[student.id]?.claimedBalance,
          balanceDisputeRecordedBalance: studentBalanceDisputes[student.id]?.recordedBalance,
          balanceDisputeRecordedChargedAmount: studentBalanceDisputes[student.id]?.recordedChargedAmount,
          balanceDisputeRecordedPaidAmount: studentBalanceDisputes[student.id]?.recordedPaidAmount,
        }));
        await linkStudentsToParent(resolvedParentId, studentsWithDisputes, parentData.schoolId);
        console.log('[Registration] Students linked successfully');

        // Success!
        const hasSchoolReviewRequests = studentsWithDisputes.some(student => student.guardianReviewStudentId);
        const hasTwoGuardianConflictRequests = studentsWithDisputes.some(student => student.guardianReviewReason === 'two_guardians_full');
        toast.success(
          hasSchoolReviewRequests
            ? "School verification request sent"
            : "Registration completed successfully!",
          hasSchoolReviewRequests
            ? {
                description: hasTwoGuardianConflictRequests
                  ? "The matching student already has two guardians linked. The school will review the guardian conflict before access is granted."
                  : "The duplicate-looking student was not created. The school will review the request."
              }
            : undefined
        );

        const schoolName = schools.find(s => s.id === parentData.schoolId)?.name || "";
        console.log('[Registration] Finalizing with school:', schoolName);

        clearPersistence();
        onComplete({
          name: parentData.fullName,
          phone: parentData.phone,
          schoolName: schoolName,
          userId: resolvedParentId
        });

      } catch (error) {
        console.error('[Registration] CRITICAL FAILURE:', error);
        toast.error("Registration failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.warn('[Registration] handleFinalConfirm called but data missing:', { parentData: !!parentData, studentsCount: studentsData.length });
    }
  };

  // Called when parent clicks "Yes, that's me" on the duplicate modal
  const handleConfirmExistingAccount = async () => {
    setShowDuplicateModal(false);
    if (pendingParentId && parentData) {
      const updatedParentData = { ...parentData, parentId: pendingParentId };
      setParentData(updatedParentData);
      
      if (currentStep === 'parent') {
        setCurrentStep('students');
        window.history.pushState({ page: 'registration-form', step: 'students' }, '', '#registration-form');
      } else {
        await handleFinalConfirm(pendingParentId);
      }
    }
  };

  // Called when parent clicks "No, create new account"
  const handleRejectDuplicate = async () => {
    setShowDuplicateModal(false);
    setPendingParentId(null);
    setDuplicateAccountName(null);
    // Force-create a new parent by bypassing the duplicate check
    if (parentData && studentsData.length > 0) {
      setIsSubmitting(true);
      try {
        const nameParts = parentData.fullName.trim().split(' ');
        const supabaseClient = (await import('../lib/supabase/client')).supabase;
        
        // Check if the email is already taken — if so, skip it to avoid
        // unique constraint violations. This handles the case where a family
        // member already registered with the same email.
        let emailToUse: string | null = parentData.email.trim() || null;
        if (emailToUse) {
          const { data: emailCheck } = await supabaseClient
            .from('parents')
            .select('parent_id')
            .eq('email', emailToUse)
            .limit(1)
            .maybeSingle();
          
          if (emailCheck) {
            console.log('[Registration] Email already taken, omitting from new account');
            emailToUse = null;  // Don't include duplicate email
          }
        }

        const { data: newParent, error } = await supabaseClient
          .from('parents')
          .insert({
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' ') || '',
            email: emailToUse,
            phone_number: parentData.phone,
            created_at: new Date().toISOString()
          })
          .select('parent_id')
          .single();

        if (error || !newParent) {
          console.error('[Registration] Failed to create new parent:', error);
          throw new Error('Failed to create parent');
        }

        console.log('[Registration] Created new parent:', newParent.parent_id);
        setParentData({ ...parentData, parentId: newParent.parent_id });

        if (currentStep === 'parent') {
          setCurrentStep('students');
          window.history.pushState({ page: 'registration-form', step: 'students' }, '', '#registration-form');
        } else {
          const studentsWithDisputes = studentsData.map((student) => ({
            ...student,
            balanceDisputeNote: studentBalanceDisputes[student.id]?.note,
            balanceDisputeClaimedBalance: studentBalanceDisputes[student.id]?.claimedBalance,
            balanceDisputeRecordedBalance: studentBalanceDisputes[student.id]?.recordedBalance,
            balanceDisputeRecordedChargedAmount: studentBalanceDisputes[student.id]?.recordedChargedAmount,
            balanceDisputeRecordedPaidAmount: studentBalanceDisputes[student.id]?.recordedPaidAmount,
          }));
          await linkStudentsToParent(newParent.parent_id, studentsWithDisputes, parentData.schoolId);
          toast.success('Registration completed successfully!');
          const schoolName = schools.find(s => s.id === parentData.schoolId)?.name || '';
          clearPersistence();
          onComplete({ name: parentData.fullName, phone: parentData.phone, schoolName, userId: newParent.parent_id });
        }
      } catch (err) {
        console.error('[Registration] Reject duplicate error:', err);
        toast.error('Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
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
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-[4px]"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[12px] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.3)] pb-safe pointer-events-auto"
            >
              {/* Header */}
              <div className="bg-amber-50 border-b border-amber-100 px-6 pt-6 pb-5 flex items-start gap-4 rounded-t-[12px]">
                <div className="size-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630] tracking-[-0.3px] leading-tight">
                    Existing Account Found
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                    Your {duplicateMatchType === 'email' ? 'email' : 'phone number'} is already linked to:
                  </p>
                  <p className="text-[16px] font-bold text-[#003630] mt-1 tracking-[-0.3px]">
                    {duplicateAccountName}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-4">
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Is this your account? Confirming will link your children to this existing profile.
                </p>

                {/* Continue anyway option */}
                <button
                  onClick={handleRejectDuplicate}
                  className="w-full h-14 rounded-[16px] bg-[#003630] text-white font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] flex items-center justify-center active:scale-[0.98] transition-all shadow-md"
                >
                  Continue anyway
                </button>

                {/* Confirm existing account option */}
                <button
                  onClick={handleConfirmExistingAccount}
                  className="w-full h-14 rounded-[16px] border-[1.5px] border-gray-100 text-gray-500 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 size={18} className="text-gray-400" />
                  Yes, that's my account
                </button>

                <p className="text-[11px] text-center text-gray-400 pt-2 uppercase tracking-[1px] font-bold">
                  Requires Admin Approval
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <div className={`transition-opacity duration-300 ${showDuplicateModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
            onDisputeSubmit={(studentId, note, details) => {
              setStudentBalanceDisputes(prev => ({ ...prev, [studentId]: { note, ...details } }));
            }}
            isSubmitting={isSubmitting}
          />
        </motion.div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}
