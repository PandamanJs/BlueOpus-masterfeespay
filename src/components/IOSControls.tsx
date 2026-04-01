/**
 * iOS-Style UI Controls
 * Native iOS switches, segmented controls, and pickers
 */

import { motion } from "motion/react";
import { haptics } from "../utils/haptics";
import { useState } from "react";

/**
 * iOS-Style Toggle Switch
 */
interface IOSSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function IOSSwitch({ 
  checked, 
  onChange, 
  disabled = false,
  size = 'md' 
}: IOSSwitchProps) {
  const handleToggle = () => {
    if (disabled) return;
    haptics.selection();
    onChange(!checked);
  };

  const dimensions = {
    sm: { width: 42, height: 24, thumbSize: 20 },
    md: { width: 51, height: 31, thumbSize: 27 },
    lg: { width: 60, height: 36, thumbSize: 32 }
  };

  const dim = dimensions[size];

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        width: `${dim.width}px`,
        height: `${dim.height}px`,
        backgroundColor: checked ? '#34C759' : '#E5E5EA'
      }}
    >
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
        className="bg-white rounded-full shadow-sm"
        style={{
          width: `${dim.thumbSize}px`,
          height: `${dim.thumbSize}px`,
          marginLeft: checked ? `${dim.width - dim.thumbSize - 2}px` : '2px'
        }}
      />
    </button>
  );
}

/**
 * iOS-Style Segmented Control
 */
interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  fullWidth?: boolean;
}

export function SegmentedControl({
  segments,
  selectedIndex,
  onChange,
  fullWidth = false
}: SegmentedControlProps) {
  const handleSelect = (index: number) => {
    if (index !== selectedIndex) {
      haptics.selection();
      onChange(index);
    }
  };

  return (
    <div 
      className={`
        inline-flex bg-gray-100 rounded-[10px] p-1 gap-1
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {segments.map((segment, index) => (
        <button
          key={index}
          onClick={() => handleSelect(index)}
          className={`
            relative px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors
            ${fullWidth ? 'flex-1' : ''}
            ${selectedIndex === index ? 'text-[#003630]' : 'text-gray-600'}
          `}
        >
          {selectedIndex === index && (
            <motion.div
              layoutId="segmented-bg"
              className="absolute inset-0 bg-white rounded-[8px] shadow-sm"
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30
              }}
            />
          )}
          <span className="relative z-10">{segment}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * iOS-Style Picker Wheel (Simplified)
 */
interface IOSPickerProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  label?: string;
}

export function IOSPicker({
  options,
  selectedIndex,
  onChange,
  label
}: IOSPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (index: number) => {
    haptics.selection();
    onChange(index);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => {
          haptics.light();
          setIsOpen(!isOpen);
        }}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-[12px] transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            {label && (
              <div className="text-[13px] text-gray-500 mb-0.5">{label}</div>
            )}
            <div className="text-[15px] font-medium text-[#003630]">
              {options[selectedIndex]}
            </div>
          </div>
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[12px] shadow-2xl overflow-hidden z-50 border border-gray-100"
        >
          <div className="max-h-[240px] overflow-y-auto ios-scroll">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                className={`
                  w-full px-4 py-3 text-left transition-colors
                  ${index === selectedIndex 
                    ? 'bg-[#95e36c]/10 text-[#003630] font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                  ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px]">{option}</span>
                  {index === selectedIndex && (
                    <svg className="w-5 h-5 text-[#003630]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * iOS-Style Slider
 */
interface IOSSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
}

export function IOSSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true
}: IOSSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    haptics.selection();
    onChange(Number(e.target.value));
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="text-[15px] text-gray-700">{label}</label>
          )}
          {showValue && (
            <span className="text-[15px] font-medium text-[#003630]">{value}</span>
          )}
        </div>
      )}
      <div className="relative h-8 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="ios-slider"
          style={{
            background: `linear-gradient(to right, #95e36c 0%, #95e36c ${percentage}%, #E5E5EA ${percentage}%, #E5E5EA 100%)`
          }}
        />
      </div>
    </div>
  );
}

/**
 * iOS-Style Stepper
 */
interface IOSStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function IOSStepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1
}: IOSStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      haptics.light();
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      haptics.light();
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-[10px] overflow-hidden">
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className="px-4 py-2 text-[#003630] text-[20px] font-medium hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <div className="px-4 py-2 text-[15px] font-medium text-[#003630] min-w-[48px] text-center">
        {value}
      </div>
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className="px-4 py-2 text-[#003630] text-[20px] font-medium hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
    </div>
  );
}

/**
 * Add iOS Slider styles to globals.css
 */
export const iosSliderStyles = `
  .ios-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .ios-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    transition: transform 0.1s;
  }

  .ios-slider::-webkit-slider-thumb:active {
    transform: scale(1.1);
  }

  .ios-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    transition: transform 0.1s;
  }

  .ios-slider::-moz-range-thumb:active {
    transform: scale(1.1);
  }
`;
