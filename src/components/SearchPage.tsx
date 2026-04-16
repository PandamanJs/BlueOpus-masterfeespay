import { useState, useMemo, useEffect } from "react";
import { getSchools } from "../lib/supabase/api/schools";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, ChevronRight } from "lucide-react";
import { haptics } from "../utils/haptics";
import type { School } from "../types";



interface SearchPageProps {
  onProceed: () => void;
  selectedSchool: string | null;
  onSchoolSelect: (school: School) => void;
}

export default function SearchPage({ onProceed, selectedSchool, onSchoolSelect }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    async function loadSchools() {
      const data = await getSchools();
      setSchools(data);
    }
    loadSchools();
  }, []);

  // Filter schools based on search query
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;

    const query = searchQuery.toLowerCase();
    return schools.filter(school =>
      school.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSchoolSelect = (school: School) => {
    onSchoolSelect(school);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleProceed = () => {
    if (selectedSchool) {
      onProceed();
    }
  };

  // Get initials for schools without logos
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header - Premium */}
      <div className="px-6 pt-10 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col mb-[12px]">
            <h1 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[28px] text-[#003630] tracking-[-0.5px]">Select Your School</h1>
          </div>
          <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[14px] text-[#6b7280] tracking-[-0.2px]">
            Choose your school to continue with payment
          </p>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="px-6 pb-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          <div
            className={`
              relative bg-white rounded-[16px] overflow-hidden
              transition-all duration-300
              ${isSearchFocused
                ? 'ring-4 ring-[#95e36c]/20 border-[1.5px] border-[#95e36c] shadow-lg'
                : 'border-[1.5px] border-[#e5e7eb] shadow-sm'
              }
            `}
            style={{
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center px-4 py-4">
              <Search
                className={`
                  flex-shrink-0 transition-colors duration-300
                  ${isSearchFocused ? 'text-[#95e36c]' : 'text-[#003630]/40'}
                `}
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search schools..."
                className="
                  flex-1 px-3 bg-transparent outline-none
                  text-[#003630] placeholder:text-[#003630]/40
                "
                style={{
                  fontSize: '16px', // Prevent iOS zoom on focus
                }}
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={handleClearSearch}
                  className="
                    flex-shrink-0 p-1 rounded-full
                    bg-[#003630]/5 hover:bg-[#003630]/10
                    active:scale-95
                    transition-all duration-200
                  "
                  style={{
                    minWidth: '28px',
                    minHeight: '28px',
                  }}
                >
                  <X size={16} className="text-[#003630]/60" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Schools List */}
      <div className="flex-1 overflow-auto px-6 pb-24">
        <AnimatePresence mode="wait">
          {filteredSchools.length > 0 ? (
            <motion.div
              key="schools-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredSchools.map((school, index) => {
                const isSelected = selectedSchool === school.name;

                return (
                  <motion.button
                    key={school.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      haptics.selection();
                      handleSchoolSelect(school);
                    }}
                    className={`
                      relative w-full rounded-[16px] p-4 border-[1.5px]
                      transition-all duration-300
                      ${isSelected
                        ? 'bg-white border-[#95e36c] shadow-[0px_8px_24px_rgba(149,227,108,0.25)]'
                        : 'bg-white border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm hover:shadow-md'
                      }
                    `}
                    style={{
                      minHeight: '80px',
                      touchAction: 'manipulation',
                    }}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#95e36c] rounded-l-[16px]"
                      />
                    )}

                    <div className="flex items-center gap-4">
                      {/* School Logo/Initials - Premium Badge */}
                      <div
                        className={`
                          flex-shrink-0 rounded-[14px] flex items-center justify-center border
                          transition-all duration-300
                          ${isSelected
                            ? 'bg-[#95e36c] border-white text-white shadow-sm'
                            : 'bg-neutral-100 border-[#e5e7eb] text-neutral-400'
                          }
                        `}
                        style={{
                          width: '56px',
                          height: '56px',
                        }}
                      >
                        {school.logo ? (
                          <img
                            src={school.logo}
                            alt={school.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="font-semibold">
                            {getInitials(school.name)}
                          </span>
                        )}
                      </div>

                      {/* School Name */}
                      <div className="flex-1 text-left">
                        <h3
                          className={`
                            transition-colors duration-300
                            ${isSelected ? 'text-[#003630]' : 'text-[#003630]'}
                          `}
                        >
                          {school.name}
                        </h3>
                        {isSelected && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-[#003630]/70 text-sm mt-1"
                          >
                            Selected
                          </motion.p>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="
                              w-6 h-6 rounded-full bg-white
                              flex items-center justify-center
                            "
                          >
                            <svg
                              width="14"
                              height="11"
                              viewBox="0 0 14 11"
                              fill="none"
                            >
                              <path
                                d="M1 5.5L5 9.5L13 1.5"
                                stroke="#95e36c"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </motion.div>
                        ) : (
                          <ChevronRight
                            size={20}
                            className="text-[#003630]/40"
                          />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="
                flex flex-col items-center justify-center
                py-16 px-6 text-center
              "
            >
              <div
                className="
                  w-20 h-20 rounded-full bg-neutral-50
                  flex items-center justify-center mb-4 border border-neutral-100
                "
              >
                <Search size={32} className="text-[#003630]/40" />
              </div>
              <h3 className="text-[#003630] mb-2">No schools found</h3>
              <p className="text-[#003630]/60 max-w-xs">
                Try adjusting your search to find your school
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue Button - Shows when school selected */}
      <AnimatePresence>
        {selectedSchool && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="
              fixed bottom-0 left-0 right-0
              px-6 pb-6 pt-4
              bg-gradient-to-t from-white via-white to-transparent
              z-50
            "
            style={{
              backdropFilter: 'blur(8px)',
            }}
          >
            <button
              onClick={() => {
                haptics.buttonPress();
                handleProceed();
              }}
              className="relative w-full h-[56px] rounded-[16px] overflow-hidden group"
              style={{
                touchAction: 'manipulation',
              }}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#00251f] transition-colors" />

              {/* Shadow */}
              <div className="absolute inset-0 shadow-lg group-active:shadow-sm transition-shadow" />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-center gap-[10px] h-full group-active:scale-[0.97] transition-transform">
                <span className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white tracking-[-0.3px]">
                  Continue with {selectedSchool.split(" ")[0]}
                </span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
