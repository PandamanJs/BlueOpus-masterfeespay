import { motion } from "motion/react";
import svgPaths from "../imports/svg-b4tvwhugf4";
import { generateReceiptPDF } from "../utils/pdfGenerator";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { useState, useEffect, useRef, useMemo } from "react";
import { Download, Mail, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import LogoHeader from "./common/LogoHeader";

interface CheckoutService {
  id: string;
  description: string;
  amount: number;
  invoiceNo: string;
  studentName: string;
}

interface DownloadReceiptPageProps {
  totalAmount: number;
  schoolName: string;
  services?: CheckoutService[];
  onGoHome: () => void;
  parentName?: string;
}

// MasterFeesLogo component removed in favor of LogoHeader

export default function DownloadReceiptPage({
  totalAmount,
  schoolName,
  services,
  onGoHome,
  parentName
}: DownloadReceiptPageProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const hasDownloadedRef = useRef(false);

  // Memoize stable identifiers so they don't change on re-render
  const { refNumber, dateTime, scheduleId } = useMemo(() => {
    const now = new Date();
    return {
      refNumber: `000${Math.floor(Math.random() * 100000000)}`.slice(-12),
      dateTime: now.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      scheduleId: `#${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`
    };
  }, []);

  const handleDownloadReceipt = () => {
    try {
      generateReceiptPDF({
        schoolName,
        totalAmount,
        refNumber,
        dateTime,
        scheduleId,
        services,
        parentName
      });
      toast.success("Receipt downloaded successfully!");
      setShowShareMenu(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  useEffect(() => {
    if (!hasDownloadedRef.current) {
      hasDownloadedRef.current = true;
      // Auto-trigger the download shortly after page load
      setTimeout(() => {
        handleDownloadReceipt();
      }, 500);
    }
  }, []);

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Payment Receipt - ${schoolName}`);
    const body = encodeURIComponent(
      `Payment Receipt\n\n` +
      `School: ${schoolName}\n` +
      `Amount: K${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `Reference: ${refNumber}\n` +
      `Date: ${dateTime}\n` +
      `Status: Success\n\n` +
      `Thank you for using Master-Fees!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success("Opening email client...");
    setShowShareMenu(false);
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `✅ *Payment Successful*\n\n` +
      `School: ${schoolName}\n` +
      `Amount: K${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `Reference: ${refNumber}\n` +
      `Date: ${dateTime}\n\n` +
      `Paid via Master-Fees`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.success("Opening WhatsApp...");
    setShowShareMenu(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col">
      <LogoHeader />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[368px] flex flex-col gap-4">
          {/* Success Card */}
          <motion.div
            className="bg-gradient-to-br from-[#003630] to-[#004d45] rounded-[20px] shadow-[0px_12px_32px_rgba(0,54,48,0.3)] px-6 pt-6 pb-9 flex flex-col items-center gap-2 border-[1.5px] border-white/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Success Icon */}
            <motion.div
              className="overflow-clip relative size-[100px] shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
            >
              <div className="absolute inset-[12.5%]">
                <div className="absolute inset-[-4%]" style={{ "--stroke-0": "rgba(149, 227, 108, 1)" } as React.CSSProperties}>
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 81 81">
                    <motion.path
                      d={svgPaths.p3f23eb00}
                      stroke="var(--stroke-0, #95E36C)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="6"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.4,
                        ease: "easeInOut"
                      }}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            <p className="font-['Inter:Extra_Light',sans-serif] font-extralight leading-[24px] text-[16px] text-white tracking-[-0.16px]">
              Payment Success
            </p>
            <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] leading-[24px] text-[32px] text-white tracking-[-0.32px]">
              K{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </motion.div>

          {/* Payment Details Card */}
          <motion.div
            className="bg-white rounded-[20px] p-6 flex flex-col gap-2 border-[1.5px] border-[#e5e7eb] shadow-[0px_8px_24px_rgba(0,0,0,0.06)]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] leading-[24px] text-[#003630] text-[18px] tracking-[-0.3px] mb-3">
              Payment Details
            </p>

            {/* Ref Number */}
            <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
              <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[14px] text-[#6b7280] tracking-[-0.2px]">Ref Number</p>
              <p className="font-['IBM_Plex_Sans_Condensed:SemiBold',sans-serif] text-[14px] text-[#003630] tracking-[-0.2px]">{refNumber}</p>
            </div>

            {/* Payment Status */}
            <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
              <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[14px] text-[#6b7280] tracking-[-0.2px]">Payment Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#95e36c] rounded-full" />
                <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630] tracking-[-0.2px]">Success</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
              <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[14px] text-[#6b7280] tracking-[-0.2px]">Date & Time</p>
              <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630] tracking-[-0.2px]">{dateTime}</p>
            </div>

            {/* Parent/Guardian Name */}
            <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
              <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[14px] text-[#6b7280] tracking-[-0.2px]">Parent/Guardian</p>
              <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630] tracking-[-0.2px]">{parentName || 'Parent'}</p>
            </div>

            {/* Schedule ID */}
            <div className="flex justify-between items-center py-2">
              <p className="font-['IBM_Plex_Sans_Devanagari:Medium',sans-serif] text-[14px] text-[#6b7280] tracking-[-0.2px]">Schedule ID</p>
              <p className="font-['IBM_Plex_Sans_Condensed:SemiBold',sans-serif] text-[14px] text-[#003630] tracking-[-0.2px]">{scheduleId}</p>
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            className="flex flex-col gap-2 mt-2 relative"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Share Receipt Button */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="relative h-[59px] w-full rounded-[16px] overflow-hidden group"
              >
                {/* Background */}
                <div className="absolute inset-0 bg-[#003630] group-hover:bg-[#004d45] transition-colors" />

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                {/* Shadow */}
                <div className="absolute inset-0 shadow-[0px_6px_20px_rgba(0,54,48,0.25)] group-active:shadow-[0px_2px_8px_rgba(0,54,48,0.2)] transition-shadow" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center gap-[10px] h-full group-active:scale-[0.97] transition-transform">
                  <Share2 size={20} color="white" />
                  <p className="font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[18px] text-white tracking-[-0.3px]">
                    Share Receipt
                  </p>
                </div>
              </button>

              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-[16px] border-[1.5px] border-[#e5e7eb] shadow-[0px_12px_32px_rgba(0,0,0,0.15)] overflow-hidden z-20"
                >
                  {/* Email Option */}
                  <button
                    onClick={handleEmailShare}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#f9fafb] transition-colors border-b border-[#f3f4f6]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#003630]/10 flex items-center justify-center">
                      <Mail size={20} className="text-[#003630]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">
                        Email
                      </p>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[12px] text-gray-500">
                        Share via email
                      </p>
                    </div>
                  </button>

                  {/* WhatsApp Option */}
                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#f9fafb] transition-colors border-b border-[#f3f4f6]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                      <MessageCircle size={20} className="text-[#25D366]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">
                        WhatsApp
                      </p>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[12px] text-gray-500">
                        Share via WhatsApp
                      </p>
                    </div>
                  </button>

                  {/* Download Option */}
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#f9fafb] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#95e36c]/20 flex items-center justify-center">
                      <Download size={20} className="text-[#003630]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[14px] text-[#003630]">
                        Download PDF
                      </p>
                      <p className="font-['IBM_Plex_Sans_Devanagari:Regular',sans-serif] text-[12px] text-gray-500">
                        Save to device
                      </p>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Go to Homepage Button */}
            <button
              onClick={onGoHome}
              className="relative h-[60px] rounded-[16px] border-[1.5px] border-[#e5e7eb] overflow-hidden group"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-white group-hover:bg-[#f9fafb] transition-colors" />

              {/* Shadow */}
              <div className="absolute inset-0 shadow-sm group-hover:shadow-md group-active:shadow-sm transition-shadow" />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-center gap-[10px] h-full group-active:scale-[0.97] transition-transform">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.25 9H15.75M9 2.25L15.75 9L9 15.75" stroke="#003630" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-['IBM_Plex_Sans_Devanagari:SemiBold',sans-serif] text-[16px] text-[#003630] tracking-[-0.2px]">
                  Go to homepage
                </p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
