/**
 * iOS Share Sheet Component
 * Native iOS-style share menu for receipts
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Share2, 
  Mail, 
  MessageCircle, 
  Download, 
  Printer, 
  Copy,
  X,
  FileText,
  Send
} from "lucide-react";
import { haptics } from "../utils/haptics";
import { toast } from "sonner";

export interface ShareData {
  title: string;
  description?: string;
  data: any;
}

interface IOSShareSheetProps {
  isVisible: boolean;
  onClose: () => void;
  shareData?: ShareData;
  receiptId?: string;
  amount?: string;
  school?: string;
  dynamicIsland?: any; // Optional - for showing notifications
}

interface ShareAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  gradient?: string;
  action: () => void;
}

export default function IOSShareSheet({
  isVisible,
  onClose,
  shareData,
  receiptId,
  amount,
  school,
  dynamicIsland
}: IOSShareSheetProps) {
  
  const handleShare = (method: string) => {
    haptics.light();
    
    switch (method) {
      case 'email':
        dynamicIsland?.info({ subtitle: 'Opening email client...' });
        // Simulate email share
        setTimeout(() => {
          dynamicIsland?.shared('Receipt shared via email');
          onClose();
        }, 1000);
        break;
      
      case 'message':
        dynamicIsland?.info({ subtitle: 'Opening messages...' });
        setTimeout(() => {
          dynamicIsland?.shared('Receipt shared via SMS');
          onClose();
        }, 1000);
        break;
      
      case 'download':
        dynamicIsland?.showProcessing({ title: 'Downloading', subtitle: 'Preparing receipt...' });
        setTimeout(() => {
          dynamicIsland?.downloaded('Receipt downloaded successfully');
          onClose();
        }, 1000);
        break;
      
      case 'print':
        dynamicIsland?.info({ subtitle: 'Preparing to print...' });
        setTimeout(() => {
          dynamicIsland?.success({ subtitle: 'Receipt sent to printer' });
          onClose();
        }, 1000);
        break;
      
      case 'copy':
        const copyText = `Payment Receipt\n${school}\nAmount: ${amount}\nReceipt ID: ${receiptId}`;
        navigator.clipboard.writeText(copyText);
        haptics.success();
        dynamicIsland?.copied('Receipt details copied to clipboard');
        onClose();
        break;
      
      case 'whatsapp':
        dynamicIsland?.info({ subtitle: 'Opening WhatsApp...' });
        setTimeout(() => {
          dynamicIsland?.shared('Receipt shared via WhatsApp');
          onClose();
        }, 1000);
        break;
    }
  };

  const shareActions: ShareAction[] = [
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      color: '#007AFF',
      gradient: 'from-blue-500 to-blue-600',
      action: () => handleShare('email')
    },
    {
      id: 'message',
      label: 'Message',
      icon: MessageCircle,
      color: '#34C759',
      gradient: 'from-green-500 to-green-600',
      action: () => handleShare('message')
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: Send,
      color: '#25D366',
      gradient: 'from-[#25D366] to-[#1da851]',
      action: () => handleShare('whatsapp')
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      color: '#5856D6',
      gradient: 'from-purple-500 to-purple-600',
      action: () => handleShare('copy')
    }
  ];

  const actions: ShareAction[] = [
    {
      id: 'download',
      label: 'Download PDF',
      icon: Download,
      color: '#FF9500',
      gradient: 'from-orange-500 to-orange-600',
      action: () => handleShare('download')
    },
    {
      id: 'print',
      label: 'Print',
      icon: Printer,
      color: '#FF3B30',
      gradient: 'from-red-500 to-red-600',
      action: () => handleShare('print')
    }
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />

        {/* Share Sheet */}
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
          className="relative w-full sm:w-[480px] bg-white/95 backdrop-blur-xl rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden"
          style={{
            maxHeight: '85vh',
            marginBottom: 'max(env(safe-area-inset-bottom), 0px)'
          }}
        >
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-9 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-[#003630] mb-1">
                  {shareData?.title || 'Share Receipt'}
                </h3>
                {shareData?.description && (
                  <p className="text-[13px] text-gray-500">
                    {shareData.description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Receipt Preview Card */}
          {receiptId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-6 my-4 p-4 bg-gradient-to-br from-[#003630] to-[#004d40] rounded-[16px] text-white shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-[12px] flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] opacity-80 mb-1">Payment Receipt</div>
                  <div className="text-[17px] font-semibold mb-1">{amount}</div>
                  <div className="text-[13px] opacity-70 truncate">{school}</div>
                  <div className="text-[11px] opacity-60 mt-1">ID: {receiptId}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Share Options Grid */}
          <div className="px-6 py-4">
            <div className="text-[13px] text-gray-500 uppercase tracking-wider mb-3">
              Share via
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {shareActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                  whileTap={{ scale: 0.9 }}
                  onClick={action.action}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-[16px] flex items-center justify-center shadow-lg active:shadow-md transition-shadow`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[12px] text-gray-700 text-center">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Actions List */}
            <div className="text-[13px] text-gray-500 uppercase tracking-wider mb-3">
              Actions
            </div>
            <div className="space-y-2 mb-4">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + (0.05 * index) }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.action}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-[14px] transition-colors"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-[12px] flex items-center justify-center shadow-md`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[15px] font-medium text-[#003630]">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Cancel Button */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-[14px] font-medium text-[15px] text-[#003630] transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
