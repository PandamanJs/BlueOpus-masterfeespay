import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  ChevronLeft, 
  Save, 
  Baby, 
  School as SchoolIcon,
  CheckCircle2,
  Loader2,
  MapPin,
  AlertCircle,
  X,
  Send
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { hapticFeedback } from '../utils/haptics';
import { toast } from 'sonner';
import { updateParent, logDispute, markStudentAsVerified } from '../lib/supabase/api/parents';
import { getStudentsByParentId, getStudentsByPhone } from '../data/students';
import type { Student } from '../data/students';
import type { PageType } from '../stores/useAppStore';
import LogoHeader from "./common/LogoHeader";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1 mb-5 shrink-0 px-1">
      <div className="inline-flex items-center gap-[8px]">
        <div className="w-[3px] h-[24px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full" />
        <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#003630] tracking-[-0.4px]">
          {title}
        </h2>
      </div>
    </div>
  );
}

function ProfileInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
  type?: string;
  icon: any;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[11px] font-bold text-gray-400 ml-1 uppercase tracking-wider font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">
        {label}
      </label>
      <div className="relative group flex items-center h-[52px]">
        <div className="absolute left-4 z-10 text-gray-400 group-focus-within:text-[#95e36c] transition-colors">
          <Icon size={18} />
        </div>
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full pl-12 pr-4 bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[16px] outline-none focus:border-[#95e36c] focus:bg-white focus:ring-4 focus:ring-[#95e36c]/5 transition-all text-[#003630] font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[15px]"
        />
      </div>
    </div>
  );
}

export default function AccountProfilePage({ navigateToPage }: { navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void }) {
  const userName = useAppStore(state => state.userName);
  const userPhone = useAppStore(state => state.userPhone);
  const userEmail = useAppStore(state => state.userEmail);
  const userId = useAppStore(state => state.userId);
  const setUserInfo = useAppStore(state => state.setUserInfo);

  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [isSaving, setIsSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [selectedDisputeStudent, setSelectedDisputeStudent] = useState<{ id: string, name: string } | null>(null);
  const [verifyingStudentId, setVerifyingStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = userId
          ? await getStudentsByParentId(userId)
          : await getStudentsByPhone(userPhone);
        setStudents(data);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [userPhone, userId]);

  const refreshStudents = async () => {
    try {
      const data = userId
        ? await getStudentsByParentId(userId)
        : await getStudentsByPhone(userPhone);
      setStudents(data);
    } catch (error) {
      console.error('Error refreshing students:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    hapticFeedback('medium');

    try {
      await updateParent(userId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim().replace(/\D/g, '')
      });
      
      setUserInfo(name.trim(), phone.trim(), email.trim(), userId);
      toast.success('Profile updated successfully');
      hapticFeedback('success');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.98, y: 5 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -5 }
  };

  return (
    <div className="min-h-screen bg-white fixed inset-0 flex justify-center overflow-hidden">
      <div className="w-full max-w-[600px] h-full flex flex-col relative bg-white shadow-2xl overflow-hidden">
        <LogoHeader showBackButton onBack={() => navigateToPage('services', 'back')} />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          <motion.div 
            className="px-6 pt-6 space-y-8"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {/* Personal Details Section */}
            <section className="bg-[#f9fafb]/50 rounded-[28px] border-[1.5px] border-[#f1f3f5] p-6 shadow-[0px_8px_24px_-12px_rgba(0,0,0,0.05)]">
              <SectionHeader title="Personal Details" />
              
              <div className="space-y-5">
                <ProfileInput 
                  label="Full Name"
                  icon={User}
                  value={name}
                  onChange={setName}
                  placeholder="Enter your full name"
                />

                <ProfileInput 
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter your email"
                />

                <ProfileInput 
                  label="Phone Number"
                  icon={Phone}
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Enter phone number"
                />

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-[56px] mt-2 rounded-[16px] bg-[#003630] text-white font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0px_10px_20px_-5px_rgba(0,54,48,0.25)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  <span className="relative z-10">Save Changes</span>
                </button>
              </div>
            </section>

            {/* Students Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <SectionHeader title="Connected Students" />
                <div className="bg-[#95e36c]/10 text-[#003630] text-[11px] font-bold px-3 py-1 rounded-full border border-[#95e36c]/20 h-fit -mt-4">
                  {students.length} Total
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingStudents ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 bg-gray-50/50 rounded-[24px] border border-[#e5e7eb]">
                    <Loader2 size={32} className="text-[#95e36c] animate-spin" />
                    <p className="text-[13px] text-gray-400 font-medium font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif]">Retrieving accounts...</p>
                  </div>
                ) : students.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {students.map((student, idx) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white border-[1.5px] border-[#e5e7eb] rounded-[22px] p-4 shadow-sm hover:border-[#95e36c]/40 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#95e36c]/15 to-[#95e36c]/5 border border-[#95e36c]/20 flex items-center justify-center text-[#003630] group-hover:scale-105 transition-transform duration-300">
                            <Baby size={28} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[17px] text-[#003630] tracking-[-0.3px]">
                              {student.name}
                            </h4>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                              <div className="flex items-center gap-1.5 text-gray-500/80">
                                <SchoolIcon size={12} />
                                <span className="text-[11px] font-medium font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] uppercase tracking-wide">{student.schoolName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400 border-l border-gray-100 pl-3">
                                <CheckCircle2 size={12} className="text-[#95e36c]/80" />
                                <span className="text-[11px] font-medium font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif]">ID: {student.admissionNumber}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Grade Badge */}
                        <div className="absolute top-4 right-4 h-6 px-2.5 rounded-full bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#003630] uppercase tracking-wider">{student.grade}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 pt-4 border-t border-[#f1f3f5] flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[#003630]/40 group-hover:text-[#95e36c] transition-colors">
                             <AlertCircle size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">
                               {student.verificationStatus === 'unverified' ? 'Pending School Confirmation' : 'School Confirmed'}
                             </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {student.verificationStatus === 'unverified' && (
                              <button
                                onClick={async () => {
                                  hapticFeedback('light');
                                  setVerifyingStudentId(student.id);
                                  try {
                                    await markStudentAsVerified(student.id, userId);
                                    await refreshStudents();
                                    toast.success('Student profile marked as confirmed.');
                                  } catch {
                                    toast.error('Could not update school confirmation status.');
                                  } finally {
                                    setVerifyingStudentId(null);
                                  }
                                }}
                                disabled={verifyingStudentId === student.id}
                                className="h-[32px] px-4 rounded-full border border-[#95e36c]/40 bg-[#95e36c]/10 text-[#003630] text-[10px] font-black uppercase tracking-wider hover:bg-[#95e36c] hover:text-[#003630] transition-all active:scale-95 disabled:opacity-60"
                              >
                                {verifyingStudentId === student.id ? 'Updating...' : 'Mark Details as Updated'}
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                hapticFeedback('light');
                                setSelectedDisputeStudent({ id: student.id, name: student.name });
                              }}
                              className="h-[32px] px-4 rounded-full border border-red-100 bg-red-50/50 text-red-600 text-[10px] font-black uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all active:scale-95"
                            >
                              Dispute Balance
                            </button>
                          </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#95e36c]/5 to-transparent rounded-full blur-2xl group-hover:bg-[#95e36c]/10 transition-colors" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="bg-[#f9fafb] rounded-[24px] border border-dashed border-[#d1d5db] p-10 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-300">
                      <Baby size={32} />
                    </div>
                    <div>
                      <h4 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#003630]">No accounts found</h4>
                      <p className="text-[12px] text-gray-500 max-w-[220px] mt-1 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">Ensure your phone number is correctly linked with the school system.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Support Portal Card */}
            <section className="bg-gradient-to-br from-[#003630] to-[#014d45] rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group shadow-lg">
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -mr-8 -mt-8" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[#95e36c] border border-white/20">
                  <MapPin size={22} />
                </div>
                <div>
                  <h4 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white">Need help linking?</h4>
                  <p className="text-[12px] text-white/60 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">Visit our support portal or call center.</p>
                </div>
              </div>
              
              <button 
                onClick={() => toast.info('Support coming soon!')}
                className="w-full h-12 rounded-xl bg-white flex items-center justify-center gap-2 text-[#003630] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] active:scale-[0.98] transition-all shadow-sm"
              >
                <span>Go to Support</span>
                <ChevronLeft size={16} className="rotate-180" />
              </button>
            </section>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDisputeStudent && (
          <DisputeDrawer 
            student={selectedDisputeStudent}
            parentId={userId}
            onClose={() => setSelectedDisputeStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DisputeDrawer({ student, parentId, onClose }: { student: { id: string, name: string }, parentId: string, onClose: () => void }) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    setIsSubmitting(true);
    hapticFeedback('medium');

    try {
      await logDispute(student.id, parentId, notes);
      toast.success('Dispute logged successfully. School admin has been notified.');
      hapticFeedback('success');
      onClose();
    } catch (e) {
      toast.error('Could not log dispute. Contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-lg bg-white rounded-t-[40px] shadow-2xl overflow-hidden p-8 pb-12"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-black text-[#95e36c] uppercase tracking-[3px]">Financial Integrity</span>
            <h3 className="text-2xl font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] mt-1">Raise Dispute</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="bg-[#FFF1F0] border border-[#FFCCC7] rounded-2xl p-4 flex gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shrink-0 shadow-sm">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-red-700 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">Disputing record for {student.name}</p>
            <p className="text-[11px] text-red-600/70 font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-normal">
              Flagging this record will notify the school board to audit your payments and invoiced balances for reconciliation.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">
            Reason for dispute
          </label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 'Paid Term 1 fees at the school office on March 15th' or 'Incorrect tuition amount listed'..."
            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#95e36c] focus:bg-white focus:ring-4 focus:ring-[#95e36c]/5 transition-all text-[14px] font-medium resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-14 mt-8 bg-[#003630] rounded-2xl text-white font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg relative overflow-hidden"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
          <span>Submit Formal Dispute</span>
        </button>
      </motion.div>
    </div>
  );
}
