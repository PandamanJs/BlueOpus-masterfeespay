import React, { useState, useEffect } from "react";
import { LogIn, Phone } from "lucide-react";
import { toast } from "sonner";
import { saveLastPhone, getLastPhone } from "../utils/preferences";
import { hapticFeedback } from "../utils/haptics";
import { useOfflineManager } from "../hooks/useOfflineManager";
import { getParentDataByPhone } from "../data/students";
import LogoHeader from "./common/LogoHeader";

interface SchoolDetailsPageProps {
  schoolName: string;
  schoolLogo?: string | null;
  onProceed: (userName: string, userPhone: string, userId: string) => void;
  onBack: () => void;
  onRegistration: () => void;
}

const getSchoolInitials = (name: string): string => {
  return name.split(" ").map(word => word[0]).slice(0, 2).join("").toUpperCase();
};

function SchoolBadge({ schoolName, schoolLogo }: { schoolName: string; schoolLogo?: string | null }) {
  const initials = getSchoolInitials(schoolName);
  return (
    <div className="flex justify-center items-center mb-32">
      <div className="w-[140px] h-[140px] flex items-center justify-center overflow-hidden">
        {schoolLogo ? (
          <img src={schoolLogo} alt={schoolName} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="w-[120px] h-[120px] rounded-[32px] bg-[#00e676] flex items-center justify-center text-[#003630] font-['Inter',sans-serif] font-bold text-[48px] shadow-sm">
            <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 12L12 22L22 12L12 2Z" />
              <path d="M9 13L12 10L15 13" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchoolDetailsPage({ schoolName, schoolLogo, onProceed, onRegistration }: SchoolDetailsPageProps) {
  const { isOnline } = useOfflineManager();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [hasInputError, setHasInputError] = useState(false);

  useEffect(() => {
    const lastPhone = getLastPhone();
    if (lastPhone) setPhoneNumber(lastPhone);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(val);
    setHasInputError(false);
  };

  const validateAndProceed = async () => {
    if (phoneNumber.length !== 10) {
      setHasInputError(true);
      toast.error("Invalid phone number", { description: "Please enter a 10-digit mobile number." });
      return;
    }

    setIsValidating(true);
    try {
      const parentData = await getParentDataByPhone(phoneNumber);
      if (!parentData) {
        setHasInputError(true);
        toast.error("Account not found", { description: "This number is not registered." });
        return;
      }
      saveLastPhone(phoneNumber);
      hapticFeedback('medium');
      onProceed(parentData.name, phoneNumber, parentData.id);
    } catch (error) {
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white min-h-screen w-full flex flex-col font-['Inter',sans-serif]">
      <LogoHeader />

      <main
        id="main-content-area"
        className="flex-1 w-full max-w-[300px] mx-auto flex flex-col items-center px-6"
        style={{ paddingTop: '20px' }}
      >
        <div
          className="flex justify-center items-center"
          style={{ marginBottom: '20px' }}
        >
          <SchoolBadge schoolName={schoolName} schoolLogo={schoolLogo} />
        </div>

        <h1 className="text-[32px] font-['Agrandir:Grand_Heavy',sans-serif] font-black text-[#003630] text-center mb-1 tracking-[-0.03em] leading-tight">
          {schoolName}
        </h1>

        <p className="text-[15px] text-gray-400 font-medium text-center mb-8">
          Sign In to your payments portal.
        </p>

        <div className="w-full space-y-4">
          <div className="relative group">
            <div 
              className="absolute top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors pointer-events-none"
              style={{ left: '10px' }}
            >
              <Phone size={18} strokeWidth={2.5} />
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="09x-xxx-xxxx"
              className={`w-full h-[54px] px-5 text-center rounded-[12px] border transition-all outline-none text-[16px] font-medium tracking-wide placeholder:text-gray-200 ${hasInputError ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-100 focus:border-black'
                }`}
            />
          </div>

          <button
            onClick={validateAndProceed}
            disabled={isValidating || !isOnline}
            className="w-full h-[60px] rounded-[18px] btn-dark btn-tactile transition-all flex items-center justify-center gap-2 text-white font-semibold text-[16px]"
          >
            {isValidating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2 h-full">
                <span>Sign In</span>
                <LogIn size={20} strokeWidth={2.5} className="mt-[1px]" />
              </div>
            )}
          </button>

          <div className="flex items-center justify-center py-6">
            <span className="text-[13px] font-bold text-gray-200 tracking-[0.2em] uppercase">OR</span>
          </div>

          <button
            onClick={onRegistration}
            className="w-full h-[54px] rounded-[12px] border border-gray-100 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center text-gray-500 font-semibold text-[16px]"
          >
            Register Now
          </button>
        </div>
      </main>

      <footer className="w-full max-w-[300px] mx-auto pb-8 pt-10 text-center">
        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
          View our <span className="underline decoration-gray-200 underline-offset-4 cursor-pointer hover:text-black">terms</span> and <span className="underline decoration-gray-200 underline-offset-4 cursor-pointer hover:text-black">conditions</span> of service.<br />
          <span className="text-gray-400/50 mt-1 block font-normal">Blue Opus 2026</span>
        </p>
      </footer>
    </div>
  );
}
