import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Download, Smartphone, Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hapticFeedback } from '../../utils/haptics';

export default function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // 1. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    setPlatform(isIos ? 'ios' : 'android');

    // 2. Check if already installed or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed');

    console.log('[PWA] Checking visibility:', { isStandalone, isDismissed, isIos });

    // If dismissed, check if 7 days have passed
    if (isDismissed) {
      const expiry = parseInt(isDismissed);
      if (new Date().getTime() < expiry) {
        console.log('[PWA] Prompt is currently in dismissal cooldown.');
        return;
      }
    }

    if (isStandalone) {
      console.log('[PWA] App is already installed.');
      return;
    }

    // 3. Handle Android/Chrome Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setIsVisible(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Handle iOS (no beforeinstallprompt)
    if (isIos) {
      console.log('[PWA] Triggering iOS manual instructions');
      setTimeout(() => setIsVisible(true), 3500);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        hapticFeedback('medium');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User choice: ${outcome}`);
        setDeferredPrompt(null);
        setIsVisible(false);
      } catch (err) {
        console.error('[PWA] Installation failed:', err);
      }
    } else {
      console.log('[PWA] No deferredPrompt available yet.');
      alert('The installation prompt is being handled by your browser. Please check the top-right of your address bar for the "Install" or "Open in App" icon.');
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    hapticFeedback('light');
    setIsVisible(false);
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa-prompt-dismissed', expiry.toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none pb-safe">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#003630]/40 backdrop-blur-md pointer-events-auto"
            onClick={handleDismiss}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -40px 100px -20px rgba(0,0,0,0.45)',
              background: 'white'
            }}
            className="relative w-full pointer-events-auto overflow-hidden px-6 pt-10 pb-8 border-t border-zinc-100"
          >
            {/* Handle Bar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-100 rounded-full" />

            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="size-20 bg-white rounded-[24px] flex items-center justify-center shadow-xl0"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                    <path d="M9 13L12 10L15 13" />
                  </svg>
                </motion.div>
                {/* Badge removed for cleaner look */}
              </div>

              <h3 className="text-2xl font-black text-[#003630] tracking-tight mb-2 font-['Space_Grotesk'] leading-none">
                Master-Fees App
              </h3>
              <p className="text-[15px] text-zinc-500 font-medium max-w-[280px]">
                Add Master-Fees to your home screen for a faster, smoother experience.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {platform === 'ios' ? (
                <div className="bg-zinc-50/80 rounded-3xl p-5 border border-zinc-100 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#003630] shrink-0 border border-zinc-100">
                      <Share size={20} strokeWidth={2.5} />
                    </div>
                    <p className="text-[15px] font-bold text-[#003630] leading-tight">
                      Tap the <span className="text-[#95e36c]">Share</span> button in Safari
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#003630] shrink-0 border border-zinc-100">
                      <PlusSquare size={20} strokeWidth={2.5} />
                    </div>
                    <p className="text-[15px] font-bold text-[#003630] leading-tight">
                      Scroll and select <span className="text-[#95e36c]">Add to Home Screen</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1 bg-zinc-50/80 rounded-[24px] p-4 border border-zinc-100 flex flex-col items-center text-center">
                    <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#003630] mb-3 border border-zinc-100">
                      <Smartphone size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-bold text-[#003630]">Native App Experience</span>
                  </div>
                  <div className="flex-1 bg-zinc-50/80 rounded-[24px] p-4 border border-zinc-100 flex flex-col items-center text-center">
                    <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#003630] mb-3 border border-zinc-100">
                      <Globe size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-bold text-[#003630]">Secure Browser Access</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {platform === 'ios' ? (
                <button
                  onClick={handleDismiss}
                  className="w-full h-[50px] bg-[#003630] rounded-[12px] text-white font-bold text-[17px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#003630]/20"
                >
                  Got it
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  className="w-full h-[50px] bg-[#003630] rounded-[12px] text-white font-bold text-[17px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#003630]/20"
                >
                  <Download size={20} strokeWidth={3} />
                  Install Application
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="w-full h-14 rounded-2xl text-zinc-400 font-bold text-[15px] hover:text-zinc-600 transition-colors flex items-center justify-center gap-2 group"
              >
                Continue in Browser
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <p className="text-[12px] text-zinc-400 text-center mt-6 font-medium leading-relaxed">
              Installing the app provides a better experience with <br />
              <span className="text-zinc-500 font-bold">instant updates and offline support.</span>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
