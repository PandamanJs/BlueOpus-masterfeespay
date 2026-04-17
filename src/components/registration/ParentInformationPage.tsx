import { useState, useEffect } from 'react';
import { User, Mail, Phone, School as SchoolIcon, Lock, Loader2, ChevronDown, CheckCircle2, AlertTriangle, X } from 'lucide-react';
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

  // New: Inline availability checking state
  const [availability, setAvailability] = useState<Record<string, { status: 'idle' | 'checking' | 'taken', name?: string }>>({});

  // Effect to check field availability (luxe debounce-like feel)
  useEffect(() => {
    const checkField = async (id: string, value: string) => {
      if (!value || value.length < 5) return;
      console.log(`[Registration] Inline check for ${id}:`, value);

      // Only check if it looks complete
      if (id === 'phone' && value.length === 10) {
        setAvailability(prev => ({ ...prev, [id]: { status: 'checking' } }));
        try {
          const parent = await getParentByPhone(value);
          console.log(`[Registration] Phone match result for ${value}:`, !!parent);
          if (parent) {
            setAvailability(prev => ({ ...prev, [id]: { status: 'taken', name: parent.name } }));
          } else {
            setAvailability(prev => ({ ...prev, [id]: { status: 'idle' } }));
          }
        } catch (e) {
          console.error('[Registration] Phone check error:', e);
          setAvailability(prev => ({ ...prev, [id]: { status: 'idle' } }));
        }
      }

      if (id === 'email' && value.includes('@') && value.includes('.')) {
        setAvailability(prev => ({ ...prev, [id]: { status: 'checking' } }));
        try {
          const parent = await getParentByEmail(value);
          console.log(`[Registration] Email match result for ${value}:`, !!parent);
          if (parent) {
            setAvailability(prev => ({ ...prev, [id]: { status: 'taken', name: parent.name } }));
          } else {
            setAvailability(prev => ({ ...prev, [id]: { status: 'idle' } }));
          }
        } catch (e) {
          console.error('[Registration] Email check error:', e);
          setAvailability(prev => ({ ...prev, [id]: { status: 'idle' } }));
        }
      }
    };

    const timer = setTimeout(() => {
      checkField('phone', formData.phone);
      checkField('email', formData.email);
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.phone, formData.email]);

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

  const inputClasses = (field: string) => `
    relative bg-white rounded-[16px] overflow-hidden
    transition-all duration-300 w-full h-[56px] px-12
    ${errors[field as keyof typeof errors]
      ? 'ring-4 ring-red-500/10 border-[1.5px] border-red-500 bg-red-50/20'
      : focusedField === field
        ? 'ring-4 ring-[#95e36c]/20 border-[1.5px] border-[#95e36c] shadow-lg'
        : 'border-[1.5px] border-[#e5e7eb] shadow-sm hover:border-[#d1d5db]'
    }
    text-[15px] font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[#003630] placeholder:text-gray-300 focus:outline-none
  `;

  const isSubmitDisabled = isVerifying || Object.values(availability).some(a => a.status === 'taken');

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader showBackButton={!!onBack} onBack={onBack} />

      <div className="w-full flex justify-center pt-6 pb-2">
        <OnboardingProgressBar currentStep={1} totalSteps={3} />
      </div>

      <div className="flex-1 px-6 pt-2 pb-32 max-w-lg mx-auto w-full relative z-0">
        {/* Header - Matching SearchPage style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="mb-[12px]">
            <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.5px]">
              Parent/Guardian Info
            </h1>
          </div>
          <p className="text-[14px] text-[#6b7280] tracking-[-0.2px] pl-[11px]">
            Enter your contact details so we can securely link your child's school records.
          </p>
        </motion.div>

        {/* Form Fields Card */}
        <div className="space-y-4">
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
                    if (field.id === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, [field.id]: value });
                    setErrors({ ...errors, [field.id]: '' });
                  }}
                  placeholder={field.placeholder}
                  className={inputClasses(field.id)}
                />

                {/* Availability Badge */}
                <AnimatePresence>
                  {(availability[field.id]?.status === 'taken' || availability[field.id]?.status === 'checking') && (
                    <motion.div
                      key={`${field.id}-status`}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 z-[30] pointer-events-none"
                    >
                      {availability[field.id]?.status === 'taken' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-[8px] shadow-[0_2px_10px_rgba(244,63,94,0.1)] backdrop-blur-md transition-all duration-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                          <span 
                            className="text-[10px] font-black !text-[#f43f5e] uppercase tracking-widest whitespace-nowrap"
                            style={{ color: '#f43f5e' }}
                          >
                            can't use this it's already exists try a different one
                          </span>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 flex items-center gap-2 bg-white/50 rounded-xl backdrop-blur-sm">
                          <Loader2 className="w-3.5 h-3.5 text-[#95e36c] animate-spin" />
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Verifying</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {errors[field.id as keyof typeof errors] && (
                <p className="text-[10px] text-red-500 pl-1 mt-1.5 font-semibold">{errors[field.id as keyof typeof errors]}</p>
              )}
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
            {errors.schoolId && <p className="text-[10px] text-red-500 pl-1 mt-1 font-semibold">{errors.schoolId}</p>}
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
            {errors.accessCode && <p className="text-[10px] text-red-500 pl-1 mt-1 font-semibold">{errors.accessCode}</p>}
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
      </AnimatePresence>
    </div>
  );
}