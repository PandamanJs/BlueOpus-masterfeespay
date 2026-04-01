import { useState } from "react";
import svgPaths from "../imports/svg-1jclls5e96";
import LogoHeader from "./common/LogoHeader";

interface ReceiptsPageProps {
  onBack: () => void;
  onNext: () => void;
  totalAmount?: number;
}



function InfoBanner() {
  return (
    <div className="relative bg-gradient-to-r from-[#e0f7d4] to-[#d0f0c0] box-border content-stretch flex flex-col gap-[10px] h-[50px] items-start p-[10px] rounded-[14px] border-[1.5px] border-[#95e36c]/30 shrink-0 w-[297px] overflow-hidden shadow-sm">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#95e36c] rounded-r-full" />
      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[15px] not-italic relative shrink-0 text-[#003630] text-[8px] tracking-[-0.08px] w-full pl-[6px]">The receipts for all your transactions will be sent to your whatsapp as well as your email upon payment.</p>
    </div>
  );
}

function ReceiptsHeader() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[24px] min-w-full not-italic relative shrink-0 text-[16px] text-black tracking-[-0.16px] w-[min-content]">Receipts</p>
      <InfoBanner />
    </div>
  );
}

function WhatsAppInput({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[24px] min-w-full not-italic relative shrink-0 text-[12px] text-[#6b7280] tracking-[-0.2px] w-[min-content]">Enter the WhatsApp number to receive your receipt</p>
      <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
        <div className="[grid-area:1_/_1] h-[56px] ml-0 mt-0 relative rounded-[14px] w-[297px]">
          <div aria-hidden="true" className={`absolute border-[1.5px] ${error ? 'border-red-400' : 'border-[#e5e7eb]'} border-solid inset-0 pointer-events-none rounded-[14px] transition-colors`} />
          <div className={`absolute inset-0 rounded-[14px] ${error ? 'bg-red-50' : 'bg-[#f9fafb]'} transition-colors`} style={{ zIndex: -1 }} />
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="xxx-xxx-xxx"
          className="[grid-area:1_/_1] font-['Inter:SemiBold',sans-serif] leading-[1.4] ml-[139.47px] mt-[14px] not-italic relative text-[20px] w-[131.443px] bg-transparent outline-none text-[#003630] placeholder:text-[#9ca3af] tracking-[-0.3px]"
        />
        <p className="[grid-area:1_/_1] font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] leading-[1.4] ml-[12px] mt-[17px] not-italic relative text-[15px] text-[#6b7280] w-[49px]">+260</p>
      </div>
      {error && (
        <p className="font-['Inter:Medium',sans-serif] text-[11px] text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

function EmailInput({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[12px] text-[#6b7280] tracking-[-0.2px] w-full">Enter your email (optional)</p>
      <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full">
        <div className="[grid-area:1_/_1] h-[56px] ml-0 mt-0 relative rounded-[14px] w-[296px]">
          <div aria-hidden="true" className={`absolute border-[1.5px] ${error ? 'border-red-400' : 'border-[#e5e7eb]'} border-solid inset-0 pointer-events-none rounded-[14px] transition-colors`} />
          <div className={`absolute inset-0 rounded-[14px] ${error ? 'bg-red-50' : 'bg-[#f9fafb]'} transition-colors`} style={{ zIndex: -1 }} />
        </div>
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="your.email@example.com"
          className="[grid-area:1_/_1] font-['Inter:Medium',sans-serif] leading-[1.4] ml-[12px] mt-[17px] not-italic relative text-[14px] w-[272px] bg-transparent outline-none text-[#003630] placeholder:text-[#9ca3af] tracking-[-0.2px]"
        />
      </div>
      {error && (
        <p className="font-['Inter:Medium',sans-serif] text-[11px] text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

export default function ReceiptsPage({ onBack, onNext }: ReceiptsPageProps) {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [emailError, setEmailError] = useState("");
  
  // Check if form is valid for enabling/disabling the button
  const isFormValid = () => {
    return validateWhatsAppNumber(whatsappNumber) && (email.trim() === "" || validateEmail(email));
  };

  const validateWhatsAppNumber = (number: string): boolean => {
    if (number.trim() === "") {
      return false; // WhatsApp number is required
    }
    // Remove any non-digit characters for validation
    const digitsOnly = number.replace(/\D/g, "");
    // Validate that it has 9-10 digits (typical for Zambian numbers after +260)
    return digitsOnly.length >= 9 && digitsOnly.length <= 10;
  };

  const validateEmail = (email: string): boolean => {
    if (email.trim() === "") {
      return true; // Email is optional, so empty is valid
    }
    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleWhatsAppChange = (value: string) => {
    // Only allow digits, spaces, and hyphens
    const sanitized = value.replace(/[^\d\s-]/g, "");
    setWhatsappNumber(sanitized);
    // Clear error when user starts typing
    if (whatsappError) {
      setWhatsappError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  const handleNext = () => {
    let hasError = false;

    // Validate WhatsApp number
    if (!validateWhatsAppNumber(whatsappNumber)) {
      setWhatsappError("Please enter a valid WhatsApp number (9-10 digits)");
      hasError = true;
    }

    // Validate email if provided
    if (email.trim() !== "" && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    onNext();
  };

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen mx-auto" data-name="Receipts Page">
        <LogoHeader showBackButton onBack={onBack} />
        <div className="absolute left-1/2 translate-x-[-50%] top-[110px] w-full px-[24px]">
          <div className="inline-flex items-center gap-[8px] mb-[4px]">
            <div className="w-[3px] h-[24px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full" />
            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.4px]">Checkout</p>
          </div>
        </div>
        <div className="absolute bg-white box-border content-stretch flex flex-col gap-[20px] items-start left-1/2 translate-x-[-50%] pb-[30px] pt-[24px] px-[25px] rounded-[20px] top-[160px] w-[346px] border-[1.5px] border-[#e5e7eb] shadow-[0px_8px_24px_rgba(0,0,0,0.06)]">
          <div className="h-[19.8px] relative shrink-0 w-[18px]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
              <path d={svgPaths.pabc1740} fill="var(--fill-0, black)" id="Vector" />
            </svg>
          </div>
          <ReceiptsHeader />
          <WhatsAppInput value={whatsappNumber} onChange={handleWhatsAppChange} error={whatsappError} />
          <EmailInput value={email} onChange={handleEmailChange} error={emailError} />
          <button 
            onClick={handleNext}
            disabled={!isFormValid()}
            className={`relative h-[59px] w-[296px] rounded-[16px] overflow-hidden touch-manipulation ${
              !isFormValid() ? 'cursor-not-allowed' : 'group'
            }`}
            data-name="Button"
          >
            {/* Background */}
            <div className={`absolute inset-0 transition-colors ${
              !isFormValid() 
                ? 'bg-[#d1d5db]' 
                : 'bg-[#003630] group-hover:bg-[#004d45]'
            }`} />
            
            {/* Shine Effect */}
            {isFormValid() && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            )}
            
            {/* Shadow */}
            <div className={`absolute inset-0 transition-shadow ${
              !isFormValid()
                ? 'shadow-sm'
                : 'shadow-[0px_6px_20px_rgba(0,54,48,0.25)] group-active:shadow-[0px_2px_8px_rgba(0,54,48,0.2)]'
            }`} />
            
            {/* Content */}
            <div className={`relative z-10 flex items-center justify-center gap-[10px] h-full transition-transform ${
              isFormValid() && 'group-active:scale-[0.97]'
            }`}>
              <p className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] tracking-[-0.3px] ${
                !isFormValid() ? 'text-white/60' : 'text-white'
              }`}>Next</p>
              {isFormValid() && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
