import { hapticFeedback } from "../../utils/haptics";
import headerSvgPaths from "../../imports/svg-co0ktog99f";
import { useAppStore } from "../../stores/useAppStore";

interface LogoHeaderProps {
    onBack?: () => void;
    showBackButton?: boolean;
    className?: string;
    showLogo?: boolean;
    children?: React.ReactNode;
}

function Logo() {
    return (
        <div className="size-[28px] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 12L12 22L22 12L12 2Z" />
                <path d="M9 13L12 10L15 13" />
            </svg>
        </div>
    );
}

export default function LogoHeader({ onBack, showBackButton = false, className, showLogo = true, children }: LogoHeaderProps) {

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
        <div className={`h-[66px] w-full sticky top-0 z-[100] bg-white/95 backdrop-blur-[20px] flex items-center px-4 ${className}`}>
            <div className="flex items-center gap-4 flex-1">
                <button 
                    onClick={handleHomeClick}
                    className="relative flex items-center gap-[12px] touch-manipulation active:scale-95 transition-transform shrink-0"
                    title="Go to Home"
                >
                    {showLogo && <Logo />}
                    <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic text-[22px] text-black text-nowrap whitespace-pre tracking-[-0.03em]">masterfees</p>
                </button>

                {children && (
                    <div className="flex-1 flex justify-center pr-[140px]">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
