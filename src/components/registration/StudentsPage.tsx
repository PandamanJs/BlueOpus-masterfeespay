import { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, Loader2, Pencil, ChevronDown, User, Sparkles, UserRoundPlus, ChevronRight, Info } from 'lucide-react';
import { type ParentData } from './ParentInformationPage';
import { type StudentData, getGradesBySchool, getClassesByGrade, scoreStudentMatches, type SchoolGrade, type MatchCandidate } from '../../lib/supabase/api/registration';
import { haptics } from '../../utils/haptics';
import LogoHeader from '../common/LogoHeader';
import OnboardingProgressBar from './OnboardingProgressBar';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../stores/useAppStore';

interface StudentsPageProps {
  parentData: ParentData;
  onComplete: (students: StudentData[]) => void;
  onBack: () => void;
  initialStudents?: StudentData[];
}



// REDESIGNED EMPTY STATE
function EmptyStudentState({ onAddManual }: { onAddManual: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      <div className="bg-white rounded-[24px] p-6 border-[1.5px] border-[#e5e7eb] shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#003630 1px, transparent 1px)', backgroundSize: '16px 1px' }} />

        <div className="flex items-start gap-5 relative z-10">
          <div className="size-14 rounded-[18px] bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            <UserRoundPlus size={28} className="text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630] tracking-[-0.3px]">No records linked</h3>
            <p className="text-[13px] text-gray-400 leading-relaxed max-w-[170px]">
              Search by name above or add details manually.
            </p>
          </div>
        </div>

        <div className="mt-8 relative z-10">
          <button
            onClick={() => { haptics.light(); onAddManual(); }}
            className="w-full h-14 rounded-[18px] bg-[#003630] border border-[#003630] shadow-[0_8px_20px_rgba(0,54,48,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
          >
            <div className="size-7 rounded-full bg-[#95e36c]/20 flex items-center justify-center group-hover/btn:bg-[#95e36c] transition-colors">
              <Plus size={16} className="text-[#95e36c] group-hover/btn:text-[#003630]" strokeWidth={3} />
            </div>
            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-white font-bold">Add New Student Record</span>
          </button>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Sparkles size={12} className="text-[#95e36c]" />
            <span className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-300">Fast & Secure Registration</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-2">
        <div className="h-[1px] flex-1 bg-gray-100" />
        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Help Center</span>
        <div className="h-[1px] flex-1 bg-gray-100" />
      </div>

      <p className="text-[12px] text-center text-gray-400 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
        Can't find your child? Contact the school administration for support.
      </p>
    </motion.div>
  );
}

// StudentCard
function StudentCard({ student, onEdit, onRemove }: { student: StudentData, onEdit: () => void, onRemove: () => void }) {
  const isReviewRequest = Boolean(student.guardianReviewStudentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[16px] p-5 border-[1px] border-[#e5e7eb] shadow-sm relative mb-4"
    >
      {/* Remove Button (X) */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Header & Subheading */}
      <div className="text-left mb-4">
        <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#000000] tracking-[-0.5px]">
          {student.name}
        </h3>
        <p className="text-[12px] text-gray-500 font-medium">
          {formatGradeAndClass(student.grade, student.class)}
        </p>
        {(student.parentName || student.otherParentName) && (
          <p className="text-[12px] text-[#95e36c] font-black uppercase tracking-wider mt-1">
            Guardian: {student.parentName || student.otherParentName}
          </p>
        )}
        {isReviewRequest && (
          <p className="text-[12px] text-amber-700 font-black uppercase tracking-wider mt-1">
            School review request
          </p>
        )}
      </div>

      {/* Instruction Box */}
      <div className="bg-[#f9fafb] rounded-[8px] p-3 border border-[#e5e7eb] mb-4">
        <p className="text-[11px] text-gray-600 leading-relaxed text-left">
          {isReviewRequest
            ? 'This learner will not be linked until the school reviews the likely matching record.'
            : "Make sure to confirm that the pupil's name and grade is correct. If any changes need to be made, please press the edit button below."}
        </p>
      </div>

      {/* Edit Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        disabled={isReviewRequest}
        className="w-full h-[40px] rounded-[8px] bg-white border border-[#e5e7eb] flex items-center justify-center font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#000000] hover:bg-gray-50 transition-colors"
      >
        {isReviewRequest ? 'Awaiting School' : 'Edit'}
      </button>
    </motion.div>
  );
}

function getMatchGuidance(confidenceBand?: StudentData['confidenceBand']): string {
  if (confidenceBand === 'high') return 'Likely your child';
  if (confidenceBand === 'medium') return 'Please confirm details';
  return 'Needs school confirmation';
}

function getBlockingReason(student: StudentData): { title: string; description: string; actionLabel: string } | null {
  if (student.isGuardianLinkLocked) {
    return {
      title: 'This learner is already linked to two guardians.',
      description: 'Please contact the school to transfer or update guardian access.',
      actionLabel: 'School Help',
    };
  }

  if (student.requiresSchoolReview) {
    return {
      title: 'High-risk duplicate match.',
      description: 'There is more than one learner sharing this name in the same grade or class. You may choose the wrong child, so the school must confirm this request.',
      actionLabel: 'Request Review',
    };
  }

  if (student.confidenceBand === 'low') {
    return {
      title: 'We could not match this learner with enough certainty.',
      description: 'Please refine the name/grade/class or ask the school to assist with linking.',
      actionLabel: 'Refine Search',
    };
  }

  return null;
}

function formatGradeAndClass(grade?: string, className?: string): string {
  const normalizedGrade = String(grade || '')
    .trim()
    .replace(/^(grade\s*)+/i, '')
    .trim();
  const normalizedClass = String(className || '').trim();
  const classSuffix = normalizedClass && normalizedClass.toLowerCase() !== 'general' ? ` ${normalizedClass}` : '';
  return `Grade ${normalizedGrade || 'Unknown'}${classSuffix}`;
}

export default function StudentsPage({ parentData, onComplete, onBack, initialStudents }: StudentsPageProps) {
  const registrationSessionIdRef = useRef<string>(crypto.randomUUID());
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentData[]>(initialStudents || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [availableGrades, setAvailableGrades] = useState<SchoolGrade[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    grade: '',
    class: '',
    studentId: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    grade: '',
    class: '',
    studentId: '',
  });

  const [searchResults, setSearchResults] = useState<StudentData[]>([]);
  const [smartMatchResults, setSmartMatchResults] = useState<StudentData[]>([]);
  const [pendingMediumCandidate, setPendingMediumCandidate] = useState<StudentData | null>(null);
  const [pendingDuplicateReview, setPendingDuplicateReview] = useState<{
    draft: StudentData;
    candidates: StudentData[];
  } | null>(null);

  // ── Back-navigation fix for the Add/Edit form ────────────────────────────
  const showAddFormRef = useRef(showAddForm);
  useEffect(() => { showAddFormRef.current = showAddForm; }, [showAddForm]);

  const setNavigationDirection = useAppStore((state) => state.setNavigationDirection);

  useEffect(() => {
    const handleAddFormBack = (e: PopStateEvent) => {
      if (showAddFormRef.current) {
        // If the form is open, close it and prevent further back navigation
        e.stopImmediatePropagation();
        setNavigationDirection('back');
        setShowAddForm(false);
        setEditingId(null);
      }
    };
    // Capture phase to intercept before App.tsx/RegistrationFormPage
    window.addEventListener('popstate', handleAddFormBack, true);
    return () => window.removeEventListener('popstate', handleAddFormBack, true);
  }, [setNavigationDirection]);

  useEffect(() => {
    const fetchGrades = async () => {
      setIsLoadingMetadata(true);
      try {
        const grades = await getGradesBySchool(parentData.schoolId);
        setAvailableGrades(grades);
      } catch (error) {
        console.error("Failed to load school grades:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    fetchGrades();
  }, [parentData.schoolId]);

  // SMART CLASS SELECTION: Dynamic loading based on selected grade
  useEffect(() => {
    const fetchClassesForGrade = async () => {
      if (!newStudent.grade) {
        setAvailableClasses([]);
        return;
      }

      // Find the ID for the currently selected grade name
      const grade = availableGrades.find(g => g.grade_name === newStudent.grade);
      if (!grade) return;

      setIsLoadingClasses(true);
      try {
        const classes = await getClassesByGrade(parentData.schoolId, grade.grade_id);
        setAvailableClasses(classes);

        // If there's only one class (or no classes), auto-select it
        if (classes.length === 1) {
          setNewStudent(prev => ({ ...prev, class: classes[0] }));
        } else if (classes.length === 0) {
          // If no specific streams exist for this grade (e.g. Baby Class), 
          // we use 'General' as the default value to keep it simple.
          setNewStudent(prev => ({ ...prev, class: 'General' }));
        } else {
          // Clear selection if multiple classes exist to force a manual choice
          setNewStudent(prev => ({ ...prev, class: '' }));
        }
      } catch (error) {
        console.error("Failed to load classes for grade:", error);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClassesForGrade();
  }, [newStudent.grade, parentData.schoolId, availableGrades]);

  const candidateToStudentData = (candidate: MatchCandidate): StudentData => ({
    id: candidate.studentId,
    name: candidate.displayName,
    grade: candidate.grade || 'Unknown',
    class: candidate.className || 'A',
    studentId: 'Existing Record',
    confidenceBand: candidate.confidenceBand,
    confidenceScore: candidate.confidenceScore,
    requiresSchoolReview: candidate.requiresSchoolReview,
    matchCandidateId: candidate.candidateId,
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const scored = await scoreStudentMatches({
            registrationSessionId: registrationSessionIdRef.current,
            schoolId: parentData.schoolId,
            queryName: searchQuery.trim(),
          });
          setSearchResults(scored.candidates.map(candidateToStudentData));
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, parentData.schoolId]);

  useEffect(() => {
    if (!showAddForm || editingId) return; // Only do smart match when adding new manually
    const timer = setTimeout(async () => {
      if (newStudent.name.trim().length >= 2) {
        try {
          const scored = await scoreStudentMatches({
            registrationSessionId: registrationSessionIdRef.current,
            schoolId: parentData.schoolId,
            queryName: newStudent.name.trim(),
            queriedGrade: newStudent.grade || undefined,
            queriedClass: newStudent.class || undefined,
          });
          const results = scored.candidates.map(candidateToStudentData);
          // Filter out students already added
          setSmartMatchResults(results.filter(r => !students.find(s => s.id === r.id)));
        } catch (error) {
          setSmartMatchResults([]);
        }
      } else {
        setSmartMatchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newStudent.name, parentData.schoolId, showAddForm, editingId, students]);

  const addStudent = (student: StudentData, options?: { forceMediumConfirm?: boolean }) => {
    console.log('[Registration] addStudent called:', student);
    haptics.selection();

    if (student.guardianReviewStudentId) {
      if (!students.find((s) => s.guardianReviewStudentId === student.guardianReviewStudentId)) {
        setStudents([...students, student]);
        setSearchQuery('');
        setSearchResults([]);
        console.log('[Registration] Student review request added to local state');
      }
      return;
    }

    if (!student.id.startsWith('new-') && student.isGuardianLinkLocked) {
      import('sonner').then(({ toast }) => toast.error(
        'This learner already has two guardians linked.',
        { description: 'Please contact the school to transfer or update guardian access.' }
      ));
      return;
    }
    if (!student.id.startsWith('new-') && student.requiresSchoolReview) {
      const reviewDraft = createSchoolReviewDraft({
        id: `review-${Date.now()}`,
        name: student.name,
        grade: student.grade,
        class: student.class,
        studentId: 'School Review',
      }, student);
      addStudent(reviewDraft);
      import('sonner').then(({ toast }) => toast.info(
        'School review request added.',
        { description: 'The school must confirm this learner before payments are available.' }
      ));
      return;
    }
    if (!student.id.startsWith('new-') && student.confidenceBand === 'low') {
      import('sonner').then(({ toast }) => toast.info(
        'We could not confidently match this learner.',
        { description: 'Please refine the name/grade/class or ask the school to assist with linking.' }
      ));
      return;
    }
    if (!student.id.startsWith('new-') && student.confidenceBand === 'medium' && !options?.forceMediumConfirm) {
      setPendingMediumCandidate(student);
      return;
    }
    if (!students.find((s) => s.id === student.id)) {
      setStudents([...students, student]);
      setSearchQuery('');
      setSearchResults([]);
      console.log('[Registration] Student added to local state, search cleared');
    } else {
      console.log('[Registration] Student already in list, skipping');
    }
  };

  const removeStudent = (id: string) => {
    haptics.light();
    setStudents(students.filter((s) => s.id !== id));
  };

  const startEditing = (student: StudentData) => {
    haptics.light();
    setEditingId(student.id);
    setNewStudent({
      name: student.name,
      grade: student.grade,
      class: student.class,
      studentId: student.studentId
    });
    setFormErrors({ name: '', grade: '', class: '', studentId: '' });
    setShowAddForm(true);
    // Push a state so "back" can pop it and trigger our interceptor
    window.history.pushState({ page: 'registration-form', subPage: 'add-student' }, '', '#registration-form');
  };

  const validateNewStudent = (): boolean => {
    const errors = { name: '', grade: '', class: '', studentId: '' };
    let isValid = true;

    if (!newStudent.name.trim()) {
      errors.name = 'Required';
      isValid = false;
    }
    if (!newStudent.grade.trim()) {
      errors.grade = 'Required';
      isValid = false;
    }
    if (!newStudent.class.trim()) {
      errors.class = 'Required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const createManualStudentDraft = (): StudentData => ({
    id: `new-${Date.now()}`,
    name: newStudent.name,
    grade: newStudent.grade,
    class: newStudent.class,
    studentId: 'New Registration',
  });

  const createSchoolReviewDraft = (draft: StudentData, candidate: StudentData): StudentData => ({
    ...draft,
    id: `review-${Date.now()}`,
    studentId: 'School Review',
    requiresSchoolReview: false,
    confidenceBand: undefined,
    guardianReviewStudentId: candidate.id,
    guardianReviewReason: 'duplicate_suspected',
    guardianReviewEvidence: {
      registrationSessionId: registrationSessionIdRef.current,
      candidateStudentId: candidate.id,
      candidateName: candidate.name,
      candidateGrade: candidate.grade,
      candidateClass: candidate.class,
      confidenceScore: candidate.confidenceScore,
      confidenceBand: candidate.confidenceBand,
      parentChoseManualEntry: true,
    },
  });

  const finalizeManualStudentCreation = (studentToAdd: StudentData) => {
    addStudent(studentToAdd);
    import('sonner').then(({ toast }) => toast.success(
      studentToAdd.guardianReviewStudentId ? 'School review request added' : 'New record added to application'
    ));
    handleCloseForm();
  };

  const handleSaveStudent = () => {
    haptics.buttonPress();
    if (validateNewStudent()) {
      if (editingId) {
        setStudents(students.map(s => s.id === editingId ? {
          ...s,
          name: newStudent.name,
          grade: newStudent.grade,
          class: newStudent.class,
        } : s));
        import('sonner').then(({ toast }) => toast.success('Record updated successfully'));
        handleCloseForm();
      } else {
        const studentToAdd = createManualStudentDraft();
        const likelyDuplicates = smartMatchResults
          .filter(candidate => !candidate.isGuardianLinkLocked && candidate.requiresSchoolReview)
          .slice(0, 3);

        if (likelyDuplicates.length > 0) {
          setPendingDuplicateReview({
            draft: studentToAdd,
            candidates: likelyDuplicates,
          });
          return;
        }

        finalizeManualStudentCreation(studentToAdd);
      }
    }
  };

  const handleCloseForm = () => {
    setNewStudent({ name: '', grade: '', class: '', studentId: '' });
    setFormErrors({ name: '', grade: '', class: '', studentId: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

  const openManualAddForm = (prefillName?: string) => {
    const parsedName = (prefillName || '').trim();
    setEditingId(null);
    setFormErrors({ name: '', grade: '', class: '', studentId: '' });
    setNewStudent(prev => ({
      ...prev,
      name: parsedName || prev.name || '',
      grade: '',
      class: '',
      studentId: '',
    }));

    if (parsedName) {
      // Show immediate suggestions from current search while refined matching recalculates.
      const immediate = searchResults
        .filter(r => !students.find(s => s.id === r.id))
        .slice(0, 6);
      setSmartMatchResults(immediate);
    } else {
      setSmartMatchResults([]);
    }

    setShowAddForm(true);
    window.history.pushState({ page: 'registration-form', subPage: 'add-student' }, '', '#registration-form');
  };

  const handleCancelAdd = () => {
    haptics.light();
    setEditingId(null);
    if (showAddForm) {
      window.history.back(); // This will trigger our popstate interceptor to close the form
    }
  };

  const handleConfirmMediumMatch = () => {
    if (!pendingMediumCandidate) return;
    addStudent(pendingMediumCandidate, { forceMediumConfirm: true });
    setPendingMediumCandidate(null);
    import('sonner').then(({ toast }) => toast.success('Student match confirmed.'));
  };

  const handleChooseExistingMatch = (candidate: StudentData) => {
    if (candidate.requiresSchoolReview) {
      const reviewDraft = createSchoolReviewDraft(pendingDuplicateReview?.draft || createManualStudentDraft(), candidate);
      finalizeManualStudentCreation(reviewDraft);
      setPendingDuplicateReview(null);
      return;
    }

    addStudent(candidate, { forceMediumConfirm: true });
    setPendingDuplicateReview(null);
    handleCloseForm();
    import('sonner').then(({ toast }) => toast.success('Existing student added to your account list.'));
  };

  const handleCreateDuplicateAnyway = () => {
    if (!pendingDuplicateReview) return;
    const primaryCandidate = pendingDuplicateReview.candidates[0];
    const reviewDraft = createSchoolReviewDraft(pendingDuplicateReview.draft, primaryCandidate);
    finalizeManualStudentCreation(reviewDraft);
    setPendingDuplicateReview(null);
  };

  const handleComplete = () => {
    haptics.heavy();
    if (students.length === 0) {
      import('sonner').then(({ toast }) => toast.error('Add at least one child to continue'));
      return;
    }

    const blockedStudents = students.filter(s => !s.id.startsWith('new-') && s.isGuardianLinkLocked);
    if (blockedStudents.length > 0) {
      import('sonner').then(({ toast }) => toast.error(
        'One or more selected students cannot be linked right now.',
        { description: 'This student already has two parent/guardian profiles assigned. Please request support from the school office.' }
      ));
      return;
    }
    onComplete(students);
  };

  const inputClasses = (field: string) => `
    relative bg-white/80 rounded-[18px] overflow-hidden
    transition-all duration-300 w-full h-[60px] px-4
    ${formErrors[field as keyof typeof formErrors]
      ? 'ring-4 ring-red-500/10 border-[1.5px] border-red-500 bg-red-50/20'
      : focusedField === field
        ? 'ring-4 ring-[#95e36c]/20 border-[1.5px] border-[#95e36c] shadow-lg'
        : 'border-[1.5px] border-white shadow-sm hover:border-[#d1d5db]'
    }
    text-[16px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] placeholder:text-gray-300 focus:outline-none
  `;

  const isButtonDisabled = students.length === 0 || showAddForm;

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader showBackButton onBack={onBack} />

      <div className="w-full flex justify-center">
        <OnboardingProgressBar currentStep={2} totalSteps={3} />
      </div>

      <div className="flex-1 px-6 pt-6 pb-32 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-[10px] mb-[12px]">
            <div className="w-[4px] h-[28px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full shadow-[0_2px_8px_rgba(149,227,108,0.3)]" />
            <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.8px]">
              Add Pupils to your Account
            </h1>
          </div>
          <div className="text-[14px] text-gray-500 tracking-[-0.2px] leading-relaxed pl-[14px]">
            <p>Add your child(ren) to your account.</p>
            <p>• Search for your child's name.</p>
            <p>• If you cannot find your child, add them manually by entering their details.</p>
          </div>
        </motion.div>



        {/* Actions Section */}
        <AnimatePresence>
          {pendingMediumCandidate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-6"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="w-full max-w-sm bg-white rounded-[20px] border border-gray-200 shadow-xl overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630]">
                    Confirm student match
                  </h3>
                  <p className="text-[12px] text-gray-500 mt-1">
                    Please double-check the name, grade, and class before adding this learner.
                  </p>
                </div>
                <div className="p-5 space-y-2">
                  <p className="text-[14px] font-bold text-[#003630]">{pendingMediumCandidate.name}</p>
                  <p className="text-[12px] text-gray-500">
                    {formatGradeAndClass(pendingMediumCandidate.grade, pendingMediumCandidate.class)}
                  </p>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => setPendingMediumCandidate(null)}
                    className="flex-1 h-11 rounded-[12px] border border-gray-200 text-gray-600 text-[13px] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmMediumMatch}
                    className="flex-1 h-11 rounded-[12px] bg-[#003630] text-white text-[13px] font-semibold"
                  >
                    Confirm & Add
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pendingDuplicateReview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-6"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="w-full max-w-md bg-white rounded-[20px] border border-gray-200 shadow-xl overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630]">
                    Are you sure this is not your child?
                  </h3>
                  <p className="text-[12px] text-gray-500 mt-1">
                    We found a likely match. If this is the learner, choose the match. If not, we will ask the school to review before linking.
                  </p>
                </div>

                <div className="p-4 space-y-2 max-h-[45vh] overflow-y-auto">
                  {pendingDuplicateReview.candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => handleChooseExistingMatch(candidate)}
                      className="w-full text-left rounded-[12px] border border-amber-200 bg-amber-50/40 p-3 hover:bg-amber-50 transition-colors"
                    >
                      <p className="font-bold text-[#003630] text-[14px] truncate">{candidate.name}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">{formatGradeAndClass(candidate.grade, candidate.class)}</p>
                      <p className="text-[10px] text-amber-700 uppercase font-black tracking-wider mt-1">
                        {getMatchGuidance(candidate.confidenceBand)}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => setPendingDuplicateReview(null)}
                    className="flex-1 h-11 rounded-[12px] border border-gray-200 text-gray-600 text-[13px] font-semibold"
                  >
                    Check Matches
                  </button>
                  <button
                    onClick={handleCreateDuplicateAnyway}
                    className="flex-1 h-11 rounded-[12px] bg-[#003630] text-white text-[13px] font-semibold"
                  >
                    Request School Review
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showAddForm ? (
          <div className="space-y-4">
            {/* Search and Add Section */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div
                  className={`
                    relative bg-white rounded-[12px] overflow-hidden
                    transition-all duration-300 border-[1px] border-[#6b7280]
                    ${focusedField === 'search' ? 'ring-2 ring-gray-200' : ''}
                    `}
                >
                  <div className="flex items-center px-4 h-[56px]">
                    <Search
                      className="flex-shrink-0 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => { setFocusedField('search'); haptics.light(); }}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for your Child"
                      className="flex-1 px-3 bg-transparent outline-none text-[#003630] placeholder:text-gray-400"
                      style={{ fontSize: '16px' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <X size={16} className="text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              <AnimatePresence>
                {searchResults.length > 0 && !pendingMediumCandidate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative z-20 bg-white rounded-[12px] shadow-lg border border-gray-200 overflow-hidden mb-2"
                  >
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => addStudent(student)}
                        disabled={student.isGuardianLinkLocked || student.confidenceBand === 'low'}
                        className={`w-full p-3 text-left border-b border-gray-50 flex items-center justify-between group ${(student.isGuardianLinkLocked || student.confidenceBand === 'low') ? 'opacity-60 cursor-not-allowed bg-gray-50' : student.requiresSchoolReview ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#003630] text-sm truncate">{student.name}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                              {formatGradeAndClass(student.grade, student.class)}
                            </span>
                            {!!student.confidenceBand && (
                              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                student.confidenceBand === 'high' ? 'bg-emerald-50 text-emerald-700' :
                                student.confidenceBand === 'medium' ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {getMatchGuidance(student.confidenceBand)}
                              </span>
                            )}
                            {(student.parentName || student.otherParentName) && (
                              <span className="text-[10px] text-[#95e36c] font-black uppercase tracking-wider">
                                Guardian: {student.parentName || student.otherParentName}
                              </span>
                            )}
                            {getBlockingReason(student) && (
                              <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider leading-tight">
                                {getBlockingReason(student)?.title} {student.requiresSchoolReview ? 'You may choose the wrong child.' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold ml-2 flex-shrink-0 ${
                          (student.isGuardianLinkLocked || student.confidenceBand === 'low')
                            ? 'bg-gray-200 text-gray-500'
                            : student.requiresSchoolReview
                              ? 'bg-amber-100 text-amber-800'
                            : student.confidenceBand === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {(student.isGuardianLinkLocked || student.confidenceBand === 'low')
                            ? (getBlockingReason(student)?.actionLabel || 'Review')
                            : student.requiresSchoolReview
                              ? 'Request Review'
                            : student.confidenceBand === 'medium'
                              ? 'Confirm'
                              : 'Add'}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {searchQuery.length >= 3 && (
                  <motion.button
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    onClick={() => { haptics.light(); openManualAddForm(searchQuery); }}
                    className="w-full h-[56px] rounded-[12px] bg-[#f3f4f6] border border-[#6b7280] flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors overflow-hidden"
                  >
                    <Plus size={18} className="text-[#374151]" />
                    <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[16px] text-[#374151]">
                      Add Student Manually
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Students List Box */}
            <div className="relative min-h-[400px] rounded-[24px] border-[1px] border-[#e5e7eb] p-6 flex flex-col items-start justify-start">
              {students.length > 0 ? (
                <div className="w-full">
                  {students.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onEdit={() => startEditing(student)}
                      onRemove={() => removeStudent(student.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[350px]">
                  <p className="text-[14px] text-gray-400 font-medium text-center">
                    The Children that you add will
                    <br />
                    appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Manual Add Form */
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                key="add-student-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-[12px]">
                    <div className="size-12 rounded-[18px] bg-gradient-to-br from-[#003630]/10 to-[#003630]/5 border border-[#003630]/10 flex items-center justify-center">
                      <UserRoundPlus size={24} className="text-[#003630]" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.6px] leading-tight">
                        {editingId ? 'Update Detail' : 'Manual Entry'}
                      </h2>
                      <p className="text-[12px] text-gray-400 font-medium">Step 2: Pupil Information</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelAdd}
                    className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors border border-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Student Name */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] pl-1">Student Full Name</label>
                    <div className="relative group">
                      <User size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${focusedField === 'name' ? 'text-[#95e36c]' : 'text-[#003630]/30'}`} />
                      <input
                        type="text"
                        value={newStudent.name}
                        onFocus={() => { setFocusedField('name'); haptics.light(); }}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        placeholder="Full name as it appears on records"
                        className={inputClasses('name')}
                      />
                    </div>
                    {/* Smart Match Suggestions */}
                    {smartMatchResults.length > 0 && !editingId && (
                      <div className="mt-2 bg-amber-50 border-[1.5px] border-amber-200 rounded-[16px] p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-2 text-amber-700 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] px-1">
                          <Info size={16} />
                          <span>Did you mean someone from this list?</span>
                        </div>
                        <div className="space-y-2">
                          {smartMatchResults.slice(0, 3).map(match => (
                            <button
                              key={match.id}
                              disabled={match.isGuardianLinkLocked || match.confidenceBand === 'low'}
                              onClick={(e) => {
                                e.preventDefault();
                                haptics.light();
                                addStudent(match);
                                handleCloseForm();
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-[12px] border border-amber-100/50 transition-all text-left ${(match.isGuardianLinkLocked || match.confidenceBand === 'low') ? 'opacity-60 cursor-not-allowed bg-gray-50' : match.requiresSchoolReview ? 'bg-amber-100/50 hover:bg-amber-100 active:scale-[0.98]' : 'bg-white hover:bg-amber-100/30 active:scale-[0.98]'}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630] truncate">
                                  {match.name}
                                </div>
                                <div className="text-[11px] text-gray-500 font-medium flex flex-col gap-1 mt-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span>{formatGradeAndClass(match.grade, match.class)}</span>
                                    <div className="size-0.5 rounded-full bg-gray-300" />
                                    <span>{match.studentId}</span>
                                  </div>
                                  {!!match.confidenceBand && (
                                    <span className={`uppercase text-[9px] font-black tracking-wider ${
                                      match.confidenceBand === 'high' ? 'text-emerald-700' :
                                      match.confidenceBand === 'medium' ? 'text-amber-700' :
                                      'text-gray-600'
                                    }`}>
                                      {getMatchGuidance(match.confidenceBand)}
                                    </span>
                                  )}
                                  {(match.parentName || match.otherParentName) && (
                                    <span className="text-[#95e36c] uppercase text-[9px] font-black tracking-wider">
                                      Guardian: {match.parentName || match.otherParentName}
                                    </span>
                                  )}
                                  {getBlockingReason(match) && (
                                    <span className="text-amber-700 uppercase text-[9px] font-black tracking-wider leading-tight">
                                      {getBlockingReason(match)?.title} {match.requiresSchoolReview ? 'You may choose the wrong child.' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${
                                (match.isGuardianLinkLocked || match.confidenceBand === 'low')
                                  ? 'bg-gray-200 text-gray-500'
                                  : match.requiresSchoolReview
                                    ? 'bg-amber-100 text-amber-800'
                                  : match.confidenceBand === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {(match.isGuardianLinkLocked || match.confidenceBand === 'low')
                                  ? (getBlockingReason(match)?.actionLabel || 'Review')
                                  : match.requiresSchoolReview
                                    ? 'Request Review'
                                  : match.confidenceBand === 'medium'
                                    ? 'Confirm'
                                    : 'Add'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grade Selection */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] pl-1">Current Grade</label>
                    <div className="relative group">
                      <select
                        value={newStudent.grade}
                        onFocus={() => { setFocusedField('grade'); haptics.light(); }}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                        className={`${inputClasses('grade')} appearance-none pr-12 cursor-pointer`}
                        disabled={isLoadingMetadata}
                      >
                        {isLoadingMetadata ? (
                          <option value="">Loading grades...</option>
                        ) : availableGrades.length === 0 ? (
                          <option value="">⚠ No grades available</option>
                        ) : (
                          <>
                            <option value="">Select Grade</option>
                            {availableGrades.map(g => (
                              <option key={g.grade_id} value={g.grade_name}>{g.grade_name}</option>
                            ))}
                          </>
                        )}
                      </select>
                      <ChevronDown size={20} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${focusedField === 'grade' ? 'text-[#95e36c]' : 'text-gray-300'}`} />
                    </div>
                  </div>

                  {/* Class/Stream Selection - Larger dropdown for better usability */}
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] pl-1 flex items-center justify-between">
                      <span>Class / Stream</span>
                      {isLoadingClasses && <Loader2 size={12} className="animate-spin text-[#95e36c]" />}
                    </label>

                    <div className="relative group">
                      <select
                        value={newStudent.class}
                        onFocus={() => { setFocusedField('class'); haptics.light(); }}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                        className={`${inputClasses('class')} appearance-none pr-12 cursor-pointer`}
                        disabled={isLoadingClasses || !newStudent.grade}
                      >
                        {!newStudent.grade ? (
                          <option value="">Select grade first</option>
                        ) : isLoadingClasses ? (
                          <option value="">Fetching school streams...</option>
                        ) : availableClasses.length === 0 ? (
                          <>
                            <option value="">Select Class / Stream</option>
                            <option value="General">General (Single Stream)</option>
                          </>
                        ) : (
                          <>
                            <option value="">Select Class / Stream</option>
                            {availableClasses.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </>
                        )}
                      </select>
                      <ChevronDown size={20} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${focusedField === 'class' ? 'text-[#95e36c]' : 'text-gray-300'}`} />
                    </div>

                    {!newStudent.grade && (
                      <p className="text-[12px] text-gray-400 pl-1 italic">Select a grade above to load class streams.</p>
                    )}
                    {newStudent.grade && !isLoadingClasses && availableClasses.length === 0 && (
                      <p className="text-[12px] text-gray-500 pl-1">No specific classes found for this grade. Use <span className="font-bold">General</span>.</p>
                    )}
                  </div>

                  <button
                    onClick={handleSaveStudent}
                    className="w-full h-14 rounded-[20px] bg-[#003630] border border-[#003630] shadow-[0_8px_24px_rgba(0,54,48,0.25)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 group/btn mt-4"
                  >
                    <div className="size-8 rounded-full bg-[#95e36c]/20 flex items-center justify-center transition-all group-hover/btn:bg-[#95e36c]">
                      <Plus size={18} className="text-[#95e36c] group-hover/btn:text-[#003630]" strokeWidth={3} />
                    </div>
                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white font-bold">
                      {editingId ? 'Update Details' : 'Add to Application'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#f0f1f3] px-[28px] pt-[20px] pb-16 shadow-[0px_-8px_24px_rgba(0,0,0,0.04)] z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleComplete}
            disabled={isButtonDisabled}
            className={`
              w-full h-14 rounded-[18px] bg-[#003630] border border-[#003630] 
              transition-all flex items-center justify-center gap-3 group/btn 
              ${isButtonDisabled
                ? 'opacity-30 shadow-none grayscale pointer-events-none'
                : 'shadow-[0_8px_20px_rgba(0,54,48,0.2)] hover:shadow-[0px_12px_32px_rgba(0,54,48,0.3)] active:scale-[0.98]'
              }
            `}
          >
            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] font-bold text-white">
              Review Balances
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
