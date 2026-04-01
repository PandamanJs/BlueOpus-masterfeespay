import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DigitProps {
  digit: string;
  index: number;
  totalDigits: number;
}

const Digit: React.FC<DigitProps> = ({ digit, index, totalDigits }) => {
  return (
    <div className="relative h-[1em] w-[0.55em] sm:w-[0.6em] overflow-hidden inline-flex items-center justify-center leading-none">
      <AnimatePresence initial={false}>
        <motion.span
          key={digit}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
            delay: (totalDigits - index) * 0.02,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
      {/* Invisible placeholder to maintain width */}
      <span className="invisible opacity-0 select-none">8</span>
    </div>
  );
};

interface CountingNumberProps {
  value: string;
}

export default function CountingNumber({ value }: CountingNumberProps) {
  const [displayValue, setDisplayValue] = useState<string | null>(null);

  useEffect(() => {
    // Small timeout to ensure it triggers after page mount/layout
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  if (displayValue === null) {
    return <span className="opacity-0">0</span>;
  }

  const characters = displayValue.split("");
  const numericCount = characters.filter((char) => !isNaN(parseInt(char))).length;
  let currentNumericIndex = 0;

  return (
    <span className="inline-flex items-baseline overflow-hidden">
      {characters.map((char, index) => {
        const isNumeric = !isNaN(parseInt(char));
        if (!isNumeric) {
          return (
            <span
              key={`${index}-${char}`}
              className="opacity-30 tracking-normal mx-[0.25px]"
            >
              {char}
            </span>
          );
        }

        currentNumericIndex++;
        return (
          <Digit
            key={`${index}-${char}`}
            digit={char}
            index={currentNumericIndex}
            totalDigits={numericCount}
          />
        );
      })}
    </span>
  );
}
