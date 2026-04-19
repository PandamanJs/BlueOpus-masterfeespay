import { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, Loader2, Pencil, ChevronDown, User, Sparkles, UserRoundPlus, ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { type ParentData } from './ParentInformationPage';
import { type StudentData, getGradesWithStreams, type SchoolGrade } from '../../lib/supabase/api/registration';
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

  const [searchResults, setSearchResults] = useState<StudentData[]>([]);
  const [smartMatchResults, setSmartMatchResults] = useState<StudentData[]>([]);
  const [gradeSearchQuery, setGradeSearchQuery] = useState('');
  const [gradeSuggestion, setGradeSuggestion] = useState<string | null>(null);
  const [showGradeSearch, setShowGradeSearch] = useState(false);
  // Simple fuzzy search / Levenshtein distance for typos
  const findClosestOption = (query: string, options: typeof availableOptions) => {
    if (!query || query.length < 2) return null;
    const cleanQuery = query.toLowerCase().replace(/\s+/g, '');
    
    let bestMatch: (typeof availableOptions)[0] | null = null;
    let highestScore = 0;

    options.forEach(opt => {
      const gName = (opt.grade_name + (opt.stream_name ? ' ' + opt.stream_name : '')).toLowerCase().replace(/\s+/g, '');
      
      // Basic similarity check
      let matches = 0;
      for (let i = 0; i < Math.min(cleanQuery.length, gName.length); i++) {
        if (cleanQuery[i] === gName[i]) matches++;
      }
      
      const score = matches / Math.max(cleanQuery.length, gName.length);
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
          const results = await searchStudentsByName(searchQuery, parentData.schoolId);
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
    if (!showAddForm || editingId) return; // Only do smart match when adding new manually
    const timer = setTimeout(async () => {
      if (newStudent.name.trim().length >= 2) {
        try {
          const { searchStudentsByName } = await import('../../lib/supabase/api/registration');
          const results = await searchStudentsByName(newStudent.name, parentData.schoolId);
          
          // Filter out students already added to the list
          const relevantMatches = results.filter(r => !students.find(s => s.id === r.id));
          setSmartMatchResults(relevantMatches);

          // Check for exact name + class collision in the database
          const exactCollision = relevantMatches.some(m => 
            m.name.trim().toLowerCase() === newStudent.name.trim().toLowerCase() &&
            m.grade === newStudent.grade &&
            m.class === newStudent.class
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
    }, 500);

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
      if (editingId) {
        setStudents(students.map(s => s.id === editingId ? {
          ...s,
          name: newStudent.name,
          grade: newStudent.grade,
          class: newStudent.class,
        } : s));
        import('sonner').then(({ toast }) => toast.success('Record updated successfully'));
      } else {
        const studentToAdd: StudentData = {
          id: `new-${Date.now()}`,
          name: newStudent.name,
          grade: newStudent.grade,
          class: newStudent.class,
          studentId: 'New Registration',
        };
        addStudent(studentToAdd);
        import('sonner').then(({ toast }) => toast.success('New record added to application'));
      }
      handleCloseForm();
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
      import('sonner').then(({ toast }) => toast.error('Add at least one child to continue'));
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

      <div className="flex-1 px-6 pt-2 pb-32 max-w-lg mx-auto w-full">
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
                    className="relative z-20 bg-white rounded-[12px] shadow-lg border border-gray-200 overflow-hidden mb-2"
                  >
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => addStudent(student)}
                        className="w-full p-3 text-left border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#003630] text-sm truncate">{student.name}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                              Grade {student.grade.toString().replace(/^(grade\s+)/i, '')}{student.class && student.class !== 'General' ? student.class : ''}
                            </span>
                            {(student.parentName || student.otherParentName) && (
                              <span className="text-[10px] text-[#003630] font-bold uppercase tracking-wider">
                                Guardian: {student.parentName || student.otherParentName}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-[#003630] ml-2 flex-shrink-0" />
                      </button>
                    ))}
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
                              Please use the "Did you mean..." list above or contact the school if this is a mistake.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
                              onClick={(e) => {
                                e.preventDefault();
                                haptics.light();
                                addStudent(match);
                                handleCloseForm();
                              }}
                              className="w-full bg-white flex items-center justify-between p-3 rounded-[12px] border border-amber-100/50 hover:bg-amber-100/30 active:scale-[0.98] transition-all text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630] truncate">
                                  {match.name}
                                </div>
                                <div className="text-[11px] text-gray-500 font-medium flex flex-col gap-1 mt-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span>Grade {match.grade.toString().replace(/^(grade\s+)/i, '')}{match.class && match.class !== 'General' ? match.class : ''}</span>
                                    <div className="size-0.5 rounded-full bg-gray-300" />
                                    <span>{match.studentId}</span>
                                  </div>
                                  {(match.parentName || match.otherParentName) && (
                                    <span className="text-[#003630] uppercase text-[9px] font-bold tracking-wider">
                                      Guardian: {match.parentName || match.otherParentName}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                                Add
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
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