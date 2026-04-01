/**
 * Apple Pay Style Card Animation
 * 3D card flip and payment confirmation UI
 */

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, CreditCard, Lock } from "lucide-react";
import { useState, useEffect } from "react";

interface ApplePayCardProps {
  isVisible: boolean;
  amount: string;
  school: string;
  studentName: string;
  services: string[];
  onConfirm: () => void;
  onCancel: () => void;
  processing?: boolean;
  success?: boolean;
}

export default function ApplePayCard({
  isVisible,
  amount,
  school,
  studentName,
  services,
  onConfirm,
  onCancel,
  processing = false,
  success = false
}: ApplePayCardProps) {
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      setCardFlipped(true);
      setTimeout(() => setShowSuccess(true), 300);
    }
  }, [success]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={!processing ? onCancel : undefined}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:w-[400px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden"
          style={{
            maxHeight: '90vh',
            marginBottom: 'max(env(safe-area-inset-bottom), 0px)'
          }}
        >
          {/* Card Container with 3D Flip */}
          <div className="relative" style={{ perspective: '1000px' }}>
            <motion.div
              animate={{ rotateY: cardFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative"
            >
              {/* Front of Card - Payment Details */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CreditCard className="w-6 h-6 text-[#003630]" />
                    <h2 className="text-[17px] font-semibold text-[#003630]">
                      Confirm Payment
                    </h2>
                  </div>
                  <div className="text-center text-gray-500 text-[13px]">
                    Review your payment details
                  </div>
                </div>

                {/* Payment Amount - Hero */}
                <div className="px-6 py-8 bg-gradient-to-br from-[#003630] to-[#004d40] text-white text-center">
                  <div className="text-[13px] opacity-80 mb-2">Total Amount</div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-[44px] font-semibold tracking-tight"
                  >
                    {amount}
                  </motion.div>
                </div>

                {/* Details */}
                <div className="px-6 py-4 space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[15px] text-gray-600">School</span>
                    <span className="text-[15px] font-medium text-[#003630]">{school}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[15px] text-gray-600">Student</span>
                    <span className="text-[15px] font-medium text-[#003630]">{studentName}</span>
                  </div>
                  <div className="py-2">
                    <div className="text-[15px] text-gray-600 mb-2">Services</div>
                    <div className="flex flex-wrap gap-2">
                      {services.map((service, index) => (
                        <motion.span
                          key={index}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="px-3 py-1.5 bg-[#95e36c]/10 text-[#003630] rounded-full text-[13px] font-medium"
                        >
                          {service}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="px-6 py-3 bg-gray-50 flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[12px] text-gray-500">
                    Secured by 256-bit encryption
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="p-4 space-y-2">
                  <motion.button
                    whileTap={{ scale: processing ? 1 : 0.98 }}
                    onClick={onConfirm}
                    disabled={processing}
                    className={`
                      w-full py-4 rounded-[14px] font-semibold text-[17px]
                      transition-all duration-200
                      ${processing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#003630] text-white active:bg-[#002820] shadow-lg shadow-[#003630]/20'
                      }
                    `}
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full"
                        />
                        Processing...
                      </span>
                    ) : (
                      'Pay with Master-Fees'
                    )}
                  </motion.button>
                  
                  <button
                    onClick={onCancel}
                    disabled={processing}
                    className="w-full py-3.5 text-[#003630] font-medium text-[15px] transition-colors hover:bg-gray-50 rounded-[14px] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Back of Card - Success State */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }}
                className="bg-white"
              >
                <div className="px-6 py-12 flex flex-col items-center justify-center min-h-[400px]">
                  <AnimatePresence>
                    {showSuccess && (
                      <>
                        {/* Success Checkmark Animation */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                          className="mb-6"
                        >
                          <div className="w-24 h-24 bg-gradient-to-br from-[#95e36c] to-[#6bc043] rounded-full flex items-center justify-center shadow-2xl">
                            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <h3 className="text-[24px] font-semibold text-[#003630] mb-2">
                            Payment Successful!
                          </h3>
                          <p className="text-[15px] text-gray-600 mb-1">
                            {amount} paid to {school}
                          </p>
                          <p className="text-[13px] text-gray-500">
                            Receipt sent to your email
                          </p>
                        </motion.div>

                        {/* Confetti Effect */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ y: -20, x: Math.random() * 400, opacity: 1 }}
                              animate={{ y: 400, opacity: 0 }}
                              transition={{
                                duration: 2 + Math.random(),
                                delay: Math.random() * 0.5,
                                ease: "linear"
                              }}
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: i % 2 === 0 ? '#95e36c' : '#003630'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
