import { useState, useEffect } from 'react';
import { Users, Plus, Search, X, Loader2, Pencil, ChevronDown, User, Sparkles, UserRoundPlus, ChevronRight } from 'lucide-react';
import { type ParentData } from './ParentInformationPage';
import { type StudentData, getGradesBySchool, getClassesBySchool } from '../../lib/supabase/api/registration';
import { haptics } from '../../utils/haptics';
import LogoHeader from '../common/LogoHeader';
import { motion, AnimatePresence } from 'motion/react';

interface StudentsPageProps {
  parentData: ParentData;
  onComplete: (students: StudentData[]) => void;
  onBack: () => void;
}

// Borrowed from Checkout SummaryCard styling (the one with chevrons)
function ParentSummaryCard({ parentData }: { parentData: ParentData }) {
  return (
    <div className="bg-white rounded-[24px] w-full relative overflow-hidden ring-1 ring-[#e5e7eb] shadow-[0px_12px_24px_-8px_rgba(0,0,0,0.06)] mb-10 mt-2">
      {/* Decorative Chevrons (Signature from CheckoutPage) */}
      <div className="absolute -top-4 -right-2 w-32 h-32 opacity-80 pointer-events-none">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full rotate-[-15deg]">
          <path d="M40 20L65 45L40 70" stroke="#e0f7d4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M55 20L80 45L55 70" stroke="#95e36c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
          <path d="M70 20L95 45L70 70" stroke="#003630" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="p-6 flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="size-11 rounded-[16px] bg-gradient-to-br from-[#003630]/15 to-[#003630]/5 border-[1.5px] border-[#003630]/20 flex items-center justify-center">
            <User size={22} className="text-[#003630]" strokeWidth={2.5} />
          </div>
          <div className="px-3 py-1 rounded-full bg-[#95e36c]/10 border border-[#95e36c]/20">
            <span className="text-[10px] font-black text-[#003630] uppercase tracking-widest">Registrant</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.5px] leading-tight">
            {parentData.fullName}
          </h2>
          <div className="flex items-center gap-2">
            <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] text-gray-500">{parentData.phone}</p>
            {parentData.email && (
              <>
                <div className="size-1 rounded-full bg-gray-300" />
                <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[13px] text-gray-500 truncate max-w-[150px]">{parentData.email}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
            <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-white font-bold">Add Student Record</span>
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[20px] p-[16px] border-[1.5px] border-[#e5e7eb] shadow-[0px_8px_24px_-12px_rgba(0,0,0,0.08)] mb-3 relative overflow-hidden group hover:border-[#003630]/20 transition-all duration-300 select-none"
    >
      {/* Decorative Gradient Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#95e36c] to-[#003630] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-1 relative z-10 text-left pl-1">
          <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[17px] text-[#003630] tracking-[-0.3px] leading-tight">
            {student.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
              {student.grade} - {student.class}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="size-9 rounded-full bg-gray-50 text-gray-400 hover:text-[#003630] hover:bg-white hover:shadow-md flex items-center justify-center transition-all border border-gray-50 hover:border-gray-100 active:scale-90"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="size-9 rounded-full bg-red-50 text-red-300 hover:text-red-500 hover:bg-white hover:shadow-md flex items-center justify-center transition-all border border-red-50 hover:border-red-100 active:scale-90"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function StudentsPage({ parentData, onComplete, onBack }: StudentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

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

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StudentData[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const [grades, classes] = await Promise.all([
          getGradesBySchool(parentData.schoolId),
          getClassesBySchool(parentData.schoolId)
        ]);
        setAvailableGrades(grades);
        setAvailableClasses(classes);
      } catch (error) {
        console.error("Failed to load school metadata:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    fetchMetadata();
  }, [parentData.schoolId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { searchStudentsByName } = await import('../../lib/supabase/api/registration');
          const results = await searchStudentsByName(searchQuery, parentData.schoolId);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, parentData.schoolId]);

  const addStudent = (student: StudentData) => {
    haptics.selection();
    if (!students.find((s) => s.id === student.id)) {
      setStudents([...students, student]);
      setSearchQuery('');
      setSearchResults([]);
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
        ? 'ring-4 ring-[#95e36c]/20 border-[1.5px] border-[#95e36c] shadow-lg'
        : 'border-[1.5px] border-white shadow-sm hover:border-[#d1d5db]'
    }
    text-[16px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] placeholder:text-gray-300 focus:outline-none
  `;

  const isButtonDisabled = students.length === 0 || showAddForm;

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader showBackButton onBack={onBack} />

      <div className="flex-1 px-6 pt-10 pb-32 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-[10px] mb-[12px]">
            <div className="w-[4px] h-[28px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full shadow-[0_2px_8px_rgba(149,227,108,0.3)]" />
            <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.8px]">
              Add Students
            </h1>
          </div>
          <p className="text-[14px] text-gray-500 tracking-[-0.2px] leading-relaxed pl-[14px]">
            Please link your children to your profile to proceed with the registration.
          </p>
        </motion.div>

        {/* Parent Summary Card */}
        {!showAddForm && <ParentSummaryCard parentData={parentData} />}

        {/* Actions Section */}
        {!showAddForm ? (
          <div className="space-y-12">
            {/* EXACT SEARCH BAR FROM SEARCHPAGE.TSX */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-[8px]">
                  <div className="w-[3px] h-[16px] bg-[#95e36c] rounded-full" />
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">
                    Database Search
                  </label>
                </div>
                {isSearching && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-[#95e36c] uppercase tracking-wider">
                    <Loader2 size={12} className="animate-spin" /> Live Verification
                  </span>
                )}
              </div>

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
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex items-center px-4 py-4">
                    <Search
                      className={`flex-shrink-0 transition-colors duration-300 ${focusedField === 'search' ? 'text-[#95e36c]' : 'text-[#003630]/40'}`}
                      size={20}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => { setFocusedField('search'); haptics.light(); }}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students..."
                      className="flex-1 px-3 bg-transparent outline-none text-[#003630] placeholder:text-[#003630]/40"
                      style={{ fontSize: '16px' }}
                    />
                    {searchQuery && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => setSearchQuery('')}
                        className="flex-shrink-0 p-1 rounded-full bg-[#003630]/5 hover:bg-[#003630]/10 active:scale-95 transition-all duration-200 min-w-[28px] min-h-[28px] flex items-center justify-center"
                      >
                        <X size={16} className="text-[#003630]/60" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Exact Search Results Style from SearchPage.tsx (School Cards) - TIGHTENED HEIGHT */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3 mt-6"
                  >
                    {searchResults.map((student, index) => (
                      <motion.button
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => addStudent(student)}
                        className="relative w-full rounded-[18px] p-4 border-[1.5px] transition-all duration-300 bg-white border-[#e5e7eb] hover:border-[#95e36c] shadow-[0px_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0px_12px_32px_rgba(149,227,108,0.2)] flex items-center gap-4 group overflow-hidden"
                        style={{ minHeight: '76px' }}
                      >
                        {/* Selector indicator accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#95e36c] opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex-1 text-left pl-1">
                          <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[17px] text-[#003630] tracking-[-0.4px] leading-tight group-hover:text-[#95e36c] transition-colors line-clamp-1">{student.name}</h3>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                            <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
                              {student.grade} — {student.class}
                            </span>
                            {student.parentName && (
                              <span className="text-[12px] text-[#95e36c] font-bold line-clamp-1 border-l border-gray-200 pl-3">
                                Guardian: {student.parentName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 size-9 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-[#95e36c]/10 group-hover:border-[#95e36c]/20 group-hover:text-[#95e36c] transition-all">
                          <ChevronRight size={20} className="relative left-[0.5px]" strokeWidth={2.5} />
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Students List */}
            <div className="space-y-4 pt-4">
              {students.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Linked Students</span>
                    <button onClick={() => { haptics.light(); setShowAddForm(true); }} className="text-[11px] font-black text-[#95e36c] uppercase tracking-widest hover:opacity-80 flex items-center gap-2.5 active:scale-95 transition-all bg-[#003630] px-3 py-1.5 rounded-full shadow-lg">
                      <Plus size={12} strokeWidth={4} /> Add New
                    </button>
                  </div>
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
                <EmptyStudentState onAddManual={() => setShowAddForm(true)} />
              )}
            </div>
          </div>
        ) : (
          /* Manual Add Form */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <div>
                <h3 className="text-[26px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] tracking-[-0.6px]">
                  {editingId ? 'Edit Student' : 'Manual Entry'}
                </h3>
                <p className="text-[13px] text-gray-500 tracking-[-0.1px]">Enter the details for the student record below</p>
              </div>
              <button
                onClick={handleCloseForm}
                className="size-11 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#003630] transition-all active:scale-90 shadow-sm"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] pl-1">Current Grade</label>
                  <div className="relative group">
                    <select
                      value={newStudent.grade}
                      onFocus={() => { setFocusedField('grade'); haptics.light(); }}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                      className={`${inputClasses('grade')} appearance-none pr-12`}
                      disabled={isLoadingMetadata}
                    >
                      <option value="">{isLoadingMetadata ? 'Loading...' : 'Select Grade'}</option>
                      {availableGrades.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#95e36c] transition-colors" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] pl-1">Class/Stream</label>
                  <div className="relative group">
                    <select
                      value={newStudent.class}
                      onFocus={() => { setFocusedField('class'); haptics.light(); }}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                      className={`${inputClasses('class')} appearance-none pr-12`}
                      disabled={isLoadingMetadata}
                    >
                      <option value="">{isLoadingMetadata ? 'Loading...' : 'Select'}</option>
                      {availableClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#95e36c] transition-colors" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveStudent}
                className="w-full h-14 rounded-[18px] bg-[#003630] border border-[#003630] shadow-[0_8px_20px_rgba(0,54,48,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
              >
                <div className="size-7 rounded-full bg-[#95e36c]/20 flex items-center justify-center group-hover/btn:bg-[#95e36c] transition-colors">
                  <Plus size={16} className="text-[#95e36c] group-hover/btn:text-[#003630]" strokeWidth={3} />
                </div>
                <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-white font-bold">
                  {editingId ? 'Update Record' : 'Add to Application'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed Footer */}
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
              Next
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}