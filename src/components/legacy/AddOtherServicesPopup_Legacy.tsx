import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getInstitutionType } from "../data/students";
import type { Student } from "../data/students";
import { getSchoolServices } from "../data/services";
import type { SchoolService } from "../data/services";
import { haptics } from "../utils/haptics";
import { getPaymentHistoryRecordByStudentId } from "../lib/supabase/api/transactions";

interface AddOtherServicesPopupProps {
  onClose: () => void;
  onDone: (services: Array<{
    id: string;
    name: string;
    amount: number;
    category: string;
    term: string;
    route?: string;
    paymentPeriod?: string;
    uniformItems?: string[];
  }>) => void;
  schoolName: string;
  userPhone: string;
  student?: Student; // Add student to enable term validation
  blockedServiceNames?: string[];
}

const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"];
const SEMESTER_OPTIONS = ["Semester 1", "Semester 2"];

/**
 * Premium Dropdown Component
 * Apple-inspired dropdown with clean design
 */
function PremiumDropdown({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full">
      <label className="block font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] text-[#6b7280] tracking-[0.8px] uppercase mb-[8px] pl-[4px]">
        {label}
      </label>
      <div className="relative group">
        {/* Dropdown Container */}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[42px] px-[14px] pr-[40px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[10px] font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[13px] text-[#003630] appearance-none cursor-pointer hover:bg-white hover:border-[#d1d5db] focus:bg-white focus:border-[#95e36c] focus:outline-none focus:ring-0 transition-all touch-manipulation shadow-sm tracking-[-0.2px]"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {/* Custom Arrow Icon */}
        <div className="absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-y-[-calc(50%-1px)]">
          <div className="w-[18px] h-[18px] bg-white rounded-[5px] border border-[#e5e7eb] flex items-center justify-center shadow-sm">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Uniform Item Selector - Redesigned for clarity
 */
function UniformSelector({
  subItems,
  selectedItems,
  onItemsChange
}: {
  subItems: Array<{ id: string; name: string; amount: number }>;
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
}) {
  const toggleItem = (itemId: string) => {
    // If selecting "complete set", deselect all individual items
    if (itemId === "uniform-complete") {
      onItemsChange(selectedItems.includes(itemId) ? [] : [itemId]);
    } else {
      // If selecting individual item, deselect "complete set"
      const newItems = selectedItems.includes(itemId)
        ? selectedItems.filter(id => id !== itemId)
        : [...selectedItems.filter(id => id !== "uniform-complete"), itemId];
      onItemsChange(newItems);
    }
  };

  const completeSet = subItems.find(item => item.id === "uniform-complete");
  const individualItems = subItems.filter(item => item.id !== "uniform-complete");

  return (
    <div className="space-y-[10px]">
      <label className="block font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] text-[#6b7280] tracking-[0.8px] uppercase pl-[4px]">
        Select Items
      </label>

      {/* Complete Set Option - Premium Featured Card */}
      {completeSet && (
        <button
          onClick={() => toggleItem(completeSet.id)}
          className="w-full group touch-manipulation active:scale-[0.98] transition-transform"
        >
          <div className={`
            relative rounded-[12px] p-[12px] transition-all duration-200
            ${selectedItems.includes(completeSet.id)
              ? 'bg-gradient-to-br from-[#95e36c] to-[#7dd054] shadow-[0px_4px_16px_rgba(149,227,108,0.25)]'
              : 'bg-white border-[1.5px] border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm'
            }
          `}>
            {/* Sparkle decoration for selected state */}
            {selectedItems.includes(completeSet.id) && (
              <>
                <div className="absolute top-[10px] right-[10px] w-[5px] h-[5px] bg-white/40 rounded-full" />
                <div className="absolute top-[16px] right-[16px] w-[3px] h-[3px] bg-white/30 rounded-full" />
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                {/* Custom Radio/Checkbox */}
                <div className={`
                  w-[20px] h-[20px] rounded-full flex items-center justify-center transition-all shadow-sm
                  ${selectedItems.includes(completeSet.id)
                    ? 'bg-white'
                    : 'bg-[#f5f7f9] border-[1.5px] border-[#e5e7eb]'
                  }
                `}>
                  {selectedItems.includes(completeSet.id) && (
                    <motion.svg
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25
                      }}
                      width="12"
                      height="10"
                      viewBox="0 0 14 11"
                      fill="none"
                    >
                      <path d="M1.5 5.5L5 9L12.5 1.5" stroke="#95e36c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </div>

                <div className="text-left">
                  <p className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] tracking-[-0.2px] mb-[2px] ${selectedItems.includes(completeSet.id) ? 'text-white' : 'text-[#003630]'
                    }`}>
                    {completeSet.name}
                  </p>
                  <p className={`font-['Inter:Regular',sans-serif] text-[10px] tracking-[-0.1px] ${selectedItems.includes(completeSet.id) ? 'text-white/80' : 'text-[#6b7280]'
                    }`}>
                    All items included • Best value
                  </p>
                </div>
              </div>

              <div className={`px-[10px] py-[6px] rounded-[8px] ${selectedItems.includes(completeSet.id)
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-[#f5f7f9]'
                }`}>
                <p className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] tracking-[-0.2px] ${selectedItems.includes(completeSet.id) ? 'text-white' : 'text-[#003630]'
                  }`}>
                  {completeSet.amount > 0 ? completeSet.amount : 'TBA'}
                </p>
                {completeSet.amount > 0 && (
                  <p className={`font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[9px] tracking-[-0.1px] text-center ${selectedItems.includes(completeSet.id) ? 'text-white/70' : 'text-[#9ca3af]'
                    }`}>
                    ZMW
                  </p>
                )}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Divider with Unique Style */}
      <div className="relative py-[6px]">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-[12px] py-[3px] bg-[#fafbfc] rounded-[6px] border border-[#f0f1f3] font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[9px] text-[#9ca3af] uppercase tracking-[0.8px]">
            Or Choose Items
          </span>
        </div>
      </div>

      {/* Individual Items - Premium Grid */}
      <div className="grid grid-cols-2 gap-[8px] max-h-[240px] overflow-y-auto pr-[4px] scrollbar-thin scrollbar-thumb-[#e5e7eb] scrollbar-track-transparent">
        {individualItems.map((item, index) => {
          const isItemSelected = selectedItems.includes(item.id);
          return (
            <motion.button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group touch-manipulation active:scale-[0.97] transition-transform"
            >
              <div className={`
                relative rounded-[10px] p-[10px] transition-all duration-200
                ${isItemSelected
                  ? 'bg-gradient-to-br from-[#e0f7d4] to-[#d0f0c0] border-[1.5px] border-[#95e36c]/50 shadow-sm'
                  : 'bg-white border-[1.5px] border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm'
                }
              `}>
                {/* Selection indicator dot */}
                {isItemSelected && (
                  <div className="absolute top-[8px] right-[8px] w-[5px] h-[5px] bg-[#95e36c] rounded-full" />
                )}

                <div className="flex flex-col gap-[8px]">
                  {/* Checkbox */}
                  <div className={`
                    w-[18px] h-[18px] rounded-[6px] flex items-center justify-center transition-all
                    ${isItemSelected
                      ? 'bg-[#95e36c] shadow-[0px_2px_6px_rgba(149,227,108,0.3)]'
                      : 'bg-[#f5f7f9] border-[1.5px] border-[#e5e7eb]'
                    }
                  `}>
                    {isItemSelected && (
                      <motion.svg
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 25
                        }}
                        width="10"
                        height="8"
                        viewBox="0 0 12 10"
                        fill="none"
                      >
                        <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="text-left">
                    <p className={`font-['IBM_Plex_Sans_Devanagari:${isItemSelected ? 'Bold' : 'Medium'}',sans-serif] text-[11px] text-[#003630] tracking-[-0.1px] leading-[1.3] mb-[4px]`}>
                      {item.name}
                    </p>
                    <div className={`
                      inline-flex items-baseline gap-[3px] px-[8px] py-[3px] rounded-[6px]
                      ${isItemSelected
                        ? 'bg-white/60 backdrop-blur-sm'
                        : 'bg-[#f5f7f9]'
                      }
                    `}>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[11px] text-[#003630] tracking-[-0.1px] leading-[1]">
                        {item.amount > 0 ? item.amount : 'TBA'}
                      </p>
                      {item.amount > 0 && (
                        <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[8px] text-[#6b7280] tracking-[-0.1px]">
                          ZMW
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Service Checkbox Item with all selection options
 */
function ServiceCheckbox({
  service,
  isSelected,
  onToggle,
  term,
  onTermChange,
  route,
  onRouteChange,
  paymentPeriod,
  onPaymentPeriodChange,
  uniformItems,
  onUniformItemsChange,
  schoolName,
  isUniversity,
  isBlocked
}: {
  service: SchoolService;
  isSelected: boolean;
  onToggle: () => void;
  term: string;
  onTermChange: (term: string) => void;
  route?: string;
  onRouteChange?: (route: string) => void;
  paymentPeriod?: string;
  onPaymentPeriodChange?: (period: string) => void;
  uniformItems?: string[];
  onUniformItemsChange?: (items: string[]) => void;
  schoolName: string;
  isUniversity?: boolean;
  isBlocked?: boolean;
}) {
  const isTransport = service.category === 'transport';
  const isMeals = service.category === 'meals';
  const isUniform = service.category === 'uniform';
  const hasPaymentPeriods = service.paymentPeriods && service.paymentPeriods.length > 0;
  const busRoutes = service.routePricing ? Object.keys(service.routePricing) : [];

  // Calculate current amount based on selections
  let displayAmount = service.amount;

  if (isUniform && uniformItems && uniformItems.length > 0) {
    displayAmount = service.subItems
      ?.filter(item => uniformItems.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0) || service.amount;
  } else if (hasPaymentPeriods && paymentPeriod) {
    const period = service.paymentPeriods?.find(p => p.period === paymentPeriod);
    if (period) {
      displayAmount = period.amount;
      // If transport with route pricing, adjust the period amount based on route
      if (isTransport && route && service.routePricing) {
        const baseRoutePrice = service.routePricing[route] || service.amount;
        const basePeriodPrice = service.amount;
        const ratio = baseRoutePrice / basePeriodPrice;
        displayAmount = Math.round(period.amount * ratio);
      }
    }
  } else if (isTransport && route && service.routePricing) {
    displayAmount = service.routePricing[route] || service.amount;
  }

  return (
    <div className="w-full">
      <button
        onClick={() => {
          haptics.selection();
          onToggle();
        }}
        className={`w-full text-left group touch-manipulation active:scale-[0.99] transition-transform ${isBlocked ? 'cursor-pointer' : ''}`}
      >
        <div className={`
          relative rounded-[12px] transition-all duration-200
          ${isSelected
            ? 'bg-gradient-to-br from-white via-[#fafbfc] to-white border-[1.5px] border-[#95e36c] shadow-[0px_2px_12px_rgba(149,227,108,0.15)]'
            : isBlocked
              ? 'bg-gray-50 border-[1.5px] border-red-200'
              : 'bg-white border-[1.5px] border-[#e5e7eb] hover:border-[#d1d5db] shadow-sm'
          }
        `}>
          {/* Selection Indicator Bar */}
          {isSelected && (
            <motion.div
              layoutId={`selection-${service.id}`}
              className="absolute left-0 top-[8px] bottom-[8px] w-[3px] bg-gradient-to-b from-[#95e36c] to-[#7dd054] rounded-r-full"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
          )}

          <div className="px-[14px] py-[12px] flex items-start gap-[12px]">
            {/* Unique Checkbox Design */}
            <div className="mt-[2px] flex-shrink-0">
              <div className={`
                w-[20px] h-[20px] rounded-[7px] flex items-center justify-center transition-all duration-200
                ${isSelected
                  ? 'bg-[#95e36c] shadow-[0px_2px_8px_rgba(149,227,108,0.4)]'
                  : isBlocked
                    ? 'bg-red-50 border-[1.5px] border-red-200'
                    : 'bg-[#f5f7f9] border-[1.5px] border-[#e5e7eb]'
                }
              `}>
                {isSelected ? (
                  <motion.svg
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25
                    }}
                    width="12"
                    height="10"
                    viewBox="0 0 14 11"
                    fill="none"
                  >
                    <path
                      d="M1.5 5.5L5 9L12.5 1.5"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                ) : isBlocked ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <div className="w-[8px] h-[8px] rounded-[3px] bg-white/60" />
                )}
              </div>
            </div>

            {/* Service Details */}
            <div className="flex-1 min-w-0">
              <p className={`font-['IBM_Plex_Sans_Devanagari:${isSelected ? 'Bold' : 'SemiBold'}',sans-serif] text-[13px] text-[#003630] tracking-[-0.2px] mb-[4px] leading-[1.3]`}>
                {service.name}
              </p>
              {isBlocked && (
                <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[11px] text-[#ef4444] tracking-[-0.1px] mb-[4px] leading-[1.3] flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Clear Outstanding Balance
                </p>
              )}
              <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#6b7280] tracking-[-0.1px] mb-[8px] leading-[1.4]">
                {isTransport && route ? `Route: ${route}` : service.description}
              </p>

              {/* Price and Category Tags */}
              <div className="flex items-center gap-[8px] flex-wrap">
                {/* Price Badge */}
                <div className={`
                  inline-flex items-baseline gap-[4px] px-[10px] py-[6px] rounded-[8px] transition-all
                  ${isSelected
                    ? 'bg-gradient-to-r from-[#e0f7d4] to-[#d0f0c0] border border-[#95e36c]/20'
                    : isBlocked
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-[#f5f7f9] border border-[#e5e7eb]'
                  }
                `}>
                  <p className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[13px] ${isBlocked ? 'text-red-500 italic' : 'text-[#003630]'} tracking-[-0.2px] leading-[1]`}>
                    {isBlocked ? 'Clear Balance' : (displayAmount > 0 ? displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'TBA')}
                  </p>
                  {!isBlocked && displayAmount > 0 && (
                    <p className={`font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[10px] ${isBlocked ? 'text-red-400' : 'text-[#6b7280]'} tracking-[-0.1px]`}>
                      ZMW
                    </p>
                  )}
                </div>

                {/* Category Badge */}
                <span className="inline-flex items-center px-[8px] py-[4px] bg-white/60 backdrop-blur-sm border border-[#e5e7eb] rounded-[6px] text-[9px] font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[#6b7280] uppercase tracking-[0.6px]">
                  {service.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Options (shown when selected) - Collapsible with Animation */}
      {isSelected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-[14px] pb-[14px] pt-[12px] space-y-[12px] bg-gradient-to-b from-[#fafbfc]/50 to-transparent">
            {/* Uniform Items Selector */}
            {isUniform && service.subItems && onUniformItemsChange && (
              <UniformSelector
                subItems={service.subItems}
                selectedItems={uniformItems || []}
                onItemsChange={onUniformItemsChange}
              />
            )}

            {/* Payment Period Selector - Unique Segmented Design - Hidden for Transport/Meals per user request */}
            {!isUniform && !isTransport && !isMeals && hasPaymentPeriods && onPaymentPeriodChange && (
              <div className="w-full">
                <label className="block font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] text-[#6b7280] tracking-[0.8px] uppercase mb-[10px] pl-[4px]">
                  Payment Frequency
                </label>
                <div className="relative bg-[#f5f7f9]/80 backdrop-blur-sm rounded-[12px] p-[3px] border border-[#e5e7eb]/50">
                  <div className="grid grid-cols-3 gap-[3px] relative">
                    {service.paymentPeriods?.map((p) => {
                      const isActive = (paymentPeriod || 'term') === p.period;
                      return (
                        <button
                          key={p.period}
                          onClick={() => onPaymentPeriodChange(p.period)}
                          className="relative z-10 py-[10px] px-[6px] rounded-[9px] transition-all touch-manipulation active:scale-95"
                        >
                          {isActive && (
                            <motion.div
                              layoutId={`period-${service.id}`}
                              className="absolute inset-0 bg-white rounded-[9px] shadow-[0px_2px_8px_rgba(0,0,0,0.06),0px_1px_2px_rgba(0,0,0,0.04)]"
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                              }}
                            />
                          )}
                          <div className="relative z-10">
                            <p className={`font-['IBM_Plex_Sans_Devanagari:${isActive ? 'Bold' : 'Medium'}',sans-serif] text-[11px] tracking-[-0.1px] text-center leading-tight mb-[3px] transition-colors ${isActive ? 'text-[#003630]' : 'text-[#9ca3af]'
                              }`}>
                              {p.period === 'term'
                                ? (isUniversity ? 'Semesterly' : 'Termly')
                                : p.period === 'month'
                                  ? 'Monthly'
                                  : p.period === 'week'
                                    ? 'Weekly'
                                    : 'Daily'}
                            </p>
                            <p className={`font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[9px] tracking-[-0.1px] text-center transition-colors ${isActive ? 'text-[#6b7280]' : 'text-[#cbd5e0]'
                              }`}>
                              K{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Dropdowns Container - Unique Card Style */}
            {!isUniform && (
              <div className="relative overflow-hidden rounded-[12px] bg-white border-[1.5px] border-[#e5e7eb] shadow-sm">
                {/* Decorative Corner Element */}
                <div className="absolute top-0 right-0 w-[48px] h-[48px] bg-gradient-to-br from-[#95e36c]/5 to-transparent rounded-bl-[24px]" />

                <div className="relative p-[12px] space-y-[12px]">
                  {/* Term/Semester Dropdown */}
                  <PremiumDropdown
                    label={isUniversity ? "Academic Semester" : "Academic Term"}
                    value={term}
                    options={isUniversity ? SEMESTER_OPTIONS : TERM_OPTIONS}
                    onChange={onTermChange}
                  />

                  {/* Divider */}
                  {isTransport && onRouteChange && (
                    <div className="relative h-[1px]">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent" />
                    </div>
                  )}

                  {/* Route Dropdown (only for transport services) - Hidden per user request since it's auto-selected */}
                  {isTransport && onRouteChange && false && (
                    <PremiumDropdown
                      label="Bus Route"
                      value={route || busRoutes[0]}
                      options={busRoutes}
                      onChange={onRouteChange}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Service Category Group
 * Groups services by category with a header
 */
function ServiceCategoryGroup({
  category,
  services,
  selectedIds,
  onToggle,
  serviceTerms,
  onTermChange,
  serviceRoutes,
  onRouteChange,
  servicePaymentPeriods,
  onPaymentPeriodChange,
  serviceUniformItems,
  onUniformItemsChange,
  schoolName,
  isUniversity,
  blockedServiceNames
}: {
  category: string;
  services: SchoolService[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  serviceTerms: Record<string, string>;
  onTermChange: (id: string, term: string) => void;
  serviceRoutes: Record<string, string>;
  onRouteChange: (id: string, route: string) => void;
  servicePaymentPeriods: Record<string, string>;
  onPaymentPeriodChange: (id: string, period: string) => void;
  serviceUniformItems: Record<string, string[]>;
  onUniformItemsChange: (id: string, items: string[]) => void;
  schoolName: string;
  isUniversity?: boolean;
  blockedServiceNames?: string[];
}) {
  if (services.length === 0) return null;

  const categoryLabels: Record<string, string> = {
    tuition: "Tuition Fees",
    meals: isUniversity ? "Cafeteria & Dining" : "Meals & Catering",
    transport: isUniversity ? "Campus Shuttle" : "Transportation",
    activities: "Activities & Programs",
    supplies: "Supplies & Materials",
    uniform: "School Uniform",
    accommodation: isUniversity ? "Student Housing" : "Boarding & Accommodation",
    other: "Other Services"
  };

  const categoryIcons: Record<string, string> = {
    meals: "🍽️",
    transport: "🚌",
    activities: "⚽",
    supplies: "📚",
    uniform: "👔",
    accommodation: "🏠",
    other: "✨"
  };

  return (
    <div className="w-full mb-[16px]">
      {/* Unique Category Header */}
      <div className="px-[24px] pt-[20px] pb-[12px]">
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center justify-center w-[32px] h-[32px] bg-gradient-to-br from-[#f5f7f9] to-[#e5e7eb] rounded-[10px] border border-white shadow-sm">
            <span className="text-[16px]">{categoryIcons[category] || "📋"}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] text-[#003630] tracking-[-0.2px]">
              {categoryLabels[category] || category}
            </h3>
            <div className="flex items-center gap-[6px] mt-[2px]">
              <div className="w-[20px] h-[2px] bg-gradient-to-r from-[#95e36c] to-transparent rounded-full" />
              <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#9ca3af] tracking-[0.5px] uppercase">
                {services.length} {services.length === 1 ? 'option' : 'options'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-[20px] space-y-[10px]">
        {services.map(service => (
          <ServiceCheckbox
            key={service.id}
            service={service}
            isSelected={selectedIds.has(service.id)}
            onToggle={() => onToggle(service.id)}
            term={serviceTerms[service.id] || (isUniversity ? "Semester 1" : "Term 1")}
            onTermChange={(term) => onTermChange(service.id, term)}
            route={serviceRoutes[service.id]}
            onRouteChange={(route) => onRouteChange(service.id, route)}
            paymentPeriod={servicePaymentPeriods[service.id]}
            onPaymentPeriodChange={(period) => onPaymentPeriodChange(service.id, period)}
            uniformItems={serviceUniformItems[service.id]}
            onUniformItemsChange={(items) => onUniformItemsChange(service.id, items)}
            schoolName={schoolName}
            isUniversity={isUniversity}
            isBlocked={blockedServiceNames?.some(blocked => {
              const b = blocked.toLowerCase();
              const s = service.name.toLowerCase();
              // Match if names are identical or if debt name starts with service name (e.g. "School Bus - Term 1")
              return b === s || b.startsWith(s + " -") || b.startsWith(s + " (");
            })}
          />
        ))}
      </div>
    </div>
  );
}

export default function AddOtherServicesPopup({ onClose, onDone, schoolName, userPhone, student, blockedServiceNames }: AddOtherServicesPopupProps) {
  // Determine if this is a university or school
  const institutionType = getInstitutionType(schoolName);
  const isUniversity = institutionType === 'university';

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [serviceTerms, setServiceTerms] = useState<Record<string, string>>({});
  const [serviceRoutes, setServiceRoutes] = useState<Record<string, string>>({});
  const [servicePaymentPeriods, setServicePaymentPeriods] = useState<Record<string, string>>({});
  const [serviceUniformItems, setServiceUniformItems] = useState<Record<string, string[]>>({});
  const [allServices, setAllServices] = useState<SchoolService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [historicalDefaults, setHistoricalDefaults] = useState<{
    routes: Record<string, string>;
    periods: Record<string, string>;
  }>({ routes: {}, periods: {} });

  // Get all services and filter out tuition (handled by Add School Fees/Add Tuition)
  useEffect(() => {
    async function fetchServicesAndHistory() {
      setIsLoadingServices(true);
      
      const [services, history] = await Promise.all([
        getSchoolServices(schoolName, student?.schoolId, student?.gradeId),
        student?.id ? getPaymentHistoryRecordByStudentId(student.id) : Promise.resolve([])
      ]);

      setAllServices(services.filter(service => service.category !== 'tuition'));

      // Process history to find last-used routes and periods
      const routeDefaults: Record<string, string> = {};
      const periodDefaults: Record<string, string> = {};

      // History is already sorted by date desc from API
      history.forEach(record => {
        const sName = (record.service_name || '').toLowerCase();
        
        // 1. Try to match route from payment reference or description
        // Example: "School Bus - Route 2"
        if (record.route && !routeDefaults[sName]) {
          routeDefaults[sName] = record.route;
        }

        // 2. Try to match frequency/period
        if ((record as any).payment_period && !periodDefaults[sName]) {
          periodDefaults[sName] = (record as any).payment_period;
        }
      });

      console.log('[HistoryDefaults] Found:', { routeDefaults, periodDefaults });
      setHistoricalDefaults({ routes: routeDefaults, periods: periodDefaults });
      
      setIsLoadingServices(false);
    }
    fetchServicesAndHistory();
  }, [schoolName, student?.id]);

  // Group services by category
  const servicesByCategory = allServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, SchoolService[]>);

  const toggleService = (serviceId: string) => {
    haptics.selection();
    setSelectedServiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
        // Initialize with default term if not set
        if (!serviceTerms[serviceId]) {
          setServiceTerms(prev => ({ ...prev, [serviceId]: "Term 1" }));
        }
        // Initialize with default route for transport services
        const service = allServices.find(s => s.id === serviceId);
        if (service?.category === 'transport' && service.routePricing && !serviceRoutes[serviceId]) {
          const sName = service.name.toLowerCase();
          const route = historicalDefaults.routes[sName] || Object.keys(service.routePricing)[0];
          setServiceRoutes(prev => ({ ...prev, [serviceId]: route }));
        }
        // Initialize payment period for services with payment periods
        if (service?.paymentPeriods && !servicePaymentPeriods[serviceId]) {
          const sName = service.name.toLowerCase();
          const period = historicalDefaults.periods[sName] || 'term';
          setServicePaymentPeriods(prev => ({ ...prev, [serviceId]: period }));
        }
        // Initialize uniform items with complete set
        if (service?.category === 'uniform' && service.subItems && !serviceUniformItems[serviceId]) {
          setServiceUniformItems(prev => ({ ...prev, [serviceId]: ['uniform-complete'] }));
        }
      }
      return newSet;
    });
  };

  const handleTermChange = (serviceId: string, term: string) => {
    setServiceTerms(prev => ({ ...prev, [serviceId]: term }));
  };

  const handleRouteChange = (serviceId: string, route: string) => {
    setServiceRoutes(prev => ({ ...prev, [serviceId]: route }));
  };

  const handlePaymentPeriodChange = (serviceId: string, period: string) => {
    setServicePaymentPeriods(prev => ({ ...prev, [serviceId]: period }));
  };

  const handleUniformItemsChange = (serviceId: string, items: string[]) => {
    setServiceUniformItems(prev => ({ ...prev, [serviceId]: items }));
  };

  const handleDone = () => {
    const selectedServices = allServices
      .filter(service => selectedServiceIds.has(service.id))
      .map(service => {
        let amount = service.amount;
        const paymentPeriod = servicePaymentPeriods[service.id];
        const route = serviceRoutes[service.id];
        const uniformItems = serviceUniformItems[service.id];

        // Calculate amount based on selections
        if (service.category === 'uniform' && uniformItems && uniformItems.length > 0) {
          amount = service.subItems
            ?.filter(item => uniformItems.includes(item.id))
            .reduce((sum, item) => sum + item.amount, 0) || service.amount;
        } else if (paymentPeriod && service.paymentPeriods) {
          const period = service.paymentPeriods.find(p => p.period === paymentPeriod);
          if (period) {
            amount = period.amount;
            // If transport with route pricing, adjust the period amount based on route
            if (service.category === 'transport' && route && service.routePricing) {
              const baseRoutePrice = service.routePricing[route] || service.amount;
              const basePeriodPrice = service.amount;
              const ratio = baseRoutePrice / basePeriodPrice;
              amount = Math.round(period.amount * ratio);
            }
          }
        } else if (service.category === 'transport' && route && service.routePricing) {
          amount = service.routePricing[route] || service.amount;
        }

        return {
          id: service.id,
          name: service.name,
          amount,
          category: service.category,
          term: serviceTerms[service.id] || "Term 1",
          ...(service.category === 'transport' && { route }),
          ...(paymentPeriod && { paymentPeriod }),
          ...(uniformItems && uniformItems.length > 0 && { uniformItems })
        };
      });

    onDone(selectedServices);
  };

  const selectedCount = selectedServiceIds.size;

  // Calculate total amount considering all selections
  const totalAmount = allServices
    .filter(service => selectedServiceIds.has(service.id))
    .reduce((sum, service) => {
      let amount = service.amount;
      const paymentPeriod = servicePaymentPeriods[service.id];
      const route = serviceRoutes[service.id];
      const uniformItems = serviceUniformItems[service.id];

      if (service.category === 'uniform' && uniformItems && uniformItems.length > 0) {
        amount = service.subItems
          ?.filter(item => uniformItems.includes(item.id))
          .reduce((itemSum, item) => itemSum + item.amount, 0) || service.amount;
      } else if (paymentPeriod && service.paymentPeriods) {
        const period = service.paymentPeriods.find(p => p.period === paymentPeriod);
        if (period) {
          amount = period.amount;
          // If transport with route pricing, adjust the period amount based on route
          if (service.category === 'transport' && route && service.routePricing) {
            const baseRoutePrice = service.routePricing[route] || service.amount;
            const basePeriodPrice = service.amount;
            const ratio = baseRoutePrice / basePeriodPrice;
            amount = Math.round(period.amount * ratio);
          }
        }
      } else if (service.category === 'transport' && route && service.routePricing) {
        amount = service.routePricing[route] || service.amount;
      }

      return sum + amount;
    }, 0);

  return (
    <>
      {/* Unique Backdrop with Layered Blur */}
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/30" />
        <div className="absolute inset-0 backdrop-blur-[6px]" />
      </motion.div>

      {/* Bottom Sheet Popup */}
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
        {/* Drag Handle */}
        <div className="flex justify-center pt-[12px] pb-[6px]">
          <div className="w-[36px] h-[5px] bg-white/90 rounded-full shadow-sm" />
        </div>

        <div className="bg-white/98 backdrop-blur-[24px] rounded-t-[32px] shadow-[0px_-8px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[85vh]">
          {/* Decorative Top Border */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#95e36c]/60 to-transparent" />

          {/* Header with Unique Design */}
          <div className="relative px-[16px] pt-[16px] pb-[12px] border-b border-[#f0f1f3]">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-[#95e36c]/5 to-transparent rounded-bl-[40px] pointer-events-none" />

            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-[8px] mb-[4px]">
                  <div className="flex items-center justify-center size-[22px] rounded-full border-[1.5px] border-black">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <h2 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[20px] text-[#003630] tracking-[-0.5px] leading-[1.1]">
                    Services
                  </h2>
                </div>
                <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#6b7280] tracking-[-0.1px] leading-[1.4] ml-[11px]">
                  Customize and add services to your payment
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

            {/* Selection Counter Badge */}
            {selectedCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 25
                }}
                className="mt-[10px] inline-flex items-center gap-[6px] px-[10px] py-[6px] bg-gradient-to-r from-[#e0f7d4] to-[#d0f0c0] rounded-[10px] border border-[#95e36c]/30"
              >
                <div className="w-[5px] h-[5px] bg-[#95e36c] rounded-full animate-pulse" />
                <span className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[10px] text-[#003630] tracking-[-0.1px]">
                  {selectedCount} selected
                </span>
              </motion.div>
            )}
          </div>

          {/* Services List - Scrollable with Custom Scrollbar */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#e5e7eb] scrollbar-track-transparent hover:scrollbar-thumb-[#d1d5db]">
            {isLoadingServices ? (
              <div className="flex flex-col items-center justify-center py-[60px] space-y-4 h-full">
                <div className="w-[32px] h-[32px] rounded-full border-[3px] border-[#f1f3f5] border-t-[#95e36c] animate-spin"></div>
                <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[13px] text-[#6b7280]">
                  Loading services...
                </p>
              </div>
            ) : (
              <>
                {Object.entries(servicesByCategory).map(([category, services]) => (
                  <ServiceCategoryGroup
                    key={category}
                    category={category}
                    services={services}
                    selectedIds={selectedServiceIds}
                    onToggle={toggleService}
                    serviceTerms={serviceTerms}
                    onTermChange={handleTermChange}
                    serviceRoutes={serviceRoutes}
                    onRouteChange={handleRouteChange}
                    servicePaymentPeriods={servicePaymentPeriods}
                    onPaymentPeriodChange={handlePaymentPeriodChange}
                    serviceUniformItems={serviceUniformItems}
                    onUniformItemsChange={handleUniformItemsChange}
                    schoolName={schoolName}
                    isUniversity={isUniversity}
                    blockedServiceNames={blockedServiceNames}
                  />
                ))}

                {allServices.length === 0 && (
                  <div className="py-[48px] px-[24px] text-center">
                    <div className="relative inline-block mb-[16px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#95e36c]/20 to-[#7dd054]/10 blur-xl rounded-full" />
                      <div className="relative w-[56px] h-[56px] bg-gradient-to-br from-[#f5f7f9] to-[#e5e7eb] rounded-[16px] flex items-center justify-center border-[1.5px] border-white shadow-[0px_4px_16px_rgba(0,0,0,0.06)]">
                        <div className="absolute inset-[6px] bg-white rounded-[12px]" />
                        <svg className="relative z-10" width="26" height="26" viewBox="0 0 32 32" fill="none">
                          <path d="M16 10V16M16 22H16.01M28 16C28 22.6274 22.6274 28 16 28C9.37258 28 4 22.6274 4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16Z" stroke="#95e36c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[15px] text-[#003630] mb-[6px] tracking-[-0.3px]">
                      No Services Available
                    </h3>
                    <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#6b7280] leading-[18px] max-w-[260px] mx-auto tracking-[-0.1px]">
                      There are currently no additional services available for this school.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Premium Footer with Floating Summary */}
          <div className="relative border-t border-[#f0f1f3] px-[16px] pt-[14px] pb-[20px] bg-gradient-to-t from-white via-[#fafbfc]/50 to-transparent">
            {/* Floating Summary Card */}
            {selectedCount > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                className="mb-[12px] relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#95e36c]/5 to-[#7dd054]/5 rounded-[16px] blur-lg" />
                <div className="relative bg-white/80 backdrop-blur-sm rounded-[12px] p-[12px] border-[1.5px] border-[#e5e7eb] shadow-[0px_4px_16px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[9px] text-[#9ca3af] tracking-[0.8px] uppercase mb-[4px]">
                        Total Amount
                      </p>
                      <div className="flex items-baseline gap-[4px]">
                        <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[22px] text-[#003630] tracking-[-0.6px] leading-[1]">
                          {totalAmount.toLocaleString()}
                        </p>
                        <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[12px] text-[#6b7280] tracking-[-0.2px]">
                          ZMW
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center justify-center w-[36px] h-[36px] bg-gradient-to-br from-[#95e36c] to-[#7dd054] rounded-[10px] shadow-[0px_4px_12px_rgba(149,227,108,0.3)]">
                        <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[16px] text-white leading-[1]">
                          {selectedCount}
                        </p>
                      </div>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[8px] text-[#9ca3af] mt-[4px] tracking-[0.3px]">
                        SERVICES
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Premium Action Button */}
            <button
              onClick={() => {
                if (selectedCount > 0) {
                  haptics.buttonPress();
                  handleDone();
                }
              }}
              disabled={selectedCount === 0}
              className="relative w-full h-[48px] rounded-[12px] transition-all touch-manipulation disabled:cursor-not-allowed group overflow-hidden"
            >
              {/* Button Background */}
              <div className={`absolute inset-0 transition-all duration-300 ${selectedCount === 0
                ? 'bg-[#f5f7f9]'
                : 'bg-[#003630] group-hover:bg-[#004d45]'
                }`} />

              {/* Shine Effect */}
              {selectedCount > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              )}

              {/* Shadow */}
              {selectedCount > 0 && (
                <div className="absolute inset-0 shadow-[0px_6px_20px_rgba(0,54,48,0.25)] group-active:shadow-[0px_2px_8px_rgba(0,54,48,0.2)] transition-shadow" />
              )}

              {/* Button Content */}
              <div className="relative z-10 flex items-center justify-center gap-[8px] h-full group-active:scale-[0.97] transition-transform">
                <span className={`font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[14px] tracking-[-0.2px] transition-colors ${selectedCount === 0 ? 'text-[#9ca3af]' : 'text-white'
                  }`}>
                  {selectedCount > 0 ? `Add to Payment` : 'Select Services to Continue'}
                </span>
                {selectedCount > 0 && (
                  <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 18 18"
                    fill="none"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </div>
            </button>
          </div>

          {/* Bottom Safe Area */}
          <div className="h-[env(safe-area-inset-bottom,20px)] bg-white/98" />
        </div>
      </motion.div>
    </>
  );
}
