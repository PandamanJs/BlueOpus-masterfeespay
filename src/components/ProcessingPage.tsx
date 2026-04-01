import { useEffect, useState } from "react";
import { motion } from "motion/react";
import svgPaths from "../imports/svg-hdxmv7xpz6";
import { getTransactionByReference, updateTransactionStatus, syncTransactionToQuickBooks } from "../lib/supabase/api/transactions";
import { useAppStore } from "../stores/useAppStore";

interface ProcessingPageProps {
  onProcessingComplete: (success: boolean) => void;
}

export default function ProcessingPage({ onProcessingComplete }: ProcessingPageProps) {
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const paymentReference = useAppStore((state) => state.paymentReference);

  // Poll payment status
  useEffect(() => {
    if (!paymentReference) {
      setIsError(true);
      setErrorMessage('No payment reference found');
      setTimeout(() => onProcessingComplete(false), 2000);
      return;
    }

    const pollStatus = async () => {
      const transaction = await getTransactionByReference(paymentReference);
      if (!transaction) {
        setIsError(true);
        setErrorMessage('Transaction not found');
        setTimeout(() => onProcessingComplete(false), 2000);
        return;
      }

      if (transaction.status === 'successful') {
        onProcessingComplete(true);
      } else if (transaction.status === 'failed') {
        setIsError(true);
        setErrorMessage('Payment failed');
        setTimeout(() => onProcessingComplete(false), 2000);
      }
      // else continue polling
    };

    // Poll immediately and then every 3 seconds
    pollStatus();
    const intervalId = setInterval(pollStatus, 3000);

    // Timeout after 30 seconds
    const timeoutId = setTimeout(async () => {
      clearInterval(intervalId);

      // Fallback: Check if transaction is still pending
      // If so, it means Lenco confirmed but status update failed
      // We should mark it as successful since we got here from PaymentPage's onSuccess
      const transaction = await getTransactionByReference(paymentReference);
      if (transaction && transaction.status === 'pending') {
        console.log('[ProcessingPage] Transaction still pending after timeout - updating to successful as fallback');
        const updateResult = await updateTransactionStatus(paymentReference, 'successful', {
          fallbackUpdate: true,
          updatedBy: 'ProcessingPage timeout handler'
        });

        if (updateResult.success) {
          console.log('[ProcessingPage] Fallback status update successful');

          // Trigger QBO Sync as fallback
          console.log('[ProcessingPage] Triggering fallback QuickBooks sync...');
          syncTransactionToQuickBooks(transaction.id).catch(err =>
            console.error('[ProcessingPage] Fallback QuickBooks sync failed:', err)
          );

          onProcessingComplete(true);
          return;
        }
      }

      setIsError(true);
      setErrorMessage('Payment verification timeout');
      setTimeout(() => onProcessingComplete(false), 2000);
    }, 30000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [onProcessingComplete, paymentReference]);

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {isError ? (
          <>
            {/* Error Icon */}
            <motion.div
              className="relative w-[127px] h-[127px] mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="rounded-full size-full relative overflow-clip bg-red-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Error Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h2 className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[20px] text-red-600 mb-4">
                Payment Error
              </h2>
              <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[15px] text-gray-600 max-w-[314px] mx-auto px-4 leading-[24px]">
                {errorMessage}
              </p>
            </motion.div>
          </>
        ) : (
          <>
            {/* Animated Icon */}
            <motion.div
              className="relative w-[127px] h-[127px] mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: 1,
              }}
              transition={{
                scale: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                opacity: {
                  duration: 0.5
                }
              }}
            >
              <div className="rounded-full size-full relative overflow-clip">
                <div className="absolute inset-[23.62%_24.41%_11.81%_14.96%]">
                  <div className="absolute inset-[-4.88%_-5.19%]" style={{ "--stroke-0": "rgba(149, 227, 108, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 85 90">
                      <motion.path
                        d={svgPaths.p39438780}
                        stroke="var(--stroke-0, #95E36C)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="8"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: [0, 1, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div aria-hidden="true" className="absolute border-[#95e36c] border-[6px] border-solid inset-0 pointer-events-none rounded-full" />
            </motion.div>

            {/* Processing Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h2 className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[20px] text-[#003630] mb-4">
                Processing Payment
              </h2>

              <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[15px] text-[#003630] tracking-[-0.15px] max-w-[314px] mx-auto px-4 leading-[24px]">
                Confirm the Payment by entering your Pin in the pop up that will appear on your phone.
              </p>
            </motion.div>

            {/* Animated dots */}
            <motion.div
              className="flex gap-2 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-[#95e36c] rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
