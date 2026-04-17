import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../stores/useAppStore';
import type { PageType } from '../stores/useAppStore';
import LogoHeader from "./common/LogoHeader";
import { toast } from 'sonner';
import { hapticFeedback } from '../utils/haptics';
import { updateParent } from '../lib/supabase/api/parents';
import { User, Mail, Phone, Loader2, Save, Shield } from 'lucide-react';


// ─── Luxe Design Tokens ──────────────────────────────────────────────────────
const EMERALD = "#003630";
const ACCENT = "#95e36c";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1 mb-8 px-1">
      <div className="flex items-center gap-2">
        <div className="absolute -left-6 top-1 bottom-1 w-[4px] bg-white rounded-full" />
        <h2 className="text-[22px] font-[900] text-[#003630] tracking-[-0.8px] font-['Space_Grotesk',sans-serif]">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-[11px] text-[#003630]/40 font-bold uppercase tracking-[0.15em] ml-3">
          {subtitle}
        </p>
      )}
    </div>
  );
}

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
    <div className="space-y-2 w-full group flex flex-col items-center">
      <label className="text-[10px] font-black text-[#003630]/30 uppercase tracking-[0.3em] font-['Space_Grotesk',sans-serif] text-center">
        {label}
      </label>
      <div className="relative flex items-center h-[60px] w-full">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full px-8 bg-white border border-[#003630]/5 rounded-[20px] outline-none focus:border-[#95e36c]/40 focus:ring-[12px] focus:ring-[#95e36c]/5 transition-all text-[#003630] font-['Space_Grotesk',sans-serif] font-[900] text-[18px] shadow-sm tracking-[-0.3px] placeholder:text-[#003630]/10 text-center"
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
    <div className="min-h-screen bg-white fixed inset-0 flex justify-center overflow-hidden">
      <div className="w-full max-w-[600px] h-full flex flex-col relative bg-white overflow-hidden">

        <LogoHeader showBackButton={false} />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
          <motion.div
            className="px-6 py-8 space-y-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Account Settings Section */}
            <section>
              <SectionHeader title="Profile Settings" subtitle="Personal Identity" />

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

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-[60px] mt-4 rounded-[20px] bg-[#003630] text-white font-['Space_Grotesk',sans-serif] font-[900] text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70 shadow-2xl shadow-[#003630]/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {isSaving ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  <span className="tracking-[-0.3px]">Commit Changes</span>
                </button>
              </div>
            </section>

            {/* Footer Protection Info */}
            <div className="flex flex-col items-center gap-3 pt-4 pb-20 px-2 opacity-30">
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-['Space_Grotesk',sans-serif]">End-to-End Encrypted Data</span>
              </div>
              <p className="text-[9px] text-center font-bold font-['Space_Grotesk',sans-serif] uppercase tracking-widest text-[#003630]">
                Institutional Security Standards Compliance • V2.4.0
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
