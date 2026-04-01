import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../imports/svg-o96q0cdj2h";
import { useState, useEffect, useRef, useCallback } from "react";
import LogoHeader from "./common/LogoHeader";
import { getInstitutionType } from "../data/students";
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

function DecorativeShapes() {
  return (
    <>
      <motion.div
        className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.6322111487388611)+(var(--transform-inner-height)*0.7254649996757507)))] items-center justify-center left-[calc(8%)] bottom-[80px] w-[calc(1px*((var(--transform-inner-height)*0.6882590651512146)+(var(--transform-inner-width)*0.7747961282730103)))]"
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
        className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.6322111487388611)+(var(--transform-inner-height)*0.7254649996757507)))] items-center justify-center left-[calc(13%)] bottom-[180px] w-[calc(1px*((var(--transform-inner-height)*0.6882590651512146)+(var(--transform-inner-width)*0.7747961282730103)))]"
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
        className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.6322111487388611)+(var(--transform-inner-height)*0.7254649996757507)))] items-center justify-center right-[calc(8%)] bottom-[60px] w-[calc(1px*((var(--transform-inner-height)*0.6882590651512146)+(var(--transform-inner-width)*0.7747961282730103)))]"
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

function PageGroup1({ onBack, onShowSettings }: { onBack: () => void; onShowSettings: () => void }) {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute left-1/2 top-[219.31px] translate-x-[-50%] w-full max-w-[600px] px-[24px]">
        <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-[1.5] not-italic text-[13px] text-black tracking-[-0.12px]">Which one of our services would you like us to help you with today?</p>
      </div>
      <DecorativeShapes />
      <div className="absolute box-border h-[66px] left-1/2 top-0 translate-x-[-50%] w-full max-w-[600px]">
        <LogoHeader onBack={onBack}>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => {
                haptics.light?.();
                onShowSettings();
              }}
              className="size-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-transform"
            >
              <Settings size={18} />
            </button>
          </div>
        </LogoHeader>
      </div>
    </div>
  );
}

function PageGroup2({ onBack, onShowSettings }: { onBack: () => void; onShowSettings: () => void }) {
  return (
    <div className="absolute contents left-0 top-0">
      <PageGroup1 onBack={onBack} onShowSettings={onShowSettings} />
    </div>
  );
}

function Frame2({ onPayFees, isUniversity }: { onPayFees?: () => void; isUniversity?: boolean }) {
  return (
    <div className="content-stretch flex gap-[15px] h-[44px] items-start relative shrink-0 w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
      <button
        onClick={() => {
          haptics.medium?.();
          onPayFees?.();
        }}
        className="btn-dark btn-tactile box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip px-[24px] py-[10px] relative shrink-0 w-full touch-manipulation"
        data-name="Button"
      >
        <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[15px] text-nowrap text-white tracking-[-0.15px] whitespace-pre">{isUniversity ? 'Pay Tuition' : 'Pay for School Fees'}</p>
      </button>
    </div>
  );
}

function Frame3({ onViewHistory, debtCount }: { onViewHistory: () => void; debtCount?: number }) {
  return (
    <div className="content-stretch flex gap-[15px] h-[43px] items-start relative shrink-0 w-full animate-fade-in" style={{ animationDelay: '200ms' }}>
      <button
        onClick={() => {
          haptics.light?.();
          onViewHistory();
        }}
        className="btn-ghost btn-tactile basis-0 grow min-h-px min-w-px relative shrink-0 touch-manipulation"
        data-name="Button"
      >
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[24px] py-[10px] relative w-full">
            <p className="font-['Inter:Extra_Light',sans-serif] font-extralight leading-[24px] not-italic relative shrink-0 text-[#2d3648] text-[15px] text-nowrap tracking-[-0.15px] whitespace-pre">
              Payment History
              {debtCount !== undefined && debtCount > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -16, minWidth: 16, height: 16,
                  padding: '0 4px',
                  backgroundColor: '#ff3b30', borderRadius: 8,
                  boxShadow: '0 0 0 2px #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '-apple-system, system-ui, sans-serif',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                }}>
                  {debtCount}
                </span>
              )}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

function Frame4({ onSelectService }: { onSelectService: (service: string) => void }) {
  return (
    <div className="content-stretch flex gap-[15px] h-[44px] items-start relative shrink-0 w-full animate-fade-in" style={{ animationDelay: '300ms' }}>
      <button
        disabled
        className="btn-ghost btn-tactile basis-0 grow min-h-px min-w-px relative shrink-0 touch-manipulation opacity-40 pointer-events-none saturate-50"
        data-name="Button"
      >
        <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
          <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[24px] py-[10px] relative w-full">
            <p className="font-['Inter:Extra_Light',sans-serif] font-extralight leading-[24px] not-italic relative shrink-0 text-[#2d3648] text-[15px] text-nowrap tracking-[-0.15px] whitespace-pre opacity-70">Policies</p>
          </div>
        </div>
      </button>
    </div>
  );
}

function Frame6({ onSelectService, onViewHistory, onPayFees, isUniversity, debtCount }: { onSelectService: (service: string) => void; onViewHistory: () => void; onPayFees?: () => void; isUniversity?: boolean; debtCount?: number }) {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-1/2 translate-x-[-50%] top-[300px] w-full max-w-[600px] px-[24px]">
      <Frame2 onPayFees={onPayFees} isUniversity={isUniversity} />
      <Frame3 onViewHistory={onViewHistory} debtCount={debtCount} />
      <Frame4 onSelectService={onSelectService} />
    </div>
  );
}

export default function ServicesPage({ userName, userPhone, schoolName, onBack, onSelectService, onViewHistory, onPayFees, debtCount, onInactivityRefresh, navigateToPage }: ServicesPageProps) {
  const institutionType = schoolName ? getInstitutionType(schoolName) : undefined;
  const isUniversity = institutionType === 'university';

  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    const interval = setInterval(tick, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

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
    <div className="bg-white min-h-screen w-full overflow-hidden flex items-center justify-center" data-name="Page 2">
      <div className="relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen mx-auto">
        <PageGroup2 onBack={onBack} onShowSettings={() => setShowSettings(true)} />
        <div className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0.5] left-1/2 translate-x-[-50%] not-italic text-[18px] text-black top-[164px] tracking-[-0.18px] w-full max-w-[600px] px-[24px]">
          <p className="font-['IBM_Plex_Sans_Devanagari:Light',sans-serif] mb-[14px]">{greeting}, </p>
          <div className="flex items-baseline justify-between">
            <p className="font-['Agrandir:Grand_Heavy',sans-serif] text-[#003630]">{userName}</p>
            <span
              className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[13px] tracking-[-0.1px]"
              style={{ color: 'rgba(156, 163, 175, 0.85)' }}
            >
              {currentTime}
            </span>
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
