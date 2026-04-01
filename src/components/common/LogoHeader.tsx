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
        <div className="size-[31px]">
            <div className="relative size-full">
                <div className="absolute bottom-[-22.63%] left-[-9.72%] right-[-9.72%] top-0">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 38 39">
                        <g id="Group 15">
                            <g filter="url(#filter0_d_2_352)" id="rect84">
                                <path d={headerSvgPaths.p24506700} fill="var(--fill-0, #003630)" />
                                <path d={headerSvgPaths.p24506700} stroke="var(--stroke-0, white)" strokeWidth="3" />
                            </g>
                            <g id="path60">
                                <path d={headerSvgPaths.p8fdf600} fill="var(--fill-0, #003630)" />
                                <path d={headerSvgPaths.p8fdf600} stroke="var(--stroke-0, #95E36C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                            </g>
                        </g>
                        <defs>
                            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="37.0294" id="filter0_d_2_352" width="37.0294" x="5.96046e-08" y="0.985283">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                                <feOffset dy="4" />
                                <feGaussianBlur stdDeviation="2" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                                <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2_352" />
                                <feBlend in="SourceGraphic" in2="effect1_dropShadow_2_352" mode="normal" result="shape" />
                            </filter>
                        </defs>
                    </svg>
                </div>
            </div>
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
        <div className={`h-[66px] w-full relative bg-white/95 backdrop-blur-[20px] flex items-center px-4 ${className}`}>
            <div aria-hidden="true" className="absolute border-[#e5e7eb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
            
            {showBackButton && onBack && (
               <button 
                onClick={onBack}
                className="absolute left-[16px] top-1/2 translate-y-[-50%] p-2 rounded-full active:bg-gray-100 z-50"
               >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </button>
            )}

            <button 
                onClick={handleHomeClick}
                className="absolute left-1/2 translate-x-[-50%] top-[17px] flex items-center gap-[16px] touch-manipulation active:scale-95 transition-transform"
                title="Go to Home"
            >
                {showLogo && <Logo />}
                <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-[normal] not-italic text-[20px] text-[#003630] text-nowrap whitespace-pre tracking-[-0.3px]">master-fees</p>
            </button>

            {children}
        </div>
    );
}
