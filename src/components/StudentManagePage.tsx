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
import group16 from '../assets/decorations/Group 16.png';
import group17 from '../assets/decorations/Group 17.png';
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
  const [availableGrades, setAvailableGrades] = useState<{ grade_id: string, grade_name: string }[]>([]);
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
      // Use the student's school ID as primary source for fetching grades
      const schoolId = selectedSchoolId || (targetStudent as any).school_id || (targetStudent as any).schoolId;
      
      console.log('[StudentManage] Attempting to fetch grades for school:', schoolId);
      
      if (schoolId) {
        setIsLoading(true); // Ensure loading state is active
        try {
          const grades = await getGradesBySchool(schoolId);
          console.log('[StudentManage] Fetched grades count:', grades?.length);
          if (grades && grades.length > 0) {
            setAvailableGrades(grades);
          } else {
            console.warn('[StudentManage] No grades found for school:', schoolId);
          }
        } catch (error) {
          console.error('[StudentManage] Grade fetch error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.error('[StudentManage] No school ID available for grade fetching');
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, [editingStudentId, targetStudent, selectedSchoolId]);

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
    <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center">
      {/* ── Fixed Header ── */}
      <header className="w-full h-20 px-6 bg-white/80 backdrop-blur-xl border-b border-[#003630]/5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              hapticFeedback('medium');
              navigateToPage('children-details', 'back');
            }}
            className="w-10 h-10 rounded-full bg-[#003630]/5 flex items-center justify-center text-[#003630] active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[#003630] text-[18px] font-[900] tracking-[-0.5px] font-['Space_Grotesk',sans-serif]">Modify Record</h1>
            <p className="text-[10px] text-[#003630]/40 font-bold uppercase tracking-[0.1em]">Student Registry</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[500px] flex flex-col px-6 py-8">
        {/* Student Identity Section - Background Removed */}
        <div className="relative overflow-hidden bg-transparent py-4 mb-10">
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#003630]/5 flex items-center justify-center text-[#003630]">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div className="px-4 py-2 rounded-full bg-[#003630]/5 border border-[#003630]/10 text-[#003630]/40 font-black text-[10px] tracking-[2px] uppercase">
                Academic Record
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[#003630]/40 font-black text-[11px] tracking-[3px] uppercase">Student Identity</span>
              <h2 className="text-[#003630] text-[36px] font-[900] tracking-[-1.2px] font-['Space_Grotesk',sans-serif] leading-tight">
                {targetStudent.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="size-1.5 rounded-full bg-[#95e36c]" />
                <span className="text-[#003630]/60 font-mono text-[14px] font-[900] tracking-wider">
                  #{targetStudent.admissionNumber || editingStudentId?.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#003630]/30 uppercase tracking-[0.2em] ml-2">Personal Details</label>

              <div className="space-y-4">
                <div className="group">
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full h-[60px] px-6 bg-white rounded-[24px] border border-[#003630]/5 text-[#003630] font-bold text-[16px] outline-none transition-all shadow-sm focus:shadow-md focus:border-[#95e36c]/50 group-hover:border-[#003630]/10"
                    />
                  </div>
                </div>

                <div className="group">
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full h-[60px] px-6 bg-white rounded-[24px] border border-[#003630]/5 text-[#003630] font-bold text-[16px] outline-none transition-all shadow-sm focus:shadow-md focus:border-[#95e36c]/50 group-hover:border-[#003630]/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#003630]/30 uppercase tracking-[0.2em] ml-2">Educational Placement</label>
              <div className="group relative">
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  className="w-full h-[60px] px-6 bg-[#003630]/5 rounded-[24px] border border-transparent text-black font-bold text-[16px] outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>Select Grade / Class</option>
                  {availableGrades.map(g => (
                    <option key={g.grade_id} value={g.grade_id}>
                      {g.grade_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="relative h-[60px] w-full rounded-[24px] overflow-hidden group active:scale-[0.96] transition-all shadow-xl shadow-teal-950/20 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <div className="relative z-10 flex items-center justify-center gap-3">
                {isSaving ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : (
                  <>
                    <div className="size-8 rounded-xl bg-[#95e36c]/20 flex items-center justify-center backdrop-blur-sm">
                      <Save size={18} className="text-[#95e36c]" strokeWidth={3} />
                    </div>
                    <span className="font-['Space_Grotesk',sans-serif] text-[18px] font-bold text-white tracking-[-0.3px]">Save Changes</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-[500px] px-6 pb-12 mt-auto">
        <div className="p-5 rounded-[24px] bg-[#003630]/5 border border-[#003630]/5 flex gap-4">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
            <AlertCircle size={18} />
          </div>
          <p className="text-[12px] text-[#003630]/60 font-medium leading-relaxed">
            Updates made here will be reflected in the official school registry and academic invoices. Please ensure accuracy before saving.
          </p>
        </div>
      </footer>
    </div>
  );
}
