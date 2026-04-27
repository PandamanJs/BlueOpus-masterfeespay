import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, School as SchoolIcon, Lock, Loader2, ChevronDown, CheckCircle2, AlertTriangle, X, Info, ChevronRight, Sparkles } from 'lucide-react';
import { validatePhoneNumber, validateEmail, validateName } from '../../utils/validation';
import { getSchools } from '../../lib/supabase/api/schools';
import { verifySchoolCode } from '../../lib/supabase/api/security';
import { getParentByPhone, getParentByEmail } from '../../lib/supabase/api/parents';
import { haptics } from '../../utils/haptics';
import { toast } from 'sonner';
import type { School } from '../../types';
import LogoHeader from '../common/LogoHeader';
import OnboardingProgressBar from './OnboardingProgressBar';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../stores/useAppStore';

interface ParentInformationPageProps {
  onNext: (data: ParentData) => void;
  onBack?: () => void;
  initialData?: ParentData;
}

export interface ParentData {
  parentId?: string;
  fullName: string;
  email: string;
  phone: string;
  schoolId: string;
  accessCode: string;
}

export default function ParentInformationPage({ onNext, onBack, initialData }: ParentInformationPageProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Read the school name the user already picked on the home screen
  const storeSelectedSchool = useAppStore((state) => state.selectedSchool);

  const [formData, setFormData] = useState<ParentData>(initialData || {
    fullName: '',
    email: '',
    phone: '',
    schoolId: '',
    accessCode: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    schoolId: '',
    accessCode: '',
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [showSmartCheckModal, setShowSmartCheckModal] = useState(false);
  const [smartMatchData, setSmartMatchData] = useState<{ id: string; name: string; type: 'update' | 'retry' } | null>(null);

  // Sync formData to a ref to avoid stale closure issues in async checks
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // New: Inline availability checking state
  const [availability, setAvailability] = useState<Record<string, { status: 'idle' | 'checking' | 'taken', name?: string }>>({});

  // Effect to check form for existing accounts (Reactive Scanner)
  useEffect(() => {
    const runRegistrationScan = async () => {
      const data = formData; // Use current render cycle data
      
      // Minimum requirements to even start checking: at least 2 fields with substantial content
      const hasName = data.fullName.trim().length >= 5;
      const hasPhone = data.phone.length >= 10;
      const hasEmail = data.email.includes('@') && data.email.includes('.');
      const hasSchool = !!data.schoolId;

      if (!hasSchool) return;
      if (!hasName && !hasPhone && !hasEmail) return;

      console.log('[Registration] [Scanner] Scanning form state...', { hasName, hasPhone, hasEmail });

      // 1. If we have a Phone or Email, check for existence in background
      // and set the 'taken' status for same-school collisions
      
      if (hasPhone) {
        try {
          const parent = await getParentByPhone(data.phone);
          if (parent) {
            const inSameSchool = parent.students.some(s => s.school_id === data.schoolId);
            const cleanName = parent.name.toLowerCase().replace(/\s+/g, ' ').trim();
            const cleanInputName = data.fullName.toLowerCase().replace(/\s+/g, ' ').trim();
            const nameMatches = cleanName === cleanInputName;
            const emailMatches = parent.email?.toLowerCase().trim() === data.email.toLowerCase().trim();

            // PERFECT MATCH CHECK
            if (nameMatches && (emailMatches || (hasPhone && data.phone === parent.phone))) {
               if (!showSmartCheckModal) {
                 console.log('[Registration] [Scanner] PERFECT MATCH via Phone block. Found ID:', parent.id);
                 setSmartMatchData({ id: parent.id, name: parent.name, type: 'update' });
                 setShowSmartCheckModal(true);
                 toast.success(`Welcome back, ${parent.name}`, { icon: <Sparkles className="text-yellow-500" /> });
               }
            } else if (inSameSchool) {
              setAvailability(prev => ({ ...prev, phone: { status: 'taken', name: parent.name } }));
            } else {
              setAvailability(prev => ({ ...prev, phone: { status: 'idle' } }));
            }
          } else {
            setAvailability(prev => ({ ...prev, phone: { status: 'idle' } }));
          }
        } catch (e) {
          console.error('[Scanner] Phone error:', e);
        }
      }

      if (hasEmail) {
        try {
          const parent = await getParentByEmail(data.email);
          if (parent) {
            const inSameSchool = parent.students.some(s => s.school_id === data.schoolId);
            const cleanName = parent.name.toLowerCase().replace(/\s+/g, ' ').trim();
            const cleanInputName = data.fullName.toLowerCase().replace(/\s+/g, ' ').trim();
            const nameMatches = cleanName === cleanInputName;
            const phoneMatches = parent.phone.replace(/\D/g, '') === data.phone.replace(/\D/g, '');

            // PERFECT MATCH CHECK
            if (nameMatches && (phoneMatches || (hasEmail && data.email === parent.email))) {
               if (!showSmartCheckModal) {
                 console.log('[Registration] [Scanner] PERFECT MATCH via Email block. Found ID:', parent.id);
                 setSmartMatchData({ id: parent.id, name: parent.name, type: 'update' });
                 setShowSmartCheckModal(true);
                 toast.success(`Welcome back, ${parent.name}`, { icon: <Sparkles className="text-yellow-500" /> });
               }
            } else if (inSameSchool) {
              setAvailability(prev => ({ ...prev, email: { status: 'taken', name: parent.name } }));
            } else {
              setAvailability(prev => ({ ...prev, email: { status: 'idle' } }));
            }
          } else {
            setAvailability(prev => ({ ...prev, email: { status: 'idle' } }));
          }
        } catch (e) {
          console.error('[Scanner] Email error:', e);
        }
      }
    };

    // Debounce slightly to avoid aggressive API hitting while typing
    const timer = setTimeout(runRegistrationScan, 500);
    return () => clearTimeout(timer);
  }, [formData.fullName, formData.phone, formData.email, formData.schoolId]);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const data = await getSchools();
        setSchools(data || []);

        // Only auto-fill if the user hasn't already picked one (for persistence)
        if (formData.schoolId) return;

        // Priority 1: match the school the user already selected on the home screen
        if (storeSelectedSchool && data && data.length > 0) {
          const match = data.find(
            (s) => s.name.toLowerCase() === storeSelectedSchool.toLowerCase()
          );
          if (match) {
            setFormData(prev => ({ ...prev, schoolId: match.id.toString() }));
            return; // done — no need to check single-school fallback
          }
        }

        // Priority 2: auto-select when there's only one school
        if (data && data.length === 1 && data[0]?.id) {
          setFormData(prev => ({ ...prev, schoolId: data[0].id.toString() }));
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      }
    }
    fetchSchools();
  }, [storeSelectedSchool]);

  const validateForm = (): boolean => {
    const newErrors = {
      fullName: validateName(formData.fullName),
      email: formData.email ? validateEmail(formData.email) : '',
      phone: validatePhoneNumber(formData.phone),
      schoolId: formData.schoolId ? '' : 'Select your school',
      accessCode: formData.accessCode.trim() ? '' : 'Code required',
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async () => {
    haptics.buttonPress();
    if (validateForm()) {
      setIsVerifying(true);
      try {
        // Step 1: Verify school access code
        const isValid = await verifySchoolCode(formData.schoolId, formData.accessCode);
        if (isValid) {
          setShowConfirmModal(true);
        } else {
          toast.error('Invalid School Access Code');
          setErrors(prev => ({ ...prev, accessCode: 'Invalid code' }));
        }
      } catch (error) {
        toast.error('Verification failed. Try again.');
        console.error('Registration verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleConfirm = () => {
    haptics.buttonPress();
    setShowConfirmModal(false);
    onNext(formData);
  };

  const inputClasses = (field: string) => {
    const isInvalid = !!errors[field as keyof typeof errors] || availability[field]?.status === 'taken';
    return `
      relative bg-white rounded-[16px] overflow-hidden
      transition-all duration-300 w-full h-[56px] px-12 border-[1.5px]
      ${isInvalid
        ? 'border-red-500 ring-4 ring-red-500/10 bg-red-50/5'
        : focusedField === field
          ? 'border-[#95e36c] ring-4 ring-[#95e36c]/10'
          : 'border-[#e5e7eb] hover:border-gray-300'
      }
      text-smart-body font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[#003630] 
      placeholder:text-gray-300 outline-none
    `;
  };

  const isSubmitDisabled = isVerifying || Object.values(availability).some(a => a.status === 'taken');

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader>
        <OnboardingProgressBar currentStep={1} totalSteps={3} className="py-0" />
      </LogoHeader>

      <div className="flex-1 px-6 pt-8 pb-32 max-w-lg mx-auto w-full relative z-0">
        {/* Header - Matching SearchPage style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="mb-[12px]">
            <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-smart-h1 text-[#003630] tracking-[-0.5px]">
              Parent/Guardian Info
            </h1>
          </div>
          <p className="text-smart-body text-[#6b7280] tracking-[-0.2px] pl-[11px]">
            Enter your contact details so we can securely link your child's school records.
          </p>
        </motion.div>

        {/* Form Fields Card */}
        <div className="space-y-1">
          {/* Label + Input Wrapper */}
          {[
            { id: 'fullName', label: 'Full Name', icon: User, placeholder: "Enter parent's full name", type: 'text' },
            { id: 'email', label: 'Email Address', icon: Mail, placeholder: "parent@example.com", type: 'email' },
            { id: 'phone', label: 'Phone Number', icon: Phone, placeholder: "0978123456", type: 'tel' }
          ].map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">{field.label}</label>
              <div className="relative group w-full">
                <field.icon
                  size={18}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${focusedField === field.id ? 'text-[#95e36c]' : 'text-gray-400'}`}
                />
                <input
                  type={field.type}
                  value={formData[field.id as keyof ParentData]}
                  onFocus={() => setFocusedField(field.id)}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (field.id === 'fullName') value = value.replace(/[^a-zA-Z\s.-]/g, '');
                    if (field.id === 'phone') {
                      value = value.replace(/[^\d+]/g, '').slice(0, 13);
                      // Real-time "wrong track" validation
                      const error = validatePhoneNumber(value);
                      const isLengthError = error.includes('10-digit') || (error === 'Invalid number format' && value.length < 10);

                      if (error && !isLengthError) {
                        setErrors(prev => ({ ...prev, phone: error }));
                      } else if (value.replace(/\D/g, '').length > 10 && !value.includes('260')) {
                        setErrors(prev => ({ ...prev, phone: 'Number is too long' }));
                      } else {
                        setErrors(prev => ({ ...prev, phone: '' }));
                      }

                      // Clear availability if length changes from 10
                      if (value.length !== 10 && availability.phone?.status !== 'idle') {
                        setAvailability(prev => ({ ...prev, phone: { status: 'idle' } }));
                      }
                    }
                    setFormData({ ...formData, [field.id]: value });
                    if (field.id !== 'phone') setErrors({ ...errors, [field.id]: '' });
                  }}
                  placeholder={field.placeholder}
                  className={inputClasses(field.id)}
                />

                {/* Inline loading/success indicators */}
                <AnimatePresence>
                  {availability[field.id]?.status === 'checking' && (
                    <motion.div
                      key={`${field.id}-verifying`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 z-[30] pointer-events-none"
                    >
                      <div className="px-3 py-1.5 flex items-center gap-2 bg-white/50 rounded-xl backdrop-blur-sm">
                        <Loader2 className="w-3.5 h-3.5 text-[#95e36c] animate-spin" />
                        <span className="text-[8px] uppercase font-bold text-gray-400 tracking-wider">Verifying</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="min-h-[24px] mt-2.5 pl-1 flex items-center">
                <AnimatePresence mode="wait">
                  {errors[field.id as keyof typeof errors] ? (
                    <motion.div
                      key="field-error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-red-500 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] flex items-center gap-2"
                    >
                      <div className="size-4 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle size={10} className="text-red-500" />
                      </div>
                      <p>{errors[field.id as keyof typeof errors]}</p>
                    </motion.div>
                  ) : availability[field.id]?.status === 'taken' ? (
                    <motion.div
                      key="availability-error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-red-500 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] flex items-center gap-2"
                    >
                      <div className="size-4 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle size={10} className="text-red-500" />
                      </div>
                      <p>This account already exists. Please try a different one.</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Select Institution</label>


            <div className="relative group">
              <SchoolIcon
                size={18}
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${focusedField === 'schoolId' ? 'text-[#95e36c]' : 'text-gray-400'}`}
              />
              <select
                value={formData.schoolId}
                onFocus={() => setFocusedField('schoolId')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => {
                  setFormData({ ...formData, schoolId: e.target.value });
                  setErrors({ ...errors, schoolId: '' });
                }}
                className={`${inputClasses('schoolId')} appearance-none pr-10 cursor-pointer`}
                style={{ WebkitAppearance: 'none' }}
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={18} />
              </div>
            </div>
            <div className="min-h-[22px] mt-1 pl-1 flex items-center">
              <AnimatePresence mode="wait">
                {errors.schoolId && (
                  <motion.div
                    key="school-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-500 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] flex items-center gap-1.5"
                  >
                    <div className="size-3.5 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle size={9} className="text-red-500" />
                    </div>
                    {errors.schoolId}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Access Code */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">School Access Code</label>
            <div className="relative group">
              <Lock
                size={18}
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${focusedField === 'accessCode' ? 'text-[#95e36c]' : 'text-gray-400'}`}
              />
              <input
                type="text"
                value={formData.accessCode}
                onFocus={() => setFocusedField('accessCode')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (value.length > 3) {
                    value = value.slice(0, 3) + '-' + value.slice(3, 7);
                  } else {
                    value = value.slice(0, 3);
                  }
                  setFormData({ ...formData, accessCode: value });
                  setErrors({ ...errors, accessCode: '' });
                }}
                placeholder="PRO-XXXX"
                className={`${inputClasses('accessCode')} tracking-[2px] font-bold text-center pl-4`}
              />
            </div>
            <div className="min-h-[22px] mt-1 pl-1 flex items-center">
              <AnimatePresence mode="wait">
                {errors.accessCode && (
                  <motion.div
                    key="access-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-500 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] flex items-center gap-1.5"
                  >
                    <div className="size-3.5 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle size={9} className="text-red-500" />
                    </div>
                    {errors.accessCode}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button Section - Exact Clone of payschoolfees page */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#e5e7eb] px-[28px] py-8 shadow-[0px_-10px_30px_rgba(0,0,0,0.04)] z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`btn-dark btn-tactile relative w-full h-[56px] rounded-[18px] overflow-hidden touch-manipulation transition-all duration-300 ${isSubmitDisabled ? 'cursor-not-allowed opacity-60 grayscale-[0.5]' : 'group'}`}
          >
            {/* Shine Effect */}
            {!isVerifying && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            )}

            {/* Content Container */}
            <div className={`relative z-10 flex items-center justify-center gap-[10px] h-full transition-all ${!isVerifying && 'group-active:scale-[0.98]'}`}>
              {isVerifying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white/60 tracking-[-0.3px] -translate-y-[1.5px]">
                    Verifying...
                  </p>
                </>
              ) : (
                <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white tracking-[-0.3px] -translate-y-[1.5px]">
                  Continue Registration
                </p>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#003630]">
                  <CheckCircle2 size={28} strokeWidth={2.5} />
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-xl font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] mb-2">
                Confirm Details
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Please verify that your details are correct before proceeding. This information cannot be easily changed later.
              </p>

              <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-6 text-sm">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Full Name</span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-gray-800">{formData.fullName}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Email</span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-gray-800">{formData.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Phone</span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-gray-800">{formData.phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">School Code</span>
                  <span className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-gray-800 tracking-wider">{formData.accessCode}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 rounded-[12px] font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3.5 rounded-[12px] font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-white bg-[#003630] hover:bg-[#004d45] transition-colors shadow-lg active:scale-95"
                >
                  Confirm & Next
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Smart Check Modal - Redesigned Edge-to-Edge with 12px corners */}
        {showSmartCheckModal && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setShowSmartCheckModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              style={{ borderRadius: '12px 12px 0 0' }}
              className="relative w-full sm:max-w-[440px] bg-white overflow-hidden shadow-2xl flex flex-col p-6 pb-safe sm:p-8 sm:!rounded-[12px]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 flex items-center justify-center shrink-0">
                  <Info size={32} style={{ color: '#a64444' }} />
                </div>
                <div>
                  <h3 className="text-[18px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] leading-tight">
                    Account Found
                  </h3>
                  <p className="text-[13px] text-gray-400 font-medium">Linked to {schools.find(s => s.id.toString() === formData.schoolId)?.name || 'institution'}</p>
                </div>
              </div>

              <div className="bg-gray-50/80 rounded-[12px] p-5 mb-8 border border-gray-100">
                <p className="text-[14px] text-[#003630]/80 leading-relaxed">
                  Hi <strong className="text-[#003630]">{smartMatchData?.name}</strong>, you already have an active profile with us. 
                  <br /><br />
                  Would you like to <strong>update your details</strong> or are you restarting a <strong>prior session</strong>?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    console.log('[Registration] SmartCheck: Update Information clicked');
                    setShowSmartCheckModal(false);
                    // Pass the existing parent ID to onNext
                    onNext({ ...formData, parentId: smartMatchData?.id });
                  }}
                  className="w-full h-[56px] rounded-[12px] bg-[#003630] text-white font-bold text-[16px] hover:bg-[#004d45] transition-all active:scale-[0.98] shadow-lg shadow-[#003630]/10 flex items-center justify-center gap-2"
                >
                  Update Information
                  <ChevronRight size={18} />
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      console.log('[Registration] SmartCheck: Sign up again clicked');
                      setShowSmartCheckModal(false);
                      // Treat as retry - we still use the existing ID to avoid collisions
                      onNext({ ...formData, parentId: smartMatchData?.id });
                    }}
                    className="h-[52px] rounded-[12px] bg-white text-[#003630] font-bold text-[14px] border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    Sign up again
                  </button>
                  <button
                    onClick={() => setShowSmartCheckModal(false)}
                    className="h-[52px] rounded-[12px] bg-white text-gray-400 font-bold text-[14px] border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    Go Back
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <div className="w-12 h-1.5 rounded-full bg-gray-100 sm:hidden" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}