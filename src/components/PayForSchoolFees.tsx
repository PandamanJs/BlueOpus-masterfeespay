import { useState } from "react";
import { motion } from "motion/react";
import tickSvgPaths from "../imports/svg-m9kcpl04lu";
import { hapticFeedback } from "../utils/haptics";
import { useOfflineManager } from "../hooks/useOfflineManager";
import LogoHeader from "./common/LogoHeader";
// import { WifiOff } from "lucide-react"; // Removed as unused

interface Student {
  name: string;
  id: string;
  grade: string;
  balances: number;
  admissionNumber?: string;
}

interface PayForSchoolFeesProps {
  onBack: () => void;
  onSelectServices: (selectedStudents: string[]) => void;
  onClearBalances?: (selectedStudents: string[]) => void;
  students?: Student[];
  initialSelectedStudents?: string[]; // Add prop to receive initial selections
}



function Radio({ isSelected }: { isSelected: boolean }) {
  return (
    <div className="absolute left-1/2 rounded-[9999px] size-[15px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Radio">
      <div aria-hidden="true" className="absolute border border-[#5f75a0] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      {isSelected && (
        <div className="absolute inset-[3px] rounded-full bg-[#003630]" />
      )}
    </div>
  );
}

function RadioBase({ isSelected }: { isSelected: boolean }) {
  return (
    <div
      className="relative rounded-[3px] shrink-0 size-[15px]"
      data-name="_Radio Base"
    >
      <Radio isSelected={isSelected} />
    </div>
  );
}

function TickCircle() {
  return (
    <div className="relative shrink-0 size-[17px]" data-name="tick-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
        <g id="tick-circle">
          <path d={tickSvgPaths.p2aa26200} fill="var(--fill-0, #95E36C)" id="Vector" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Frame2({ name }: { name: string }) {
  return (
    <div className="h-[16px] relative shrink-0 w-[94px]">
      <p className="absolute font-['IBM_Plex_Sans_Condensed:SemiBold',sans-serif] leading-[normal] left-0 not-italic text-[12px] text-black text-nowrap top-0 whitespace-pre">{name}</p>
    </div>
  );
}

function Frame({ grade, id, admissionNumber }: { grade: string; id: string; admissionNumber?: string }) {
  // Prioritize admission number for display, fallback to truncated UUID
  const displayId = admissionNumber || (id.length > 20 ? `${id.substring(0, 8)}...` : id);

  return (
    <div className="content-stretch flex gap-[14px] items-center relative shrink-0 w-full">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[8px] text-black text-center w-[40px]">{grade}</p>
      <div className="flex h-[calc(1px*((var(--transform-inner-width)*1)+(var(--transform-inner-height)*0)))] items-center justify-center relative shrink-0 w-[calc(1px*((var(--transform-inner-height)*1)+(var(--transform-inner-width)*0)))]" style={{ "--transform-inner-width": "8", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
          <div className="h-0 relative w-[8px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-0.5px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 1">
                <line id="Line 49" stroke="var(--stroke-0, black)" strokeWidth="0.5" x2="8" y1="0.25" y2="0.25" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[8px] text-black text-center">{displayId}</p>
    </div>
  );
}

function Frame4({ student }: { student: Student }) {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-[104px]">
      <Frame2 name={student.name} />
      <Frame grade={student.grade} id={student.id} admissionNumber={student.admissionNumber} />
    </div>
  );
}

function Frame6({ balances }: { balances: number }) {
  const isCredit = balances < 0;
  const hasOutstanding = balances > 0;

  return (
    <div className={`relative h-[44px] rounded-[14px] shrink-0 w-fit min-w-[135px] border transition-all duration-300 group flex items-center justify-between px-[16px] ${
      hasOutstanding 
        ? 'bg-red-50/50 border-red-100 shadow-[0px_2px_8px_rgba(239,68,68,0.04)]' 
        : isCredit
          ? 'bg-[#95e36c]/10 border-[#95e36c]/20 shadow-[0px_2px_8px_rgba(149,227,108,0.04)]'
          : 'bg-[#f8fafc] border-[#f1f3f5] shadow-sm'
      }`}>

      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-[3px]">
          <span className={`font-['Inter:Medium',sans-serif] text-[10px] uppercase tracking-wider ${
            hasOutstanding ? 'text-red-400' : isCredit ? 'text-[#95e36c]' : 'text-gray-400'
          }`}>
            ZMW
          </span>
          <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[10px] tabular-nums tracking-[-0.1px] leading-tight ${
            hasOutstanding ? 'text-[#ef4444]' : isCredit ? 'text-[#003630]' : 'text-gray-700'
          }`}>
            {balances.toLocaleString()}
          </span>
        </div>
        <p className={`font-['Inter:Medium',sans-serif] text-[9px] uppercase tracking-[0.3px] mt-[1.5px] ${
          hasOutstanding ? 'text-red-500/70' : isCredit ? 'text-[#003630]/60' : 'text-gray-400'
        }`}>
          {hasOutstanding ? 'Due Balance' : isCredit ? 'Credit Balance' : 'No Balance'}
        </p>
      </div>

      <div className={`flex items-center justify-center w-[22px] h-[22px] rounded-full transition-all duration-300 ml-[10px] ${
        hasOutstanding ? 'bg-red-500/10' : isCredit ? 'bg-[#95e36c]/20' : 'bg-gray-100'
      }`}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`transition-transform group-active:translate-x-0.5 ${
          hasOutstanding ? 'text-red-500' : isCredit ? 'text-[#003630]' : 'text-gray-400'
        }`}>
          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function Frame8({ balances }: { balances: number }) {
  return (
    <div className="content-stretch flex gap-[6px] items-start justify-end relative shrink-0 w-fit min-w-[155px]">
      <Frame6 balances={balances} />
    </div>
  );
}


export default function PayForSchoolFees({
  onBack,
  onSelectServices,
  onClearBalances,
  students = [],
  initialSelectedStudents = []
}: PayForSchoolFeesProps) {
  // Initialize state with passed initial selections
  const [selectedStudents, setSelectedStudents] = useState<string[]>(initialSelectedStudents);
  const { isOnline } = useOfflineManager();

  const toggleStudent = (studentId: string) => {
    hapticFeedback('selection');
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectServices = () => {
    if (selectedStudents.length > 0) {
      onSelectServices(selectedStudents);
    }
  };

  // Check if any selected student has balances
  const hasSelectedStudentWithBalance = selectedStudents.some(studentId => {
    const student = students.find(s => s.id === studentId);
    return student && student.balances > 0;
  });

  const handleClearBalances = () => {
    hapticFeedback('medium');
    if (onClearBalances) {
      onClearBalances(selectedStudents);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] to-[#f5f7f9] min-h-screen w-full flex items-center justify-center" data-name="Pay for school fees page 1">
      <div className="relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen mx-auto bg-gradient-to-br from-[#f9fafb] to-[#f5f7f9] flex flex-col overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0">
          <LogoHeader showBackButton onBack={() => {
            hapticFeedback('light');
            onBack();
          }} />
        </div>

        {/* Content - Scrollable area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Title and Instructions - Premium */}
          <div className="flex-shrink-0 px-[28px] sm:px-[40px] pt-[20px] pb-[24px]">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center gap-[8px] mb-[16px]">
                <div className="w-[3px] h-[24px] bg-gradient-to-b from-[#95e36c] to-[#003630] rounded-full" />
                <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.4px]">
                  Select Accounts
                </h2>
              </div>
              <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] leading-[1.5] text-[#6b7280] text-[13px] tracking-[-0.2px]">
                Choose the students you want to make a payment for
              </p>
            </motion.div>
          </div>

          {/* Student Cards - Scrollable with bottom padding for fixed buttons */}
          <div
            className="flex-1 overflow-y-auto px-[28px] pb-[140px] space-y-[12px]"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 text-center">No students found</p>
              </div>
            ) : (
              students.map((student, index) => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleStudent(student.id)}
                    className={`
                      relative rounded-[20px] p-[16px] border-[1.5px]
                      transition-all cursor-pointer active:scale-[0.98]
                      ${isSelected
                        ? 'bg-white border-[#95e36c] shadow-[0px_8px_24px_rgba(149,227,108,0.25)]'
                        : 'bg-white border-[#e5e7eb] hover:border-[#d1d5db] shadow-[0px_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.08)]'
                      }
                    `}
                  >
                    {/* Selection Indicator Line - Optional but nice backup if "stroke" meant this */}
                    {isSelected && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        className="absolute left-0 top-4 bottom-4 w-[4px] bg-[#95e36c] rounded-r-full"
                      />
                    )}

                    <div className="flex items-center justify-between gap-[12px]">
                      <div className="flex items-center gap-[12px] flex-1 pl-2">
                        {isSelected ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            <TickCircle />
                          </motion.div>
                        ) : (
                          <RadioBase isSelected={false} />
                        )}
                        <Frame4 student={student} />
                      </div>
                      <Frame8 balances={student.balances} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Fixed Bottom Buttons Container */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#e5e7eb] px-[28px] pt-[16px] pb-[20px] shadow-[0px_-4px_16px_rgba(0,0,0,0.06)] z-50">
          <div className="w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] mx-auto flex flex-col gap-[12px]">
            {/* Clear Balances Button - Only show if selected student has balance */}
            {hasSelectedStudentWithBalance && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={handleClearBalances}
                className={`btn-primary btn-tactile relative w-full h-[56px] rounded-[18px] overflow-hidden touch-manipulation group ${!isOnline ? 'opacity-50 grayscale' : ''}`}
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center gap-[10px] h-full group-active:scale-[0.98] transition-all">
                  <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#003630] tracking-[-0.3px]">
                    {isOnline ? 'Clear Balances' : 'Go Online to Clear Balances'}
                  </p>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-transform group-hover:translate-x-0.5">
                    <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#003630" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.button>
            )}

            {/* Select Services Button */}
            <button
              onClick={() => {
                hapticFeedback('heavy');
                handleSelectServices();
              }}
              disabled={selectedStudents.length === 0 || !isOnline}
              className={`btn-dark btn-tactile relative w-full h-[56px] rounded-[18px] overflow-hidden touch-manipulation ${(selectedStudents.length === 0 || !isOnline) ? 'cursor-not-allowed opacity-60' : 'group'
                }`}
              data-name="Button"
            >
              {/* Shine Effect */}
              {selectedStudents.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              )}

              {/* Content */}
              <div className={`relative z-10 flex items-center justify-center gap-[10px] h-full transition-all ${selectedStudents.length > 0 && 'group-active:scale-[0.98]'
                }`}>
                <p className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] tracking-[-0.3px] ${(selectedStudents.length === 0 || !isOnline) ? 'text-white/60' : 'text-white'
                  }`}>
                  {isOnline ? 'Select Services' : 'Go Online to Pay'}
                </p>
                {selectedStudents.length > 0 && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-transform group-hover:translate-x-0.5">
                    <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
