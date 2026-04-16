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
  ShieldCheck,
} from "lucide-react";

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
    { icon: <ShieldCheck size={20} />, label: "Policies & Refunds", disabled: false },
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
                        } else if (item.label === "Policies & Refunds") {
                          onClose();
                          navigateToPage("policies");
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
  const INACTIVITY_MS = 5 * 60 * 1000;
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      console.log('[ServicesPage] 5 min inactivity — refreshing...');
      if (onInactivityRefresh) {
        onInactivityRefresh();
      } else {
        window.location.reload();
      }
    }, INACTIVITY_MS);
  }, [onInactivityRefresh, INACTIVITY_MS]);

  useEffect(() => {
    const events = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  const currentHour = new Date().getHours();
  const greeting = currentHour >= 5 && currentHour < 12 ? "Good Morning" : currentHour >= 12 && currentHour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="bg-white min-h-screen w-full overflow-hidden flex flex-col items-center">
      {/* ── Mobile Container ── */}
      <div className="relative w-full max-w-[440px] h-screen bg-white shadow-2xl overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="w-full h-20 px-6 bg-white border-b border-neutral-200 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <div className="size-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                <path d="M9 13L12 10L15 13" />
              </svg>
            </div>
            <h1 className="text-black text-[22px] font-bold font-['Inter'] tracking-tight leading-none">masterfees</h1>
          </div>

          <button
            onClick={() => {
              haptics.light?.();
              setShowSettings(true);
            }}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black active:scale-95 transition-all border border-gray-100"
          >
            <Settings size={20} strokeWidth={2} />
          </button>
        </div>

        {/* ── Hero Greeting Block ── */}
        <div className="w-full p-6 bg-gray-50 flex flex-col gap-4 animate-fade-in">
          <div className="w-full flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-black/60 text-lg font-normal font-['Inter']">{greeting},</span>
              <span className="text-black text-2xl font-extrabold font-['Inter'] leading-tight tracking-[-0.5px]">{userName}</span>
            </div>

            <div className="h-6 px-3 bg-[#95e36c]/10 rounded-full flex items-center gap-2 border border-[#95e36c]/30">
              <div className="w-3.5 h-3.5 rounded-full bg-[#95e36c] flex items-center justify-center">
                <Check size={10} strokeWidth={4} className="text-white gap-3" />
              </div>
              <span className="text-[#004d45] text-[10px] font-bold font-['Space_Grotesk'] uppercase tracking-wider">Account Verified</span>
            </div>
          </div>

          <div className="py-2">
            <p className="text-black/70 text-[13px] font-normal font-['Inter'] leading-relaxed">
              Welcome to the <span className="font-semibold text-black">{displaySchoolName || 'Twalumbu Education Centre'}</span> payment portal. What would you like to do today?
            </p>
          </div>
        </div>

        {/* ── Main Menu Actions ── */}
        <div className="flex-1 px-6 py-8 flex flex-col gap-5 overflow-y-auto no-scrollbar scroll-smooth">

          {/* Action: Pay Fees */}
          <button
            onClick={() => {
              haptics.medium?.();
              onPayFees?.();
            }}
            className="w-full h-[52px] px-6 bg-[#003630] rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-lg shadow-teal-950/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 relative text-white group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="2" y1="7" x2="22" y2="7" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
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

        </div>

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
