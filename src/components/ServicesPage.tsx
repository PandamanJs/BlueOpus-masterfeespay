import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { getInstitutionType, getStudentsByPhone } from "../data/students";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";
import { useAppStore } from "../stores/useAppStore";
import type { PageType } from "../stores/useAppStore";
import {
  Settings,
  ChevronRight,
  User,
  Bell,
  HelpCircle,
  LogOut,
  X,
  Phone,
  Check,
  Baby,
  ShieldCheck,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import masterFeesLogo from "../assets/header_logo.png";
import posthog from "../lib/posthog";


interface ServicesPageProps {
  userName: string;
  userPhone: string;
  schoolName?: string;
  onBack: () => void;
  onSelectService: (service: string) => void;
  onViewHistory: () => void;
  onPayFees?: () => void;
  debtCount?: number;
  onInactivityRefresh?: () => void;
  navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void;
}



// ─── Settings Drawer ─────────────────────────────────────────────────────────


export default function ServicesPage({ userName, userPhone, schoolName, onBack, onSelectService, onViewHistory, onPayFees, debtCount, onInactivityRefresh, navigateToPage }: ServicesPageProps) {
  const institutionType = schoolName ? getInstitutionType(schoolName) : undefined;
  const isUniversity = institutionType === 'university';

  const storeSchoolName = useAppStore(state => state.selectedSchool);
  const selectedSchoolId = useAppStore(state => state.selectedSchoolId);
  const [inferredSchoolName, setInferredSchoolName] = useState("");
  const displaySchoolName = schoolName || storeSchoolName || inferredSchoolName || "";

  useEffect(() => {
    if (!schoolName && !storeSchoolName && userPhone) {
      getStudentsByPhone(userPhone, selectedSchoolId || undefined).then(students => {
        if (students && students.length > 0) {
          setInferredSchoolName(students[0].schoolName);
        }
      });
    }
  }, [schoolName, storeSchoolName, userPhone, selectedSchoolId]);

  const students = useAppStore(state => state.students);
  const isUnderReview = students.some(s => s.verificationStatus === 'unverified');

  const currentHour = new Date().getHours();
  const greeting = currentHour >= 5 && currentHour < 12 ? "Good Morning" : currentHour >= 12 && currentHour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="bg-white min-h-screen w-full overflow-hidden flex flex-col items-center">
      {/* ── Mobile Container ── */}
      <div className="relative w-full max-w-[440px] h-screen bg-white shadow-2xl overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="w-full h-[50px] pt-safe px-6 bg-white border-b border-neutral-200 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <div className="size-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                <path d="M9 13L12 10L15 13" />
              </svg>
            </div>
            <h1 className="text-black text-[22px] font-bold font-['Inter'] tracking-tight leading-none">masterfees</h1>
          </div>

        </div>

        {/* ── Hero Greeting Block ── */}
        <div className="w-full p-smart bg-gray-50 flex flex-col gap-4 animate-fade-in">
          <div className="w-full flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-black/60 text-smart-h3 font-normal font-['Inter']">{greeting},</span>
              <span className="text-black text-smart-h2 font-extrabold font-['Inter'] leading-tight tracking-[-0.5px]">{userName}</span>
            </div>

            {isUnderReview ? (
              <div 
                className="h-6 px-3 rounded-full flex items-center gap-2 border shadow-sm"
                style={{ backgroundColor: '#FFF1F1', borderColor: '#FBDEDE' }}
              >
                <AlertTriangle size={12} strokeWidth={3} style={{ color: '#9B4444' }} />
                <span style={{ color: '#9B4444' }} className="text-[10px] font-black font-['Space_Grotesk'] uppercase tracking-wider">Under Review</span>
              </div>
            ) : (
              <div className="h-6 px-3 bg-[#95e36c]/10 rounded-full flex items-center gap-2 border border-[#95e36c]/30">
                <div className="w-3.5 h-3.5 rounded-full bg-[#95e36c] flex items-center justify-center">
                  <Check size={10} strokeWidth={4} className="text-white" />
                </div>
                <span className="text-[#004d45] text-[10px] font-bold font-['Space_Grotesk'] uppercase tracking-wider">Account Verified</span>
              </div>
            )}
          </div>

          <div className="py-2">
            <p className="text-black/70 text-smart-body font-normal font-['Inter'] leading-relaxed">
              Welcome to the <span className="font-semibold text-black">{displaySchoolName || 'School'}</span> payment portal. What would you like to do today?
            </p>
          </div>
        </div>

        {/* ── Main Menu Actions ── */}
        <div className="flex-1 px-6 py-8 flex flex-col gap-5 overflow-y-auto no-scrollbar scroll-smooth">

          {/* Action: Pay Fees */}
          <button
            onClick={() => {
              haptics.medium?.();
              posthog.capture({ event: 'pay_fees_clicked' });
              onPayFees?.();
            }}
            className="w-full h-[52px] px-6 bg-[#003630] rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-lg shadow-teal-950/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 relative text-[#95e36c] group-hover:scale-110 transition-transform">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
              <span className="text-white text-[13px] font-medium font-['Inter'] tracking-tight">
                {isUniversity ? 'Pay Tuition' : 'Pay for School Fees'}
              </span>
            </div>
            <div className="w-5 h-5 flex items-center justify-center text-white transition-colors">
              <ChevronRight size={16} strokeWidth={2.5} />
            </div>
          </button>

          {/* Action: History */}
          <button
            onClick={() => {
              haptics.light?.();
              posthog.capture({ event: 'payment_history_clicked' });
              onViewHistory();
            }}
            className="w-full h-[52px] px-6 bg-white rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.06)] border border-neutral-100 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 text-black group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-black text-[13px] font-medium font-['Inter'] tracking-tight">Payment History</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-gray-50 group-hover:text-black transition-all">
              <ChevronRight size={16} strokeWidth={2.5} />
            </div>
          </button>

          {/* Action: Policies */}
          <button
            onClick={() => {
              haptics.light?.();
              posthog.capture({ event: 'policies_clicked' });
              navigateToPage("policies");
            }}
            className="w-full h-[52px] px-6 bg-white rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.06)] border border-neutral-100 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 text-black group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span className="text-black text-[13px] font-medium font-['Inter'] tracking-tight">Policies & Refunds</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-gray-50 group-hover:text-black transition-all">
              <ChevronRight size={16} strokeWidth={2.5} />
            </div>
          </button>
          <button
            onClick={() => {
              haptics.light?.();
              posthog.capture({ event: 'settings_opened_from_button' });
              navigateToPage("settings");
            }}
            className="w-full h-[52px] px-6 bg-white rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.06)] border border-neutral-100 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 text-black group-hover:scale-110 transition-transform">
                <Settings size={20} strokeWidth={2} />
              </div>
              <span className="text-black text-[13px] font-medium font-['Inter'] tracking-tight">Account Settings</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-gray-50 group-hover:text-black transition-all">
              <ChevronRight size={16} strokeWidth={2.5} />
            </div>
          </button>

        </div>

      </div>



    </div>
  );
}
