import React, { useState, useEffect, useRef } from 'react';
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
  onBack: (students: StudentData[]) => void;
  initialStudents?: StudentData[];
  onStudentsChange?: (students: StudentData[]) => void;
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





// StudentCard
function StudentCard({ student, onEdit, onRemove }: { student: StudentData; onEdit: () => void; onRemove: () => void }) {
  const gradeLabel = student.grade.toLowerCase().includes('grade') ? student.grade : `Grade ${student.grade}`;

  return (
    <div className="w-full h-[54px] pl-5 pr-4 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] rounded-lg flex items-center justify-between mb-2.5">
      <div className="flex flex-col justify-center min-w-0">
        <div className="text-black text-[12px] font-bold font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-none truncate">
          {student.name}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-[#808080] text-[8px] font-medium font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
            {gradeLabel}{student.class && student.class !== 'General' ? ` ${student.class}` : ''}
          </div>
          {student.studentId && student.studentId !== 'New Registration' && (
            <div className="text-[#808080] text-[8px] font-normal font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
              {student.studentId}
            </div>
          )}
        </div>
        <div className="text-[#808080] text-[8px] font-normal font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] uppercase mt-1">
          {student.schoolName || 'STUDENT RECORD'}
        </div>
      </div>

      <div className="flex items-center gap-8 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            height: '26px',
            paddingLeft: '24px',
            paddingRight: '24px',
            backgroundColor: '#F0F2F5',
            borderRadius: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'black',
            fontSize: '10px',
            fontFamily: "'IBM Plex Sans Devanagari:Bold', sans-serif",
            fontWeight: '700',
            border: 'none',
            outline: 'none',
            cursor: 'pointer'
          }}
          className="active:scale-95 transition-transform"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="active:scale-90 transition-transform"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.6665 7.33334V11.3333" stroke="#AEAEAE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.3335 7.33334V11.3333" stroke="#AEAEAE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.6668 4V13.3333C12.6668 13.687 12.5264 14.0261 12.2763 14.2761C12.0263 14.5262 11.6871 14.6667 11.3335 14.6667H4.66683C4.31321 14.6667 3.97407 14.5262 3.72402 14.2761C3.47397 14.0261 3.3335 13.687 3.3335 13.3333V4" stroke="#AEAEAE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 4H14" stroke="#AEAEAE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.3335 4.00001V2.66668C5.3335 2.31305 5.47397 1.97392 5.72402 1.72387C5.97407 1.47382 6.31321 1.33334 6.66683 1.33334H9.3335C9.68712 1.33334 10.0263 1.47382 10.2763 1.72387C10.5264 1.97392 10.6668 2.31305 10.6668 2.66668V4.00001" stroke="#AEAEAE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function StudentsPage({ parentData, onComplete, onBack, initialStudents, onStudentsChange }: StudentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentData[]>(initialStudents || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
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

  // Sync students back to parent state whenever they change
  useEffect(() => {
    onStudentsChange?.(students);
  }, [students, onStudentsChange]);

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
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length >= 2) {
        try {
          setIsSearchingStudents(true);
          const { searchStudentsByName } = await import('../../lib/supabase/api/registration');

          // Fetch raw results from database (usually substring or ILIKE)
          const results = await searchStudentsByName(trimmedQuery, parentData.schoolId, parentData.parentId, {
            includeGuardianLocked: true
          });

          if (!isCancelled) {
            // Apply advanced frontend fuzzy matching & sorting
            const scoredResults = results.map(student => {
              const q = trimmedQuery.toLowerCase();
              const n = student.name.toLowerCase();

              let score = 0;
              if (n === q) score = 1.0; // Perfect match
              else if (n.startsWith(q)) score = 0.9; // Prefix match
              else if (n.includes(q)) score = 0.8; // Substring match
              else {
                // Typo-tolerant fuzzy score
                const sim = calculateSimilarity(q, n);
                score = sim * 0.7; // Lower priority for fuzzy
              }

              return { ...student, _searchScore: score };
            });

            // Filter out very low quality matches and sort by score
            const finalResults = scoredResults
              .filter(s => (s._searchScore || 0) > 0.4)
              .sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));

            setSearchResults(finalResults);
          }

        } catch (error) {
          console.error("Search error:", error);
          if (!isCancelled) setSearchResults([]);
        } finally {
          if (!isCancelled) setIsSearchingStudents(false);
        }
      } else {
        if (!isCancelled) {
          setSearchResults([]);
          setIsSearchingStudents(false);
        }
      }
    }, 400); // Faster debounce for better "bullet proof" feel

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

  const handleOpenSearchOverlay = () => {
    haptics.light();
    setShowSearchOverlay(true);
  };

  const handleCloseSearchOverlay = () => {
    haptics.light();
    setShowSearchOverlay(false);
    setSearchQuery('');
    setSearchResults([]);
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
    <div className={`bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] ${showSearchOverlay ? 'overflow-hidden' : ''}`}>
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
        {/* Header - Matching Services Page style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="bg-[#f9fafb] rounded-[22px] p-[16px] shadow-inner flex flex-col gap-2 border border-gray-100/50">
            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] font-bold leading-tight not-italic text-[20px] text-[#003630] tracking-[-0.18px] flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Add Pupils to your account
            </p>
            <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-relaxed not-italic text-[#6b7280] text-[10px] tracking-[-0.12px]">
              Add your child(ren) to your account.
              If you cannot find your child, please add them manually by entering their details.
            </p>
          </div>
        </motion.div>



        {/* Actions Section */}
        {!showAddForm && (
          <div className="space-y-6">
            <div
              className="w-full shrink-0 relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-100 overflow-hidden flex flex-col min-h-[300px]"
            >
              <div className="flex-1 w-full overflow-y-auto px-6 pt-6 pb-6 no-scrollbar">
                {students.length > 0 ? (
                  <div className="space-y-1">
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
                  <div className="flex flex-col items-center justify-center h-full text-center px-3 py-20">
                    <p className="text-neutral-600 text-[12px] font-normal font-['Space_Grotesk'] leading-relaxed max-w-[220px]">
                      Press the button below to start adding your children.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Overlay */}
        <AnimatePresence>
          {showSearchOverlay && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[100] flex flex-col bg-white"
            >
              <LogoHeader>
                <OnboardingProgressBar currentStep={2} totalSteps={3} className="py-0" />
              </LogoHeader>

              {/* Overlay Header */}
              <div className="w-full h-[50px] px-6 flex items-center justify-between border-b border-[#F6F7F9]">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_add_student)">
                      <path d="M8.00016 14.6667C11.6821 14.6667 14.6668 11.6819 14.6668 8.00001C14.6668 4.31811 11.6821 1.33334 8.00016 1.33334C4.31826 1.33334 1.3335 4.31811 1.3335 8.00001C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.3335 8H10.6668" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 5.33334V10.6667" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_add_student">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="text-black text-[14px] font-bold font-['Inter'] tracking-tight">Add Students</span>
                </div>
                <button
                  onClick={handleCloseSearchOverlay}
                  className="size-10 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] active:scale-90 transition-transform overflow-hidden"
                >
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="scale-75">
                    <path d="M15 19L18 16M18 16L21 13M18 16L15 13M18 16L21 19" stroke="#505050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 pb-12 no-scrollbar bg-white"
                style={{ paddingTop: '20px' }}
              >
                <div className="max-w-lg mx-auto">
                  <div className="bg-white rounded-2xl shadow-[0px_4px_4px_rgba(0,0,0,0.25)] border border-[#E6E6E6] p-4 flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                      {/* Search Input Container */}
                      <div className="w-full h-14 px-3 bg-white rounded-xl border-2 border-[#C1C9D7] flex items-center gap-4">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.58317 17.5C13.9554 17.5 17.4998 13.9556 17.4998 9.58332C17.4998 5.21107 13.9554 1.66666 9.58317 1.66666C5.21092 1.66666 1.6665 5.21107 1.6665 9.58332C1.6665 13.9556 5.21092 17.5 9.58317 17.5Z" stroke="#B9BEC6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.3332 18.3333L16.6665 16.6667" stroke="#B9BEC6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <input
                          type="text"
                          autoFocus
                          value={searchQuery}
                          onFocus={() => { setFocusedField('search-overlay'); haptics.light(); }}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for your Child"
                          className="flex-1 bg-transparent border-none text-black placeholder:text-[#B9BEC6] text-xs font-normal font-['IBM_Plex_Sans_Devanagari'] focus:outline-none focus:ring-0"
                          style={{ outline: 'none', boxShadow: 'none' }}
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="p-1">
                            <X size={14} className="text-[#B9BEC6]" />
                          </button>
                        )}
                      </div>

                      {/* Search Results Area */}
                      <AnimatePresence>
                        {(isSearchingStudents || searchResults.length > 0) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 py-2">
                              {isSearchingStudents ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 size={16} className="animate-spin text-[#003630]" />
                                </div>
                              ) : (
                                searchResults.map((student) => {
                                  const isAlreadyAdded = students.some(s => s.id === student.id);
                                  return (
                                    <button
                                      key={student.id}
                                      disabled={isAlreadyAdded}
                                      onClick={() => {
                                        handleSelectSearchResult(student);
                                        if (!student.isGuardianLinkLocked) handleCloseSearchOverlay();
                                      }}
                                      className={`w-full p-3 text-left rounded-lg border border-[#F0F2F5] flex items-center justify-between group transition-all ${isAlreadyAdded ? 'opacity-50' : 'hover:bg-gray-50'}`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[14px] text-black truncate">{student.name}</p>
                                        <p className="text-[10px] text-gray-400">Grade {student.grade.toString().replace(/^(grade\s+)/i, '')}{student.class && student.class !== 'General' ? ` • ${student.class}` : ''}</p>
                                      </div>
                                      <div className={`size-8 rounded-lg flex items-center justify-center ${isAlreadyAdded ? 'bg-gray-100 text-gray-300' : 'bg-[#003630] text-white'}`}>
                                        {isAlreadyAdded ? <Check size={14} /> : <Plus size={14} />}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Info Section & Manual Add Button - Only show if search failed to find results */}
                      {searchQuery.length >= 2 && !isSearchingStudents && searchResults.length === 0 && (
                        <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="p-3 flex flex-col items-center gap-2.5">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.99984 18.3333C14.6022 18.3333 18.3332 14.6024 18.3332 9.99999C18.3332 5.39762 14.6022 1.66666 9.99984 1.66666C5.39746 1.66666 1.6665 5.39762 1.6665 9.99999C1.6665 14.6024 5.39746 18.3333 9.99984 18.3333Z" stroke="#A39F9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M10 13.3333V9.99999M10 6.66666H10.0083" stroke="#A39F9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="text-center text-black text-xs font-normal font-['Inter'] leading-tight">
                              Can’t Find your Child?<br />Add them manually by pressing the button below.
                            </div>
                          </div>

                          {/* Manual Add Button */}
                          <button
                            onClick={() => {
                              handleCloseSearchOverlay();
                              openManualEntry(searchQuery);
                            }}
                            className="w-full h-14 px-3 rounded-lg border border-[#2D2D2D] flex items-center justify-center active:scale-[0.98] transition-all"
                          >
                            <span className="text-[#2D2D2D] text-xs font-medium font-['Space_Grotesk']">+ Manually Add Student Record</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Entry Form Overlay */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="manual-entry-overlay"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[110] flex flex-col bg-white"
            >
              <LogoHeader>
                <OnboardingProgressBar currentStep={2} totalSteps={3} className="py-0" />
              </LogoHeader>

              {/* Overlay Header */}
              <div className="w-full h-[72px] px-6 flex items-center justify-between border-b border-[#F6F7F9]">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[12px] bg-[#f0fdf4] flex items-center justify-center">
                    <UserRoundPlus size={20} className="text-[#003630]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-black text-[15px] font-bold font-['Inter'] tracking-tight leading-tight">
                      {editingId ? 'Update Detail' : 'Manual Entry'}
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium">Step 2: Pupil Information</p>
                  </div>
                </div>
                <button
                  onClick={handleCancelAdd}
                  className="size-10 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] active:scale-90 transition-transform overflow-hidden"
                >
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="scale-75">
                    <path d="M15 19L18 16M18 16L21 13M18 16L15 13M18 16L21 19" stroke="#505050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 pb-12 no-scrollbar bg-[#f9fafb]"
                style={{ paddingTop: '20px' }}
              >
                <div className="max-w-lg mx-auto space-y-6">
                  {/* Card for the form */}
                  <div className="bg-white rounded-[24px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] border border-[#E6E6E6] p-6 space-y-8">
                    {/* Student Name */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[1.5px] pl-1">Student Full Name</label>
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

                      {/* Collision warning block */}
                      {collisionDetected && !editingId && (
                        <div className="mt-2 bg-red-50 border border-red-100 rounded-[16px] p-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-start gap-3 text-red-700">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                              <p className="font-bold text-[13px] leading-tight">Student already exists</p>
                              <p className="text-[11px] leading-relaxed opacity-90">
                                A record for <strong>{newStudent.name}</strong> is already in <strong>Grade {newStudent.grade} {newStudent.class}</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grade & Class selection */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[1.5px] pl-1">Current Grade & Class</label>
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
                            window.setTimeout(() => setShowGradeOptions(false), 200);
                          }}
                          onChange={(e) => {
                            setGradeClassQuery(e.target.value);
                            setShowGradeOptions(true);
                            if (!e.target.value.trim()) {
                              setNewStudent(prev => ({ ...prev, grade: '', class: 'General' }));
                            }
                          }}
                          placeholder={isLoadingMetadata ? 'Loading grades...' : 'Search grade or class, e.g. Grade 7A'}
                          className={inputClasses('grade')}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronDown size={18} className={`text-gray-400 transition-transform ${showGradeOptions ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Dropdown for grades */}
                        <AnimatePresence>
                          {showGradeOptions && filteredGradeClassOptions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[120] max-h-[300px] overflow-y-auto no-scrollbar py-2"
                            >
                              {filteredGradeClassOptions.map((option) => (
                                <button
                                  key={`${option.gradeId}-${option.className}`}
                                  type="button"
                                  onMouseDown={() => selectGradeClassOption(option)}
                                  className="w-full px-5 py-4 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                >
                                  <div>
                                    <div className="text-[14px] font-bold text-[#003630]">{option.label}</div>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{option.gradeName} • {option.className}</div>
                                  </div>
                                  <div className="size-6 rounded-full border border-gray-200 flex items-center justify-center">
                                    <ChevronRight size={12} className="text-gray-300" />
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {formErrors.grade && (
                        <p className="text-[10px] font-bold text-red-500 pl-1">{formErrors.grade}</p>
                      )}
                    </div>

                    <button
                      onClick={handleSaveStudent}
                      className="w-full h-12 rounded-[24px] bg-[#003630] text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                    >
                      <span className="font-['Space_Grotesk'] text-[10px] font-bold">
                        {editingId ? 'Update Student' : 'Add Student'}
                      </span>
                    </button>
                  </div>

                  {/* Duplicate suggestions block - if any */}
                  {smartMatchResults.length > 0 && !editingId && (
                    <div className="bg-[#fdfaf2] border border-[#fdecd5] rounded-[24px] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-bold text-[13px]">Similar Pupils Found</span>
                        <Info size={16} className="text-amber-500" />
                      </div>
                      <div className="space-y-3">
                        {smartMatchResults.slice(0, 2).map(match => (
                          <button
                            key={match.id}
                            onClick={() => { haptics.light(); addStudent(match); handleCloseForm(); }}
                            className="w-full bg-white flex items-center justify-between p-4 rounded-[20px] border border-gray-100 active:scale-[0.98] transition-all"
                          >
                            <div className="text-left">
                              <div className="font-bold text-[14px] text-[#003630]">{match.name}</div>
                              <div className="text-[10px] text-gray-400 uppercase font-black">Grade {match.grade} {match.class}</div>
                            </div>
                            <div className="px-4 py-2 rounded-full bg-[#003630] text-white text-[10px] font-black uppercase tracking-wider">USE THIS</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                          <span className={`text-[11px] font-black rounded-full px-3 py-1 whitespace-nowrap ${match.isGuardianLinkLocked ? 'text-amber-800 bg-amber-100' : 'text-[#003630] bg-[#95e36c]/30'
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 pt-4 pb-8 shadow-[0px_-10px_30px_rgba(0,0,0,0.04)] z-50">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="px-1">
            <div className="text-black text-base font-bold font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">
              {students.length} Students Added
            </div>
          </div>

          <button
            onClick={handleOpenSearchOverlay}
            className="w-full h-14 rounded-xl bg-[#003630] flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-md hover:bg-[#004d45] group"
          >
            <div className="size-5 rounded-full border border-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
              <Plus size={12} className="text-white" strokeWidth={3} />
            </div>
            <span className="text-white text-sm font-bold font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">
              {students.length > 0 ? 'Add another Pupil' : 'Add Pupil'}
            </span>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onBack(students)}
              className="flex-1 h-14 rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-300 flex justify-center items-center active:scale-[0.98] transition-all"
            >
              <span className="text-center text-black text-xs font-bold font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">Back</span>
            </button>

            <button
              onClick={handleComplete}
              disabled={isButtonDisabled}
              className={`
              flex-1 h-14 rounded-xl flex justify-center items-center transition-all
              ${isButtonDisabled
                  ? 'bg-gray-50 outline outline-1 outline-offset-[-1px] outline-zinc-100 opacity-50 grayscale pointer-events-none'
                  : 'bg-[#003630] text-white shadow-lg active:scale-[0.98] hover:bg-[#004d45]'
                }
            `}
            >
              <span className={`text-base font-bold font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] ${isButtonDisabled ? 'text-zinc-400' : 'text-white'}`}>
                Next
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
