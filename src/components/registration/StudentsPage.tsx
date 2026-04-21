import { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, Loader2, Pencil, ChevronDown, User, Sparkles, UserRoundPlus, ChevronRight, Info, AlertTriangle, Check } from 'lucide-react';
import { type ParentData } from './ParentInformationPage';
import { type StudentData, getGradesWithStreams, getClassesByGrade, type SchoolGrade } from '../../lib/supabase/api/registration';
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

  const [availableOptions, setAvailableOptions] = useState<{ grade_id: string; grade_name: string; stream_name?: string }[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

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

  const [showSmartMatchModal, setShowSmartMatchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<StudentData[]>([]);
  const [smartMatchResults, setSmartMatchResults] = useState<StudentData[]>([]);
  const [showSmartMatchResults, setShowSmartMatchResults] = useState(true);
  const [gradeSearchQuery, setGradeSearchQuery] = useState('');
  const [gradeSuggestion, setGradeSuggestion] = useState<string | null>(null);
  const [showGradeSearch, setShowGradeSearch] = useState(false);
  // Levenshtein distance for fuzzy string matching
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

  // Simple fuzzy search for grades
  const findClosestOption = (query: string, options: typeof availableOptions) => {
    if (!query || query.length < 2) return null;
    const cleanQuery = query.toLowerCase().replace(/\s+/g, '');

    let bestMatch: (typeof availableOptions)[0] | null = null;
    let highestScore = 0;

    options.forEach(opt => {
      const gName = (opt.grade_name + (opt.stream_name ? ' ' + opt.stream_name : '')).toLowerCase().replace(/\s+/g, '');
      const score = calculateSimilarity(cleanQuery, gName);
      if (score > 0.6 && score > highestScore) {
        highestScore = score;
        bestMatch = opt;
      }
    });

    return bestMatch;
  };


  useEffect(() => {
    if (gradeSearchQuery && availableOptions.length > 0) {
      const exactMatches = availableOptions.filter(opt => {
        const combined = opt.grade_name + (opt.stream_name ? ' ' + opt.stream_name : '');
        return combined.toLowerCase().includes(gradeSearchQuery.toLowerCase());
      });

      if (exactMatches.length === 0) {
        const suggestion = findClosestOption(gradeSearchQuery, availableOptions);
        setGradeSuggestion(suggestion ? (suggestion.grade_name + (suggestion.stream_name ? ' ' + suggestion.stream_name : '')) : null);
      } else {
        setGradeSuggestion(null);
      }
    } else {
      setGradeSuggestion(null);
    }
  }, [gradeSearchQuery, availableOptions]);

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
        const options = await getGradesWithStreams(parentData.schoolId);
        setAvailableOptions(options);
      } catch (err) {
        console.error('Failed to load grade metadata:', err);
      } finally {
        setIsLoadingMetadata(false);
      }
    }
    loadData();
  }, [parentData.schoolId]);

  useEffect(() => {
    const fetchClassesForGrade = async () => {
      if (!newStudent.grade) {
        setAvailableClasses([]);
        return;
      }

      // Find the ID for the currently selected grade name
      const grade = availableOptions.find(g => g.grade_name === newStudent.grade);
      if (!grade) return;

      setIsLoadingClasses(true);
      try {
        const classes = await getClassesByGrade(parentData.schoolId, grade.grade_id);
        setAvailableClasses(classes);

        // Auto-select class in background
        if (classes.length > 0) {
          setNewStudent(prev => ({ ...prev, class: classes[0] }));
        } else {
          setNewStudent(prev => ({ ...prev, class: 'General' }));
        }
      } catch (error) {
        console.error("Failed to load classes for grade:", error);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClassesForGrade();
  }, [newStudent.grade, parentData.schoolId, availableOptions]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const { searchStudentsByName } = await import('../../lib/supabase/api/registration');
          const results = await searchStudentsByName(searchQuery, parentData.schoolId, parentData.parentId);
          setSearchResults(results);

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

  const [collisionDetected, setCollisionDetected] = useState<boolean>(false);

  useEffect(() => {
    if (!showAddForm || editingId) return;
    const timer = setTimeout(async () => {
      if (newStudent.name.trim().length >= 3) {
        try {
          const { searchStudentsByName } = await import('../../lib/supabase/api/registration');
          const results = await searchStudentsByName(newStudent.name, parentData.schoolId, parentData.parentId);

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


  const handleSaveStudent = () => {
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
        addStudent(studentToAdd);
        toast.success('New record added to application');
      }
      handleCloseForm();
      setShowSmartMatchModal(false);
    }
  };


  const handleCloseForm = () => {
    setNewStudent({ name: '', grade: '', class: '', studentId: '' });
    setFormErrors({ name: '', grade: '', class: '', studentId: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

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
      <LogoHeader showBackButton onBack={onBack}>
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

      <div className={`flex-1 px-6 pt-2 pb-32 max-w-lg mx-auto w-full transition-opacity duration-300 ${showSmartMatchModal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.8px] mb-2 leading-tight">
            Add Pupils to your Account
          </h1>
          <div className="text-[14px] text-gray-500 tracking-[-0.2px] leading-relaxed">
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
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative z-20 bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden mb-4 mt-2"
                  >
                    <div className="p-2 space-y-1">
                      {searchResults.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => addStudent(student)}
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
                                    {student.parentName || student.otherParentName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#003630] group-hover:text-white transition-all ml-3 shrink-0">
                            <Plus size={18} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { haptics.light(); setShowAddForm(true); window.history.pushState({ page: 'registration-form', subPage: 'add-student' }, '', '#registration-form'); }}
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
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] pl-1">Current Grade</label>
                      <div className="relative group">
                        <div className="relative">
                          <input
                            type="text"
                            value={gradeSearchQuery}
                            onFocus={() => {
                              setFocusedField('grade');
                              setShowGradeSearch(true);
                              haptics.light();
                            }}
                            onBlur={() => {
                              setFocusedField(null);
                              // Delayed hide to allow clicking results
                              setTimeout(() => setShowGradeSearch(false), 200);
                            }}
                            onChange={(e) => {
                              setGradeSearchQuery(e.target.value);
                              setNewStudent({ ...newStudent, grade: '' }); // Reset actual value until picked
                            }}
                            placeholder="Type to search grade..."
                            className={inputClasses('grade')}
                          />
                          {isLoadingMetadata && (
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Loader2 className="size-5 text-[#95e36c] animate-spin" />
                            </div>
                          )}
                        </div>

                        <AnimatePresence>
                          {showGradeSearch && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-[100] w-full mt-2 bg-white rounded-[16px] shadow-2xl border border-gray-100 overflow-hidden max-h-[220px] overflow-y-auto"
                            >
                              {availableOptions
                                .filter(opt => {
                                  const combined = opt.grade_name + (opt.stream_name ? ' ' + opt.stream_name : '');
                                  return combined.toLowerCase().includes(gradeSearchQuery.toLowerCase());
                                })
                                .map((opt) => {
                                  const label = opt.grade_name + (opt.stream_name ? ' ' + opt.stream_name : '');
                                  const isSelected = newStudent.grade === opt.grade_name && (opt.stream_name ? newStudent.class === opt.stream_name : newStudent.class === 'General');

                                  return (
                                    <button
                                      key={`${opt.grade_id}-${opt.stream_name || 'none'}`}
                                      type="button"
                                      onClick={() => {
                                        setNewStudent({
                                          ...newStudent,
                                          grade: opt.grade_name,
                                          class: opt.stream_name || 'General'
                                        });
                                        setGradeSearchQuery(label);
                                        setShowGradeSearch(false);
                                        haptics.success();
                                      }}
                                      className="w-full px-5 py-3.5 text-left hover:bg-[#f9fafb] transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between group"
                                    >
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[15px] font-medium transition-colors ${isSelected ? 'text-[#003630] font-bold' : 'text-gray-600'}`}>
                                            {opt.grade_name}
                                          </span>
                                          {opt.stream_name && (
                                            <span className="px-2 py-0.5 rounded-full bg-[#95e36c]/10 text-[#003630] text-[10px] font-black uppercase tracking-wider">
                                              {opt.stream_name}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <div className="size-2 rounded-full bg-[#95e36c] shadow-[0_0_8px_#95e36c]" />
                                      )}
                                    </button>
                                  );
                                })
                              }
                              {availableOptions.filter(opt => {
                                const combined = opt.grade_name + (opt.stream_name ? ' ' + opt.stream_name : '');
                                return combined.toLowerCase().includes(gradeSearchQuery.toLowerCase());
                              }).length === 0 && (
                                  <div className="px-5 py-8 text-center">
                                    {gradeSuggestion ? (
                                      <div className="space-y-3">
                                        <p className="text-[13px] text-gray-400">No exact match for "{gradeSearchQuery}"</p>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNewStudent({ ...newStudent, grade: gradeSuggestion });
                                            setGradeSearchQuery(gradeSuggestion);
                                            setGradeSuggestion(null);
                                            haptics.success();
                                          }}
                                          className="px-4 py-2 rounded-full bg-[#95e36c]/10 text-[#003630] text-[12px] font-bold border border-[#95e36c]/20 hover:bg-[#95e36c]/20 transition-all active:scale-95"
                                        >
                                          Did you mean <span className="underline italic ml-0.5">{gradeSuggestion}</span>?
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-[13px] text-gray-400">No grades matching "{gradeSearchQuery}"</p>
                                    )}
                                  </div>
                                )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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