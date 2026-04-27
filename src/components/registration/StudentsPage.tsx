import { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, Loader2, Pencil, ChevronDown, User, Sparkles, UserRoundPlus, ChevronRight, Info, AlertTriangle, Check } from 'lucide-react';
import { type ParentData } from './ParentInformationPage';
import { type StudentData, getGradesBySchool, getClassesByGrade, type SchoolGrade } from '../../lib/supabase/api/registration';
import { haptics } from '../../utils/haptics';
import LogoHeader from '../common/LogoHeader';
import OnboardingProgressBar from './OnboardingProgressBar';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../stores/useAppStore';
import { toast } from 'sonner';

interface StudentsPageProps {
  parentData: ParentData;
  onComplete: (students: StudentData[]) => void;
  onBack: () => void;
  initialStudents?: StudentData[];
}

type GradeClassOption = {
  gradeId: string;
  gradeName: string;
  className: string;
  label: string;
};

const normalizeDuplicateText = (value?: string | null) =>
  (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const isClearDuplicateStudent = (
  candidate: StudentData,
  student: { name: string; grade: string; class: string }
) => {
  const sameName = normalizeDuplicateText(candidate.name) === normalizeDuplicateText(student.name);
  const sameGrade = normalizeDuplicateText(candidate.grade) === normalizeDuplicateText(student.grade);
  const sameClass = normalizeDuplicateText(candidate.class || 'General') === normalizeDuplicateText(student.class || 'General');
  return sameName && sameGrade && sameClass;
};



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
          Grade {student.grade.toString().replace(/^(grade\s+)/i, '')}{student.class && student.class !== 'General' ? ` ${student.class}` : ''}
        </p>
        {(student.parentName || student.otherParentName) && (
          <p className="text-[12px] text-[#003630] font-bold uppercase tracking-wider mt-1">
            Guardian: {student.parentName || student.otherParentName}
          </p>
        )}
      </div>

      {/* Instruction Box */}
      <div className="bg-[#f9fafb] rounded-[8px] p-3 border border-[#e5e7eb] mb-4">
        <p className="text-[11px] text-gray-600 leading-relaxed text-left">
          Make sure to confirm that the pupil's name and grade is correct. If any changes need to be made, please press the edit button below.
        </p>
      </div>

      {/* Edit Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="w-full h-[40px] rounded-[8px] bg-white border border-[#e5e7eb] flex items-center justify-center font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#000000] hover:bg-gray-50 transition-colors"
      >
        Edit
      </button>
    </motion.div>
  );
}

export default function StudentsPage({ parentData, onComplete, onBack, initialStudents }: StudentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentData[]>(initialStudents || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [availableGrades, setAvailableGrades] = useState<SchoolGrade[]>([]);
  const [gradeClassOptions, setGradeClassOptions] = useState<GradeClassOption[]>([]);
  const [gradeClassQuery, setGradeClassQuery] = useState('');
  const [showGradeOptions, setShowGradeOptions] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [pendingManualStudent, setPendingManualStudent] = useState<StudentData | null>(null);
  const [showSimilarStudentModal, setShowSimilarStudentModal] = useState(false);
  const [searchResults, setSearchResults] = useState<StudentData[]>([]);
  const [smartMatchResults, setSmartMatchResults] = useState<StudentData[]>([]);
  const [showSmartMatchModal, setShowSmartMatchModal] = useState(false);
  const [showSmartMatchResults, setShowSmartMatchResults] = useState(true);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const clearDuplicateMatches = pendingManualStudent
    ? smartMatchResults.filter(match => isClearDuplicateStudent(match, pendingManualStudent))
    : [];

  const openManualEntry = (prefillName: string = '') => {
    haptics.light();
    setEditingId(null);
    setNewStudent({
      name: prefillName.trim(),
      grade: '',
      class: 'General',
      studentId: ''
    });
    setGradeClassQuery('');
    setFormErrors({ name: '', grade: '', class: '', studentId: '' });
    setShowAddForm(true);
    window.history.pushState({ page: 'registration-form', subPage: 'add-student' }, '', '#registration-form');
  };

  const [newStudent, setNewStudent] = useState({
    name: '',
    grade: '',
    class: 'General',
    studentId: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    grade: '',
    class: '',
    studentId: '',
  });

  // Levenshtein distance for fuzzy student-name matching
  const getFuzzyDistance = (s1: string, s2: string) => {
    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    return track[s2.length][s1.length];
  };

  const calculateSimilarity = (s1: string, s2: string) => {
    const longer = s1.length > s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    return (longer.length - getFuzzyDistance(s1.toLowerCase(), s2.toLowerCase())) / longer.length;
  };
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
    async function loadData() {
      setIsLoadingMetadata(true);
      try {
        const grades = await getGradesBySchool(parentData.schoolId);
        setAvailableGrades(grades);
        const options = await Promise.all(
          grades.map(async (grade) => {
            const classes = await getClassesByGrade(parentData.schoolId, grade.grade_id);
            const classNames = classes.length > 0 ? classes : ['General'];
            return classNames.map((className) => ({
              gradeId: grade.grade_id,
              gradeName: grade.grade_name,
              className,
              label: className && className !== 'General'
                ? `${grade.grade_name} ${className}`
                : grade.grade_name,
            }));
          })
        );
        setGradeClassOptions(options.flat());
      } catch (error) {
        console.error("Failed to load school grades:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    }
    loadData();
  }, [parentData.schoolId]);
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          setIsSearchingStudents(true);
          const { searchStudentsByName } = await import('../../lib/supabase/api/registration');
          const results = await searchStudentsByName(searchQuery, parentData.schoolId, parentData.parentId, {
            includeGuardianLocked: true
          });
          if (!isCancelled) {
            setSearchResults(results);
          }

        } catch (error) {
          console.error("Search error:", error);
          if (!isCancelled) {
            setSearchResults([]);
          }
        } finally {
          if (!isCancelled) {
            setIsSearchingStudents(false);
          }
        }
      } else {
        if (!isCancelled) {
          setSearchResults([]);
          setIsSearchingStudents(false);
        }
      }
    }, 500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, parentData.schoolId, parentData.parentId]);

  const [collisionDetected, setCollisionDetected] = useState<boolean>(false);

  useEffect(() => {
    if (!showAddForm || editingId) return;
    const timer = setTimeout(async () => {
      if (newStudent.name.trim().length >= 3) {
        try {
          const { searchStudentsByName } = await import('../../lib/supabase/api/registration');
          const results = await searchStudentsByName(newStudent.name, parentData.schoolId, parentData.parentId, {
            includeGuardianLocked: true
          });

          // Filter out students already added to the local session list
          const relevantMatches = results.filter(r => !students.find(s => s.id === r.id));

          // Enhanced fuzzy sorting for matches
          const matchedWithScores = relevantMatches.map(m => ({
            ...m,
            score: calculateSimilarity(newStudent.name, m.name)
          })).sort((a, b) => b.score - a.score);

          setSmartMatchResults(matchedWithScores.filter(m => m.score > 0.4));

          // Check for exact name + class collision in the database
          const exactCollision = matchedWithScores.some(m =>
            m.score > 0.95 &&
            m.grade === newStudent.grade &&
            (newStudent.class === 'General' || m.class === newStudent.class)
          );
          setCollisionDetected(exactCollision);
        } catch (error) {
          setSmartMatchResults([]);
          setCollisionDetected(false);
        }
      } else {
        setSmartMatchResults([]);
        setCollisionDetected(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [newStudent.name, newStudent.grade, newStudent.class, parentData.schoolId, showAddForm, editingId, students]);


  const addStudent = (student: StudentData) => {
    console.log('[Registration] addStudent called:', student);
    haptics.selection();
    if (!students.find((s) => s.id === student.id)) {
      setStudents([...students, student]);
      setSearchQuery('');
      setSearchResults([]);
      console.log('[Registration] Student added to local state, search cleared');
    } else {
      console.log('[Registration] Student already in list, skipping');
    }
  };

  const buildGuardianReviewStudent = (match: StudentData): StudentData | null => {
    if (!pendingManualStudent) return null;

    const guardianConflict = Boolean(match.isGuardianLinkLocked);
    return {
      ...pendingManualStudent,
      id: `review-${Date.now()}`,
      studentId: 'School Review',
      guardianReviewStudentId: match.id,
      guardianReviewReason: guardianConflict ? 'two_guardians_full' : 'duplicate_suspected',
      guardianReviewEvidence: {
        duplicateStudentId: match.id,
        duplicateStudentName: match.name,
        duplicateStudentGrade: match.grade,
        duplicateStudentClass: match.class,
        requestedName: pendingManualStudent.name,
        requestedGrade: pendingManualStudent.grade,
        requestedClass: pendingManualStudent.class,
        existingGuardianNames: match.guardianNames || [match.parentName, match.otherParentName].filter(Boolean),
        guardianSlotsRemaining: match.guardianSlotsRemaining ?? null,
        isGuardianLinkLocked: guardianConflict,
        source: guardianConflict ? 'manual_student_two_guardians_modal' : 'manual_student_duplicate_modal'
      }
    };
  };

  const buildGuardianReviewFromSearch = (match: StudentData): StudentData => {
    const guardianConflict = Boolean(match.isGuardianLinkLocked);
    return {
      id: `review-${Date.now()}`,
      name: match.name,
      grade: match.grade,
      class: match.class,
      studentId: 'School Review',
      guardianReviewStudentId: match.id,
      guardianReviewReason: guardianConflict ? 'two_guardians_full' : 'duplicate_suspected',
      guardianReviewEvidence: {
        duplicateStudentId: match.id,
        duplicateStudentName: match.name,
        duplicateStudentGrade: match.grade,
        duplicateStudentClass: match.class,
        requestedName: match.name,
        requestedGrade: match.grade,
        requestedClass: match.class,
        existingGuardianNames: match.guardianNames || [match.parentName, match.otherParentName].filter(Boolean),
        guardianSlotsRemaining: match.guardianSlotsRemaining ?? null,
        isGuardianLinkLocked: guardianConflict,
        source: guardianConflict ? 'search_result_two_guardians' : 'search_result_duplicate_review'
      }
    };
  };

  const handleSelectSearchResult = (student: StudentData) => {
    if (student.isGuardianLinkLocked) {
      addStudent(buildGuardianReviewFromSearch(student));
      import('sonner').then(({ toast }) => toast.success('Guardian conflict sent for review', {
        description: 'This student already has two guardians linked. The school will review your request before any access is granted.'
      }));
      return;
    }

    addStudent(student);
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
    setGradeClassQuery(student.class && student.class !== 'General' ? `${student.grade} ${student.class}` : student.grade);
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

    // Check for local duplicates (same name, grade, class in the list already)
    const isLocalDuplicate = students.some(s =>
      s.id !== editingId &&
      s.name.trim().toLowerCase() === newStudent.name.trim().toLowerCase() &&
      s.grade === newStudent.grade &&
      s.class === newStudent.class
    );

    if (isLocalDuplicate) {
      errors.name = 'Duplicate student in your list';
      isValid = false;
      toast.error('You have already added this student to your application.');
    }

    setFormErrors(errors);
    return isValid;
  };

  const saveManualStudent = (allowSimilar: boolean = false) => {
    haptics.buttonPress();
    if (validateNewStudent()) {
      // If we have high similarity matches and it's a new entry, 
      // trigger the smart match modal to prevent accidental duplicates
      const hasHighMatch = smartMatchResults.some(m => m.score > 0.75);

      if (!editingId && hasHighMatch && !showSmartMatchModal) {
        setShowSmartMatchModal(true);
        return;
      }

      if (editingId) {
        setStudents(students.map(s => s.id === editingId ? {
          ...s,
          name: newStudent.name,
          grade: newStudent.grade,
          class: newStudent.class,
        } : s));
        toast.success('Record updated successfully');
      } else {
        const studentToAdd: StudentData = {
          id: `new-${Date.now()}`,
          name: newStudent.name,
          grade: newStudent.grade,
          class: newStudent.class,
          studentId: 'New Registration',
        };
        const clearMatches = smartMatchResults.filter(match => isClearDuplicateStudent(match, studentToAdd));
        if (!allowSimilar && clearMatches.length > 0) {
          setPendingManualStudent(studentToAdd);
          setShowSimilarStudentModal(true);
          return;
        }
        addStudent(studentToAdd);
        toast.success('New record added to application');
      }
      handleCloseForm();
      setShowSmartMatchModal(false);
    }
  };
  const handleSaveStudent = () => saveManualStudent(false);

  const handleUseExistingMatch = (student: StudentData) => {
    if (student.isGuardianLinkLocked) {
      const reviewStudent = buildGuardianReviewStudent(student);
      if (!reviewStudent) return;
      addStudent(reviewStudent);
      setPendingManualStudent(null);
      setShowSimilarStudentModal(false);
      handleCloseForm();
      import('sonner').then(({ toast }) => toast.success('School review requested', {
        description: 'This student already has two guardians linked. The school will review the request before access is granted.'
      }));
      return;
    }
    addStudent(student);
    setPendingManualStudent(null);
    setShowSimilarStudentModal(false);
    handleCloseForm();
    import('sonner').then(({ toast }) => toast.success('Existing pupil record added'));
  };

  const handleCreateNewDespiteSimilar = () => {
    if (!pendingManualStudent) return;
    const clearMatches = smartMatchResults.filter(match => isClearDuplicateStudent(match, pendingManualStudent));
    if (clearMatches.length > 0) {
      import('sonner').then(({ toast }) => toast.warning('Duplicate student not added', {
        description: 'This looks like an existing student. Please choose the existing record or ask the school to review it.'
      }));
      return;
    }

    addStudent(pendingManualStudent);
    setPendingManualStudent(null);
    setShowSimilarStudentModal(false);
    handleCloseForm();
    import('sonner').then(({ toast }) => toast.warning('Possible duplicate student added', {
      description: 'This new student looks similar to an existing record. The school will review it before payments are unlocked.'
    }));
  };

  const handleRequestSchoolReview = () => {
    if (!pendingManualStudent) return;
    const match = clearDuplicateMatches[0];
    if (!match) return;

    const reviewStudent = buildGuardianReviewStudent(match);
    if (!reviewStudent) return;

    addStudent(reviewStudent);
    setPendingManualStudent(null);
    setShowSimilarStudentModal(false);
    handleCloseForm();
    import('sonner').then(({ toast }) => toast.success('Requested school verification', {
      description: match.isGuardianLinkLocked
        ? 'The matching student already has two guardians linked. The school will review the conflict before any access is granted.'
        : 'This duplicate-looking student was not created. The school will review whether it is a different child.'
    }));
  };

  const handleCloseForm = () => {
    setNewStudent({ name: '', grade: '', class: '', studentId: '' });
    setGradeClassQuery('');
    setShowGradeOptions(false);
    setPendingManualStudent(null);
    setShowSimilarStudentModal(false);
    setFormErrors({ name: '', grade: '', class: '', studentId: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

  const selectGradeClassOption = (option: GradeClassOption) => {
    haptics.light();
    setNewStudent(prev => ({
      ...prev,
      grade: option.gradeName,
      class: option.className,
    }));
    setGradeClassQuery(option.label);
    setShowGradeOptions(false);
    setFormErrors(prev => ({ ...prev, grade: '', class: '' }));
  };

  const filteredGradeClassOptions = gradeClassOptions.filter(option =>
    option.label.toLowerCase().includes(gradeClassQuery.trim().toLowerCase())
  );

  const handleCancelAdd = () => {
    haptics.light();
    setEditingId(null);
    if (showAddForm) {
      window.history.back(); // This will trigger our popstate interceptor to close the form
    }
  };

  const handleComplete = () => {
    haptics.heavy();
    if (students.length === 0) {
      toast.error('Add at least one child to continue');
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
        ? 'ring-4 ring-gray-100 border-[1.5px] border-[#003630] shadow-lg'
        : 'border-[1.5px] border-white shadow-sm hover:border-[#d1d5db]'
    }
    text-[16px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] placeholder:text-gray-300 focus:outline-none text-center
  `;

  const isButtonDisabled = students.length === 0 || showAddForm;

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader>
        <OnboardingProgressBar currentStep={2} totalSteps={3} className="py-0" />
      </LogoHeader>

      {/* ── Smart Match Confirmation Modal ── */}
      <AnimatePresence>
        {showSmartMatchModal && smartMatchResults.length > 0 && (
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
              <div className="bg-amber-50 border-b border-amber-100 px-6 pt-6 pb-5 flex items-start gap-4 rounded-t-[12px]">
                <div className="size-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-[#003630] tracking-[-0.3px] leading-tight">
                    Potential Duplicate Found
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                    We found students with very similar details in our records. Please review carefully to avoid duplicates.
                  </p>
                </div>
              </div>

              <div className="px-5 py-6 max-h-[40vh] overflow-y-auto no-scrollbar space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Matching Records</p>
                {smartMatchResults.slice(0, 3).map(match => (
                  <button
                    key={match.id}
                    onClick={() => {
                      haptics.light();
                      addStudent(match);
                      handleCloseForm();
                      setShowSmartMatchModal(false);
                    }}
                    className="w-full bg-gray-50 flex items-center justify-between p-4 rounded-[16px] border border-gray-100 active:scale-[0.98] transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630] truncate">
                        {match.name}
                      </div>
                      <div className="text-[12px] text-gray-400">
                        Grade {match.grade} {match.class}
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-[#003630] text-white text-[12px] font-bold">
                      Add This Student
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-6 pb-10 pt-2 space-y-3">
                <button
                  onClick={() => {
                    const studentToAdd: StudentData = {
                      id: `new-${Date.now()}`,
                      name: newStudent.name,
                      grade: newStudent.grade,
                      class: newStudent.class,
                      studentId: 'New Registration',
                    };
                    setStudents([...students, studentToAdd]);
                    toast.success('Successfully added as new record');
                    handleCloseForm();
                    setShowSmartMatchModal(false);
                  }}
                  className="w-full h-14 rounded-[16px] bg-[#003630] text-white font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] flex items-center justify-center active:scale-[0.98] transition-all shadow-md"
                >
                  Continue anyway
                </button>

                <button
                  onClick={() => setShowSmartMatchModal(false)}
                  className="w-full h-14 rounded-[16px]  text-gray-600 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] flex items-center justify-center active:scale-[0.98] transition-all"
                >
                  No, Go Back & Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 px-6 pt-8 pb-32 max-w-lg mx-auto w-full transition-opacity duration-300 ${showSmartMatchModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-smart-h1 text-[#003630] tracking-[-0.8px] mb-2 leading-tight">
            Add Pupils to your Account
          </h1>
          <div className="text-smart-body text-gray-500 tracking-[-0.2px] leading-relaxed">
            <p>Add your child(ren) to your account.</p>
            <p className="mt-1 text-gray-400">
              If you cannot find your child, please add them manually by entering their details.
            </p>
          </div>
        </motion.div>



        {/* Actions Section */}
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
                    relative bg-white rounded-[16px] overflow-hidden
                    transition-all duration-300
                    ${focusedField === 'search'
                      ? 'ring-4 ring-[#95e36c]/20 border-[1.5px] border-[#95e36c] shadow-lg'
                      : 'border-[1.5px] border-[#e5e7eb] shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center px-4 h-[56px]">
                    <Search
                      className={`
                        flex-shrink-0 transition-colors duration-300
                        ${focusedField === 'search' ? 'text-[#95e36c]' : 'text-[#003630]/40'}
                      `}
                      size={20}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => { setFocusedField('search'); haptics.light(); }}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for your Child"
                      className="flex-1 px-3 bg-transparent outline-none border-none focus:outline-none focus:ring-0 text-[#003630] placeholder:text-[#003630]/40"
                      style={{ fontSize: '16px', outline: 'none', border: 'none', boxShadow: 'none' }}
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
                {(isSearchingStudents || searchResults.length > 0 || (searchQuery.trim().length >= 2 && !isSearchingStudents)) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative z-20 bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden mb-4 mt-2"
                  >
                    <div className="p-2 space-y-1">
                      {isSearchingStudents ? (
                        <div className="flex items-center justify-center gap-3 px-4 py-6 text-[#003630]/60">
                          <Loader2 size={18} className="animate-spin" />
                          <span className="text-[12px] font-bold uppercase tracking-widest">Searching student records...</span>
                        </div>
                      ) : searchResults.length > 0 ? searchResults.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleSelectSearchResult(student)}
                          className="w-full p-4 text-left rounded-[18px] hover:bg-gray-50 flex items-center justify-between group transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630] truncate mb-0.5">{student.name}</p>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest font-black">
                                  Grade {student.grade.toString().replace(/^(grade\s+)/i, '')}{student.class && student.class !== 'General' ? ` ${student.class}` : ''}
                                </span>
                                {student.studentId && student.studentId !== 'Pending' && (
                                  <>
                                    <div className="size-1 rounded-full bg-gray-200" />
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                      ID: {student.studentId}
                                    </span>
                                  </>
                                )}
                              </div>
                              {(student.parentName || student.otherParentName) && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <User size={10} className="text-[#003630]/30" />
                                  <span className="text-[10px] text-[#003630]/60 font-bold uppercase tracking-[1px]">
                                    {student.isGuardianLinkLocked && student.guardianNames && student.guardianNames.length > 0
                                      ? student.guardianNames.join(' and ')
                                      : student.parentName || student.otherParentName}
                                  </span>
                                </div>
                              )}
                              {student.isGuardianLinkLocked && (
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1">
                                  <AlertTriangle size={10} className="text-amber-700" />
                                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                                    Two guardians are already linked to this student.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#003630] group-hover:text-white transition-all ml-3 shrink-0">
                            {student.isGuardianLinkLocked ? <AlertTriangle size={18} /> : <Plus size={18} />}
                          </div>
                        </button>
                      )) : (
                        <div className="px-4 py-5 text-center">
                          <p className="text-[12px] font-bold text-[#003630]">No student matches found</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Try another spelling or add the pupil manually so the school can review it.
                          </p>
                          <p className="text-[10px] text-amber-700/80 mt-3 font-bold uppercase tracking-wider">
                            Some students with two guardians are hidden from direct linking
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openManualEntry(searchQuery)}
                className="w-full h-[60px] rounded-[16px] bg-[#f9fafb] border-[1.5px] border-dashed border-[#d1d5db] flex items-center justify-center gap-2 hover:border-[#003630] transition-colors group mt-4 shadow-sm"
              >
                <Plus size={18} className="text-gray-400 group-hover:text-[#003630] transition-colors" />
                <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[16px] text-gray-400 group-hover:text-[#003630] transition-colors">
                  Add Pupil Manually
                </span>
              </motion.button>
            </div>

            {/* Students List Box */}
            <div className={`relative min-h-[400px] rounded-[24px] border-[1px] border-[#e5e7eb] p-6 flex flex-col ${students.length === 0 ? 'items-center justify-center' : 'items-start justify-start'}`}>
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
                    {/* Identical student collision warning */}
                    {collisionDetected && !editingId && (
                      <div className="mt-2 bg-red-50 border-[1.5px] border-red-200 rounded-[16px] p-4 shadow-md animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-3 text-red-700">
                          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-1">
                            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] leading-tight">
                              Student already exists in this Class
                            </p>
                            <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[12px] leading-relaxed opacity-90">
                              A record for <strong>{newStudent.name}</strong> was found in <strong>Grade {newStudent.grade.toString().replace(/^(grade\s+)/i, '')} {newStudent.class}</strong>.
                              Please use the "Did you mean..." list below or continue to add anyway.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {smartMatchResults.length > 0 && !editingId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 bg-[#fdfaf2] border-[1.5px] border-[#fdecd5] rounded-[20px] p-4 shadow-sm"
                      >
                        <button
                          onClick={() => setShowSmartMatchResults(!showSmartMatchResults)}
                          className="w-full flex items-center justify-between mb-4 px-1 cursor-pointer group/title"
                        >
                          <span className="text-gray-500 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] group-hover/title:text-[#003630] transition-colors">
                            Did you mean someone from this list?
                          </span>
                          <motion.div
                            animate={{ rotate: showSmartMatchResults ? 0 : 180 }}
                            className="text-[#003630] transition-transform duration-300"
                          >
                            <ChevronDown size={20} />
                          </motion.div>
                        </button>

                        <AnimatePresence initial={false}>
                          {showSmartMatchResults && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pb-2">
                                {smartMatchResults.slice(0, 3).map(match => (
                                  <button
                                    key={match.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      haptics.light();
                                      addStudent(match);
                                      handleCloseForm();
                                    }}
                                    className="w-full bg-white flex items-center justify-between p-5 rounded-[22px] border border-gray-100 hover:border-[#95e36c] hover:shadow-lg active:scale-[0.98] transition-all text-left group"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630] truncate mb-0.5 group-hover:text-[#95e36c]/80 transition-colors">
                                        {match.name}
                                      </div>
                                      <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest font-black">
                                            Grade {match.grade.toString().replace(/^(grade\s+)/i, '')}{match.class && match.class !== 'General' ? ` ${match.class}` : ''}
                                          </span>
                                          {match.studentId && match.studentId !== 'Pending' && (
                                            <>
                                              <div className="size-1 rounded-full bg-gray-200" />
                                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[1.5px]">
                                                ID: {match.studentId}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        {(match.parentName || match.otherParentName) && (
                                          <div className="flex items-center gap-1.5 opacity-60">
                                            <User size={10} className="text-[#003630]" />
                                            <span className="text-[10px] text-[#003630] font-bold uppercase tracking-[1px]">
                                              {match.parentName || match.otherParentName}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="px-5 py-2.5 rounded-full bg-[#003630] text-white text-[12px] font-black uppercase tracking-[1px] shadow-md group-hover:bg-[#95e36c] group-hover:text-[#003630] transition-all ml-4 shrink-0">
                                      ADD
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="mt-4 pt-3 border-t border-[#fdecd5] text-center">
                          <p className="text-[11px] text-gray-500 font-medium">
                            Wrong spelling? Review the list carefully to avoid duplicates.
                          </p>
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* Grade & Class Grid */}
                    <div className="space-y-6">
                      <div className="space-y-2.5">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] pl-1">Current Grade & Class</label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={gradeClassQuery}
                          onFocus={() => {
                            setFocusedField('grade');
                            setShowGradeOptions(true);
                            haptics.light();
                          }}
                          onBlur={() => {
                            setFocusedField(null);
                            window.setTimeout(() => setShowGradeOptions(false), 160);
                          }}
                          onChange={(e) => {
                            setGradeClassQuery(e.target.value);
                            setShowGradeOptions(true);
                            if (!e.target.value.trim()) {
                              setNewStudent(prev => ({ ...prev, grade: '', class: 'General' }));
                            }
                          }}
                          placeholder={isLoadingMetadata ? 'Loading grades...' : 'Search grade or class, e.g. Grade 7A'}
                          className={`${inputClasses('grade')} pr-12`}
                          disabled={isLoadingMetadata}
                        />
                        <ChevronDown size={20} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${focusedField === 'grade' ? 'text-[#95e36c]' : 'text-gray-300'}`} />
                        <AnimatePresence>
                          {showGradeOptions && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="absolute left-0 right-0 top-[68px] z-30 max-h-[260px] overflow-y-auto rounded-[16px] border border-gray-200 bg-white shadow-xl"
                            >
                              {isLoadingMetadata ? (
                                <div className="p-4 text-center text-[12px] font-bold text-gray-400">Loading grades...</div>
                              ) : filteredGradeClassOptions.length === 0 ? (
                                <div className="p-4 text-center text-[12px] font-bold text-gray-400">No matching grade or class</div>
                              ) : (
                                filteredGradeClassOptions.map(option => (
                                  <button
                                    key={`${option.gradeId}-${option.className}`}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectGradeClassOption(option)}
                                    className="w-full px-4 py-3 text-left border-b border-gray-50 hover:bg-[#f9fafb] active:bg-[#95e36c]/10 transition-colors"
                                  >
                                    <span className="block font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630]">
                                      {option.label}
                                    </span>
                                  </button>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {formErrors.grade && (
                        <p className="text-[11px] font-bold text-red-500 pl-1">Please select the grade and class.</p>
                      )}
                    </div>

                    {/* Class/Stream is now auto-filled in background */}
                  </div>

                  <button
                    onClick={handleSaveStudent}
                    className="w-full h-14 rounded-[16px] bg-[#003630] border border-[#003630] shadow-[0_8px_24px_rgba(0,54,48,0.25)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 group/btn mt-4"
                  >
                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white font-bold">
                      {editingId ? 'Update Student' : 'Add Student'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showSimilarStudentModal && (
          <>
          {(() => {
            const highlightedMatch = clearDuplicateMatches[0];
            const hasGuardianConflict = Boolean(highlightedMatch?.isGuardianLinkLocked);
            const guardianNames = highlightedMatch?.guardianNames || [highlightedMatch?.parentName, highlightedMatch?.otherParentName].filter(Boolean);
            return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 sm:py-8"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md max-h-[calc(100dvh-48px)] bg-white rounded-[24px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-amber-100 bg-amber-50 shrink-0">
                <div className="size-11 rounded-[14px] bg-amber-100 flex items-center justify-center mb-3">
                  <Info size={22} className="text-amber-700" />
                </div>
                <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#003630] tracking-[-0.4px]">
                  {hasGuardianConflict ? 'Guardian conflict found' : 'Duplicate student found'}
                </h3>
                <p className="text-[13px] text-amber-800/80 leading-relaxed mt-1">
                  {hasGuardianConflict
                    ? 'This name, grade, and class match an existing student who already has two guardians linked. You can request school review so the school can verify whether this request should replace or add a guardian.'
                    : 'This name, grade, and class already match an existing record. Please use the existing pupil record or ask the school to review it.'}
                </p>
                {hasGuardianConflict && guardianNames.length > 0 && (
                  <div className="mt-3 rounded-[14px] border border-amber-200 bg-white/70 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Existing guardians</p>
                    <p className="text-[12px] text-[#003630] font-bold mt-1 leading-relaxed">
                      {guardianNames.join(' and ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-3 overflow-y-auto">
                {clearDuplicateMatches.slice(0, 3).map(match => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => handleUseExistingMatch(match)}
                    className="w-full p-4 rounded-[16px] border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#95e36c] transition-all text-left flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630] truncate">
                        {match.name}
                      </p>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                        {match.grade}{match.class && match.class !== 'General' ? ` ${match.class}` : ''} {match.studentId ? `- ${match.studentId}` : ''}
                      </p>
                      {match.guardianNames && match.guardianNames.length > 0 && (
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                          Guardians: {match.guardianNames.join(' and ')}
                        </p>
                      )}
                    </div>
                    <span className={`text-[11px] font-black rounded-full px-3 py-1 whitespace-nowrap ${
                      match.isGuardianLinkLocked ? 'text-amber-800 bg-amber-100' : 'text-[#003630] bg-[#95e36c]/30'
                    }`}>
                      {match.isGuardianLinkLocked ? 'School review needed' : 'This is my child'}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setShowSimilarStudentModal(false);
                    setPendingManualStudent(null);
                  }}
                  className="w-full min-h-12 rounded-[14px] bg-[#003630] text-white font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] px-4 active:scale-[0.98] transition-all"
                >
                  Go back and edit details
                </button>
                <button
                  type="button"
                  onClick={handleRequestSchoolReview}
                  className="w-full min-h-11 rounded-[14px] bg-white text-gray-500 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] px-4"
                >
                  {hasGuardianConflict ? 'Request guardian conflict review' : 'Request school verification'}
                </button>
              </div>
            </motion.div>
          </motion.div>
            );
          })()}
          </>
        )}
      </AnimatePresence>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#f0f1f3] px-[28px] py-8 shadow-[0px_-10px_30px_rgba(0,0,0,0.04)] z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleComplete}
            disabled={isButtonDisabled}
            className={`
              w-full h-14 rounded-[12px] bg-[#003630] border border-[#003630] 
              transition-all flex items-center justify-center gap-3 group/btn 
              ${isButtonDisabled
                ? 'opacity-30 shadow-none grayscale pointer-events-none'
                : 'shadow-[0_8px_20px_rgba(0,54,48,0.2)] hover:shadow-[0px_12px_32px_rgba(0,54,48,0.3)] active:scale-[0.98]'
              }
            `}
          >
            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] font-bold text-white tracking-[0.5px] -translate-y-[1px]">
              PROCEED TO REVIEW
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
