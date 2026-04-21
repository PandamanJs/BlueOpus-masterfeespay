import { motion } from "motion/react";
import svgPaths from "../imports/svg-b4tvwhugf4";
import { generateReceiptPDF } from "../utils/pdfGenerator";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { useState, useEffect, useRef, useMemo } from "react";
import { Download, Mail, MessageCircle, Share2, ArrowLeft, CheckCircle2 } from "lucide-react";
import LogoHeader from "./common/LogoHeader";

interface CheckoutService {
  id: string;
  description: string;
  amount: number;
  invoiceNo: string;
  studentName: string;
  studentId?: string;
  grade?: string;
}

interface DownloadReceiptPageProps {
  totalAmount: number;
  schoolName: string;
  schoolLogo?: string | null;
  services?: CheckoutService[];
  onGoHome: () => void;
  parentName?: string;
  admissionNumber?: string;
  grade?: string;
}

// MasterFeesLogo component removed in favor of LogoHeader

import { ModernReceipt } from "./common/ModernReceipt";

export default function DownloadReceiptPage({
  totalAmount,
  schoolName,
  schoolLogo,
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
      refNumber: `RCP-${Math.floor(Math.random() * 100000000)}`.slice(-12),
      dateTime: now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
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
        parentName,
        schoolLogo,
        admissionNumber: (services && services[0]?.studentId) || '',
        grade: (services && services[0]?.grade) || ''
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
      }, 800);
    }
  }, []);

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Payment Receipt - ${schoolName}`);
    const body = encodeURIComponent(
      `Payment Receipt\n\n` +
      `School: ${schoolName}\n` +
      `Amount: K${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `Reference: ${refNumber}\n` +
      `Date: ${dateTime}\n\n` +
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

  // Mock items for the preview
  const previewItems = services?.map(s => ({
    studentName: s.studentName,
    details: s.description,
    qty: 1,
    unitPrice: s.amount,
    total: s.amount,
    amtPaid: totalAmount >= (services?.reduce((acc, curr) => acc + curr.amount, 0) || 0) ? s.amount : Math.min(s.amount, totalAmount / (services?.length || 1)), // Simple proportional distribution for preview
    balance: Math.max(0, s.amount - (totalAmount >= (services?.reduce((acc, curr) => acc + curr.amount, 0) || 0) ? s.amount : Math.min(s.amount, totalAmount / (services?.length || 1))))
  })) || [
    {
        studentName: 'Student Name',
        details: 'Term 1 School Fees',
        qty: 1,
        unitPrice: totalAmount,
        total: totalAmount,
        amtPaid: totalAmount,
        balance: 0
    }
  ];

  const totalCharged = previewItems.reduce((acc, curr) => acc + curr.total, 0);
  const totalBalance = previewItems.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="bg-gradient-to-br from-[#f9fafb] via-white to-[#f5f7f9] min-h-screen flex flex-col">
      <LogoHeader />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-[368px] flex flex-col gap-6">
          {/* Success Header */}
          <div className="flex flex-col items-center gap-1">
             <div className="size-14 rounded-full bg-[#95e36c]/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="text-[#003630]" size={32} />
             </div>
             <h1 className="text-[24px] font-bold text-[#003630] font-['Space_Grotesk']">Payment Successful</h1>
             <p className="text-[14px] text-gray-500 font-medium font-['Space_Grotesk']">Ref: {refNumber}</p>
          </div>

          {/* Receipt Preview - Scaled to fit mobile width */}
          <div className="w-full overflow-hidden rounded-[24px] border border-gray-100 shadow-2xl bg-white flex justify-center py-2 relative">
             <div className="scale-[0.55] origin-top -mb-[420px]">
                <ModernReceipt 
                   schoolName={schoolName}
                   schoolLogo={schoolLogo}
                   receiptNo={refNumber}
                   date={dateTime}
                   paymentRef={refNumber}
                   paymentMethod="Mobile Money"
                   billedTo={parentName || 'Parent'}
                   grade={services?.[0]?.grade || (services?.[0] as any)?.class || 'N/A'}
                   studentId={services?.[0]?.studentId || services?.[0]?.id || 'N/A'}
                   items={previewItems}
                   totalFeesCharged={totalCharged}
                   amountPaid={totalAmount}
                   balanceOwing={totalBalance}
                   nextPaymentDate="30/05/2026"
                   statusBadge={totalAmount >= totalCharged ? 'Paid' : 'Partly Paid'}
                />
             </div>
          </div>          {/* Buttons Area */}
          <motion.div
            className="flex flex-col gap-3 mt-4 relative"
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
