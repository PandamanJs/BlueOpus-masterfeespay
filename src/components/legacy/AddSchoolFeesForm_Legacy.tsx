import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { getInstitutionType } from "../../data/students";
import { getSchoolByName } from "../../lib/supabase/api/schools";
import { haptics } from "../../utils/haptics";

/**
 * Premium Select Component (Legacy)
 */
export function PremiumSelect({
    label,
    value,
    options,
    onChange,
    placeholder = "Select an option"
}: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-[8px] relative">
            <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider ml-[2px]">{label}</span>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-[52px] px-[16px] pr-[40px] bg-white border-[1.5px] rounded-[14px] flex items-center justify-between transition-all shadow-sm active:scale-[0.98] ${isOpen ? 'border-[#003630] ring-2 ring-[#003630]/5' : 'border-[#e5e7eb] hover:border-[#d1d5db]'
                    }`}
            >
                <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[15px] truncate ${selectedOption ? 'text-[#003630]' : 'text-[#9ca3af]'
                    }`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[9000] bg-black/5 backdrop-blur-[1px]"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="absolute left-0 right-0 z-[9001] bg-white rounded-[24px] shadow-[0px_16px_48px_rgba(0,0,0,0.18)] border border-[#e5e7eb] overflow-hidden max-h-[300px] flex flex-col"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f3f5] bg-[#f9fafb]/50">
                                <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[1px]">{label}</span>
                                <button onClick={() => setIsOpen(false)} className="text-[#6b7280] opacity-50 hover:opacity-100">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto py-2 side-scrollbar">
                                {options.map((option) => {
                                    const isActive = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                haptics.selection();
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-[18px] py-[14px] text-left transition-all flex items-center justify-between group h-[52px] ${isActive ? 'bg-[#95e36c]/8' : 'hover:bg-[#f9fafb]'
                                                }`}
                                        >
                                            <span className={`font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[15px] transition-colors ${isActive ? 'text-[#003630] font-bold' : 'text-[#4b5563] group-hover:text-[#003630]'
                                                }`}>
                                                {option.label}
                                            </span>
                                            {isActive && (
                                                <div className="w-[20px] h-[20px] rounded-full bg-[#95e36c] flex items-center justify-center shadow-[0px_2px_8px_rgba(149,227,108,0.3)]">
                                                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                                        <path d="M11 5L6.5 10.5L4.5 8.5" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

const YEAR_OPTIONS = ["2026", "2027", "2028", "2029"];
const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"];
const SEMESTER_OPTIONS = ["Semester 1", "Semester 2"];

/**
 * AddSchoolFeesForm (Legacy)
 */
export function AddSchoolFeesForm({ onDone, onClose, schoolName, hasTuitionDebt, studentGrade, termServiceMap, activeGradeId }: { onDone: (grade: string, year: string, term: string, price: number) => void; onClose: () => void; schoolName: string; hasTuitionDebt: boolean; studentGrade?: string; termServiceMap?: Record<number, string[]>; activeGradeId?: string }) {
    const institutionType = getInstitutionType(schoolName);
    const isUniversity = institutionType === 'university';

    const [gradeOptions, setGradeOptions] = useState<Array<{ name?: string; label: string; value: string; price: number; grade_id?: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedYear, setSelectedYear] = useState("2026");
    const [selectedTerm, setSelectedTerm] = useState(isUniversity ? "Semester 1" : "Term 1");
    const [paymentPeriod, setPaymentPeriod] = useState<"term" | "year">("term");

    useEffect(() => {
        const fetchGrades = async () => {
            setLoading(true);
            const school = await getSchoolByName(schoolName);
            if (school?.grade_pricing && school.grade_pricing.length > 0) {
                let processedOptions = school.grade_pricing;
                setGradeOptions(processedOptions);

                let preSelected = "";
                if (activeGradeId) {
                    const exactMatch = processedOptions.find((opt: any) => opt.grade_id === activeGradeId || opt.value === activeGradeId);
                    if (exactMatch) preSelected = exactMatch.value;
                }

                if (!preSelected && studentGrade) {
                    const normalize = (g: string) => g.toLowerCase().replace(/^(grade|form|year)\s*0*/, '').match(/^([a-z0-9]+)/)?.[1] || g.toLowerCase();
                    const normS = normalize(studentGrade);
                    const matched = processedOptions.find((opt: any) => normalize(opt.name || opt.label) === normS);
                    if (matched) preSelected = matched.value;
                }

                setSelectedGrade(preSelected || processedOptions[0]?.value || "");
            }
            setLoading(false);
        };
        fetchGrades();
    }, [schoolName, studentGrade, activeGradeId]);

    const isTermBlocked = (termName: string) => {
        if (!termServiceMap) return false;
        const termNum = parseInt(termName.replace(/\D/g, ''));
        if (!termNum) return false;
        const existing = termServiceMap[termNum] || [];
        return existing.some(s => s.toLowerCase().includes('tuition') || s.toLowerCase().includes('school fees') || s.toLowerCase().includes('fees'));
    };

    const availableTerms = TERM_OPTIONS;
    const availableSemesters = SEMESTER_OPTIONS;
    const hasTuitionBalance = hasTuitionDebt;

    const handleDone = () => {
        const gradeOption = gradeOptions.find(opt => opt.value === selectedGrade);
        if (gradeOption) {
            const multiplier = isUniversity ? 2 : 3;
            const finalPrice = paymentPeriod === "year" ? gradeOption.price * multiplier : gradeOption.price;
            const termLabel = paymentPeriod === "year" ? "Full Year" : selectedTerm;
            onDone(gradeOption.label, selectedYear, termLabel, finalPrice);
        }
    };

    return (
        <>
            <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-black/30" />
            </motion.div>

            <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[600px]"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                    type: "spring",
                    damping: 32,
                    stiffness: 380,
                    mass: 0.8
                }}
            >
                <div className="flex justify-center pt-[12px] pb-[6px]">
                    <div className="w-[36px] h-[5px] bg-white/90 rounded-full shadow-sm" />
                </div>

                <div className="bg-white rounded-t-[32px] shadow-[0px_-12px_44px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-[#95e36c]/60 to-transparent" />

                    <div className="relative px-[16px] pt-[16px] pb-[12px] border-b border-[#f0f1f3]">
                        <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-[#95e36c]/5 to-transparent rounded-bl-[40px] pointer-events-none" />

                        <div className="relative flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-[8px] mb-[4px]">
                                    <div className="flex items-center justify-center size-[22px] rounded-full border-[1.5px] border-black">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 5v14M5 12h14" />
                                        </svg>
                                    </div>
                                    <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630] tracking-[-0.5px] leading-[1.1]">
                                        {isUniversity ? 'Add Products / Services' : 'Add Products / Services'}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    haptics.selection();
                                    onClose();
                                }}
                                className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-[#f5f7f9]/70 backdrop-blur-sm border border-[#e5e7eb]/60 hover:bg-[#e5e7eb]/90 active:scale-90 transition-all touch-manipulation shadow-sm ml-[8px]"
                            >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-[20px] pt-[12px] pb-[40px] space-y-[40px] min-h-[400px]">
                        <div>
                            {(() => {
                                if (loading) {
                                    return (
                                        <div className="py-4 flex justify-center">
                                            <div className="w-5 h-5 border-2 border-[#95e36c] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    );
                                }

                                if (!gradeOptions || gradeOptions.length === 0) {
                                    return (
                                        <div className="py-4 text-center text-sm text-gray-400">
                                            No grades found for this school.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        <PremiumSelect
                                            label={isUniversity ? "Program / Year" : "Select Grade"}
                                            value={selectedGrade || ""}
                                            options={gradeOptions}
                                            onChange={(val) => {
                                                haptics.selection();
                                                setSelectedGrade(val);
                                            }}
                                            placeholder={`Select ${isUniversity ? 'Program' : 'Grade'}`}
                                        />
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="h-[1px] bg-[#e5e7eb]/10" />

                        <div>
                            <div className="flex flex-col gap-[20px]">
                                <div className="space-y-[8px]">
                                    <PremiumSelect
                                        label="Academic Year"
                                        value={selectedYear}
                                        options={YEAR_OPTIONS.map(y => ({ value: y, label: y }))}
                                        onChange={setSelectedYear}
                                    />
                                </div>

                                <div className="space-y-[12px] gap-3">
                                    <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider ml-[2px] gap-2">Please Select the Periods to pay for</span>
                                    <div className="grid grid-cols-3 gap-[10px]">
                                        {(isUniversity ? availableSemesters : availableTerms).map((term) => {
                                            const isActive = paymentPeriod === 'term' && selectedTerm === term;
                                            const isBlockedByInvoice = isTermBlocked(term);
                                            const isBlockedByDebt = hasTuitionBalance && !isBlockedByInvoice;

                                            return (
                                                <button
                                                    key={term}
                                                    disabled={isBlockedByInvoice || isBlockedByDebt}
                                                    onClick={() => {
                                                        haptics.selection();
                                                        setPaymentPeriod("term");
                                                        setSelectedTerm(term);
                                                    }}
                                                    className={`h-[52px] rounded-[16px] flex flex-col items-center justify-center border-[1.5px] transition-all relative active:scale-95 ${isActive
                                                        ? 'bg-[#95e36c] border-transparent text-[#003630] shadow-[0px_4px_12px_rgba(149,227,108,0.25)]'
                                                        : (isBlockedByInvoice || isBlockedByDebt)
                                                            ? 'bg-[#FFF1F0]/40 border-[#FFCCC7]/30 cursor-not-allowed opacity-80'
                                                            : 'bg-white border-[#f1f3f5] text-[#4b5563] hover:border-[#d1d5db]'
                                                        }`}
                                                >
                                                    <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] tracking-[-0.1px] ${(isBlockedByInvoice || isBlockedByDebt) ? 'text-red-400' : ''}`}>
                                                        {term.split(' ')[1] ? `Term ${term.split(' ')[1]}` : term}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#f1f3f5] px-[20px] pt-[16px] pb-[24px] bg-white">
                        <div className="grid grid-cols-2 gap-[12px]">
                            <div className="h-[56px] bg-white rounded-[18px] border border-[#f1f3f5] shadow-[0px_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
                                <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630] leading-none mb-[4px]">
                                    K{(() => {
                                        const gradeOption = gradeOptions.find(opt => opt.value === selectedGrade);
                                        if (!gradeOption) return "0";
                                        const multiplier = isUniversity ? 2 : 3;
                                        const finalPrice = paymentPeriod === "year" ? gradeOption.price * multiplier : gradeOption.price;
                                        return finalPrice.toLocaleString();
                                    })()}
                                </span>
                                <span className="font-['Inter:SemiBold',sans-serif] text-[9px] text-[#9ca3af] uppercase tracking-[0.6px]">
                                    Total Amount
                                </span>
                            </div>

                            <button
                                onClick={() => {
                                    haptics.medium();
                                    handleDone();
                                }}
                                className={`h-[56px] rounded-[18px] border transition-all group flex items-center justify-center gap-[6px] active:scale-[0.97] ${selectedGrade
                                    ? 'bg-[#003630] border-transparent shadow-[0px_8px_20px_rgba(0,54,48,0.2)]'
                                    : 'bg-white border-[#f1f3f5] shadow-[0px_2px_8px_rgba(0,0,0,0.04)]'
                                    }`}
                            >
                                <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] transition-colors ${selectedGrade ? 'text-white' : 'text-[#6b7280]'
                                    }`}>
                                    Next
                                </span>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`transition-opacity ${selectedGrade ? 'opacity-100' : 'opacity-40'}`}>
                                    <path d="M6 12L10 8L6 4" stroke={selectedGrade ? "white" : "currentColor"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

/**
 * Helper function to build service description with all metadata (Legacy)
 */
export function buildServiceDescription(service: {
    name: string;
    term: string;
    route?: string;
    paymentPeriod?: string;
    uniformItems?: string[];
}): string {
    let description = service.name;

    if (service.term) {
        description += ` - ${service.term}`;
    }

    if (service.paymentPeriod) {
        const periodLabels: Record<string, string> = {
            'term': 'Per Term',
            'week': 'Per Week',
            'day': 'Per Day',
            'year': 'Full Year'
        };
        description += ` (${periodLabels[service.paymentPeriod] || service.paymentPeriod})`;
    }

    if (service.route) {
        description += ` - ${service.route}`;
    }

    if (service.uniformItems && service.uniformItems.length > 0) {
        if (service.uniformItems.includes('uniform-complete')) {
            description += ' (Complete Set)';
        } else {
            description += ` (${service.uniformItems.length} item${service.uniformItems.length > 1 ? 's' : ''})`;
        }
    }

    return description;
}
