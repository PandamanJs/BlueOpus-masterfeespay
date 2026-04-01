import { useState, useEffect } from 'react';
import { User, Mail, Phone, School as SchoolIcon, Lock, Loader2, ChevronDown } from 'lucide-react';
import { getSchools } from '../../lib/supabase/api/schools';
import { verifySchoolCode } from '../../lib/supabase/api/security';
import { haptics } from '../../utils/haptics';
import { toast } from 'sonner';
import type { School } from '../../types';
import LogoHeader from '../common/LogoHeader';
import { motion, AnimatePresence } from 'motion/react';

interface ParentInformationPageProps {
  onNext: (data: ParentData) => void;
}

export interface ParentData {
  fullName: string;
  email: string;
  phone: string;
  schoolId: string;
  accessCode: string;
}

export default function ParentInformationPage({ onNext }: ParentInformationPageProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ParentData>({
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

  useEffect(() => {
    async function fetchSchools() {
      try {
        const data = await getSchools();
        setSchools(data || []);
        if (data && data.length === 1 && data[0]?.id) {
          setFormData(prev => ({ ...prev, schoolId: data[0].id.toString() }));
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      }
    }
    fetchSchools();
  }, []);

  const validateForm = (): boolean => {
    const newErrors = {
      fullName: '', email: '', phone: '', schoolId: '', accessCode: '',
    };
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }
    
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^0[79][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Use format 097xxxxxxx';
      isValid = false;
    }

    if (!formData.schoolId) {
      newErrors.schoolId = 'Select your school';
      isValid = false;
    }

    if (!formData.accessCode.trim()) {
      newErrors.accessCode = 'Code required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    haptics.buttonPress();
    if (validateForm()) {
      setIsVerifying(true);
      try {
        const isValid = await verifySchoolCode(formData.schoolId, formData.accessCode);
        if (isValid) {
          onNext(formData);
        } else {
          toast.error('Invalid School Access Code');
          setErrors(prev => ({ ...prev, accessCode: 'Invalid code' }));
        }
      } catch (error) {
        toast.error('Verification failed. Try again.');
      } finally {
        setIsVerifying(false);
      }
    }
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

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif]">
      <LogoHeader />

      <div className="flex-1 px-6 pt-8 pb-32 max-w-lg mx-auto w-full">
        {/* Header - Matching SearchPage style */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-[8px] mb-[12px]">
            <div className="w-[3px] h-[32px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full" />
            <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.5px]">
              Registration Info
            </h1>
          </div>
          <p className="text-[14px] text-[#6b7280] tracking-[-0.2px] pl-[11px]">
            Please enter your accurate contact details to link your school records securely.
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
              <div className="relative group">
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
              </div>
              {errors[field.id as keyof typeof errors] && (
                <p className="text-[10px] text-red-500 pl-1 font-semibold">{errors[field.id as keyof typeof errors]}</p>
              )}
            </div>
          ))}

          {/* School Selector - Custom Styled */}
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
                  setFormData({ ...formData, accessCode: e.target.value.toUpperCase() });
                  setErrors({ ...errors, accessCode: '' });
                }}
                placeholder="PRO-XXXX"
                className={`${inputClasses('accessCode')} tracking-[2px] font-bold text-center pl-4`}
              />
            </div>
            {errors.accessCode && <p className="text-[10px] text-red-500 pl-1 font-semibold">{errors.accessCode}</p>}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button Section - Exact Clone of payschoolfees page */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#e5e7eb] px-[28px] pt-4 pb-16 shadow-[0px_-4px_16px_rgba(0,0,0,0.06)] z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isVerifying}
            className={`btn-dark btn-tactile relative w-full h-[56px] rounded-[18px] overflow-hidden touch-manipulation transition-all duration-300 ${isVerifying ? 'cursor-not-allowed opacity-60' : 'group'}`}
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
                  <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white/60 tracking-[-0.3px]">
                    Verifying...
                  </p>
                </>
              ) : (
                <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white tracking-[-0.3px]">
                  Continue Registration
                </p>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}