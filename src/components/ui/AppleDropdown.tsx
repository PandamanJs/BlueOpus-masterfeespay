import { useState } from "react";
import { motion } from "motion/react";

interface AppleDropdownProps {
    label: string;
    options: { label: string; value: string; disabled?: boolean }[];
    value: string;
    onChange: (value: string) => void;
}

/**
 * Apple-style Dropdown Component
 * Premium dropdown with smooth animations
 */
export function AppleDropdown({
    label,
    options,
    value,
    onChange
}: AppleDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="w-full">
            {/* Label */}
            <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] text-[#6b7280] tracking-[1px] uppercase mb-[10px] pl-[4px]">
                {label}
            </p>

            {/* Dropdown Button */}
            <div className="relative group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full h-[48px] bg-[#f9fafb] hover:bg-white rounded-[12px] px-[16px] pr-[44px] flex items-center justify-between transition-all touch-manipulation border-[1.5px] border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm"
                >
                    <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[14px] text-[#003630] tracking-[-0.2px]">
                        {selectedOption?.label || "Select..."}
                    </p>
                </button>

                {/* Custom Arrow Icon */}
                <div className="absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-y-[-calc(50%-1px)]">
                    <div className="w-[20px] h-[20px] bg-white rounded-[6px] border border-[#e5e7eb] flex items-center justify-center shadow-sm">
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        >
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            className="absolute z-50 w-full mt-[8px] bg-white/95 backdrop-blur-[20px] rounded-[14px] shadow-[0px_8px_32px_rgba(0,0,0,0.12)] overflow-hidden border-[1.5px] border-[#e5e7eb]"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <div className="max-h-[240px] overflow-y-auto p-[4px]">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        disabled={option.disabled}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full group touch-manipulation active:scale-[0.98] transition-transform mb-[2px] ${option.disabled ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`w-full text-left px-[14px] py-[12px] rounded-[10px] transition-all relative ${option.value === value
                                            ? 'bg-gradient-to-r from-[#e0f7d4] to-[#d0f0c0] border-[1.5px] border-[#95e36c]/30 shadow-[0px_2px_8px_rgba(149,227,108,0.1)]'
                                            : option.disabled
                                                ? 'bg-gray-50/50 grayscale-[0.5] opacity-60'
                                                : 'hover:bg-[#f5f7f9] border-[1.5px] border-transparent'
                                            }`}>
                                            {option.value === value && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#95e36c] rounded-r-full" />
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-[8px]">
                                                    <p className={`font-['IBM_Plex_Sans_Devanagari:${option.value === value ? 'SemiBold' : 'Regular'}',sans-serif] text-[14px] tracking-[-0.2px] ${option.value === value ? 'text-[#003630] ml-[8px]' : option.disabled ? 'text-[#a0a0a0]' : 'text-[#1d1d1f]'
                                                        }`}>
                                                        {option.label}
                                                    </p>
                                                    {option.disabled && (
                                                        <span className="px-[6px] py-[2px] bg-red-50 text-red-500 text-[9px] font-bold rounded-full border border-red-100 uppercase tracking-[0.5px]">
                                                            Due
                                                        </span>
                                                    )}
                                                </div>
                                                {option.value === value && (
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M3 8L6 11L13 4" stroke="#95e36c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
