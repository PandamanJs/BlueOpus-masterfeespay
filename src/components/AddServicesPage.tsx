import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { getStudentsByPhone, getInstitutionType } from "../data/students";
import type { Student } from "../data/students";
import { getPendingTransactionsForStudent, getInvoicesWithBalanceForStudent } from "../lib/supabase/api/transactions";
import type { Transaction } from "../types";
import type { PaymentHistoryRecord } from "../lib/supabase/types";

import xIconSvgPaths from "../imports/svg-zhcira9im7";
import AddOtherServicesPopup from "./AddOtherServicesPopup";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";
import LogoHeader from "./common/LogoHeader";

interface AddServicesPageProps {
  selectedStudentIds: string[];
  userPhone: string;
  schoolName: string;
  onBack: () => void;
  onNext: () => void;
  onCheckout?: (services: Array<Service & { studentName: string; studentId?: string }>) => void;
}

interface Service {
  id: string;
  description: string;
  amount: number;
  invoiceNo: string;
  term?: number;
  academicYear?: number;
  grade?: string;
  pricing_id?: string;
  invoice_id?: string; // Add this too for consistency
}



function ChildPill({ name, isActive, hasBalance, onClick }: { name: string; id: string; admissionNumber?: string; isActive: boolean; hasBalance?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={() => {
        haptics.selection();
        onClick();
      }}
      className={`h-[36px] px-[16px] rounded-[12px] transition-all duration-300 flex items-center justify-center relative shrink-0 min-w-[110px] active:scale-95 ${isActive
        ? 'bg-[#95e36c] text-[#003630] border-transparent shadow-[0px_4px_12px_-2px_rgba(149,227,108,0.3)] z-10'
        : 'bg-white border-[1.2px] border-[#f1f3f5] text-[#4b5563] shadow-[0px_2px_4px_rgba(0,0,0,0.02)]'
        }`}
    >
      <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[12px] tracking-[-0.2px] whitespace-nowrap`}>
        {name}
      </span>
      {hasBalance && (
        <div className={`absolute top-[6px] right-[8px] w-[4px] h-[4px] rounded-full animate-pulse ${isActive ? 'bg-[#003630]/30' : 'bg-red-500'} shadow-sm`} />
      )}
    </button>
  );
}

function StudentInfo({ student, serviceTotal, onClearBalances }: { student: Student; serviceTotal: number; onClearBalances?: () => void }) {
  const hasBalance = student.balances > 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#003630] tracking-[-0.3px] leading-tight">
            {student.name}
          </h3>
          <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] leading-none opacity-80">
            {student.grade}
          </p>
          <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[11px] leading-none opacity-80 pl-2 border-l border-[#e5e7eb]">
            {student.schoolName || 'Twalumbu Education Centre'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="font-['Inter:Bold',sans-serif] text-[19px] text-[#003630] leading-none">
            ZMW {serviceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] text-[#9ca3af] font-black uppercase tracking-[1px] leading-none">Adding to cart</span>
        </div>
      </div>

      {hasBalance && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onClearBalances}
          role="button"
          tabIndex={0}
          className="group relative flex items-center justify-between p-3 rounded-[14px] bg-[#FFF1F0]/60 border border-[#FFCCC7]/80 shadow-[0px_2px_8px_rgba(255,107,107,0.04)] cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-[1.5px] leading-none">Due Balance</span>
              <span className="text-[10px] text-red-400/90 font-medium tracking-tight mt-0.5 group-active:text-red-500 transition-colors">Tap to add outstanding items</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-['Inter:Bold',sans-serif] text-[15px] text-red-600">
              ZMW {student.balances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-red-400 transition-transform group-hover:translate-x-0.5">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>
      )}
    </div>
  );
}



function XIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-[14px] cursor-pointer touch-manipulation active:opacity-60 transition-opacity"
      data-name="icon-x"
      aria-label="Remove service"
    >
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="icon-x">
          <path d={xIconSvgPaths.p1edcdf00} fill="var(--fill-0, #FF0000)" id="Shape" />
        </g>
      </svg>
    </button>
  );
}

function ServiceTable({ services, onRemoveItem }: { services: Service[]; onRemoveItem: (id: string) => void }) {
  const hasServices = services.length > 0;

  return (
    <div className="card card-interactive content-stretch flex flex-col flex-1 items-start overflow-clip relative shrink-0 w-full animate-scale-in" style={{ animationDelay: '100ms' }}>
      {/* Header */}
      <div className="box-border content-stretch flex h-[32px] items-center pb-0 pt-[12px] px-[12px] relative shrink-0 w-full bg-gradient-to-b from-[#fafafa] to-white">
        <div className="box-border content-stretch flex gap-[10px] h-full items-center pb-[2px] pt-[4px] px-[6px] relative shrink-0 flex-1">
          <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#7a929e] text-[8px] text-nowrap tracking-[-0.08px]">
            <p className="leading-[24px] whitespace-pre">Service Description</p>
          </div>
        </div>
        <div className="h-full relative shrink-0 w-[108px]">
          <div className="flex flex-row items-center justify-center size-full">
            <div className="box-border content-stretch flex gap-[10px] h-full items-center justify-center px-[10px] py-[4px] relative w-[108px]">
              <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] h-full justify-center leading-[0] not-italic relative shrink-0 text-[#7a929e] text-[8px] tracking-[-0.08px] w-[54px]">
                <p className="leading-[24px]">Amount (ZMW)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider w-full"></div>

      {/* Services or Empty State */}
      {!hasServices ? (
        <div className="flex-1 flex items-center justify-center w-full py-8">
          <p className="font-['Inter:Light',sans-serif] font-light leading-[15px] not-italic text-[#a7aaa7] text-[10px] text-center tracking-[-0.1px] px-4">
            Select a Pupil to View Payment History
          </p>
        </div>
      ) : (
        <div className="flex-1 w-full">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              className="box-border content-stretch flex min-h-[40px] items-center pl-[5px] pr-[56px] py-[6px] w-full relative group hover:bg-gradient-to-r hover:from-[rgba(149,227,108,0.03)] hover:to-transparent transition-all duration-200"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
            >
              <div className="box-border content-stretch flex gap-[10px] items-center px-[10px] py-[4px] relative shrink-0 flex-1 min-w-0">
                <div className="content-stretch flex flex-col items-start justify-center leading-[0] not-italic relative flex-1 min-w-0">
                  <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] justify-center relative w-full text-[12px] text-black">
                    <p className="leading-[1.4] truncate">{service.description.replace(/\s*\(Per term\)/i, '')}</p>
                  </div>
                  <div className="flex flex-col font-['Inter:Light',sans-serif] font-light justify-center relative text-[#003049] text-[8px] tracking-[-0.08px] mt-[2px]">
                    <p className="leading-[12px]">Invoice No. {service.invoiceNo}</p>
                  </div>
                </div>
              </div>
              <div className="box-border content-stretch flex gap-[10px] items-center justify-end px-[10px] py-[4px] relative shrink-0 w-[100px]">
                <div className="flex flex-col font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-nowrap">
                  <p className="leading-[1.4] whitespace-pre">K{service.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div
                className="absolute right-0 top-0 h-full px-[12px] flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ minWidth: '44px' }}
              >
                <XIcon onClick={() => onRemoveItem(service.id)} />
              </div>
              {index < services.length - 1 && (
                <div className="absolute bottom-0 left-[10px] right-[10px] h-[1px] bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.06)] to-transparent"></div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}



const YEAR_OPTIONS = ["2026", "2027", "2028", "2029"];

const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"];
const SEMESTER_OPTIONS = ["Semester 1", "Semester 2"];

import { getSchoolByName } from "../lib/supabase/api/schools";

function AddSchoolFeesForm({ onDone, onClose, schoolName, hasTuitionDebt, studentGrade }: { onDone: (grade: string, year: string, term: string, price: number) => void; onClose: () => void; schoolName: string; hasTuitionDebt: boolean; studentGrade?: string }) {
  const institutionType = getInstitutionType(schoolName);
  const isUniversity = institutionType === 'university';

  const [gradeOptions, setGradeOptions] = useState<Array<{ name?: string; label: string; value: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedTerm, setSelectedTerm] = useState(isUniversity ? "Semester 1" : "Term 1");
  const [paymentPeriod, setPaymentPeriod] = useState<"term" | "year">("term");

  const [gradeTab, setGradeTab] = useState<'primary' | 'secondary'>('primary');

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      const school = await getSchoolByName(schoolName);
      if (school?.grade_pricing && school.grade_pricing.length > 0) {
        console.log('[Frontend] Received grade options:', school.grade_pricing);

        let processedOptions = school.grade_pricing;
        if (school.uses_forms) {
          const formMap: Record<string, string> = {
            'Grade 7': 'Form 1',
            'Grade 8': 'Form 2',
            'Grade 9': 'Form 3',
            'Grade 10': 'Form 4',
            'Grade 11': 'Form 5',
            'Grade 12': 'Form 6',
          };
          processedOptions = school.grade_pricing.map((opt: any) => {
            const rawName = opt.name || opt.label.split(' - ')[0];
            if (formMap[rawName]) {
              return {
                ...opt,
                name: formMap[rawName],
                label: opt.label.replace(rawName, formMap[rawName])
              };
            }
            return opt;
          });
        }

        setGradeOptions(processedOptions);

        let initialSelection = processedOptions[0]?.value || "";
        let initialTab: 'primary' | 'secondary' = 'primary';

        console.log('[GradeSelection] Attempting to auto-match grade:', studentGrade);

        if (studentGrade) {
          const gradeToForm: Record<string, string> = {
            'grade 7': 'form 1',
            'grade 8': 'form 2',
            'grade 9': 'form 3',
            'grade 10': 'form 4',
            'grade 11': 'form 5',
            'grade 12': 'form 6'
          };

          const normalize = (g: string) => {
            if (!g) return '';
            let v = g.toLowerCase().trim();
            // Remove 'grade', 'form', 'year' and any leading zeros
            v = v.replace(/^(grade|form|year)\s*0*/, '');
            // Take only the first numeric or alphanumeric segment (e.g., "8 blue" -> "8")
            const match = v.match(/^([a-z0-9]+)/);
            return match ? match[1] : v;
          };

          const normalizedStudentGrade = normalize(studentGrade);
          console.log('[GradeSelection] Normalized student grade:', normalizedStudentGrade);

          const matchedOption = processedOptions.find((opt: any) => {
            const optName = opt.name || opt.label.split(' - ')[0] || '';
            const normalizedOptName = normalize(optName);

            // 1. Direct match
            if (optName.toLowerCase() === studentGrade.toLowerCase()) return true;

            // 2. Form mapping match (e.g., Grade 8 -> Form 2)
            if (school.uses_forms && gradeToForm[studentGrade.toLowerCase()] === optName.toLowerCase()) return true;

            // 3. Normalized match (e.g., "08" -> "8")
            if (normalizedOptName === normalizedStudentGrade && normalizedStudentGrade !== '') return true;

            return false;
          });

          if (matchedOption) {
            initialSelection = matchedOption.value;
            const matchedName = matchedOption.name || matchedOption.label || '';
            if (['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'].includes(matchedName) || matchedName.includes('Secondary')) {
              initialTab = 'secondary';
            }
          }
        }

        setSelectedGrade(initialSelection);
        setGradeTab(initialTab);
      } else {
        // Fallback to empty or logic
        setGradeOptions([]);
      }
      setLoading(false);
    };
    fetchGrades();
  }, [schoolName, studentGrade]);

  // Derive primary and secondary grades for the tabs
  const secondaryGrades = gradeOptions.filter(opt => {
    const name = opt.name || opt.label.split(' - ')[0] || '';
    return ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 
           'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'].includes(name) || 
           name.includes('Secondary');
  });
  
  const primaryGrades = gradeOptions.filter(opt => !secondaryGrades.includes(opt));

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
                  <div className="w-[3px] h-[18px] bg-gradient-to-b from-[#95e36c] to-[#7dd054] rounded-full" />
                  <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#003630] tracking-[-0.5px] leading-[1.1]">
                    {isUniversity ? 'Add Tuition' : 'Add School Fees'}
                  </h2>
                </div>
                <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#6b7280] tracking-[-0.1px] leading-[1.4] ml-[11px]">
                  {isUniversity ? 'Select program and payment options' : 'Select grade and payment options'}
                </p>
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

          <div className="flex-1 overflow-y-auto px-[20px] py-[40px] space-y-[40px] min-h-[400px]">
            <div>
              <label className="block font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] text-[#6b7280] tracking-[1px] uppercase mb-[16px] pl-[4px]">
                {isUniversity ? "Program/Year" : "Grade/Form"}
              </label>

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

                const showTabs = secondaryGrades.length > 0 && primaryGrades.length > 0 && !isUniversity;

                const displayedGrades = !showTabs ? gradeOptions : (gradeTab === 'primary' ? primaryGrades : secondaryGrades);

                return (
                  <div className="space-y-4">
                    {showTabs && (
                      <div className="relative flex p-[4px] bg-[#f1f3f5] items-center rounded-[14px] mx-[2px] mb-[12px]">
                        <button
                          onClick={() => {
                            haptics.selection();
                            setGradeTab('primary');
                          }}
                          className="relative flex-1 py-[8px] px-[12px] text-center z-10"
                        >
                          {gradeTab === 'primary' && (
                            <motion.div
                              layoutId="gradeTabIndicator"
                              className="absolute inset-0 bg-white rounded-[10px] shadow-sm border-[1.5px] border-[#95e36c]"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className={`relative z-20 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] transition-colors duration-200 tracking-[-0.2px] ${gradeTab === 'primary' ? 'text-[#003630]' : 'text-[#6b7280]'
                            }`}>
                            Primary & Pre-School
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            haptics.selection();
                            setGradeTab('secondary');
                          }}
                          className="relative flex-1 py-[8px] px-[12px] text-center z-10"
                        >
                          {gradeTab === 'secondary' && (
                            <motion.div
                              layoutId="gradeTabIndicator"
                              className="absolute inset-0 bg-white rounded-[10px] shadow-sm border-[1.5px] border-[#95e36c]"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className={`relative z-20 font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] transition-colors duration-200 tracking-[-0.2px] ${gradeTab === 'secondary' ? 'text-[#003630]' : 'text-[#6b7280]'
                            }`}>
                            Secondary
                          </span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-[12px]">
                      <AnimatePresence mode="popLayout">
                        {displayedGrades.map((option) => {
                          const isActive = selectedGrade === option.value;
                          const name = option.name || option.label.split(' - ')[0];

                          return (
                            <motion.button
                              key={option.value}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              onClick={() => {
                                haptics.selection();
                                setSelectedGrade(option.value);
                              }}
                              className={`relative h-[46px] flex items-center justify-center rounded-[12px] transition-all duration-200 border-[1.5px] active:scale-[0.96] ${isActive
                                ? 'bg-[#95e36c] border-transparent shadow-[0px_4px_12px_rgba(149,227,108,0.25)]'
                                : 'bg-white border-[#f1f3f5] text-[#4b5563]'
                                }`}
                            >
                              <div className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] leading-tight text-center px-[8px] tracking-[0.1px] ${isActive ? 'text-[#003630]' : 'text-[#1f2937]'}`}>
                                {name}
                              </div>

                              {isActive && (
                                <div className="absolute top-[6px] right-[6px]">
                                  <div className="w-[4px] h-[4px] rounded-full bg-[#003630]/30" />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="h-[1px] bg-[#e5e7eb]/10" />

            <div>
              <label className="block font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] text-[#6b7280] tracking-[1px] uppercase mb-[16px] pl-[4px]">
                Session Details
              </label>

              <div className="flex flex-col gap-[20px] p-[20px] rounded-[24px] bg-[#f9fafb]/50 border border-[#f1f3f5]">
                <div className="space-y-[8px]">
                  <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider ml-[2px]">Academic Year</span>
                  <div className="relative group">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full h-[50px] bg-white rounded-[14px] px-[16px] appearance-none font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630] border-[1.5px] border-[#e5e7eb] focus:border-[#95e36c] outline-none shadow-sm transition-all"
                    >
                      {YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <div className="absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none text-[#6b7280]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-[12px]">
                  <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider ml-[2px]">Payment Period</span>
                  <div className="grid grid-cols-3 gap-[10px]">
                    {(isUniversity ? availableSemesters : availableTerms).map((term) => {
                      const isActive = paymentPeriod === 'term' && selectedTerm === term;
                      const isBlockedByDebt = hasTuitionBalance;

                      return (
                        <button
                          key={term}
                          disabled={isBlockedByDebt}
                          onClick={() => {
                            haptics.selection();
                            setPaymentPeriod("term");
                            setSelectedTerm(term);
                          }}
                          className={`h-[52px] rounded-[16px] flex flex-col items-center justify-center border-[1.5px] transition-all relative active:scale-95 ${isActive
                            ? 'bg-[#95e36c] border-transparent text-[#003630] shadow-[0px_4px_12px_rgba(149,227,108,0.25)]'
                            : isBlockedByDebt
                              ? 'bg-[#FFF1F0]/40 border-[#FFCCC7]/30 cursor-not-allowed opacity-80'
                              : 'bg-white border-[#f1f3f5] text-[#4b5563] hover:border-[#d1d5db]'
                            }`}
                        >
                          <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] tracking-[-0.1px] ${isBlockedByDebt ? 'text-red-400' : ''}`}>
                            {term.split(' ')[1] ? `Term ${term.split(' ')[1]}` : term}
                          </span>
                          {isBlockedByDebt && (
                            <span className="text-[7.5px] text-red-500 font-black uppercase tracking-[0.5px] mt-[1px]">
                              Clear Balance
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      if (hasTuitionBalance) return;
                      haptics.selection();
                      setPaymentPeriod("year");
                    }}
                    disabled={hasTuitionBalance}
                    className={`w-full h-[52px] rounded-[14px] flex items-center justify-center border-[1.5px] transition-all relative active:scale-[0.98] mt-[8px] ${paymentPeriod === 'year'
                      ? 'bg-[#003630] border-transparent text-white shadow-[0px_6px_16px_rgba(0,54,48,0.2)]'
                      : hasTuitionBalance
                        ? 'bg-[#FFF1F0]/40 border-[#FFCCC7]/30 cursor-not-allowed opacity-80'
                        : 'bg-white border-[#e5e7eb] text-[#4b5563] hover:border-[#d1d5db]'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-[1px]">
                      <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[11px] tracking-[-0.1px] ${hasTuitionBalance ? 'text-red-400' : ''}`}>
                        {isUniversity ? "Full Academic Year" : "Full Year (All 3 Terms)"}
                      </span>
                      {hasTuitionBalance && (
                        <span className="text-[8px] text-red-500 font-black uppercase tracking-[0.5px]">
                          Please clear outstanding balance first
                        </span>
                      )}
                      {paymentPeriod === 'year' && (
                        <div className="absolute right-[16px] w-[18px] h-[18px] rounded-full bg-[#95e36c] flex items-center justify-center shadow-sm">
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                            <path d="M12 5L6.5 10.5L4 8" stroke="#003630" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
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

          <div className="h-[env(safe-area-inset-bottom,20px)] bg-white/98" />
        </div>
      </motion.div>
    </>
  );
}


/**
 * Helper function to build service description with all metadata
 */
function buildServiceDescription(service: {
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

export default function AddServicesPage({ selectedStudentIds, userPhone, schoolName, onBack, onNext, onCheckout }: AddServicesPageProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  useEffect(() => {
    async function loadStudents() {
      const students = await getStudentsByPhone(userPhone);
      setAllStudents(students);
    }
    loadStudents();
  }, [userPhone]);

  const selectedStudents = allStudents.filter(s => selectedStudentIds.includes(s.id));

  // Determine if this is a university or school
  const institutionType = getInstitutionType(schoolName);
  const isUniversity = institutionType === 'university';

  const [activeStudentId, setActiveStudentId] = useState<string>("");

  // Set initial active student when data loads
  useEffect(() => {
    if (selectedStudents.length > 0 && !activeStudentId) {
      const firstStudent = selectedStudents[0];
      if (firstStudent) {
        setActiveStudentId(firstStudent.id);
      }
    }
  }, [selectedStudents, activeStudentId]);
  const activeStudent = selectedStudents.find(s => s.id === activeStudentId);
  const [showAddFeesForm, setShowAddFeesForm] = useState(false);
  const [showOtherServicesPopup, setShowOtherServicesPopup] = useState(false);
  const [studentServices, setStudentServices] = useState<Record<string, Service[]>>({});

  // Balance Check State
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [invoicesWithBalance, setInvoicesWithBalance] = useState<PaymentHistoryRecord[]>([]);

  useEffect(() => {
    if (activeStudentId) {
      Promise.all([
        getPendingTransactionsForStudent(activeStudentId),
        getInvoicesWithBalanceForStudent(activeStudentId)
      ]).then(([txs, invoices]) => {
        setPendingTransactions(txs);
        setInvoicesWithBalance(invoices);
      });
    }
  }, [activeStudentId]);

  // Get services for the active student
  const activeStudentServices = studentServices[activeStudentId] || [];
  const activeCartRefs = new Set(activeStudentServices.map(s => s.invoiceNo));

  // Determine net credit position
  const hasNetDebt = (activeStudent?.balances || 0) > 0;

  const hasTuitionDebt = hasNetDebt && (pendingTransactions.some((tx) => {
    const meta_data = tx.meta_data as any;
    if (activeCartRefs.has(tx.reference)) return false;
    if (meta_data?.items && Array.isArray(meta_data.items)) {
      return meta_data.items.some((item: any) =>
        item.category === 'tuition' ||
        item.description?.toLowerCase().includes('term') ||
        item.description?.toLowerCase().includes('school fees')
      );
    }
    const desc = meta_data?.description?.toLowerCase() || '';
    return desc.includes('tuition') || desc.includes('school fees');
  }) || invoicesWithBalance.some(invoice => (invoice.balance_remaining || 0) > 0 && !activeCartRefs.has(invoice.reference)));

  // Calculate specific blocked services
  const { blockedServiceNames } = !hasNetDebt ? { blockedServiceNames: [] } : [...pendingTransactions, ...invoicesWithBalance].reduce((acc, item) => {
    if (activeCartRefs.has(item.reference)) return acc;

    const isTx = 'meta_data' in item;
    const meta_data = isTx ? (item as Transaction).meta_data as any : null;

    // 1. Identify specific service names to block
    if (isTx) {
      if (meta_data?.items && Array.isArray(meta_data.items)) {
        meta_data.items.forEach((subItem: any) => {
          const name = subItem.name || subItem.description;
          if (name && !acc.blockedServiceNames.includes(name)) {
            acc.blockedServiceNames.push(name);
          }
        });
      } else if (meta_data?.description && !acc.blockedServiceNames.includes(meta_data.description)) {
        acc.blockedServiceNames.push(meta_data.description);
      }
    } else {
      const invoice = item as PaymentHistoryRecord;
      if (invoice.service_name && !acc.blockedServiceNames.includes(invoice.service_name)) {
        acc.blockedServiceNames.push(invoice.service_name);
      }
    }

    return acc;
  }, { blockedServiceNames: [] as string[] });

  // Determine if there is debt for "Other" (non-tuition) services
  const hasOtherDebt = blockedServiceNames.some(name => {
    const low = name.toLowerCase();
    // Exclude names that look like tuition/fees
    return !low.includes('fees') && !low.includes('tuition') && !low.includes('school fees') && !low.includes('grade');
  });

  // Calculate total across all selected students
  const totalAmount = Object.entries(studentServices).reduce((sum, [studentId, services]) => {
    if (selectedStudentIds.includes(studentId)) {
      return sum + services.reduce((serviceSum, service) => serviceSum + service.amount, 0);
    }
    return sum;
  }, 0);

  const handleClearOutstandingDebt = (type: 'tuition' | 'other' | 'all') => {
    const debtsToAdd: Service[] = [];
    // Get all current services to avoid duplicates by invoice number
    const currentServices = studentServices[activeStudentId] || [];
    const existingInvoices = new Set(currentServices.map(s => s.invoiceNo));

    const isTargetType = (name: string) => {
      if (type === 'all') return true;
      const low = name.toLowerCase();
      const isTuition = low.includes('fees') || low.includes('tuition') || low.includes('school fees') || low.includes('grade');
      return type === 'tuition' ? isTuition : !isTuition;
    };

    // 1. Process Pending Transactions
    pendingTransactions.forEach((tx) => {
      const meta_data = tx.meta_data as any;
      const term = meta_data?.term || (tx as any).term;
      const year = meta_data?.academicYear || (tx as any).academicYear;
      
      let baseName = meta_data?.description || (meta_data?.items && meta_data.items[0]?.description) || "Outstanding Balance";
      const name = `${baseName}${term ? ` - ${typeof term === 'number' ? `Term ${term}` : term}` : ''}${year ? ` ${year}` : ''}`;

      if (isTargetType(name) && !existingInvoices.has(tx.reference)) {
        debtsToAdd.push({
          id: tx.id || `tx-${tx.reference}`,
          description: name,
          amount: tx.total_amount,
          invoiceNo: tx.reference,
          invoice_id: tx.id || undefined,  // actual UUID for DB linkage
          term: term,
          academicYear: year
        });
      }
    });

    // 2. Process Historical Invoices with balances
    invoicesWithBalance.forEach((inv) => {
      const baseName = inv.service_name || "School Fees";
      const term = inv.term;
      const year = inv.academic_year;
      
      const name = `${baseName}${term ? ` - Term ${term}` : ''}${year ? ` ${year}` : ''} (Balance)`;

      if (isTargetType(name) && !existingInvoices.has(inv.reference)) {
        let amount = inv.balance_remaining || 0;
        
        // Ensure we don't bring the full invoice amount if the student has a lower net balance (partial payment exists)
        if (activeStudent && activeStudent.balances > 0 && amount > activeStudent.balances) {
          amount = activeStudent.balances;
        }

        debtsToAdd.push({
          id: `inv-${inv.id || inv.reference}`,
          description: name,
          amount: amount,
          invoiceNo: inv.reference,
          invoice_id: inv.id || undefined,  // actual UUID for DB linkage
          term: term,
          academicYear: year
        });
      }
    });

    // 3. Fallback: If the student object shows a balance but we couldn't find line-item matches, 
    // add it as a generic item so they can still pay it
    if (debtsToAdd.length === 0 && activeStudent && activeStudent.balances > 0) {
      // Check if we already have a balance-related items in the cart
      const hasBalanceItem = Array.from(existingInvoices).some(ref => ref.startsWith('BAL-') || ref.startsWith('tx-') || ref.startsWith('inv-'));
      
      if (!hasBalanceItem) {
        const studentName = activeStudent.name || 'Student';
        const gradeContext = activeStudent.grade ? `(${activeStudent.grade}) ` : '';
        
        debtsToAdd.push({
          id: `fallback-${activeStudentId}`,
          description: `${studentName} - ${gradeContext}Outstanding Fees`,
          amount: activeStudent.balances,
          invoiceNo: `BAL-${activeStudent.admissionNumber || activeStudentId.slice(0, 4)}`,
          academicYear: new Date().getFullYear()
        });
      }
    }

    if (debtsToAdd.length > 0) {
      setStudentServices(prev => ({
        ...prev,
        [activeStudentId]: [...(prev[activeStudentId] || []), ...debtsToAdd]
      }));
      haptics.success();
      toast.success("Debt Added to Cart", {
        description: `Successfully added ${debtsToAdd.length} outstanding item(s) to your payment list.`,
        duration: 4000
      });
    } else {
      toast.info("Already in Cart", {
        description: "Your outstanding balance is already in the payment list.",
        duration: 3000
      });
    }
  };

  const handleAddSchoolFees = () => {
    setShowAddFeesForm(true);
  };

  const handleDone = (grade: string, year: string, term: string, price: number) => {
    setShowAddFeesForm(false);
    // Parse term number
    const termNum = parseInt(term.replace(/\D/g, '')) || 1;
    const yearNum = parseInt(year) || new Date().getFullYear();

    const newService: Service = {
      id: `service-${Date.now()}`,
      description: `${grade} - ${term} ${year}`,
      amount: price,
      invoiceNo: "202",
      term: termNum,
      academicYear: yearNum,
      grade: grade
    };
    setStudentServices(prev => ({
      ...prev,
      [activeStudentId]: [...(prev[activeStudentId] || []), newService]
    }));
  };

  const handleAddOtherServices = () => {
    setShowOtherServicesPopup(true);
  };

  const handleOtherServicesDone = (services: Array<{
    id: string;
    name: string;
    amount: number;
    category: string;
    term: string;
    route?: string;
    paymentPeriod?: string;
    uniformItems?: string[];
  }>) => {
    setShowOtherServicesPopup(false);

    if (services.length === 0) return;

    // Get existing services for the active student
    const existingServices = studentServices[activeStudentId] || [];

    // Convert the school services to the Service format, filtering out duplicates
    const newServices: Service[] = services
      .filter(service => {
        // Create a signature for this service based on all key attributes
        const signature = `${service.name}-${service.term}${service.route ? `-${service.route}` : ''}${service.paymentPeriod ? `-${service.paymentPeriod}` : ''}${service.uniformItems ? `-${service.uniformItems.join(',')}` : ''}`;

        // Check if a service with this signature already exists
        const isDuplicate = existingServices.some(existing => {
          const existingSignature = existing.description; // Simpler check for now
          return existingSignature === signature;
        });

        return !isDuplicate;
      })
      .map((service, index) => {
        // Check if this service name matches a blocked service (to add debt instead of new service)
        const relevantDebt = [...pendingTransactions, ...invoicesWithBalance].find(item => {
          if (activeCartRefs.has(item.reference)) return false;
          const isTx = 'meta_data' in item;
          const debtName = (isTx ? ((item as any).meta_data?.description || "Service") : (item as any).service_name)?.toLowerCase() || "";
          const sName = service.name.toLowerCase();
          return debtName === sName || debtName.startsWith(sName + " -") || debtName.startsWith(sName + " (");
        });

        if (relevantDebt) {
          const isTx = 'meta_data' in relevantDebt;
          const metadata = isTx ? (relevantDebt as any).meta_data as any : null;
          const name = (isTx ? (metadata?.description || (metadata?.items && metadata.items[0]?.description)) : (relevantDebt as any).service_name) || service.name;

          return {
            id: relevantDebt.id || `debt-${relevantDebt.reference}`,
            description: isTx ? name : `${name} (Balance)`,
            amount: isTx ? (relevantDebt as any).total_amount : (relevantDebt as any).balance_remaining,
            invoiceNo: relevantDebt.reference,
            term: isTx ? (metadata?.term || (relevantDebt as any).term) : (relevantDebt as any).term,
            academicYear: isTx ? (metadata?.academicYear || (relevantDebt as any).academicYear) : (relevantDebt as any).academic_year
          };
        }

        // Generate a unique ID for new service
        const uniqueId = `${service.id}-${service.term.replace(/\s+/g, '-')}-${service.route ? service.route.replace(/\s+/g, '-') : 'no-route'}-${Date.now()}-${index}`;

        const newSvc: Service = {
          id: uniqueId,
          description: buildServiceDescription(service),
          amount: service.amount,
          invoiceNo: "202",
          term: parseInt(service.term.replace(/\D/g, '')) || 1,
          academicYear: new Date().getFullYear(),
          pricing_id: service.id // PRESERVE THE ORIGINAL FEE ITEM ID
        };

        return newSvc;
      });

    // Only add if there are new services (not all duplicates)
    if (newServices.length > 0) {
      setStudentServices(prev => ({
        ...prev,
        [activeStudentId]: [...(prev[activeStudentId] || []), ...newServices]
      }));
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setStudentServices(prev => ({
      ...prev,
      [activeStudentId]: (prev[activeStudentId] || []).filter(s => s.id !== serviceId)
    }));
  };

  // Check if any services have been added
  const hasServices = Object.values(studentServices).some(services => services.length > 0);

  const handleNextOrCheckout = () => {
    haptics.heavy();
    if (totalAmount > 0 && onCheckout) {
      // Flatten all services with student names
      const allServicesWithStudents = Object.entries(studentServices).flatMap(([studentId, services]) => {
        const student = selectedStudents.find(s => s.id === studentId);
        const studentName = student?.name || 'Unknown Student';
        return services.map(service => ({
          ...service,
          studentName,
          studentId,
          term: service.term,
          academicYear: service.academicYear,
          grade: student?.grade
        }));
      });
      if (onCheckout) {
        onCheckout(allServicesWithStudents);
      }
    } else {
      onNext();
    }
  };

  return (
    <div className="bg-white h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen mx-auto shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col">
        <LogoHeader showBackButton onBack={() => {
          haptics.selection();
          onBack();
        }} />

        <div className="flex-1 flex flex-col px-[24px] pt-[12px] pb-[280px] overflow-y-auto no-scrollbar">
          <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[24px] not-italic text-[18px] text-black tracking-[-0.18px]">
            Add Services to pay for
          </p>
          <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-[1.5] not-italic text-[#a7aaa7] text-[12px] tracking-[-0.12px] mt-[2px]">
            Select the services that you would like to pay for and proceed to checkout to make payment.
          </p>

          {/* Child Selection Section */}
          <div className="mt-[12px] mb-[12px] flex flex-col items-center gap-3">
            <div className="flex gap-[10px] items-center relative w-full overflow-x-auto no-scrollbar pb-1 px-1">
              {selectedStudents.map(student => (
                <ChildPill
                  key={student.id}
                  name={student.name}
                  id={student.id}
                  isActive={activeStudentId === student.id}
                  admissionNumber={student.admissionNumber}
                  hasBalance={student.balances > 0}
                  onClick={() => setActiveStudentId(student.id)}
                />
              ))}
            </div>

            {/* Pagination Indicators - Pill style */}
            <div className="flex justify-center gap-[7px]">
              {selectedStudents.map(student => (
                <div
                  key={`dot-${student.id}`}
                  className={`h-[5px] rounded-full transition-all duration-300 ${activeStudentId === student.id
                    ? 'w-[18px] bg-[#95e36c] shadow-[0px_1px_3px_rgba(149,227,108,0.2)]'
                    : 'w-[5px] bg-[#d1d5db]'
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[16px]">
            {/* Student Info Card */}
            {activeStudent && (
              <div className="bg-white rounded-[20px] p-[16px] border-[1.5px] border-[#e5e7eb] shadow-sm">
                <StudentInfo
                  student={activeStudent}
                  serviceTotal={activeStudentServices.reduce((sum, s) => sum + s.amount, 0)}
                  onClearBalances={() => handleClearOutstandingDebt('all')}
                />
              </div>
            )}

            {/* Child Services Empty State (when no popup is open) */}
            {!showAddFeesForm && !showOtherServicesPopup && activeStudentServices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-white/50 border border-dashed border-gray-300 rounded-[20px]">
                <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[#6b7280] text-[14px]">No services selected yet</p>
                <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[#9ca3af] text-[12px] mt-1">Add fees or services below</p>
              </div>
            )}

            {/* Service Table - only visible when not adding stuff */}
            {!showAddFeesForm && !showOtherServicesPopup && activeStudentServices.length > 0 && (
              <div className="bg-white rounded-[20px] overflow-hidden border-[1.5px] border-[#e5e7eb] shadow-sm">
                <ServiceTable services={activeStudentServices} onRemoveItem={handleRemoveService} />
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#e5e7eb] px-[20px] pt-[16px] pb-[32px] shadow-[0px_-4px_24px_rgba(0,0,0,0.08)] z-50">
          <div className="w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] mx-auto flex flex-col gap-[12px]">

            {/* Action Grid: 2x2 */}
            <div className="grid grid-cols-2 gap-[10px] w-full">

              {!showAddFeesForm && !showOtherServicesPopup && (
                <>
                  {/* Item 1,1: Add Fees */}
                  <button
                    onClick={() => {
                      if (hasTuitionDebt) {
                        handleClearOutstandingDebt('tuition');
                        return;
                      }
                      handleAddSchoolFees();
                    }}
                    className={`relative h-[56px] rounded-[16px] transition-all touch-manipulation overflow-hidden group shadow-sm`}
                  >
                    <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />
                    {!hasTuitionDebt && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    )}
                    <div className="relative z-10 flex items-center justify-center gap-[8px] h-full group-active:scale-[0.96] transition-transform px-2">
                      <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          {hasTuitionDebt ? (
                            <path d="M7 11V7a5 5 0 0 1 10 0v4M3 11h18v11H3z" />
                          ) : (
                            <path d="M12 5v14M5 12h14" />
                          )}
                        </svg>
                      </div>
                      <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] text-white tracking-[-0.2px] text-left leading-tight">
                        {hasTuitionDebt ? 'Clear Debt' : (isUniversity ? 'Add Tuition' : 'Add Fees')}
                      </span>
                    </div>
                  </button>

                  {/* Item 1,2: Other Services */}
                  <button
                    onClick={() => {
                      if (hasOtherDebt) {
                        handleClearOutstandingDebt('other');
                        return;
                      }
                      haptics.buttonPress();
                      handleAddOtherServices();
                    }}
                    className={`h-[56px] transition-all touch-manipulation active:scale-[0.96] flex items-center justify-center shadow-sm group px-2 rounded-[16px] ${hasOtherDebt
                      ? 'bg-[#FFF1F0]/40 border-red-200 border-[1.5px]'
                      : 'bg-white border-[1.5px] border-[#e5e7eb] hover:border-[#d1d5db] active:bg-gray-50'
                      }`}
                  >
                    <div className={`${hasOtherDebt ? 'bg-red-50' : 'bg-[#f0fdf4]'} p-1.5 rounded-lg mr-[8px] shrink-0`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasOtherDebt ? "#ef4444" : "#003630"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        {hasOtherDebt ? (
                          <path d="M7 11V7a5 5 0 0 1 10 0v4M3 11h18v11H3z" />
                        ) : (
                          <path d="M12 5v14M5 12h14" />
                        )}
                      </svg>
                    </div>
                    <span className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[13px] tracking-[-0.2px] text-left leading-tight ${hasOtherDebt ? 'text-red-500' : 'text-[#003630]'}`}>
                      {hasOtherDebt ? 'Clear Balance' : 'Other Services'}
                    </span>
                  </button>
                </>
              )}

              {/* Item 2,1: Total Display */}
              <div className="bg-[#f8fafc] rounded-[16px] border-[1.5px] border-[#e5e7eb] flex flex-col justify-center px-[16px] h-[56px] shadow-sm">
                <span className="text-[17px] font-['Inter:Bold',sans-serif] text-[#003630] leading-none">
                  ZMW {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
                <span className="text-[9px] text-[#9ca3af] font-black uppercase tracking-[0.5px] mt-1">Total Amount</span>
              </div>

              {/* Item 2,2: Checkout Button */}
              <button
                onClick={() => {
                  if (hasServices) {
                    haptics.buttonPress();
                    handleNextOrCheckout();
                  }
                }}
                disabled={!hasServices}
                className={`h-[56px] relative rounded-[16px] overflow-hidden group transition-all shadow-sm ${hasServices
                  ? 'bg-[#003630] touch-manipulation cursor-pointer'
                  : 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                  }`}
              >
                {hasServices && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}

                <div className={`relative z-10 flex items-center justify-center gap-[8px] h-full ${hasServices ? 'group-active:scale-[0.95] transition-transform' : ''}`}>
                  <p className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] tracking-[-0.2px] ${hasServices ? 'text-white' : 'text-gray-400'}`}>
                    {totalAmount > 0 ? "Checkout" : "Next"}
                  </p>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke={hasServices ? "white" : "#9ca3af"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Popups Section */}
        <AnimatePresence>
          {/* Add School Fees Popup */}
          {showAddFeesForm && (
            <AddSchoolFeesForm
              schoolName={schoolName}
              hasTuitionDebt={hasTuitionDebt}
              studentGrade={activeStudent?.grade}
              onDone={handleDone}
              onClose={() => setShowAddFeesForm(false)}
            />
          )}

          {/* Add Other Services Popup */}
          {showOtherServicesPopup && (
            <AddOtherServicesPopup
              schoolName={schoolName}
              userPhone={userPhone}
              onClose={() => setShowOtherServicesPopup(false)}
              onDone={handleOtherServicesDone}
              student={activeStudent}
              blockedServiceNames={blockedServiceNames}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
