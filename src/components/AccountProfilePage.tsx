import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../stores/useAppStore';
import type { PageType } from '../stores/useAppStore';
import LogoHeader from "./common/LogoHeader";
import { toast } from 'sonner';
import { hapticFeedback } from '../utils/haptics';
import { updateParent } from '../lib/supabase/api/parents';
import { User, Mail, Phone, Loader2, Save, Shield, ArrowLeft } from 'lucide-react';
import group16 from "../assets/decorations/Group 16.png";
import group17 from "../assets/decorations/Group 17.png";

// ─── Luxe Design Tokens ──────────────────────────────────────────────────────
const EMERALD = "#003630";
const ACCENT = "#95e36c";

function LuxeInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  type?: string;
  icon?: any;
}) {
  return (
    <div className="flex flex-col gap-2 w-full group">
      <label className="text-[10px] font-black text-[#003630]/30 uppercase tracking-[0.2em] font-['Space_Grotesk',sans-serif] ml-1">
        {label}
      </label>
      <div className="relative flex items-center h-[56px] w-full">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full px-6 bg-white border border-neutral-100 rounded-xl outline-none focus:border-[#95e36c]/40 focus:ring-4 focus:ring-[#95e36c]/5 transition-all text-[#003630] font-medium text-[15px] shadow-[0px_2px_8px_rgba(0,0,0,0.04)] placeholder:text-[#003630]/10"
        />
      </div>
    </div>
  );
}

export default function AccountProfilePage({ navigateToPage }: { navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void }) {
  const userName = useAppStore(state => state.userName);
  const userPhone = useAppStore(state => state.userPhone);
  const userEmail = useAppStore(state => state.userEmail);
  const userId = useAppStore(state => state.userId);
  const setUserInfo = useAppStore(state => state.setUserInfo);

  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    hapticFeedback('medium');

    if (!userId) {
      toast.error('Identity error', { description: 'Your account session is invalid. Please log in again.' });
      setIsSaving(false);
      return;
    }

    try {
      await updateParent(userId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim().replace(/\D/g, '')
      });

      setUserInfo(name.trim(), phone.trim(), email.trim(), userId);
      toast.success('Profile updated successfully');
      hapticFeedback('success');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#FAFBFC] min-h-screen flex flex-col font-sans selection:bg-[#95e36c]/30 fixed inset-0 overflow-hidden">
      <div className="w-full max-w-[500px] mx-auto h-full flex flex-col relative bg-[#FAFBFC]">

        {/* ── Fixed Header ── */}
        <LogoHeader className="border-none shadow-none bg-white/40 backdrop-blur-md sticky top-0 z-20" />

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">

          {/* ── Hero Section ── */}
          <div className="w-full p-smart bg-gradient-to-b from-gray-50 to-neutral-100 flex flex-col gap-4 animate-fade-in border-b border-neutral-200 relative overflow-hidden shadow-[inset_0px_8px_48px_rgba(0,0,0,0.1)]">
            <div className="w-full relative z-10 flex flex-col items-start">
              <h1 className="text-[32px] font-[900] text-[#003630] tracking-[-1px] font-['Space_Grotesk',sans-serif] mb-1">Profile Settings</h1>
              <p className="text-[11px] text-[#003630]/40 font-bold uppercase tracking-[0.2em] mb-4">Personal Identity</p>
              <p className="text-[8px] text-neutral-500 font-medium max-w-[280px] leading-relaxed">
                Update your account information <br></br> and how you appear across the platform.
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

          <motion.div
            className="px-6 py-8 pb-32 space-y-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-6">
              <LuxeInput
                label="Display Name"
                icon={User}
                value={name}
                onChange={setName}
                placeholder="Your full name"
              />

              <LuxeInput
                label="Email Address"
                icon={Mail}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="your@email.com"
              />

              <LuxeInput
                label="Direct Line"
                icon={Phone}
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="Phone number"
              />
            </div>

            {/* Footer Protection Info */}
            <div className="flex flex-col items-center gap-3 pt-4 opacity-40">
              <div className="flex items-center gap-2 text-[#003630]">
                <Shield size={14} strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] font-['Space_Grotesk',sans-serif]">End-to-End Encrypted Data</span>
              </div>
              <p className="text-[9px] text-center font-bold font-['Space_Grotesk',sans-serif] uppercase tracking-widest text-[#003630]/60">

              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="p-6 bg-white/80 backdrop-blur-lg border-t border-neutral-100 shadow-[0px_-4px_20px_rgba(0,0,0,0.03)] z-30">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-[56px] rounded-xl bg-[#003630] text-white font-bold text-[15px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70 shadow-xl shadow-teal-950/20 relative overflow-hidden group mx-auto max-w-[400px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {isSaving ? (
              <Loader2 size={22} className="animate-spin text-[#95e36c]" />
            ) : (
              <Save size={18} className="text-[#95e36c]" />
            )}
            <span className="tracking-tight">Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
