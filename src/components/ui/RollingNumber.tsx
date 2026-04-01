import { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

interface RollingNumberProps {
    value: number;
    className?: string;
    currency?: string;
}

export default function RollingNumber({ value, className, currency }: RollingNumberProps) {
    const springValue = useSpring(0, {
        mass: 0.8,
        stiffness: 75,
        damping: 15,
    });

    const displayValue = useTransform(springValue, (current) => {
        return current.toLocaleString('en-ZM', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    });

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    return (
        <div className={`flex items-baseline justify-center gap-1.5 ${className}`}>
            {currency && <span className="text-[0.55em] font-black opacity-80 select-none mr-0.5">{currency}</span>}
            <motion.span className="inline-block tabular-nums font-black leading-none">
                {displayValue}
            </motion.span>
        </div>
    );
}
