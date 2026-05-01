import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Baby,
  ChevronLeft,
  School as SchoolIcon,
  Loader2,
  AlertCircle,
  X,
  Send,
  Plus,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { hapticFeedback } from '../utils/haptics';
import { toast } from 'sonner';
import { logDispute } from '../lib/supabase/api/parents';
import { getStudentsByPhone, type Student } from '../data/students';
import type { PageType } from '../stores/useAppStore';
import { searchStudentsByName, attemptGuardianLink, type StudentData } from '../lib/supabase/api/registration';

export default function ChildrenDetailsPage({ navigateToPage }: { navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void }) {
  const userId = useAppStore(state => state.userId);
  const userPhone = useAppStore(state => state.userPhone);
  const selectedSchoolId = useAppStore(state => state.selectedSchoolId);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentData[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDisputeStudent, setSelectedDisputeStudent] = useState<{ id: string, name: string } | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await getStudentsByPhone(userPhone, selectedSchoolId || undefined);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load student records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userPhone) fetchStudents();
  }, [userPhone]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStudentsByName(searchQuery, selectedSchoolId || undefined, userId);
        // Filter out students already in the list
        setSearchResults(results.filter(r => !students.find(s => s.id === r.id)));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, students, selectedSchoolId, userId]);

  const handleLinkStudent = async (student: StudentData) => {
    if (!userId || !selectedSchoolId) return;

    setIsLinking(true);
    try {
      const result = await attemptGuardianLink({
        registrationSessionId: `link-${Date.now()}`,
        parentId: userId,
        schoolId: selectedSchoolId,
        studentId: student.id,
        confidenceBand: 'high',
        mediumConfirmed: true
      });

      if (result.outcome === 'linked') {
        toast.success('Student linked successfully');
        setShowSearch(false);
        setSearchQuery('');
        fetchStudents(); // Refresh list
      } else if (result.outcome === 'queued_for_review' || result.outcome === 'blocked_two_guardians') {
        toast.info('Request sent for school review', {
          description: result.message
        });
        setShowSearch(false);
        setSearchQuery('');
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Linking failed:', err);
      toast.error('Failed to link student');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center font-['Inter',sans-serif]">
      {/* ── Fixed Header ── */}
      <header className="w-full h-[50px] pt-safe px-6 bg-white border-b border-neutral-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="size-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                <path d="M9 13L12 10L15 13" />
              </svg>
            </div>
            <h1 className="text-black text-[22px] font-bold font-['Inter'] tracking-tight">masterfees</h1>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[600px] flex flex-col pb-32">
        {/* ── Hero Section ── */}
        <section className="px-6 py-8 bg-[#f9fafb]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-black shadow-sm">
                <Baby size={22} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold font-['Inter'] text-black">Children's Details</h2>
            </div>
            {!showSearch && (
              <button 
                onClick={() => { hapticFeedback('light'); setShowSearch(true); }}
                className="size-10 rounded-full bg-black text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <p className="text-black text-[13px] leading-relaxed font-normal font-['Inter'] opacity-80 max-w-[340px]">
            Manage student identities linked to your account and review academic ledger statuses.
          </p>
        </section>

        {/* ── Content ── */}
        <div className="px-6 pt-8 space-y-6">
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-[24px] p-6 border-[1.5px] border-[#e5e7eb] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[15px] text-black">Find Student</h4>
                    <button onClick={() => setShowSearch(false)} className="text-neutral-400 hover:text-black">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name or admission number..."
                      className="w-full h-12 px-4 rounded-xl border border-neutral-100 bg-neutral-50 text-[14px] focus:outline-none focus:border-black transition-all"
                    />
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4 gap-2">
                        <Loader2 size={16} className="animate-spin text-neutral-400" />
                        <span className="text-[12px] text-neutral-400">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-neutral-50">
                          <div>
                            <p className="font-bold text-[14px] text-black">{result.name}</p>
                            <p className="text-[11px] text-neutral-400">{result.grade} • {result.studentId}</p>
                          </div>
                          <button
                            disabled={isLinking}
                            onClick={() => handleLinkStudent(result)}
                            className="h-8 px-4 rounded-full bg-black text-white text-[11px] font-bold active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isLinking ? <Loader2 size={14} className="animate-spin" /> : 'Link'}
                          </button>
                        </div>
                      ))
                    ) : searchQuery.length >= 2 ? (
                      <p className="text-center py-4 text-[12px] text-neutral-400 font-medium">No students found matching "{searchQuery}"</p>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="text-black animate-spin" />
              <p className="text-[13px] text-neutral-400 font-bold uppercase tracking-wider">Synchronizing Ledger...</p>
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-4">
              {students.map((student, idx) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-[24px] p-6 shadow-sm border border-neutral-100 hover:border-[#95e36c]/40 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-[22px] bg-gray-50 flex items-center justify-center text-[#003630] group-hover:bg-[#95e36c]/10 transition-all duration-500">
                      <Baby size={32} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[18px] text-black tracking-tight">
                          {student.name}
                        </h4>
                        <div className="px-2 py-0.5 rounded-lg bg-gray-50 text-neutral-400 font-bold text-[10px] uppercase tracking-wider">
                          {student.grade}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-neutral-400">
                        <SchoolIcon size={14} />
                        <span className="text-[13px] font-medium">{student.schoolName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-neutral-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#95e36c] animate-pulse" />
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest">Active Status</span>
                    </div>

                    <button
                      onClick={() => {
                        hapticFeedback('light');
                        useAppStore.getState().setEditingStudentId(student.id);
                        navigateToPage('student-manage');
                      }}
                      className="h-[36px] px-4 rounded-full border border-neutral-100 hover:border-[#003630]/20 transition-all active:scale-95 flex items-center gap-2 text-[#003630]/60 font-bold"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span className="text-[11px] uppercase tracking-wide">Edit Details</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center text-center gap-5">
              <div className="w-20 h-20 rounded-[28px] bg-gray-50 flex items-center justify-center text-neutral-200">
                <Baby size={40} />
              </div>
              <div>
                <h4 className="font-bold text-[18px] text-black tracking-tight">No Records Found</h4>
                <p className="text-[13px] text-neutral-400 max-w-[240px] mt-2 font-medium">Please verify that your phone number is registered within the school system.</p>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-4 bg-[#F7F7F7] rounded-xl flex items-center gap-4 border border-neutral-100 mt-8">
            <div className="w-5 h-5 flex items-center justify-center text-neutral-400">
              <Info size={18} />
            </div>
            <p className="flex-1 text-neutral-400 text-[12px] leading-relaxed font-normal">
              Child details are synchronized with the school's central registry. For name corrections or grade updates, please contact your school administrator.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
