import { motion } from "motion/react";
import {
  User,
  ShieldCheck,
  Baby,
  HelpCircle,
  ChevronRight,
  LogOut,
  Settings,
  ArrowLeft
} from "lucide-react";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";
import posthog from "../lib/posthog";
import { type PageType } from "../stores/useAppStore";
import LogoHeader from "./common/LogoHeader";
import group16 from "../assets/decorations/Group 16.png";
import group17 from "../assets/decorations/Group 17.png";

interface SettingsPageProps {
  userName: string;
  userPhone: string;
  onLogout: () => void;
  onBack: () => void;
  navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void;
}

export default function SettingsPage({
  userName,
  userPhone,
  onLogout,
  onBack,
  navigateToPage,
}: SettingsPageProps) {
  const items = [
    { icon: <User size={20} />, label: "Account Profile", subLabel: "Update your personal information", disabled: false },
    { icon: <ShieldCheck size={20} />, label: "Audit & Disputes", subLabel: "Review and resolve payment issues", disabled: false },
    { icon: <Baby size={20} />, label: "Children's Details", subLabel: "Manage your students", disabled: false },
    { icon: <HelpCircle size={20} />, label: "Help & Support", subLabel: "Get assistance and FAQs", disabled: true },
  ];

  return (
    <div className="bg-[#FAFBFC] min-h-screen flex flex-col font-sans selection:bg-[#95e36c]/30">
      {/* ── Fixed Header ── */}
      <LogoHeader className="border-none shadow-none bg-white/40 backdrop-blur-md sticky top-0 z-20" />

      {/* ── Hero Section ── */}
      <div className="w-full p-smart bg-gradient-to-b from-gray-50 to-neutral-100 flex flex-col gap-4 animate-fade-in border-b border-neutral-200 relative overflow-hidden shadow-[inset_0px_8px_48px_rgba(0,0,0,0.1)]">
        <div className="w-full max-w-[500px] mx-auto text-left relative z-10">
          <h1 className="text-[32px] font-[900] text-[#003630] tracking-[-1px] font-['Space_Grotesk',sans-serif] mb-1">General Settings</h1>
          <p className="text-[11px] text-[#003630]/40 font-bold uppercase tracking-[0.2em] mb-4">Account & Preferences</p>
          <p className="text-[8px] text-neutral-500 font-medium max-w-[280px] leading-relaxed">
            Manage your account security, view payment audits, <br></br> and update your children's details in one secure place.
          </p>
        </div>

        {/* Decorative Assets */}
        <div className="absolute right-0 top-0 h-full w-full pointer-events-none overflow-hidden select-none z-0">
          <div className="relative w-full h-full">
            <div
              className="absolute right-[10px] w-[120px] h-[120px] opacity-[0.08]"
              style={{ top: '-60px', transform: 'rotate(25deg)', zIndex: 0 }}
            >
              <img src={group16} alt="" className="w-full h-full object-contain" />
            </div>
            <div
              className="absolute right-[8px] w-[120px] h-[120px] opacity-[0.15]"
              style={{ bottom: '-50px', transform: 'translateY(5px) rotate(-12deg)', zIndex: 1 }}
            >
              <img src={group17} alt="" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 w-full max-w-[500px] mx-auto flex flex-col px-6 pb-12">

        {/* ── Settings Group ── */}
        <div className="flex-1 px-0 py-1 flex flex-col justify-center gap-4">

          <div className="flex flex-col gap-4">
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
                    navigateToPage("account-profile");
                  } else if (item.label === "Children's Details") {
                    navigateToPage("children-details");
                  } else if (item.label === "Audit & Disputes") {
                    navigateToPage("audit-disputes");
                  }
                }}
                className={`w-full h-[52px] px-6 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all ${item.label === "Account Profile"
                  ? "bg-[#003630] shadow-lg shadow-teal-950/20 border-none"
                  : "bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.06)] border border-neutral-100"
                  } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 group-hover:scale-110 transition-transform flex items-center justify-center ${item.label === "Account Profile" ? "text-[#95e36c]" : "text-black"
                    }`}>
                    {item.icon}
                  </div>
                  <span className={`text-[13px] font-medium font-['Inter'] tracking-tight ${item.label === "Account Profile" ? "text-white" : "text-black"
                    }`}>
                    {item.label}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${item.label === "Account Profile"
                  ? "text-[#95e36c] group-hover:bg-white/5"
                  : "text-gray-300 group-hover:bg-gray-50 group-hover:text-black"
                  }`}>
                  <ChevronRight size={16} strokeWidth={2.5} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Footer ── */}
        <div className="mt-auto pt-12 flex flex-col items-center gap-10">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => {
              haptics.heavy?.();
              onLogout();
            }}
            className="w-full h-14 rounded-2xl bg-white border border-red-50 flex items-center justify-center gap-4 text-red-500 font-bold text-[15px] shadow-sm hover:bg-red-50 active:scale-[0.98] transition-all group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </motion.button>

          <div className="flex flex-col items-center gap-4 opacity-20 pb-safe">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#003630]"></p>
            <p className="text-[9px] font-bold text-neutral-500">v1.2.4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
