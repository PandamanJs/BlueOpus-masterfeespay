import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import svgPaths from "../imports/svg-o96q0cdj2h";
import { toast } from "sonner";
import { ChevronDown, Delete, Check, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { saveLastPhone, getLastPhone } from "../utils/preferences";
import { hapticFeedback } from "../utils/haptics";
import { useOfflineManager } from "../hooks/useOfflineManager";

import { getInstitutionType } from "../data/students";
import LogoHeader from "./common/LogoHeader";

/**
 * Component Props Interface
 * Defines the contract for this component's API
 */
interface SchoolDetailsPageProps {
  schoolName: string;  // Name of the selected school
  schoolLogo?: string | null; // Logo of the selected school
  onProceed: (userName: string, userPhone: string) => void;  // Callback when validation succeeds
  onBack: () => void;  // Callback for back navigation
  onRegistration: () => void; // Callback for registration
}


/**
 * Get school initials for display
 * Extracts first letter of first two words in school name
 * 
 * @param {string} name - School name
 * @returns {string} Two-letter initials (e.g., "TE" for "Twalumbu Educational Center")
 */
const getSchoolInitials = (name: string): string => {
  return name
    .split(" ")
    .map(word => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

/**
 * Logo Component
 * Renders the Master-Fees diamond checkmark logo in the header
 * 
 * @param {object} props - Component props
 * @param {string} props.schoolName - Name of the selected school (reserved for future use)
 * @returns {JSX.Element} SVG logo with drop shadow filter
 * 
 * Visual: Black diamond with green checkmark stroke
 */


function SchoolBadge({ schoolName, schoolLogo }: { schoolName: string; schoolLogo?: string | null }) {
  const initials = getSchoolInitials(schoolName);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex justify-center items-center"
      data-name="School Badge"
    >
      <div
        className={`w-[120px] h-[120px] flex items-center justify-center overflow-hidden ${schoolLogo
          ? "bg-transparent border-0 shadow-none"
          : "rounded-[28px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.06)] border border-[#eef0f2]"
          }`}
      >
        {schoolLogo ? (
          <img
            src={schoolLogo}
            alt={schoolName}
            className="max-w-[95%] max-h-[95%] object-contain mix-blend-multiply"
          />
        ) : (
          <span className="text-[#003630] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[36px] tracking-[-1px]">
            {initials}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SchoolInfoText({ schoolName, isUniversity }: { schoolName: string; isUniversity?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col gap-2 items-center text-center w-full max-w-[95%] px-[24px]"
    >
      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[13px] text-gray-400 uppercase tracking-[2px]">{isUniversity ? 'Pay Tuition for' : 'Pay School fees for'}</p>
      <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] leading-tight text-black tracking-tight whitespace-nowrap truncate w-full">
        {schoolName}
      </h1>
    </motion.div>
  );
}



import { getParentDataByPhone } from "../data/students";

/**
 * NumericKeypad Component
 * A custom 3x4 grid for phone number entry
 */
const NumericKeypad = React.memo(({ onNumberClick, onDelete, onClear }: {
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  onClear: () => void;
}) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"];

  return (
    <div className="grid grid-cols-3 gap-[10px] w-full max-w-[340px] mx-auto pb-4">
      {keys.map((key) => {
        const isAction = key === "DEL" || key === "C";
        return (
          <motion.button
            key={key}
            whileTap={{
              scale: 0.92,
              transition: { type: "spring", stiffness: 800, damping: 15 }
            }}
            onClick={() => {
              hapticFeedback('light');
              if (key === "DEL") onDelete();
              else if (key === "C") onClear();
              else onNumberClick(key);
            }}
            style={{
              boxShadow: isAction
                ? "0px 1px 0px rgba(0,0,0,0.12), 0px 3px 8px rgba(0,0,0,0.06)"
                : "0px 1px 0px rgba(0,0,0,0.10), 0px 4px 10px rgba(0,0,0,0.07), inset 0px 1px 0px rgba(255,255,255,0.95)",
            }}
            className={`h-[60px] rounded-[18px] flex items-center justify-center text-[20px] font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] select-none touch-manipulation ${isAction
              ? "bg-[#eceef0] text-[#6b7280]"
              : "bg-white border border-[#e5e7eb] text-[#003630]"
              }`}
          >
            {key === "DEL" ? <Delete className="size-5" /> : key}
          </motion.button>
        );
      })}
    </div>
  );
});

/**
 * KeypadSheet Component
 * A premium slide-up bottom sheet containing the keypad and formatted display
 */
function KeypadSheet({
  isOpen,
  onClose,
  value,
  onValueChange,
  onDone,
  isValidating,
  hasError
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onValueChange: (val: string) => void;
  onDone: () => void;
  isValidating: boolean;
  hasError: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNumberClick = (num: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    
    if (value.length >= 10 && start === end) return;
    
    const newVal = value.substring(0, start) + num + value.substring(end);
    const filtered = newVal.replace(/\D/g, "").slice(0, 10);
    onValueChange(filtered);
    
    // Restore and move cursor
    setTimeout(() => {
      input.focus();
      const nextPos = start + 1;
      input.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const handleDelete = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    
    let newVal = "";
    let nextPos = start;

    if (start !== end) {
      newVal = value.substring(0, start) + value.substring(end);
      nextPos = start;
    } else if (start > 0) {
      newVal = value.substring(0, start - 1) + value.substring(start);
      nextPos = start - 1;
    } else {
      return;
    }
    
    onValueChange(newVal.replace(/\D/g, ""));
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const onClear = () => {
    onValueChange("");
    inputRef.current?.focus();
  };

  const cleaned = value.replace(/\D/g, "");
  const canDone = cleaned.length === 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-black/40"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 35,
              stiffness: 400,
              mass: 0.8
            }}
            className="fixed bottom-0 left-0 right-0 z-[1000] mx-auto max-w-[600px]"
          >
            <div className="flex justify-center pt-[12px] pb-[8px]">
              <div className="w-[36px] h-[5px] bg-white/80 rounded-full shadow-sm" />
            </div>

            <div className="bg-white rounded-t-[32px] shadow-[0px_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
              <div className="h-[3px] bg-gradient-to-r from-transparent via-[#95e36c] to-transparent" />

              <div className="flex-1 px-[24px] pt-[28px] pb-[40px] relative">
                <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-gradient-to-br from-[#95e36c]/5 to-transparent rounded-bl-full pointer-events-none" />

                <div className="relative flex items-start justify-between mb-[32px]">
                  <div>
                    <div className="flex items-center gap-[8px] mb-[6px]">
                      <div className="w-[4px] h-[20px] bg-gradient-to-b from-[#95e36c] to-[#7dd054] rounded-full" />
                      <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[24px] text-[#003630] tracking-[-0.5px] leading-[1.1]">
                        Authentication
                      </h2>
                    </div>
                    <p className="font-['Inter:Regular',sans-serif] text-[13px] text-[#6b7280] tracking-[-0.1px] ml-[12px]">
                      Enter your mobile number to verify your details
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#f5f7f9]/60 backdrop-blur-sm border border-[#e5e7eb]/50 hover:bg-[#e5e7eb]/80 active:scale-90 transition-all touch-manipulation shadow-sm"
                  >
                    <X className="w-[16px] h-[16px] text-[#6b7280]" strokeWidth={2.5} />
                  </button>
                </div>

                <div className={`relative w-full h-[72px] mb-[32px] transition-all duration-300 ${
                  hasError ? "z-10" : ""
                }`}>
                  <input
                    ref={inputRef}
                    type="tel"
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      onValueChange(val);
                    }}
                    onFocus={() => hapticFeedback('light')}
                    placeholder="0971 234 567"
                    className={`w-full h-full text-center font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[26px] tracking-tight transition-all duration-300 rounded-full border px-12 outline-none appearance-none shadow-none focus:ring-4 ${
                      hasError
                        ? "bg-red-50 border-red-400 text-red-600 focus:ring-red-500/10"
                        : "bg-[#f5f7f9] border-[#e5e7eb] text-[#003630] focus:bg-white focus:border-[#95e36c] focus:ring-[#95e36c]/10"
                    } placeholder:text-[#b4b9c3]/40 placeholder:font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] placeholder:text-[18px]`}
                    autoComplete="tel"
                  />
                  {isValidating && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#95E36C] border-t-transparent" />
                    </div>
                  )}
                </div>

                <NumericKeypad
                  onNumberClick={handleNumberClick}
                  onDelete={handleDelete}
                  onClear={onClear}
                />

                {/* Action Button */}
                <button
                  disabled={!canDone || isValidating}
                  onClick={() => {
                    hapticFeedback('medium');
                    onDone();
                  }}
                  className="relative w-full h-[60px] rounded-[18px] transition-all touch-manipulation overflow-hidden group mt-[16px]"
                >
                  <div className={`absolute inset-0 transition-colors ${!canDone || isValidating
                    ? "bg-[#f5f7f9]"
                    : "bg-[#003630] group-hover:bg-[#004d45]"
                    }`} />

                  {canDone && !isValidating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  )}

                  <div className="absolute inset-0 shadow-[0px_6px_20px_rgba(0,54,48,0.25)] group-active:shadow-[0px_2px_8px_rgba(0,54,48,0.2)]" />

                  <div className={`relative z-10 flex items-center justify-center gap-[10px] h-full transition-transform group-active:scale-[0.98] ${!canDone || isValidating ? "text-[#9ca3af]" : "text-white"
                    }`}>
                    <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[17px] tracking-[-0.2px]">
                      {isValidating ? "Verifying..." : "Continue"}
                    </span>
                    {!isValidating && (
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Check className="size-5" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                </button>
              </div>

              {/* Bottom Safe Area */}
              <div className="h-[env(safe-area-inset-bottom,20px)] bg-white/95" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Bottom sheet keypad implementation follows below

// Text Input component is no longer needed on the main page as it's moved to the sheet
// Removing related InputSection components for cleaner code

interface ProceedButtonProps {
  onClick: () => void;
  disabled: boolean;
  isOnline: boolean;
}

function ProceedButton({ onClick, disabled, isOnline }: ProceedButtonProps) {
  return (
    <div className="w-full max-w-[600px] px-[24px]">
      <button
        onClick={() => {
          hapticFeedback('medium');
          onClick();
        }}
        disabled={disabled}
        className={`w-full h-[54px] rounded-[16px] transition-all duration-300 relative group overflow-hidden btn-tactile ${disabled
          ? 'bg-gray-300 cursor-not-allowed opacity-60'
          : 'glass-dark shadow-lg hover:shadow-xl'
          }`}
        data-name="Button"
      >
        {/* Shine Effect */}
        {!disabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        )}

        <div className="relative z-10 flex items-center justify-center gap-[10px] h-full">
          <p className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] tracking-[-0.3px] ${disabled ? 'text-white/60' : 'text-white'}`}>
            {isOnline ? 'Proceed' : 'Go Online to Proceed'}
          </p>
          {!disabled && (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}

function RegistrationButton({ onRegistration }: { onRegistration: () => void }) {
  return (
    <div className="w-full max-w-[600px] px-[24px]">
      <button
        onClick={() => {
          hapticFeedback('light');
          onRegistration();
        }}
        className="w-full h-[54px] rounded-[16px] glass transition-all duration-300 relative group overflow-hidden btn-tactile shadow-sm hover:shadow-md border border-[#003630]/20"
        data-name="Registration Button"
      >
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#003630]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

        <div className="relative z-10 flex items-center justify-center gap-[10px] h-full">
          <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] tracking-[-0.3px] text-[#003630]">
            Registration
          </p>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3.75V14.25M3.75 9H14.25" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
    </div>
  );
}


function Footer() {
  return (
    <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] gap-[3px] items-center leading-[normal] not-italic text-[#bdbdbd] text-[10px] text-center mt-auto mb-[24px] w-full max-w-[300px]">
      <p className="w-full whitespace-pre-wrap">
        <span>{`view the `}</span>
        <span className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline">terms</span>
        <span>{` and `}</span>
        <span className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline">conditions</span>
        <span>{`  of service`}</span>
      </p>
      <p className="w-full">All rights reserved ©</p>
    </div>
  );
}

function DecorativeShapes() {
  return (
    <>
      <motion.div
        className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.6322111487388611)+(var(--transform-inner-height)*0.7254649996757507)))] items-center justify-center left-[calc(8%)] bottom-[80px] w-[calc(1px*((var(--transform-inner-height)*0.6882590651512146)+(var(--transform-inner-width)*0.7747961282730103)))] z-0"
        style={{ "--transform-inner-width": "122.546875", "--transform-inner-height": "60.953125" } as React.CSSProperties}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          y: [0, 0, -12, 0],
          rotate: [0, 0, -4, 0],
          scale: [1, 1, 1.04, 1],
        }}
        transition={{
          opacity: { duration: 0.5, delay: 0.2 },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
          rotate: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
          scale: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
        }}
      >
        <div className="flex-none rotate-[39.213deg] skew-x-[355.733deg]">
          <div className="h-[60.96px] relative w-[122.559px]" data-name="path60">
            <div className="absolute inset-[-28.71%_-14.28%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 158 96">
                <motion.path
                  d={svgPaths.p23b65fc0}
                  id="path60"
                  stroke="var(--stroke-0, #E0F7D4)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="35"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.6322111487388611)+(var(--transform-inner-height)*0.7254649996757507)))] items-center justify-center left-[calc(13%)] bottom-[180px] w-[calc(1px*((var(--transform-inner-height)*0.6882590651512146)+(var(--transform-inner-width)*0.7747961282730103)))] z-0"
        style={{ "--transform-inner-width": "158.96875", "--transform-inner-height": "97.015625" } as React.CSSProperties}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          y: [0, 0, -15, 0],
          rotate: [0, 0, 5, 0],
          scale: [1, 1, 1.05, 1],
        }}
        transition={{
          opacity: { duration: 0.5, delay: 0.6 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 },
          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 },
        }}
      >
        <div className="flex-none rotate-[39.213deg] skew-x-[355.733deg]">
          <div className="h-[97.03px] relative w-[158.975px]" data-name="path60 (Stroke)">
            <div className="absolute inset-[-1.55%_-0.94%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 162 101">
                <motion.path
                  d={svgPaths.p1abe0160}
                  id="path60 (Stroke)"
                  stroke="var(--stroke-0, #003630)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut", delay: 0.6 }}
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.6322111487388611)+(var(--transform-inner-height)*0.7254649996757507)))] items-center justify-center right-[calc(8%)] bottom-[60px] w-[calc(1px*((var(--transform-inner-height)*0.6882590651512146)+(var(--transform-inner-width)*0.7747961282730103)))] z-0"
        style={{ "--transform-inner-width": "122.546875", "--transform-inner-height": "60.953125" } as React.CSSProperties}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          y: [0, 0, -18, 0],
          rotate: [0, 0, 6, 0],
          scale: [1, 1, 1.06, 1],
        }}
        transition={{
          opacity: { duration: 0.5, delay: 1 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 },
          rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 },
          scale: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 },
        }}
      >
        <div className="flex-none rotate-[39.213deg] skew-x-[355.733deg]">
          <div className="h-[60.96px] relative w-[122.559px]" data-name="path60">
            <div className="absolute inset-[-28.71%_-14.28%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 158 96">
                <motion.path
                  d={svgPaths.p23b65fc0}
                  id="path60"
                  stroke="var(--stroke-0, #E0F7D4)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="35"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut", delay: 1 }}
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}



export default function SchoolDetailsPage({ schoolName, schoolLogo, onProceed, onRegistration }: SchoolDetailsPageProps) {
  const institutionType = getInstitutionType(schoolName);
  const isUniversity = institutionType === 'university';
  const { isOnline } = useOfflineManager();

  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [hasInputError, setHasInputError] = useState(false);

  // Load last used phone number
  useEffect(() => {
    const lastPhone = getLastPhone();
    if (lastPhone) {
      setPhoneNumber(formatPhoneNumber(lastPhone));
    }
  }, []);

  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, "");
  };

  const handlePhoneValueChange = (val: string) => {
    const formatted = formatPhoneNumber(val);
    setPhoneNumber(formatted);
    setIsPhoneValid(false);
    setHasInputError(false); // Clear error as soon as user edits
  };
  const validatePhoneNumber = async (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");

    // Zambian numbers must be exactly 10 digits (e.g. 0978253506)
    if (cleaned.length !== 10) {
      setHasInputError(true);
      toast.error("Invalid phone number", {
        description: "Please enter your full 10-digit Zambian mobile number (e.g. 0978253506).",
      });
      return;
    }

    setIsValidating(true);
    try {
      const parentData = await getParentDataByPhone(cleaned);

      if (!parentData) {
        setHasInputError(true);
        toast.error("Number not found", {
          description: "This phone number is not registered in our system.",
        });
        return;
      }

      setUserName(parentData.name);
      setIsPhoneValid(true);
      saveLastPhone(cleaned);
      setIsKeypadOpen(false); // Close on success

      // Short delay for the user to see success before navigating
      setTimeout(() => {
        onProceed(parentData.name, phone);
      }, 300);

    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };



  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen w-full flex justify-center">
      <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen overflow-hidden flex flex-col items-center" data-name="Page 1">
        <DecorativeShapes />
        <motion.div
          animate={{
            opacity: isKeypadOpen ? 0.4 : 1,
            scale: isKeypadOpen ? 0.96 : 1,
            y: isKeypadOpen ? -10 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full flex-1 flex flex-col items-center min-h-0"
        >
          <LogoHeader showBackButton onBack={() => {
            hapticFeedback('light');
            // Navigates back to search via App.tsx prop logic
            // Since this component uses onBack prop
            onBack && onBack();
          }} />

          {/* Main Content Area - Top Aligned for surgical margin control */}
          <div className="flex-1 w-full flex flex-col items-center justify-start relative z-10 px-6 overflow-y-auto no-scrollbar">

            {/* 1. Logo - Positioned from top */}
            <div className="mt-[190px]">
              <SchoolBadge schoolName={schoolName} schoolLogo={schoolLogo} />
            </div>

            {/* 2. School Title - Positioned from logo */}
            <div className="mt-[40px]">
              <SchoolInfoText schoolName={schoolName} isUniversity={isUniversity} />
            </div>

            <AnimatePresence>
              {!isKeypadOpen && (
                <motion.div
                  key="action-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '90px' }}
                >
                  {/* 3. Proceed Button - Positioned in the lower-middle visual zone */}
                  <div className="w-full flex justify-center">
                    <ProceedButton
                      onClick={() => setIsKeypadOpen(true)}
                      disabled={!isOnline}
                      isOnline={isOnline}
                    />
                  </div>

                  {/* 4. Registration Button - Positioned from proceed button */}
                  <div className="mt-[20px] w-full flex justify-center">
                    <RegistrationButton onRegistration={onRegistration} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>

        {/* Fixed Footer at the bottom */}
        <div className="w-full flex justify-center pb-10 pt-6 relative z-20 bg-[#f9fafb]">
          <Footer />
        </div>

        {/* Slide-up Keypad Sheet */}
        <KeypadSheet
          isOpen={isKeypadOpen}
          onClose={() => { setIsKeypadOpen(false); setHasInputError(false); }}
          value={phoneNumber}
          onValueChange={handlePhoneValueChange}
          onDone={() => validatePhoneNumber(phoneNumber)}
          isValidating={isValidating}
          hasError={hasInputError}
        />
      </div>
    </div>
  );
}




