import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "./imports/svg-s534f8yrof";
import servicesSvgPaths from "./imports/svg-o96q0cdj2h";
import lazyLoadWithTracking from "./utils/lazyLoad";
import performanceMonitor from "./utils/performanceMonitor";
import type { PaymentData } from "./components/HistoryPage";
import { Toaster } from "./components/ui/sonner";
import { getStudentsByPhone } from "./data/students";
import { incrementStudentSelection } from "./utils/preferences";
import { useAppStore } from "./stores/useAppStore";
import type { CheckoutService, PageType } from "./stores/useAppStore";
import type { School } from "./types";
import { toast } from "sonner";
import DynamicIsland, { useDynamicIsland } from "./components/DynamicIsland";
import { getSchools } from "./lib/supabase/api/schools";
import { hapticFeedback } from "./utils/haptics";
import { getPendingTransactionsForStudent, getInvoicesWithBalanceForStudent } from "./lib/supabase/api/transactions";
import { checkIfStaff } from "./lib/supabase/api/parents";

import { UpdateNotification } from "./components/UpdateNotification";
import { useOfflineManager } from "./hooks/useOfflineManager";

// School logos imports removed as we now fetch from database


/**
 * ========================================
 * LAZY LOADED COMPONENTS
 * ========================================
 * 
 * We're using code splitting to keep the initial bundle small.
 * Think of it like this: why load the payment success page when the user 
 * just opened the app? We'll load those pages when they're actually needed.
 * 
 * The "Lazy" prefix avoids naming conflicts with components defined below.
 * 
 * preload: true = load this ASAP in the background (for pages users see early)
 * preload: false/undefined = only load when the user navigates to it
 */


const LazySchoolDetailsPage = lazyLoadWithTracking(
  () => import("./components/SchoolDetailsPage"),
  { componentName: "SchoolDetailsPage", preload: true }
);

const LazyServicesPage = lazyLoadWithTracking(
  () => import("./components/ServicesPage"),
  { componentName: "ServicesPage" }
);

const LazyHistoryPage = lazyLoadWithTracking(
  () => import("./components/HistoryPage"),
  { componentName: "HistoryPage" }
);

const LazyAllReceipts = lazyLoadWithTracking(
  () => import("./components/AllReceipts"),
  { componentName: "AllReceipts" }
);

const LazyPayForSchoolFees = lazyLoadWithTracking(
  () => import("./components/PayForSchoolFees"),
  { componentName: "PayForSchoolFees" }
);

const LazyAddServicesPage = lazyLoadWithTracking(
  () => import("./components/AddServicesPage"),
  { componentName: "AddServicesPage" }
);

const LazyCheckoutPage = lazyLoadWithTracking(
  () => import("./components/CheckoutPage"),
  { componentName: "CheckoutPage" }
);

const LazyPaymentPage = lazyLoadWithTracking(
  () => import("./components/PaymentPage"),
  { componentName: "PaymentPage" }
);

const LazyProcessingPage = lazyLoadWithTracking(
  () => import("./components/ProcessingPage"),
  { componentName: "ProcessingPage" }
);

const LazyPaymentFailedPage = lazyLoadWithTracking(
  () => import("./components/PaymentFailedPage"),
  { componentName: "PaymentFailedPage" }
);

const LazyPaymentSuccessPage = lazyLoadWithTracking(
  () => import("./components/PaymentSuccessPage"),
  { componentName: "PaymentSuccessPage" }
);

const LazyDownloadReceiptPage = lazyLoadWithTracking(
  () => import("./components/DownloadReceiptPage"),
  { componentName: "DownloadReceiptPage" }
);

const LazyAccountProfilePage = lazyLoadWithTracking(
  () => import("./components/AccountProfilePage"),
  { componentName: "AccountProfilePage" }
);

const LazyAuditDisputesPage = lazyLoadWithTracking(
  () => import("./components/AuditDisputesPage"),
  { componentName: "AuditDisputesPage" }
);

const LazyChildrenDetailsPage = lazyLoadWithTracking(
  () => import("./components/ChildrenDetailsPage"),
  { componentName: "ChildrenDetailsPage" }
);

const LazyStudentManagePage = lazyLoadWithTracking(
  () => import("./components/StudentManagePage"),
  { componentName: "StudentManagePage" }
);

const LazyTutorial = lazyLoadWithTracking(
  () => import("./components/Tutorial"),
  { componentName: "Tutorial" }
);

const LazyIOSFeaturesDemo = lazyLoadWithTracking(
  () => import("./components/IOSFeaturesDemo"),
  { componentName: "IOSFeaturesDemo" }
);

const LazyRegistrationFormPage = lazyLoadWithTracking(
  () => import("./components/RegistrationFormPage"),
  { componentName: "RegistrationFormPage" }
);

const LazyRegistrationSuccessPage = lazyLoadWithTracking(
  () => import("./components/RegistrationSuccessPage"),
  { componentName: "RegistrationSuccessPage" }
);

const LazyViewPaymentPlansPage = lazyLoadWithTracking(
  () => import("./components/ViewPaymentPlansPage"),
  { componentName: "ViewPaymentPlansPage" }
);

const LazyPoliciesPage = lazyLoadWithTracking(
  () => import("./components/PoliciesPage"),
  { componentName: "PoliciesPage" }
);

/**
 * ========================================
 * SCHOOLS DATA
 * ========================================
 */
// SCHOOLS constant removed in favor of database fetching


/**
 * SearchNormal Component
 * 
 * Just a simple magnifying glass icon from our Figma design.
 * We use SVG paths imported from Figma to keep the design pixel-perfect.
 */
function SearchNormal() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
      <g id="search-normal">
        <path d={svgPaths.p14d5dec0} id="Vector" stroke="var(--stroke-0, #BDBDBD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p355f1080} id="Vector_2" stroke="var(--stroke-0, #BDBDBD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <g id="Vector_3" opacity="0"></g>
      </g>
    </svg>
  );
}

/**
 * VuesaxLinearSearchNormal Component
 * 
 * Wrapper for the search icon - keeps our Figma naming structure intact
 */
function VuesaxLinearSearchNormal() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/search-normal">
      <SearchNormal />
    </div>
  );
}

/**
 * ========================================
 * TEXT INPUT COMPONENT
 * ========================================
 * 
 * This is the main school search input on the home page.
 * 
 * Key features we implemented:
 * - Real-time search as you type (filters the SCHOOLS array)
 * - Dropdown suggestions with smooth animations
 * - Click outside to close (handled by useEffect)
 * - Green glow effect on focus (#95e36c with 20% opacity)
 * - 16px font size prevents iOS auto-zoom (common mobile UX trick)
 * - Touch-friendly targets (48px minimum height for mobile users)
 * 
 * The outer glow on focus was a specific requirement - we use ring utilities
 * instead of inner rings to get that Apple-style soft glow effect.
 */
function TextInput({ onSchoolSelect }: { onSchoolSelect: (school: School | null) => void; selectedSchool: string | null }) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    async function fetchSchools() {
      const data = await getSchools();
      setSchools(data);
    }
    fetchSchools();
  }, []);

  // Real-time filtering - case insensitive for better UX
  // Only show results if user has actually typed something
  const filteredSchools = inputValue.trim()
    ? schools.filter((school) =>
      school.name.toLowerCase().includes(inputValue.toLowerCase())
    )
    : [];

  // Handle clicking anywhere outside the input to close suggestions
  // This is a common pattern for dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * When user types in the input
   * We clear their selection until they pick from the dropdown
   * This ensures they can't submit a partially typed school name
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0);
    if (!value.trim()) {
      onSchoolSelect(null);
    } else {
      // Clear selection - user must pick from dropdown
      onSchoolSelect(null);
    }
  };

  /**
   * When user clicks a school from the dropdown
   * Update the input, notify parent component, close dropdown, and blur input
   */
  const handleSelectSchool = (school: School) => {
    setInputValue(school.name);
    onSchoolSelect(school);
    setShowSuggestions(false);
    inputRef.current?.blur(); // Remove focus after selection
  };

  return (
    <div ref={containerRef} className={`basis-0 bg-white grow h-full min-h-[50px] min-w-px relative rounded-[14px] shrink-0 transition-all duration-200 ${isFocused ? 'ring-4 ring-[#95e36c]/20' : ''}`} data-name="Text Input">
      <div aria-hidden="true" className="absolute border-[1px] border-solid border-[rgba(0,0,0,0.08)] inset-0 pointer-events-none rounded-[14px] transition-all duration-200" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center p-[18px] relative size-full">
          <div className="relative shrink-0 size-[20px] opacity-60" data-name="search-normal">
            <VuesaxLinearSearchNormal />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              inputValue.trim().length > 0 && setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="e.g. Twalumbu, ACU"
            className="flex-1 bg-transparent border-none outline-none focus:!ring-0 focus:!outline-none font-['IBM_Plex_Sans:Regular',sans-serif] text-black placeholder:text-[rgba(45,54,72,0.4)] tracking-[-0.01em] touch-manipulation"
            style={{ fontSize: '16px', border: 'none', outline: 'none', boxShadow: 'none' }}
          />
        </div>
      </div>

      {/* Suggestions Dropdown - Apple style */}
      {showSuggestions && filteredSchools.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 mt-[8px] glass rounded-[14px] overflow-hidden z-10 scrollbar-thin"
          style={{
            maxHeight: '240px',
            overflowY: 'auto'
          }}
        >
          {filteredSchools.map((school, index) => (
            <motion.button
              key={school.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: index * 0.02 }}
              onClick={() => handleSelectSchool(school)}
              className="w-full text-left px-[20px] py-[14px] font-['IBM_Plex_Sans:Regular',sans-serif] text-black hover:bg-[rgba(149,227,108,0.08)] active:bg-[rgba(149,227,108,0.15)] transition-all duration-150 touch-manipulation border-b border-[rgba(0,0,0,0.04)] last:border-b-0 flex items-center gap-[12px]"
              style={{ fontSize: '16px', letterSpacing: '-0.01em' }}
            >
              <span className="flex-1">{school.name}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* No results message */}
      {showSuggestions && inputValue.trim() && filteredSchools.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-[8px] bg-white border border-[rgba(0,0,0,0.08)] rounded-[14px] z-10"
          style={{
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="px-[20px] py-[14px] font-['IBM_Plex_Sans:Regular',sans-serif] text-[rgba(45,54,72,0.4)]" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>
            No schools found
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TextAreaBase({ selectedSchool, onSchoolSelect }: { selectedSchool: string | null; onSchoolSelect: (school: School | null) => void }) {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px relative shrink-0 w-full" data-name="_Text Area Base">
      <TextInput onSchoolSelect={onSchoolSelect} selectedSchool={selectedSchool} />
    </div>
  );
}

function TextArea({ selectedSchool, onSchoolSelect }: { selectedSchool: string | null; onSchoolSelect: (school: School | null) => void }) {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[24px] min-h-[50px] items-start relative shrink-0 w-full" data-name="Text Area">
      <TextAreaBase selectedSchool={selectedSchool} onSchoolSelect={onSchoolSelect} />
    </div>
  );
}

function Frame({ selectedSchool, onSchoolSelect }: { selectedSchool: string | null; onSchoolSelect: (school: School | null) => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
      <p className="font-['IBM_Plex_Sans:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12px] text-black text-center w-full">Enter Your School's Name</p>
      <TextArea selectedSchool={selectedSchool} onSchoolSelect={onSchoolSelect} />
    </div>
  );
}

function Frame3({ onProceed, hasSchool, selectedSchool, onSchoolSelect }: { onProceed: () => void; hasSchool: boolean; selectedSchool: string | null; onSchoolSelect: (school: School | null) => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start w-full px-[24px] sm:px-[48px]">
      <Frame selectedSchool={selectedSchool} onSchoolSelect={onSchoolSelect} />
      <motion.button
        onClick={() => {
          hapticFeedback('medium');
          onProceed();
        }}
        disabled={!hasSchool}
        whileHover={hasSchool ? { scale: 1.01, y: -1 } : {}}
        whileTap={hasSchool ? { scale: 0.98, y: 1 } : {}}
        transition={{ duration: 0.15 }}
        className="relative min-h-[56px] w-full rounded-[14px] overflow-hidden touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed group"
        data-name="Button"
        style={{
          background: hasSchool ? 'linear-gradient(180deg, #003630 0%, #002820 100%)' : '#003630',
          boxShadow: hasSchool
            ? '0 1px 2px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 4px 14px 0 rgba(0, 54, 48, 0.2)'
            : '0 1px 2px 0 rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity duration-200 pointer-events-none" />

        <div className="flex flex-row items-center justify-center size-full px-[24px] py-[16px]">
          <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] relative shrink-0 text-[16px] text-white tracking-[-0.01em]">
            Proceed
          </p>
        </div>
      </motion.button>
    </div>
  );
}


function Frame1() {
  return (
    <div className="content-stretch flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] gap-[3px] items-center leading-[normal] not-italic text-[#bdbdbd] text-[10px] text-center w-full px-[24px] py-[20px]">
      <p className="relative shrink-0 w-full whitespace-pre-wrap">
        <span>{`view the `}</span>
        <span className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline">terms</span>
        <span>{` and `}</span>
        <span className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline">conditions</span>
        <span>{`  of service`}</span>
      </p>
      <p className="relative shrink-0 w-full">All rights reserved ©</p>
    </div>
  );
}

function Group() {
  return (
    <div className="relative shrink-0 size-[109.79px]">
      <div className="absolute inset-[-5.02%_-8.67%_-12.31%_-8.67%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 129 129">
          <g id="Group 15">
            <g filter="url(#filter0_d_2_218)" id="rect84">
              <path d={svgPaths.p3c984100} fill="var(--fill-0, #003630)" />
              <path d={svgPaths.p38a7c180} stroke="var(--stroke-0, white)" strokeWidth="8" />
            </g>
            <path d={svgPaths.p32912680} id="path60" stroke="var(--stroke-0, #95E36C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10" />
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="128.819" id="filter0_d_2_218" width="128.819" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2_218" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_2_218" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col items-center not-italic relative shrink-0 text-black text-center w-full px-[24px]">
      <div className="flex flex-col font-['IBM_Plex_Sans:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[16px] w-full">
        <p className="leading-[45px]">Pay Fees with</p>
      </div>
      <p className="font-['IBM_Plex_Sans:Bold',sans-serif] leading-[45px] relative shrink-0 sm:text-[48px] w-full font-bold not-italic text-[36px]">master-fees</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[#f5f4f7] box-border content-stretch flex flex-col gap-[20px] items-center justify-end px-0 py-[24px] w-full relative min-h-[280px] sm:min-h-[323px] overflow-hidden">
      <div aria-hidden="true" className="absolute border-[#95e36c] border-[0px_0px_4px] border-solid inset-0 pointer-events-none" />

      {/* Animated Wave Layers - Seamless Continuous Waves */}
      <motion.div
        className="absolute bottom-0 left-0 h-[150%] pointer-events-none flex"
        style={{ opacity: 0.2, width: "200%" }}
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          x: { duration: 20, repeat: Infinity, ease: "linear" },
        }}
      >
        <svg className="absolute bottom-0 left-0 w-1/2 h-[80%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,100 Q150,150 300,100 T600,100 Q750,50 900,100 T1200,100 Q1350,150 1500,100 T1800,100 Q1950,50 2100,100 T2400,100 L2400,200 L0,200 Z"
            fill="#95e36c"
            opacity="0.4"
            animate={{
              d: [
                "M0,100 Q150,150 300,100 T600,100 Q750,50 900,100 T1200,100 Q1350,150 1500,100 T1800,100 Q1950,50 2100,100 T2400,100 L2400,200 L0,200 Z",
                "M0,100 Q150,60 300,100 T600,100 Q750,140 900,100 T1200,100 Q1350,60 1500,100 T1800,100 Q1950,140 2100,100 T2400,100 L2400,200 L0,200 Z",
                "M0,100 Q150,150 300,100 T600,100 Q750,50 900,100 T1200,100 Q1350,150 1500,100 T1800,100 Q1950,50 2100,100 T2400,100 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
        <svg className="absolute bottom-0 left-1/2 w-1/2 h-[80%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,100 Q150,150 300,100 T600,100 Q750,50 900,100 T1200,100 Q1350,150 1500,100 T1800,100 Q1950,50 2100,100 T2400,100 L2400,200 L0,200 Z"
            fill="#95e36c"
            opacity="0.4"
            animate={{
              d: [
                "M0,100 Q150,150 300,100 T600,100 Q750,50 900,100 T1200,100 Q1350,150 1500,100 T1800,100 Q1950,50 2100,100 T2400,100 L2400,200 L0,200 Z",
                "M0,100 Q150,60 300,100 T600,100 Q750,140 900,100 T1200,100 Q1350,60 1500,100 T1800,100 Q1950,140 2100,100 T2400,100 L2400,200 L0,200 Z",
                "M0,100 Q150,150 300,100 T600,100 Q750,50 900,100 T1200,100 Q1350,150 1500,100 T1800,100 Q1950,50 2100,100 T2400,100 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 h-[150%] pointer-events-none flex"
        style={{ opacity: 0.25, width: "200%" }}
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          x: { duration: 25, repeat: Infinity, ease: "linear" },
        }}
      >
        <svg className="absolute bottom-0 left-0 w-1/2 h-[70%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,120 Q200,60 400,120 T800,120 Q950,160 1100,120 T1600,120 Q1750,60 1900,120 T2400,120 L2400,200 L0,200 Z"
            fill="#003630"
            opacity="0.5"
            animate={{
              d: [
                "M0,120 Q200,60 400,120 T800,120 Q950,160 1100,120 T1600,120 Q1750,60 1900,120 T2400,120 L2400,200 L0,200 Z",
                "M0,120 Q200,170 400,120 T800,120 Q950,70 1100,120 T1600,120 Q1750,170 1900,120 T2400,120 L2400,200 L0,200 Z",
                "M0,120 Q200,60 400,120 T800,120 Q950,160 1100,120 T1600,120 Q1750,60 1900,120 T2400,120 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
        <svg className="absolute bottom-0 left-1/2 w-1/2 h-[70%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,120 Q200,60 400,120 T800,120 Q950,160 1100,120 T1600,120 Q1750,60 1900,120 T2400,120 L2400,200 L0,200 Z"
            fill="#003630"
            opacity="0.5"
            animate={{
              d: [
                "M0,120 Q200,60 400,120 T800,120 Q950,160 1100,120 T1600,120 Q1750,60 1900,120 T2400,120 L2400,200 L0,200 Z",
                "M0,120 Q200,170 400,120 T800,120 Q950,70 1100,120 T1600,120 Q1750,170 1900,120 T2400,120 L2400,200 L0,200 Z",
                "M0,120 Q200,60 400,120 T800,120 Q950,160 1100,120 T1600,120 Q1750,60 1900,120 T2400,120 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 h-[150%] pointer-events-none flex"
        style={{ opacity: 0.3, width: "200%" }}
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          x: { duration: 18, repeat: Infinity, ease: "linear" },
        }}
      >
        <svg className="absolute bottom-0 left-0 w-1/2 h-[60%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,140 Q250,90 500,140 T1000,140 Q1100,110 1200,140 T1800,140 Q1900,90 2100,140 T2400,140 L2400,200 L0,200 Z"
            fill="#95e36c"
            opacity="0.3"
            animate={{
              d: [
                "M0,140 Q250,90 500,140 T1000,140 Q1100,110 1200,140 T1800,140 Q1900,90 2100,140 T2400,140 L2400,200 L0,200 Z",
                "M0,140 Q250,170 500,140 T1000,140 Q1100,160 1200,140 T1800,140 Q1900,170 2100,140 T2400,140 L2400,200 L0,200 Z",
                "M0,140 Q250,90 500,140 T1000,140 Q1100,110 1200,140 T1800,140 Q1900,90 2100,140 T2400,140 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
        <svg className="absolute bottom-0 left-1/2 w-1/2 h-[60%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,140 Q250,90 500,140 T1000,140 Q1100,110 1200,140 T1800,140 Q1900,90 2100,140 T2400,140 L2400,200 L0,200 Z"
            fill="#95e36c"
            opacity="0.3"
            animate={{
              d: [
                "M0,140 Q250,90 500,140 T1000,140 Q1100,110 1200,140 T1800,140 Q1900,90 2100,140 T2400,140 L2400,200 L0,200 Z",
                "M0,140 Q250,170 500,140 T1000,140 Q1100,160 1200,140 T1800,140 Q1900,170 2100,140 T2400,140 L2400,200 L0,200 Z",
                "M0,140 Q250,90 500,140 T1000,140 Q1100,110 1200,140 T1800,140 Q1900,90 2100,140 T2400,140 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 h-[150%] pointer-events-none flex"
        style={{ opacity: 0.18, width: "200%" }}
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          x: { duration: 30, repeat: Infinity, ease: "linear" },
        }}
      >
        <svg className="absolute bottom-0 left-0 w-1/2 h-[55%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,130 Q180,170 360,130 T720,130 Q900,80 1080,130 T1440,130 Q1620,170 1800,130 T2400,130 L2400,200 L0,200 Z"
            fill="#003630"
            opacity="0.35"
            animate={{
              d: [
                "M0,130 Q180,170 360,130 T720,130 Q900,80 1080,130 T1440,130 Q1620,170 1800,130 T2400,130 L2400,200 L0,200 Z",
                "M0,130 Q180,90 360,130 T720,130 Q900,165 1080,130 T1440,130 Q1620,90 1800,130 T2400,130 L2400,200 L0,200 Z",
                "M0,130 Q180,170 360,130 T720,130 Q900,80 1080,130 T1440,130 Q1620,170 1800,130 T2400,130 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
        <svg className="absolute bottom-0 left-1/2 w-1/2 h-[55%]" viewBox="0 0 2400 200" preserveAspectRatio="none">
          <motion.path
            d="M0,130 Q180,170 360,130 T720,130 Q900,80 1080,130 T1440,130 Q1620,170 1800,130 T2400,130 L2400,200 L0,200 Z"
            fill="#003630"
            opacity="0.35"
            animate={{
              d: [
                "M0,130 Q180,170 360,130 T720,130 Q900,80 1080,130 T1440,130 Q1620,170 1800,130 T2400,130 L2400,200 L0,200 Z",
                "M0,130 Q180,90 360,130 T720,130 Q900,165 1080,130 T1440,130 Q1620,90 1800,130 T2400,130 L2400,200 L0,200 Z",
                "M0,130 Q180,170 360,130 T720,130 Q900,80 1080,130 T1440,130 Q1620,170 1800,130 T2400,130 L2400,200 L0,200 Z",
              ],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      <Group />
      <Frame2 />
    </div>
  );
}

function SearchPage({ onProceed, selectedSchool, onSchoolSelect }: { onProceed: () => void; selectedSchool: string | null; onSchoolSelect: (school: School | null) => void }) {
  return (
    <div className="bg-white min-h-screen w-full flex justify-center">
      <div className="bg-white w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen overflow-hidden flex flex-col relative" data-name="Page 3">
        {/* Background shapes removed for cleaner UI */}
        <Frame4 />

        {/* Main Scrollable Content */}
        <div className="flex-1 w-full flex flex-col relative z-10 overflow-y-auto no-scrollbar">
          <div className="flex-1 flex flex-col py-[24px]">
            <Frame3
              onProceed={onProceed}
              hasSchool={!!selectedSchool}
              selectedSchool={selectedSchool}
              onSchoolSelect={onSchoolSelect}
            />
          </div>
        </div>

        {/* Fixed Footer at the bottom */}
        <div className="w-full flex justify-center pb-8 pt-4 relative z-20 bg-white/80 backdrop-blur-sm">
          <Frame1 />
        </div>
      </div>
    </div>
  );
}


export function DecorativeShapes() {
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
                  d={servicesSvgPaths.p23b65fc0}
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
                  d={servicesSvgPaths.p1abe0160}
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
                  d={servicesSvgPaths.p23b65fc0}
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




export default function App() {
  const { isOnline } = useOfflineManager();

  // Security: Track last navigation timestamp to prevent rapid manipulation
  const lastNavigationRef = useRef<number>(0);
  const navigationLockRef = useRef<boolean>(false);

  // Security: Protect against console manipulation (production only)
  // Defer initialization to avoid blocking initial render
  useEffect(() => {
    // Use setTimeout to defer non-critical security setup
    const timeoutId = setTimeout(() => {
      // Store original console methods for potential restore
      const originalConsole = {
        log: window.console.log,
        warn: window.console.warn,
        error: window.console.error,
      };

      if (import.meta.env.MODE === 'production') {
        // Disable console methods in production to prevent manipulation
        const noop = () => { };
        try {
          window.console.log = noop;
          window.console.warn = noop;
          window.console.error = noop;
        } catch (e) {
          // Some browsers don't allow console override, fail silently
        }
      }

      // Detect if DevTools is opened (best effort)
      const detectDevTools = () => {
        try {
          const threshold = 160;
          if (window.outerWidth - window.innerWidth > threshold ||
            window.outerHeight - window.innerHeight > threshold) {
            // DevTools potentially open
            if (import.meta.env.MODE === 'development') {
              originalConsole.log('[Security] Developer tools detected');
            }
            // In production, you might want to take additional security measures
          }
        } catch (e) {
          // Fail silently if detection fails
        }
      };

      window.addEventListener('resize', detectDevTools);
    }, 100); // Defer by 100ms to allow initial render to complete

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Zustand store state
  const currentPage = useAppStore((state) => state.currentPage);
  const navigationDirection = useAppStore((state) => state.navigationDirection);
  const selectedSchool = useAppStore((state) => state.selectedSchool);
  const selectedSchoolLogo = useAppStore((state) => state.selectedSchoolLogo);
  const userName = useAppStore((state) => state.userName);
  const userPhone = useAppStore((state) => state.userPhone);
  const receiptStudentName = useAppStore((state) => state.receiptStudentName);
  const receiptStudentId = useAppStore((state) => state.receiptStudentId);
  const receiptStudentGrade = useAppStore((state) => state.receiptStudentGrade);
  const receiptParentName = useAppStore((state) => state.receiptParentName);
  const receiptPaymentData = useAppStore((state) => state.receiptPaymentData);
  const selectedStudentIds = useAppStore((state) => state.selectedStudentIds);
  const checkoutServices = useAppStore((state) => state.checkoutServices);
  const paymentAmount = useAppStore((state) => state.paymentAmount);
  const showTutorial = useAppStore((state) => state.showTutorial);
  const hasSeenTutorial = useAppStore((state) => state.hasSeenTutorial);
  const lastCompletedPaymentTimestamp = useAppStore((state) => state.lastCompletedPaymentTimestamp);
  const paymentInProgress = useAppStore((state) => state.paymentInProgress);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const students = useAppStore((state) => state.students);
  const isStaff = useAppStore((state) => state.isStaff);

  // HYDRATION GUARD: Prevent rendering anything until the store is loaded from localStorage.
  // This prevents flash-of-empty-state and accidental redirects to search on refresh.
  if (!hasHydrated) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-[#95e36c]/20 border-t-[#95e36c] rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  // iOS Features Demo state
  const [showIOSDemo, setShowIOSDemo] = useState(false);

  // Students data from Supabase
  const studentsLoading = useAppStore((state) => state.studentsLoading || false); // Added if not exist, else keep as is
  const setStudents = useAppStore((state) => state.setStudents);
  const setIsStaff = useAppStore((state) => state.setIsStaff);
  const [studentsLoadingLocal, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // Dynamic Island for payment status
  const dynamicIsland = useDynamicIsland();

  // Zustand store actions
  const setNavigationDirection = useAppStore((state) => state.setNavigationDirection);
  const setSelectedSchool = useAppStore((state) => state.setSelectedSchool);
  const setUserInfo = useAppStore((state) => state.setUserInfo);
  const setSelectedStudentIds = useAppStore((state) => state.setSelectedStudentIds);
  const setCheckoutServices = useAppStore((state) => state.setCheckoutServices);
  const setPaymentAmount = useAppStore((state) => state.setPaymentAmount);
  const setReceiptStudent = useAppStore((state) => state.setReceiptStudent);
  const setReceiptPaymentData = useAppStore((state) => state.setReceiptPaymentData);
  const setShowTutorial = useAppStore((state) => state.setShowTutorial);
  const completeTutorial = useAppStore((state) => state.completeTutorial);
  const resetCheckoutFlow = useAppStore((state) => state.resetCheckoutFlow);
  const markPaymentComplete = useAppStore((state) => state.markPaymentComplete);
  const startPaymentProcess = useAppStore((state) => state.startPaymentProcess);
  const clearPaymentSecurity = useAppStore((state) => state.clearPaymentSecurity);

  // Check if user has seen tutorial on mount
  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial, setShowTutorial]);

  // Clear selected school when navigating TO the search page
  useEffect(() => {
    if (currentPage === 'search') {
      setSelectedSchool(null);
    }
  }, [currentPage, setSelectedSchool]);

  // Shared student fetching logic
  const fetchStudents = async (phone: string) => {
    if (!phone) {
      setStudents([]);
      setIsStaff(false);
      return;
    }
    
    // Get the current school ID from the store to ensure filtered fetching
    const storeSchoolId = useAppStore.getState().selectedSchoolId;
    
    console.log('[App] Fetching students and staff status for phone:', phone, storeSchoolId ? `(Filtered for School: ${storeSchoolId})` : '(No school filter)');
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      // Parallel fetch for students and staff status
      // We pass the school ID to ensure you only see students for the school you've selected
      const [studentData, staffStatus] = await Promise.all([
        getStudentsByPhone(phone, storeSchoolId || undefined),
        checkIfStaff(phone)
      ]);
      
      console.log('[App] Successfully fetched:', { students: studentData.length, isStaff: staffStatus });
      
      setStudents(studentData);
      setIsStaff(staffStatus);
      
      return studentData;
    } catch (error) {
      console.error('[App] Error fetching user data:', error);
      setStudentsError('Failed to load user data. Please try again.');
      toast.error('Failed to load user data');
      return [];
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch students when userPhone changes or on initial hydrate
  useEffect(() => {
    if (hasHydrated && userPhone) {
      fetchStudents(userPhone);
    }
  }, [userPhone, hasHydrated]);

  const handleTutorialComplete = () => {
    completeTutorial();
  };

  // Security: Validate if user can access a restricted page
  const canAccessPage = (page: PageType): boolean => {
    const state = useAppStore.getState();

    // Anyone can access these pages
    const publicPages: PageType[] = ['search', 'details', 'services', 'history', 'receipts', 'registration-portal', 'registration-form', 'registration-success', 'account-profile', 'policies', 'audit-disputes', 'children-details', 'student-manage', 'pay-fees', 'add-services'];
    if (publicPages.includes(page)) return true;

    // Payment flow pages require proper context
    if (page === 'checkout') {
      return state.checkoutServices.length > 0 || state.selectedStudentIds.length > 0;
    }


    if (page === 'payment') {
      return state.paymentAmount > 0 && state.checkoutServices.length > 0;
    }

    if (page === 'processing') {
      return state.paymentInProgress;
    }

    // Success and download-receipt pages require completed payment
    if (page === 'success' || page === 'download-receipt') {
      // Must have completed a payment within the last 5 minutes
      if (!state.lastCompletedPaymentTimestamp) return false;
      const timeSincePayment = Date.now() - state.lastCompletedPaymentTimestamp;
      return timeSincePayment < 5 * 60 * 1000; // 5 minutes
    }

    // Failed page is accessible if there was a payment attempt
    if (page === 'failed') {
      return true; // Failed page can be shown anytime
    }

    return false;
  };

  /**
   * navigateToPage Utility
   * 
   * Updates only the internal store. The synchronized effect below will 
   * handle the side-effect of updating the browser history.
   */
  const navigateToPage = (page: PageType, direction: 'forward' | 'back' = 'forward', replaceHistory = false) => {
    // 1. Performance monitoring
    const endTracking = performanceMonitor.trackPageTransition(currentPage, page);

    // 2. Set direction for animations
    setNavigationDirection(direction);

    // 3. Update internal store (This will trigger the useEffect for history sync)
    // We pass a custom flag to handle replacement vs pushing
    if (replaceHistory) {
      window.history.replaceState({ page }, '', `#${page}`);
    } else {
      if (window.history.state?.page !== page) {
        window.history.pushState({ page }, '', `#${page}`);
      }
    }
    
    // Update store state
    useAppStore.setState({ currentPage: page });

    // 4. Cleanup monitoring
    setTimeout(() => endTracking(), 100);
  };

  // Initialize history on mount - WAIT FOR HYDRATION
  useEffect(() => {
    if (!hasHydrated) return; // Wait until store is ready

    // Check if there's a hash in the URL on initial load
    const hash = window.location.hash.slice(1);
    const validPages: PageType[] = ['search', 'details', 'services', 'history', 'receipts', 'pay-fees', 'add-services', 'checkout', 'payment', 'processing', 'failed', 'success', 'download-receipt', 'registration-portal', 'registration-form', 'registration-success', 'policies', 'account-profile', 'audit-disputes', 'children-details', 'student-manage'];

    if (hash && validPages.includes(hash as PageType)) {
      const targetPage = hash as PageType;

      // Block payment-flow pages from being accessed directly via URL hash IF NO CART DATA EXISTS
      const paymentFlowPages: PageType[] = ['payment', 'checkout', 'processing', 'add-services', 'pay-fees', 'success', 'download-receipt', 'failed'];
      if (paymentFlowPages.includes(targetPage)) {
        // Landing on a payment page from a fresh load is ONLY invalid if checkoutServices are empty
        if (!checkoutServices || checkoutServices.length === 0) {
          const safePage: PageType = (userPhone && selectedSchool) ? 'services' : 'search';
          console.warn(`[Nav] Blocked direct access to payment-flow page "${targetPage}" on fresh load (Empty Cart). Redirecting to ${safePage}.`);
          window.history.replaceState({ page: safePage }, '', `#${safePage}`);
          useAppStore.setState({ currentPage: safePage });
        } else {
          // Valid cart exists — allow staying on the page (refresh recovery)
          window.history.replaceState({ page: targetPage }, '', `#${targetPage}`);
          useAppStore.setState({ currentPage: targetPage });
        }
      } else if (canAccessPage(targetPage)) {
        window.history.replaceState({ page: targetPage }, '', `#${targetPage}`);
        useAppStore.setState({ currentPage: targetPage });
      } else {
        // Redirect to appropriate page if access denied
        console.warn(`[Security] Access denied to page: ${targetPage}. Redirecting to search.`);
        window.history.replaceState({ page: 'search' }, '', '#search');
        useAppStore.setState({ currentPage: 'search' });
      }
    } else {
      // No hash — always decide the start page from current session state, never from persisted nav
      const safePage: PageType = (userPhone && selectedSchool) ? 'services' : 'search';
      window.history.replaceState({ page: safePage }, '', `#${safePage}`);
      useAppStore.setState({ currentPage: safePage });
    }

    // Handle browser back/forward buttons and swipe gestures
    const handlePopState = (event: PopStateEvent) => {
      // Security: Prevent rapid navigation manipulation
      const now = Date.now();
      if (navigationLockRef.current || (now - lastNavigationRef.current) < 300) {
        event.preventDefault();
        return;
      }

      navigationLockRef.current = true;
      lastNavigationRef.current = now;
      setTimeout(() => { navigationLockRef.current = false; }, 300);

      const targetPage = event.state?.page as PageType || (window.location.hash.slice(1) as PageType) || 'search';
      const currentPageValue = useAppStore.getState().currentPage;

      // 1. Safety Checks (Redirection)
      if (currentPageValue === 'success' || currentPageValue === 'download-receipt') {
        clearPaymentSecurity();
        resetCheckoutFlow();
        window.history.replaceState({ page: 'services' }, '', '#services');
        useAppStore.setState({ currentPage: 'services' });
        return;
      }

      if (targetPage === 'processing') {
        window.history.forward();
        return;
      }

      // 2. Validate Access
      if (!canAccessPage(targetPage)) {
        window.history.replaceState({ page: 'search' }, '', '#search');
        useAppStore.setState({ currentPage: 'search' });
        return;
      }

      // 3. Apply Navigation
      setNavigationDirection('back');
      useAppStore.setState({ currentPage: targetPage });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasHydrated]);

  // Prevent accidental navigation away from app and handle page visibility
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentPageValue = useAppStore.getState().currentPage;
      const selectedSchoolValue = useAppStore.getState().selectedSchool;

      // Only show confirmation if user has navigated beyond search page
      if (currentPageValue !== 'search' && selectedSchoolValue) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Security: Handle page visibility changes (tab switching, minimizing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentPageValue = useAppStore.getState().currentPage;
        const restrictedPages: PageType[] = ['processing', 'payment', 'checkout'];

        // If user returns to a restricted page, validate access
        if (restrictedPages.includes(currentPageValue)) {
          if (!canAccessPage(currentPageValue)) {
            console.warn(`[Security] Page ${currentPageValue} no longer accessible. Redirecting.`);
            window.history.replaceState({ page: 'services' }, '', '#services');
            useAppStore.setState({ currentPage: 'services' });
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add a safety entry to history to prevent closing app on back gesture from search
  // We only push search if there's no state at all (initial entry)
  useEffect(() => {
    if (currentPage === 'search' && !window.history.state) {
      window.history.replaceState({ page: 'search' }, '', '#search');
    }
  }, [currentPage]);

  // Security: Periodic validation of current page access
  useEffect(() => {
    const securityCheckInterval = setInterval(() => {
      const state = useAppStore.getState();
      if (!state.hasHydrated) return; // Skip security check until hydrated

      const currentPageValue = state.currentPage;

      // Check if current page is still accessible
      if (!canAccessPage(currentPageValue)) {
        console.warn(`[Security Check] Current page ${currentPageValue} is no longer accessible. Redirecting to Home.`);
        clearPaymentSecurity();
        resetCheckoutFlow();
        window.history.replaceState({ page: 'search' }, '', '#search');
        useAppStore.setState({ currentPage: 'search' });
      }

      // Clear old payment completion timestamps (after 5 minutes)
      if (state.lastCompletedPaymentTimestamp) {
        const timeSincePayment = Date.now() - state.lastCompletedPaymentTimestamp;
        if (timeSincePayment > 5 * 60 * 1000) {
          console.log('[Security] Payment completion timestamp expired. Clearing.');
          clearPaymentSecurity();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(securityCheckInterval);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                             CLEAR BALANCES LOGIC                           */
  /* -------------------------------------------------------------------------- */

  const handleClearBalances = async (selectedIds: string[]) => {
    // 1. Filter students with balance
    const studentsWithBalance = students.filter(s =>
      selectedIds.includes(s.id) && s.balances > 0
    );

    if (studentsWithBalance.length === 0) return;

    // 2. Map to CheckoutService
    let balanceServices: CheckoutService[] = [];

    for (const student of studentsWithBalance) {
      // Fetch both detailed invoices and pending transactions
      const [invoices, pendingTxs] = await Promise.all([
        getInvoicesWithBalanceForStudent(student.id),
        getPendingTransactionsForStudent(student.id)
      ]);

      if (invoices.length > 0) {
        // Use detailed invoices from payment_history
        const servicesValue = invoices.map(inv => ({
          id: inv.id || crypto.randomUUID(),
          description: inv.service_name || "School Fees",
          amount: inv.balance_remaining || 0,
          invoiceNo: inv.invoice_number || `INV-${inv.id?.substring(0, 4)}`,
          invoice_id: inv.id || undefined,  // actual UUID for DB linkage
          studentName: student.name,
          studentId: student.id,
          term: inv.term,
          academicYear: inv.academic_year,
          grade: student.grade,
          schoolId: student.schoolId,
          isDebt: true
        }));
        balanceServices = [...balanceServices, ...servicesValue];

      }

      // Also include any other pending transactions that aren't necessarily tied to an invoice in payment_history
      if (pendingTxs.length > 0) {
        // Simple heuristic: if we already have invoices, maybe don't duplicate pending stuff 
        // unless they are for different amounts or don't look like invoice payments
        const invoiceIds = invoices.map(i => i.id);

        const additionalServices = pendingTxs
          .filter(tx => !invoiceIds.includes(tx.id)) // Avoid double counting if IDs match
          .map(tx => {
            let desc = "Outstanding Balance";
            if (tx.meta_data && (tx.meta_data as any).description) {
              desc = (tx.meta_data as any).description;
            } else {
              desc = `Pending Payment - ${student.name}`;
            }

            return {
              id: tx.id || crypto.randomUUID(),
              description: desc,
              amount: tx.amount,
              invoiceNo: tx.reference || `BAL-${student.id.substring(0, 4)}`,
              studentName: student.name,
              studentId: student.id,
              term: tx.meta_data?.['term'],
              academicYear: tx.meta_data?.['year'] || tx.meta_data?.['academicYear'],
              grade: student.grade,
              schoolId: student.schoolId,
              isDebt: true
            };
          });

        balanceServices = [...balanceServices, ...additionalServices];
      }

      // Final fallback if both were empty but student has a balance field > 0
      if (invoices.length === 0 && pendingTxs.length === 0 && student.balances > 0) {
        balanceServices.push({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
          description: `Outstanding Balance`,
          amount: student.balances,
          invoiceNo: `BAL-${student.id.substring(0, 4)}-${Date.now().toString().slice(-4)}`,
          studentName: student.name,
          studentId: student.id,
          term: undefined,
          academicYear: undefined,
          grade: student.grade,
          schoolId: student.schoolId,
          isDebt: true
        });
      }
    }

    // 3. Update store and navigate
    setCheckoutServices(balanceServices);
    setPaymentAmount(balanceServices.reduce((acc, curr) => acc + curr.amount, 0));
    setSelectedStudentIds(selectedIds);
    navigateToPage('checkout');
  };

  /* -------------------------------------------------------------------------- */
  /*                             EVENT HANDLERS                                 */
  /* -------------------------------------------------------------------------- */

  const handleProceed = () => {
    if (selectedSchool) {
      navigateToPage("details");
    } else {
      // Safety check: show error if user somehow clicks without selection
      toast.error("Please select a school", {
        description: "You must select a school before proceeding.",
        duration: 3000,
      });
      console.log("Proceed blocked - No school selected. Current state:", { selectedSchool });
    }
  };

  const handleRegistration = () => {
    navigateToPage("registration-form");
  };

  const handleRegistrationComplete = async (parentPhone: string, parentName: string, parentId: string) => {
    // After successful registration, automatically log in the parent
    // Set user info in the store
    setUserInfo(parentName, parentPhone, '', parentId);

    // Fetch their students to populate the app
    try {
      const studentData = await getStudentsByPhone(parentPhone);
      setStudents(studentData);

      // Show success notification
      dynamicIsland.success({
        subtitle: 'Registration complete! Welcome to master-fees',
        autoHide: 3000
      });

      // Navigate to pay-fees page so they can immediately make a payment
      navigateToPage("pay-fees");
    } catch (error) {
      console.error('Error fetching students after registration:', error);
      toast.error('Registration successful, but failed to load students. Please try logging in again.');
      navigateToPage("search");
    }
  };

  const handleProceedToServices = async (name: string, phone: string, id: string) => {
    setStudentsLoading(true);
    try {
      // 1. Fetch students first to verify they exist at this school
      const studentsData = await fetchStudents(phone);
      
      // 2. Check if they are staff (fetchStudents already sets this in store)
      const staffStatus = useAppStore.getState().isStaff;

      // 3. SECURE GATE: If no students found AND not staff, block access
      if ((!studentsData || studentsData.length === 0) && !staffStatus) {
        toast.error(`No records found for this number at ${selectedSchool || 'this school'}. Please verify the number or register.`);
        // Note: we don't navigate or set user info here
        return;
      }

      // 4. Success! Now set identity and proceed
      setUserInfo(name, phone, '', id);
      navigateToPage("services");
    } catch (e) {
      console.error('Login error:', e);
      toast.error('An error occurred during verification. Please try again.');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleBackToDetails = () => {
    navigateToPage("details", "back");
  };

  const handleBackToSearch = () => {
    navigateToPage("search", "back");
    // Clearing school select handled by useEffect on search page
  };

  const handleViewHistory = () => {
    navigateToPage("history");
  };

  const handleBackToServices = () => {
    navigateToPage("services", "back");
  };

  const handleViewAllReceipts = (
    studentName: string,
    studentId: string,
    studentGrade: string,
    parentName: string,
    paymentData: Record<string, PaymentData[]>
  ) => {
    setReceiptStudent(studentName, studentId, studentGrade, parentName);
    setReceiptPaymentData(paymentData);
    navigateToPage("receipts");
  };

  const handleBackToHistory = () => {
    navigateToPage("history", "back");
  };

  const handleServiceSelect = (service: string) => {
    // Future: Use navigateToPage correctly
  };

  const handlePayFees = () => {
    navigateToPage("pay-fees");
  };

  const handleSelectServices = (selectedStudents: string[]) => {
    setNavigationDirection('forward');
    // Track student selections in preferences
    selectedStudents.forEach(studentId => {
      incrementStudentSelection(studentId);
    });

    setSelectedStudentIds(selectedStudents);
    navigateToPage("add-services");
  };

  const handleBackToPayFees = () => {
    navigateToPage("pay-fees", "back");
  };

  const handleNextFromAddServices = () => {
    navigateToPage("checkout");
  };

  const handleCheckout = (services: CheckoutService[]) => {
    setCheckoutServices(services);
    navigateToPage("checkout");
  };

  const handleBackToAddServices = () => {
    navigateToPage("add-services", "back");
  };

  const handleCheckoutProceed = (amount: number) => {
    setPaymentAmount(amount);
    navigateToPage("payment");
  };

  const handleBackToCheckout = () => {
    navigateToPage("checkout", "back");
  };

  const handleSchoolSelection = (school: School | null) => {
    // CRITICAL: Always reset the checkout flow when selecting a new school
    // to prevent service data from bleeding between different institutions.
    resetCheckoutFlow();

    setSelectedSchool(
      school ? school.name : null, 
      school ? school.logo : null, 
      school ? school.id as string : null,
      school ? !!school.vat_enabled : false
    );
  };

  const handlePaymentComplete = () => {
    // Payment is now handled within PaymentPage (via Lenco integration)
    // When this is called, payment is already successful and saved

    // Mark payment completed
    markPaymentComplete();

    // Show success notification in Dynamic Island
    dynamicIsland.success({ subtitle: 'Payment successful! Receipt generated' });

    // Navigate directly to success page (this handles state and history)
    navigateToPage("success", "forward", true);
  };

  const handleProcessingComplete = (success: boolean) => {
    if (success) {
      // Mark payment as completed for security tracking
      markPaymentComplete();

      // Show success notification in Dynamic Island
      dynamicIsland.success({ subtitle: 'Payment successful! Receipt generated' });

      // Replace processing page in history to prevent back navigation
      // Clear the entire history stack to prevent going back through payment flow
      navigateToPage('success', 'forward', true);

      console.log('[Security] Payment completed successfully. Navigation restricted.');
    } else {
      // Show error notification in Dynamic Island
      dynamicIsland.error({ subtitle: 'Payment failed. Please try again' });

      // Replace processing page in history to prevent back navigation
      navigateToPage("failed", true);
    }
  };

  const handleTryAgain = () => {
    // On payment failure, go back to payment page
    navigateToPage("payment", "back");
  };

  const handleViewReceiptsFromSuccess = () => {
    // After successful payment, user can view receipts
    // This replaces the success page to prevent going back through payment flow
    navigateToPage('download-receipt', 'forward', true);
  };

  const handleDownloadReceipts = () => {
    // PDF generation will be handled in DownloadReceiptPage
  };

  const handleGoHome = () => {
    // Navigate home and clear the payment flow from history
    console.log('[Navigation] Returning to services. Clearing payment data.');
    clearPaymentSecurity();
    resetCheckoutFlow();
    navigateToPage('services', 'forward', true);
  };

  // Page transition animation variants - direction aware
  const pageVariants = {
    initial: {
      opacity: 0,
      x: navigationDirection === 'forward' ? 100 : -100,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
    exit: {
      opacity: 0,
      x: navigationDirection === 'forward' ? -100 : 100,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {currentPage === "download-receipt" && (
          <motion.div
            key="download-receipt"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyDownloadReceiptPage
              totalAmount={paymentAmount}
              schoolName={selectedSchool || "Institutional Fees"}
              schoolLogo={selectedSchoolLogo}
              services={checkoutServices}
              onGoHome={handleGoHome}
              parentName={userName}
            />
          </motion.div>
        )}

        {currentPage === "success" && (
          <motion.div
            key="success"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyPaymentSuccessPage
              onViewReceipts={handleViewReceiptsFromSuccess}
            />
          </motion.div>
        )}

        {currentPage === "failed" && (
          <motion.div
            key="failed"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyPaymentFailedPage
              onTryAgain={handleTryAgain}
              onBack={handleBackToServices}
            />
          </motion.div>
        )}

        {currentPage === "processing" && (
          <motion.div
            key="processing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyProcessingPage
              onProcessingComplete={handleProcessingComplete}
            />
          </motion.div>
        )}

        {currentPage === "payment" && (
          <motion.div
            key="payment"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyPaymentPage
              onBack={handleBackToCheckout}
              onPay={handlePaymentComplete}
              totalAmount={paymentAmount}
            />
          </motion.div>
        )}

        {currentPage === "checkout" && (
          <motion.div
            key="checkout"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyCheckoutPage
              services={checkoutServices}
              onBackToServices={handleBackToAddServices}
              onProceed={handleCheckoutProceed}
            />
          </motion.div>
        )}

        {currentPage === "add-services" && (
          <motion.div
            key="add-services"
            className="absolute inset-0 w-full h-full"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyAddServicesPage
              selectedStudentIds={selectedStudentIds}
              userPhone={userPhone}
              schoolName={selectedSchool || ""}
              onBack={handleBackToPayFees}
              onNext={handleNextFromAddServices}
              onCheckout={handleCheckout}
            />
          </motion.div>
        )}

        {currentPage === "pay-fees" && (
          <motion.div
            key="pay-fees"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyPayForSchoolFees
              onBack={handleBackToServices}
              onSelectServices={handleSelectServices}
              onClearBalances={handleClearBalances}
              students={students}
              initialSelectedStudents={selectedStudentIds}
            />
          </motion.div>
        )}

        {currentPage === "receipts" && (
          <motion.div
            key="receipts"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyAllReceipts
              onBack={() => navigateToPage("history", "back")}
              studentName={receiptStudentName}
              studentId={receiptStudentId}
              studentGrade={receiptStudentGrade}
              parentName={receiptParentName}
              paymentData={receiptPaymentData}
            />
          </motion.div>
        )}

        {currentPage === "history" && (
          <motion.div
            key="history"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyHistoryPage
              userPhone={userPhone}
              schoolName={selectedSchool || undefined}
              schoolLogo={selectedSchoolLogo}
              onBack={handleBackToServices}
              onViewAllReceipts={handleViewAllReceipts}
              userName={userName}
              onClearBalances={handleClearBalances}
              onIndividualPay={(service: CheckoutService) => handleCheckout([service])}
            />
          </motion.div>
        )}

        {currentPage === "services" && (
          <motion.div
            key="services"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyServicesPage
              userName={userName}
              userPhone={userPhone}
              schoolName={selectedSchool || undefined}
              onBack={handleBackToDetails}
              onSelectService={handleServiceSelect}
              onViewHistory={handleViewHistory}
              onPayFees={handlePayFees}
              debtCount={students.reduce((sum, s) => sum + s.unpaidInvoicesCount, 0)}
              navigateToPage={navigateToPage}
            />
          </motion.div>
        )}

        {currentPage === "details" && selectedSchool && (
          <motion.div
            key="details"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazySchoolDetailsPage
              schoolName={selectedSchool}
              schoolLogo={selectedSchoolLogo}
              onProceed={handleProceedToServices}
              onBack={handleBackToSearch}
              onRegistration={handleRegistration}
            />
          </motion.div>
        )}


        {currentPage === "search" && (
          <motion.div
            key="search"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <SearchPage
              onProceed={handleProceed}
              selectedSchool={selectedSchool}
              onSchoolSelect={handleSchoolSelection}
            />
          </motion.div>
        )}



        {currentPage === "registration-form" && (
          <motion.div
            key="registration-form"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyRegistrationFormPage
              onBack={() => {
                navigateToPage("details", "back");
              }}
              onComplete={(data) => {
                // Store the registration data temporarily so we can use it after success page
                // We'll use it to auto-login the user
                sessionStorage.setItem('pendingRegistration', JSON.stringify(data));

                // Set user info and school
                setUserInfo(data.name, data.phone, '', data.userId);
                if (data.schoolName) {
                  setSelectedSchool(data.schoolName);
                }
                navigateToPage("registration-success");
              }}
            />
          </motion.div>
        )}

        {currentPage === "registration-success" && (
          <motion.div
            key="registration-success"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyRegistrationSuccessPage
              onContinue={() => {
                // Retrieve the registration data
                const pendingData = sessionStorage.getItem('pendingRegistration');
                if (pendingData) {
                  const data = JSON.parse(pendingData);
                  sessionStorage.removeItem('pendingRegistration');

                  // Auto-login the newly registered parent
                  handleRegistrationComplete(data.phone, data.name, data.userId);
                } else {
                  // Fallback: just navigate to search if no data found
                  navigateToPage("search");
                }
              }}
            />
          </motion.div>
        )}

        {currentPage === "audit-disputes" && (
          <motion.div
            key="audit-disputes"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyAuditDisputesPage
              navigateToPage={navigateToPage}
            />
          </motion.div>
        )}

        {currentPage === "policies" && (
          <motion.div
            key="policies"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyPoliciesPage
              onBack={() => navigateToPage("services", "back")}
              students={students}
              userPhone={userPhone}
              userName={userName}
            />
          </motion.div>
        )}
        {currentPage === "account-profile" && (
          <motion.div
            key="account-profile"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyAccountProfilePage navigateToPage={navigateToPage} />
          </motion.div>
        )}
        {currentPage === "children-details" && (
          <motion.div
            key="children-details"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyChildrenDetailsPage navigateToPage={navigateToPage} />
          </motion.div>
        )}
        {currentPage === "student-manage" && (
          <motion.div
            key="student-manage"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LazyStudentManagePage navigateToPage={navigateToPage} />
          </motion.div>
        )}
      </AnimatePresence>
      <DynamicIsland data={dynamicIsland.islandData} onDismiss={dynamicIsland.hide} />
      <Toaster />
      <UpdateNotification />
      {showTutorial && <LazyTutorial onComplete={handleTutorialComplete} />}
      {showIOSDemo && <LazyIOSFeaturesDemo onClose={() => setShowIOSDemo(false)} />}
    </>
  );
}
