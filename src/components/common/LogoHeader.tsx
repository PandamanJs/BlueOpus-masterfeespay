import React from 'react';
import { Check } from 'lucide-react';
import { hapticFeedback } from "../../utils/haptics";
import { useAppStore } from "../../stores/useAppStore";

interface LogoHeaderProps {
    className?: string;
    showLogo?: boolean;
    children?: React.ReactNode;
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div data-svg-wrapper>
        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.909 7.84821C17.5924 8.53163 17.5924 9.63967 16.909 10.3231L10.3234 16.9087C9.63996 17.5921 8.53192 17.5921 7.8485 16.9087L1.26288 10.3231C0.57946 9.63967 0.579461 8.53163 1.26288 7.84821L7.8485 1.26259L7.98108 1.14244C8.66844 0.581664 9.68261 0.621831 10.3234 1.26259L16.909 7.84821Z" stroke="black" strokeWidth="1.5" strokeLinecap="square"/>
        </svg>
      </div>
      <div data-svg-wrapper>
        <svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.75 3.83876L3.70593 0.895682C3.90101 0.701446 4.21641 0.701446 4.41149 0.895682L7.33865 3.81011" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export default function LogoHeader({ className, showLogo = true, children }: LogoHeaderProps) {

    const handleHomeClick = () => {
        hapticFeedback('medium');

        // Use store's reset capability to avoid being stuck in an inconsistent state
        useAppStore.getState().resetCheckoutFlow();

        // Force navigation to home with forward transition (since it's a reset)
        useAppStore.setState({
            currentPage: 'search',
            navigationDirection: 'back',
            selectedSchool: null
        });

        // Update browser history explicitly
        window.history.pushState({ page: 'search' }, '', '#search');
    };

    return (
    <div className={`h-[56px] pt-safe w-full relative z-[100] bg-white border-b border-zinc-100 flex items-center px-6 ${className || ''}`}>
      <div className="flex items-center justify-between w-full">
        <button
          onClick={handleHomeClick}
          className="flex items-center gap-3 active:scale-95 transition-transform shrink-0"
          title="Go to Home"
        >
          {showLogo && (
            <div className="size-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                <path d="M9 13L12 10L15 13" />
              </svg>
            </div>
          )}
          <div className="flex items-center gap-1.5 logo-crisp">
            <h1 className="text-black text-[22px] font-bold font-['Inter'] tracking-tight leading-none logo-crisp">masterfees</h1>
            <div className="size-5 bg-[#003129] rounded-full flex items-center justify-center">
              <Check size={12} className="text-white" strokeWidth={3} />
            </div>
          </div>
        </button>

        {children && (
          <div className="flex-1 flex justify-end items-center h-8 ml-4">
            {children}
          </div>
        )}
      </div>
    </div>
    );
}
