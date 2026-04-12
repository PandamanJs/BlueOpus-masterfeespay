import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../imports/svg-o96q0cdj2h";
import { useState, useEffect, useRef, useCallback } from "react";
import LogoHeader from "./common/LogoHeader";
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
} from "lucide-react";
import verifiedIcon from "../assets/button icons/verified.png";

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

function SettingsDrawer({
  isOpen,
  onClose,
  userName,
  userPhone,
  onLogout,
  navigateToPage,
}: {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userPhone: string;
  onLogout: () => void;
  navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void;
}) {
  const items = [
    { icon: <User size={20} />, label: "Account Profile", disabled: true },
    { icon: <Bell size={20} />, label: "Notifications", disabled: true },
    { icon: <HelpCircle size={20} />, label: "Help & Support", disabled: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[999]"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 32,
              stiffness: 380,
              mass: 0.8
            }}
            className="fixed bottom-0 left-0 right-0 z-[1000] mx-auto max-w-[600px] flex flex-col"
          >
            {/* Handle Bar - History Style */}
            <div className="flex justify-center pt-[12px] pb-[6px]">
              <div className="w-[36px] h-[5px] bg-white/90 rounded-full shadow-sm" />
            </div>

            <div className="bg-[#f9fafb] rounded-t-[32px] shadow-[0px_-12px_44px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Premium Gradient Top Border */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#95e36c]/60 to-transparent" />

              {/* Header - Refined History Style */}
              <div className="px-6 pt-6 pb-4 border-b border-[#f0f1f3] bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[14px] bg-[#95e36c]/10 flex items-center justify-center text-[#01403c]">
                      <Settings size={20} />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-black text-[#003630] tracking-[-0.5px]">Settings</h2>
                      <p className="text-[11px] text-[#003630]/50 font-medium uppercase tracking-[0.5px]">Profile & Preferences</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-[#f1f3f5] flex items-center justify-center text-[#6b7280] active:scale-90 transition-transform"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar scroll-smooth">
                {/* Profile Card - High-Fidelity Checkout Style */}
                <div className="bg-[#003630] rounded-[32px] p-6 text-white shadow-[0px_24px_48px_-12px_rgba(0,54,48,0.45)] mb-8 relative overflow-hidden group border border-white/10 transition-all duration-500 hover:shadow-[0px_32px_64px_-16px_rgba(0,54,48,0.55)]">
                  {/* Triple Chevron Decoration - Checkout Engine Parity */}
                  <div className="absolute -top-4 -right-1 w-38 h-38 opacity-30 pointer-events-none group-hover:scale-110 group-hover:rotate-[-10deg] transition-all duration-1000 ease-out">
                    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full rotate-[-15deg]">
                      <path d="M40 20L65 45L40 70" stroke="#e0f7d4" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M55 20L80 45L55 70" stroke="#95e36c" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
                      <path d="M70 20L95 45L70 70" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" className="opacity-20" />
                    </svg>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2 className="text-[28px] font-black tracking-[-1px] leading-tight text-white drop-shadow-md font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif]">
                      {userName || "Louis Siwale"}
                    </h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-inner group/phone hover:bg-white/15 transition-colors w-fit">
                      <Phone size={14} className="text-[#95e36c] group-hover/phone:scale-110 transition-transform" />
                      <p className="text-[14px] font-bold tracking-[0.2px] text-white/90 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif]">
                        {userPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items - Premium List */}
                <div className="space-y-4">
                  <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[12px] text-gray-400 px-1 uppercase tracking-[0.1em] mb-4 opacity-80">General Settings</p>
                  {items.map((item, idx) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 + 0.1 }}
                      onClick={() => {
                        if (item.disabled) {
                          toast.info(`${item.label} coming soon!`);
                          return;
                        }
                        haptics.light?.();
                        if (item.label === "Account Profile") {
                          onClose();
                          navigateToPage("account-profile");
                        } else {
                          toast.info(`${item.label} coming soon!`);
                        }
                      }}
                      className={`w-full group active:scale-[0.98] transition-all ${item.disabled ? 'opacity-40 pointer-events-none saturate-50' : ''}`}
                    >
                      <div className={`flex items-center justify-between p-4 bg-[#f9fafb] border border-[#f1f3f5] rounded-[24px] shadow-sm ${!item.disabled && 'group-hover:border-[#95e36c]/60 group-hover:bg-white group-hover:shadow-md'} transition-all duration-300`}>
                        <div className="flex items-center gap-5">
                          <div className="text-[#94a3b8] group-hover:text-[#003630] group-hover:scale-110 transition-all duration-300">
                            {item.icon}
                          </div>
                          <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#003630] tracking-[-0.2px]">
                            {item.label}
                          </span>
                        </div>
                        <div className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center text-[#cbd5e1] group-hover:text-[#003630] transition-all border border-transparent group-hover:border-[#95e36c]/30">
                          <ChevronRight size={18} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Enhanced Logout Action - Dark Emerald Shine */}
              <div className="px-8 pt-6 pb-14 bg-white border-t border-[#f3f4f6]/60 flex flex-col gap-4 shadow-[0px_-10px_30px_rgba(0,0,0,0.03)] z-50">
                <button
                  onClick={() => {
                    haptics.heavy?.();
                    onLogout();
                  }}
                  className="relative h-[60px] w-full max-w-[340px] mx-auto rounded-[20px] overflow-hidden group active:scale-[0.96] transition-all shadow-[0px_12px_24px_-8px_rgba(0,54,48,0.3)] touch-manipulation block"
                >
                  {/* Background */}
                  <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#014d45] transition-colors" />

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <LogOut size={18} className="text-[#95e36c]" strokeWidth={2.5} />
                    </div>
                    <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[17px] text-white tracking-[-0.3px]">Sign Out</p>
                  </div>
                </button>
                <p className="text-center text-[11px] text-[#9ca3af] font-['Inter:Medium',sans-serif] uppercase tracking-widest mt-1 opacity-60">Version 1.2.4 • Secure Session</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PageGroup1({ onBack, onShowSettings, schoolName }: { onBack: () => void; onShowSettings: () => void; schoolName?: string }) {
  return (
    <div className="absolute contents left-0 top-0">
      {/* Welcome text moved to main greeting block for better alignment */}

      <div className="absolute box-border h-[66px] left-1/2 top-0 translate-x-[-50%] w-full max-w-[600px]">
        <LogoHeader onBack={onBack}>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => {
                haptics.light?.();
                onShowSettings();
              }}
              className="flex items-center justify-center text-[#003630] active:scale-90 transition-transform"
            >
              <Settings size={18} />
            </button>
          </div>
        </LogoHeader>
      </div>
    </div>
  );
}

function PageGroup2({ onBack, onShowSettings, schoolName }: { onBack: () => void; onShowSettings: () => void; schoolName?: string }) {
  return (
    <div className="absolute contents left-0 top-0">
      <PageGroup1 onBack={onBack} onShowSettings={onShowSettings} schoolName={schoolName} />
    </div>
  );
}

function Frame2({ onPayFees, isUniversity }: { onPayFees?: () => void; isUniversity?: boolean }) {
  return (
    <div className="w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
      <button
        onClick={() => {
          haptics.medium?.();
          onPayFees?.();
        }}
        className="w-full h-[60px] rounded-[18px] btn-dark btn-tactile flex items-center justify-between px-6 transition-all group shadow-[0_4px_0_0_#001a17,0_20px_40px_-10px_rgba(0,54,48,0.4)]"
      >
        <div className="flex items-center gap-4">
          <div className="text-[#95e36c] group-active:scale-95 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-white tracking-[-0.2px]">
            {isUniversity ? 'Pay Tuition' : 'Pay for School Fees'}
          </p>
        </div>
        <ChevronRight size={14} strokeWidth={3} className="text-white opacity-80" />
      </button>
    </div>
  );
}

function Frame3({ onViewHistory, debtCount }: { onViewHistory: () => void; debtCount?: number }) {
  return (
    <div className="w-full animate-fade-in" style={{ animationDelay: '200ms' }}>
      <button
        onClick={() => {
          haptics.light?.();
          onViewHistory();
        }}
        className="w-full h-[60px] rounded-[18px] bg-white border border-gray-100 shadow-[0_4px_0_0_#f3f4f6,0_15px_30px_-10px_rgba(0,0,0,0.08)] active:translate-y-[2px] active:shadow-[0_2px_0_0_#f3f4f6,0_10px_20px_-5px_rgba(0,0,0,0.05)] transition-all flex items-center justify-between px-6 group"
      >
        <div className="flex items-center gap-4 text-[#003630]">
          <div className="group-active:scale-95 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-[#003630] tracking-[-0.2px]">
            Payment History
          </p>
        </div>
        <ChevronRight size={14} strokeWidth={3} className="text-[#003630] opacity-40" />
      </button>
    </div>
  );
}

function Frame4({ onSelectService }: { onSelectService: (service: string) => void }) {
  return (
    <div className="w-full animate-fade-in" style={{ animationDelay: '300ms' }}>
      <button
        onClick={() => {
          haptics.light?.();
          onSelectService("payment-plans");
        }}
        className="w-full h-[60px] rounded-[18px] bg-white border border-gray-100 shadow-[0_4px_0_0_#f3f4f6,0_15px_30px_-10px_rgba(0,0,0,0.08)] active:translate-y-[2px] active:shadow-[0_2px_0_0_#f3f4f6,0_10px_20px_-5px_rgba(0,0,0,0.05)] transition-all flex items-center justify-between px-6 group"
      >
        <div className="flex items-center gap-4 text-[#003630]">
          <div className="group-active:scale-95 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-[#003630] tracking-[-0.2px]">
            Policies & Refunds
          </p>
        </div>
        <ChevronRight size={14} strokeWidth={3} className="text-[#003630] opacity-40" />
      </button>
    </div>
  );
}

function Frame6({ onSelectService, onViewHistory, onPayFees, isUniversity, debtCount }: { onSelectService: (service: string) => void; onViewHistory: () => void; onPayFees?: () => void; isUniversity?: boolean; debtCount?: number }) {
  return (
    <div className="absolute flex flex-col gap-4 items-start left-1/2 translate-x-[-50%] top-[300px] w-full max-w-[600px] px-6">
      <Frame2 onPayFees={onPayFees} isUniversity={isUniversity} />
      <Frame3 onViewHistory={onViewHistory} debtCount={debtCount} />
      <Frame4 onSelectService={onSelectService} />
    </div>
  );
}

export default function ServicesPage({ userName, userPhone, schoolName, onBack, onSelectService, onViewHistory, onPayFees, debtCount, onInactivityRefresh, navigateToPage }: ServicesPageProps) {
  const institutionType = schoolName ? getInstitutionType(schoolName) : undefined;
  const isUniversity = institutionType === 'university';

  const storeSchoolName = useAppStore(state => state.selectedSchool);
  const [inferredSchoolName, setInferredSchoolName] = useState("");
  const displaySchoolName = schoolName || storeSchoolName || inferredSchoolName || "";

  useEffect(() => {
    if (!schoolName && !storeSchoolName && userPhone) {
      getStudentsByPhone(userPhone).then(students => {
        if (students && students.length > 0) {
          setInferredSchoolName(students[0].schoolName);
        }
      });
    }
  }, [schoolName, storeSchoolName, userPhone]);

  const [showSettings, setShowSettings] = useState(false);

  // ── Inactivity auto-refresh after 5 minutes ──────────────────────────────
  const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      console.log('[ServicesPage] 5 min inactivity — refreshing...');
      if (onInactivityRefresh) {
        onInactivityRefresh();
      } else {
        // Fallback: trigger a full page reload
        window.location.reload();
      }
    }, INACTIVITY_MS);
  }, [onInactivityRefresh, INACTIVITY_MS]);

  useEffect(() => {
    const events = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer(); // start the timer on mount
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);
  // ────────────────────────────────────────────────────────────────────────

  const currentHour = new Date().getHours();
  const greeting = currentHour >= 5 && currentHour < 12 ? "Good morning" : currentHour >= 12 && currentHour < 17 ? "Good Afternoon" : "Good Evening";

  const handleViewPaymentPlans = (service: string) => {
    if (service === "payment-plans") {
      navigateToPage("policies");
    } else {
      onSelectService(service);
    }
  };


  return (
    <div className="bg-[#F9FAFB] min-h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen mx-auto overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-white shadow-[inset_0_-2px_10px_rgba(0,0,0,0.02)]">
          <PageGroup2 onBack={onBack} onShowSettings={() => setShowSettings(true)} schoolName={displaySchoolName} />
        </div>
        <div className="absolute left-1/2 translate-x-[-50%] top-[110px] w-full max-w-[600px] px-[24px] flex flex-col gap-3">
          <p className="font-['Inter:Light',sans-serif] text-[18px] text-[#003630]/60 leading-none">
            {greeting},
          </p>
          <div className="flex items-center justify-between">
            <p className="font-['Inter:Black',sans-serif] font-bold text-[34px] text-[#003630] leading-tight tracking-[1.5px]">
              {userName}
            </p>
            <div className="flex items-center gap-2 translate-y-1">
              <img
                src="https://cdn-icons-png.flaticon.com/512/7595/7595571.png"
                alt="Verified"
                className="w-[16px] h-[16px] object-contain"
              />
              <span className="font-['Inter:SemiBold',sans-serif] text-[12px] text-[#003630]">Account Verified</span>
            </div>
          </div>
          <div className="mt-8 max-w-[340px]">
            <p className="font-['Inter:Regular',sans-serif] text-[15px] text-[#003630]/70 leading-[1.6] tracking-[-0.2px]">
              Welcome to the <span className="font-bold text-[#003630]">{displaySchoolName || 'school'}</span> payment portal. What would you like to do today?
            </p>
          </div>
        </div>
        <Frame6 onSelectService={handleViewPaymentPlans} onViewHistory={onViewHistory} onPayFees={onPayFees} isUniversity={isUniversity} debtCount={debtCount} />
      </div>

      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userName={userName}
        userPhone={userPhone}
        onLogout={() => {
          haptics.warning?.();
          useAppStore.getState().resetAll();
        }}
        navigateToPage={navigateToPage}
      />
    </div>
  );
}
