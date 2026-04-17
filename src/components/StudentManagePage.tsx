import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  User,
  Save,
  Loader2,
  CheckCircle2,
  Trash2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { hapticFeedback } from '../utils/haptics';
import { toast } from 'sonner';
import { getGradesBySchool, updateStudent } from '../lib/supabase/api/students';
import type { PageType } from '../stores/useAppStore';

export default function StudentManagePage({ navigateToPage }: { navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void }) {
  const editingStudentId = useAppStore(state => state.editingStudentId);
  const students = useAppStore(state => state.students);
  const selectedSchoolId = useAppStore(state => state.selectedSchoolId);
  
  const targetStudent = students.find(s => s.id === editingStudentId);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [availableGrades, setAvailableGrades] = useState<{grade_id: string, grade_name: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!targetStudent) {
      toast.error('Student record not found');
      navigateToPage('children-details', 'back');
      return;
    }

    // Split name for editing
    const names = targetStudent.name.split(' ');
    setFirstName(names[0] || '');
    setLastName(names.slice(1).join(' ') || '');
    setGradeId(targetStudent.gradeId || '');

    const fetchGrades = async () => {
      if (selectedSchoolId) {
        const grades = await getGradesBySchool(selectedSchoolId);
        setAvailableGrades(grades);
      }
      setIsLoading(false);
    };

    fetchGrades();
  }, [targetStudent, selectedSchoolId]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setIsSaving(true);
    hapticFeedback('medium');

    try {
      await updateStudent(editingStudentId!, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gradeId: gradeId
      });

      toast.success('Student record updated');
      hapticFeedback('success');
      
      // Navigate back and trigger a refresh if needed (App.tsx usually handles student loading)
      navigateToPage('children-details', 'back');
    } catch (e) {
      toast.error('Could not update record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !targetStudent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-[#003630] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center font-['Inter',sans-serif]">
      {/* ── Fixed Header ── */}
      <header className="w-full h-20 px-6 bg-white border-b border-neutral-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticFeedback('medium');
              navigateToPage('children-details', 'back');
            }}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-black text-[18px] font-bold tracking-tight">Modify Student</h1>
        </div>
      </header>

      <main className="w-full max-w-[500px] flex flex-col px-6 py-10">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-[20px] bg-[#003630] flex items-center justify-center text-white">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-[24px] font-black text-black tracking-tight">{targetStudent.name}</h2>
              <p className="text-[13px] text-neutral-400 font-medium">Registry ID: {targetStudent.admissionNumber || editingStudentId?.substring(0, 8)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-[60px] px-6 bg-gray-50 rounded-[24px] border border-transparent focus:border-[#95e36c]/40 focus:bg-white transition-all outline-none font-bold text-black"
                placeholder="Student first name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-[60px] px-6 bg-gray-50 rounded-[24px] border border-transparent focus:border-[#95e36c]/40 focus:bg-white transition-all outline-none font-bold text-black"
                placeholder="Student last name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest ml-1">Current Grade</label>
              <div className="relative">
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  className="w-full h-[60px] px-6 pl-14 bg-gray-50 rounded-[24px] border border-transparent focus:border-[#95e36c]/40 focus:bg-white transition-all outline-none font-bold text-black appearance-none"
                >
                  <option value="" disabled>Select Grade</option>
                  {availableGrades.map(g => (
                    <option key={g.grade_id} value={g.grade_id}>{g.grade_name}</option>
                  ))}
                </select>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400">
                  <GraduationCap size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-[60px] bg-[#003630] rounded-[24px] text-white font-bold text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-[#003630]/10"
            >
              {isSaving ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>Update Registry</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-neutral-400 mt-6 font-medium leading-relaxed">
              Updates made here will be reflected in the official school registry and academic invoices.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
