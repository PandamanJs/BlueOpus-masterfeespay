import { useState } from "react";
import { motion } from "motion/react";
import tickSvgPaths from "../imports/svg-m9kcpl04lu";
import { hapticFeedback } from "../utils/haptics";
import { useOfflineManager } from "../hooks/useOfflineManager";
import LogoHeader from "./common/LogoHeader";
import { BadgeCheck } from "lucide-react";

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



function StudentCard({
  student,
  isSelected,
  onClick
}: {
  student: Student;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isCleared = student.balances <= 0;

  return (
    <motion.div
      onClick={onClick}
      className={`
        relative rounded-[20px] p-5 border transition-all cursor-pointer active:scale-[0.98] group
        ${isSelected
          ? 'border-[#95e36c] shadow-[0px_20px_40px_rgba(149,227,108,0.15)] ring-1 ring-[#95e36c]/20'
          : 'border-white/40 shadow-[0px_8px_32px_rgba(0,0,0,0.06)]'
        }
      `}
      style={{
        background: isSelected ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 1)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        boxShadow: isCleared
          ? `inset 0 4px 0 0 #95e36c, ${isSelected ? '0 20px 40px rgba(149,227,108,0.1)' : '0 8px 32px rgba(0,0,0,0.06)'}`
          : "0 8px 32px rgba(0,0,0,0.06)"
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Selection Indicator - Resized to 12x12 */}
          <div className="relative w-[15px] h-[15px] shrink-0 flex items-center justify-center isolate">
            <div className={`w-full h-full rounded-full border-[2px] border-solid transition-all duration-300 ${isSelected
              ? 'border-[#95e36c] bg-[#95e36c]'
              : 'border-[#4b5563] bg-white opacity-100'
              }`}
              style={{ minWidth: '16px', minHeight: '16px' }}
            />
            {isSelected && (
              <motion.svg
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute z-10"
                width="8" height="9" viewBox="0 0 24 24" fill="none"
                stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-col min-w-0">
            <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-[13px] text-black tracking-[-0.3px] truncate">
              {student.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-['Inter',sans-serif] font-medium text-[10px] text-[#4b5563]">
                {student.grade}
              </span>
              <span className="font-['Inter',sans-serif] font-normal text-[10px] text-[#9ca3af]">
                {student.admissionNumber || student.id.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300 ${student.balances > 0
              ? 'bg-[#FFF5F5] text-[#EA3030]'
              : 'bg-[#F0FFF4] text-[#16A34A]'
              }`}
          >
            {student.balances > 0 ? (
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#EA3030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            )}
            <span className="font-['Inter',sans-serif] font-bold text-[10px] tracking-tight">
              {student.balances > 0 ? `K${Math.floor(student.balances).toLocaleString()} Balance` : 'Cleared'}
            </span>
          </div>

          {/* Far Right Chevron */}
          <div className="shrink-0">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
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
    <div className="bg-white min-h-screen w-full flex items-center justify-center" data-name="Pay for school fees page 1">
      <div className="relative w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] h-screen mx-auto bg-white flex flex-col overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 bg-white relative z-10">
          <LogoHeader showBackButton={false} />
        </div>

        {/* Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto w-full pb-[140px]" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          {/* Inner Inset Grey Card */}
          <div className="mx-[1px] sm:mx-[0px] mt-[0px] bg-gray-50 rounded-[28px] border border-gray-200/60 shadow-[0_4px_32px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden pb-[40px]">
            {/* Title and Instructions - Premium */}
            <div className="flex-shrink-0 px-[24px] sm:px-[28px] pt-[28px] pb-[0px]">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-4">
                  <BadgeCheck className="w-[22px] h-[22px] text-[#003630]" strokeWidth={2.5} />
                  <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-[28px] text-[#003630] tracking-tight[1.5px]">
                    Select Accounts
                  </h2>
                </div>
                <p className="font-['Inter',sans-serif] font-medium text-[#4b5563] text-[14px] leading-relaxed">
                  Choose the Students you want to make a payment for.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Student Cards - Outside the grey card */}
          <div className="px-[20px] sm:px-[28px] pt-[24px] space-y-[12px]">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-[24px] border border-dashed border-gray-200">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="font-['Space_Grotesk',sans-serif] font-bold text-gray-500 text-center px-8">No students found associated with this account</p>
              </div>
            ) : (
              students.map((student, index) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isSelected={selectedStudents.includes(student.id)}
                  onClick={() => toggleStudent(student.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Fixed Bottom Buttons Container */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[#EA3030] px-[28px] pt-[16px] pb-[20px] shadow-[0px_-4px_16px_rgba(0,0,0,0.06)] z-50">
          <div className="w-full max-w-[600px] md:max-w-[700px] lg:max-w-[800px] mx-auto flex flex-col gap-[12px]">
            {/* Clear Balances Button - Only show if selected student has balance */}
            {hasSelectedStudentWithBalance && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={handleClearBalances}
                className={`btn-tactile relative w-full h-[56px] rounded-[18px] bg-white border-[2px] !border-[#EA3030] overflow-hidden touch-manipulation group ${!isOnline ? 'opacity-50 grayscale' : ''}`}
              >
                {/* Subtle Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EA3030]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center gap-[10px] h-full group-active:scale-[0.98] transition-all">
                  <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-[#EA3030] font-bold tracking-[-0.3px]">
                    {isOnline ? 'Clear Balances' : 'Go Online to Clear Balances'}
                  </p>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-transform group-hover:translate-x-0.5">
                    <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#EA3030" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
