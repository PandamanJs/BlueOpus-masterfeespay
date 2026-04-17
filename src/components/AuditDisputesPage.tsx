import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ChevronLeft,
  ChevronDown,
  Info,
  History,
  Check,
  Loader2,
  AlertCircle,
  X,
  Send,
  Baby,
  Plus
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { hapticFeedback } from '../utils/haptics';
import { toast } from 'sonner';
import { logDispute, getDisputesByParent } from '../lib/supabase/api/parents';
import { getStudentsByPhone } from '../data/students';
import type { Student } from '../data/students';
import type { PageType } from '../stores/useAppStore';

export default function AuditDisputesPage({ navigateToPage }: { navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void }) {
  const userId = useAppStore(state => state.userId);
  const userPhone = useAppStore(state => state.userPhone);
  const userName = useAppStore(state => state.userName);

  const [activeTab, setActiveTab] = useState<'history' | 'raise'>('history');
  const [disputes, setDisputes] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRaiseForm, setShowRaiseForm] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [disputesData, studentsData] = await Promise.all([
          getDisputesByParent(userId),
          getStudentsByPhone(userPhone)
        ]);
        setDisputes(disputesData);
        setStudents(studentsData);
        if (studentsData.length > 0) {
          setSelectedStudentId(studentsData[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId, userPhone]);

  const handleRaiseDispute = async () => {
    if (!selectedStudentId || !notes.trim()) {
      toast.error('Please fill in all details');
      return;
    }

    setIsSubmitting(true);
    hapticFeedback('medium');

    try {
      await logDispute(selectedStudentId, userId, notes);
      toast.success('Dispute logged successfully. School admin notified.');
      setNotes('');
      setShowRaiseForm(false);
      setActiveTab('history');
      // Refresh list
      const updatedDisputes = await getDisputesByParent(userId);
      setDisputes(updatedDisputes);
    } catch (e) {
      toast.error('Could not log dispute. Contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center font-['Inter',sans-serif]">
      {/* ── Fixed Header ── */}
      <header className="w-full h-20 px-6 bg-white border-b border-neutral-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticFeedback('medium');
              if (showRaiseForm) {
                setShowRaiseForm(false);
              } else {
                navigateToPage('services', 'back');
              }
            }}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-black shadow-sm">
              <ShieldAlert size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold font-['Inter'] text-black">Audit & Disputes</h2>
          </div>
          <p className="text-black text-[13px] leading-relaxed font-normal font-['Inter'] opacity-80 max-w-[340px]">
            Review active financial investigations and raise discrepancies found in your balance records for further auditing.
          </p>
        </section>

        {/* ── Tabs ── */}
        {!showRaiseForm && (
          <div className="px-6 py-6 flex items-center gap-4">
            <button
              onClick={() => { hapticFeedback('light'); setActiveTab('history'); }}
              className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
            >
              {activeTab === 'history' && <div className="w-1.5 h-1.5 bg-[#4FE501] rounded-full" />}
              <span className={`text-xs font-bold font-['Space_Grotesk'] ${activeTab === 'history' ? 'text-black' : ''}`}>Dispute History</span>
            </button>
            <button
              onClick={() => { hapticFeedback('light'); setActiveTab('raise'); }}
              className={`h-10 px-6 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'raise' ? 'bg-[#95e36c]/10 border border-[#95e36c]/30' : 'bg-transparent text-neutral-500'}`}
            >
              {activeTab === 'raise' && <div className="w-1.5 h-1.5 bg-[#4FE501] rounded-full" />}
              <span className={`text-xs font-bold font-['Space_Grotesk'] ${activeTab === 'raise' ? 'text-black' : ''}`}>Raise Dispute</span>
            </button>
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-6 space-y-4">
          {activeTab === 'history' ? (
            <div className="flex flex-col gap-4 h-full">
              {/* Info Banner */}
              <div className="p-4 bg-[#F7F7F7] rounded-xl flex items-center gap-4 border border-neutral-100 shadow-sm">
                <div className="w-5 h-5 flex items-center justify-center text-neutral-600">
                  <Info size={18} />
                </div>
                <p className="flex-1 text-neutral-600 text-[12px] leading-relaxed font-normal font-['Inter']">
                  Once a dispute is raised, our team will review the discrepancies with the school administration. You will be notified of the resolution.
                </p>
              </div>

              {/* Dispute List Area */}
              <div className="flex-1 min-h-[400px] flex flex-col gap-4">
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <Loader2 className="animate-spin text-teal-600 mb-2" size={32} />
                    <p className="text-neutral-500 text-sm font-medium">Loading history...</p>
                  </div>
                ) : disputes.length > 0 ? (
                  <div className="space-y-3">
                    {disputes.map((dispute) => (
                      <div key={dispute.id} className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col gap-2 transition-all hover:border-[#95e36c]/40">
                        <div className="flex items-center justify-between">
                          <span className="text-black text-[13px] font-bold font-['Inter']">
                            {dispute.student ? `${dispute.student.first_name} ${dispute.student.last_name}` : 'Unknown Student'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(dispute.status)}`}>
                            {dispute.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                          <span className="line-clamp-1 flex-1 pr-4">ID: <span className="text-black font-semibold">#{dispute.id.slice(0, 8).toUpperCase()}</span></span>
                          <span>{new Date(dispute.created_at).toLocaleDateString()}</span>
                        </div>
                        {dispute.notes && (
                          <p className="text-neutral-400 text-[10px] italic border-t border-neutral-50 pt-2 mt-1 line-clamp-2">
                            "{dispute.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 min-h-[300px] rounded-2xl border border-[#E6E6E6] border-dashed bg-gray-50/30 flex flex-col items-center justify-center p-8 text-center">
                    <div className="size-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-300 mb-4 shadow-sm">
                      <History size={24} />
                    </div>
                    <p className="text-neutral-500 text-[12px] font-medium font-['Space_Grotesk'] max-w-[200px]">
                      Your disputes and audit history will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : !showRaiseForm ? (
            <div className="space-y-4">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setShowRaiseForm(true);
                    setNotes('');
                    hapticFeedback('medium');
                  }}
                  className="w-full bg-white rounded-2xl p-5 border border-neutral-100 hover:border-[#95e36c]/40 transition-all flex items-center gap-4 group shadow-sm active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#003630] group-hover:bg-[#95e36c]/10 transition-colors">
                    <Baby size={24} strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-[15px] text-black">
                      {student.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                      {student.grade} • {student.schoolName}
                    </p>
                  </div>
                  <div className="size-8 rounded-full bg-gray-50 flex items-center justify-center text-neutral-300 group-hover:bg-black group-hover:text-white transition-all">
                    <Plus size={16} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* ── Raise Dispute Form ── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 pt-4 pb-20"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-black text-base font-bold font-['Inter']">Dispute Details</h3>
                <p className="text-neutral-500 text-[12px]">Please document the discrepancies found for the selected student.</p>
              </div>

              <div className="space-y-6">
                {/* Select Student (Read only if coming from student selection) */}
                <div className="flex flex-col gap-2 relative">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Target Student</label>
                  <button
                    onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                    className="w-full px-4 py-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-gray-200 flex items-center justify-between group active:bg-gray-50 transition-colors"
                  >
                    <span className="text-black text-xs font-medium font-['Inter']">
                      {students.find(s => s.id === selectedStudentId)?.name || 'Select a student'}
                    </span>
                    <ChevronDown size={16} className={`text-neutral-600 transition-transform ${showStudentDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showStudentDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-100 shadow-xl z-50 overflow-hidden"
                      >
                        {students.map(student => (
                          <button
                            key={student.id}
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setShowStudentDropdown(false);
                              hapticFeedback('light');
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-neutral-50 last:border-0 text-left"
                          >
                            <span className="text-xs font-medium text-black">{student.name}</span>
                            {selectedStudentId === student.id && <Check size={14} className="text-[#003630]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Observation Notes */}
                <div className="flex flex-col gap-4">
                  <label className="text-zinc-500 text-xs font-normal font-['Inter']">Auditor Observation Notes</label>
                  <textarea
                    placeholder="Please state the discrepancy here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-40 px-4 py-4 bg-white rounded-xl shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-neutral-200 text-black text-xs font-medium font-['Inter'] placeholder:text-zinc-400 focus:outline-[#003630] transition-all resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* ── Fixed Bottom Action Bar ── */}
      {(showRaiseForm || (activeTab === 'history' && !loading)) && (
        <div className="w-full fixed bottom-0 left-0 right-0 px-6 pt-4 pb-6 bg-white border-t border-neutral-100 shadow-[0px_-10px_30px_rgba(0,0,0,0.03)] flex flex-col items-center z-[60]">
          <div className="w-full max-w-[552px]">
            {showRaiseForm ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    hapticFeedback('light');
                    setShowRaiseForm(false);
                  }}
                  className="flex-1 h-14 bg-transparent border border-neutral-200 text-black rounded-xl flex items-center justify-center gap-4 text-sm font-bold font-['Inter'] active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleRaiseDispute}
                  style={{ backgroundColor: isSubmitting ? '#E6E6E6' : '#003129' }}
                  className="flex-1 h-14 text-white rounded-xl flex items-center justify-center text-sm font-medium font-['Inter'] shadow-lg active:scale-[0.98] transition-all disabled:cursor-not-allowed gap-4"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                  <span>{isSubmitting ? 'Logging...' : 'Initiate Audit'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  hapticFeedback('medium');
                  setActiveTab('raise');
                }}
                style={{ backgroundColor: '#003630' }}
                className="w-full h-14 text-white rounded-xl flex items-center justify-center text-sm font-semibold font-['Inter'] shadow-xl shadow-teal-950/30 active:scale-[0.98] transition-all gap-2"
              >
                <Plus size={18} />
                Raise New Dispute
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
