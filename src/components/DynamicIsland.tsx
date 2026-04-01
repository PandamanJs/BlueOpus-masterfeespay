/**
 * Dynamic Island Component - Universal Notification System
 * iOS 16+ style notification pill for all app notifications
 */

import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  CreditCard,
  X,
  Info,
  AlertTriangle,
  Bell,
  Trash2,
  Download,
  Upload,
  Save,
  Share2,
  Copy,
  type LucideIcon
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export type NotificationType =
  | 'idle'
  | 'processing'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'payment'
  | 'delete'
  | 'download'
  | 'upload'
  | 'save'
  | 'share'
  | 'copy';

export interface DynamicIslandData {
  type: NotificationType;
  title?: string;
  subtitle?: string;
  message?: string;
  amount?: string;
  school?: string;
  progress?: number; // 0-100
  autoHide?: number; // milliseconds (default: 4000 for success/error, never for processing)
  customIcon?: LucideIcon;
}

interface DynamicIslandProps {
  data: DynamicIslandData;
  onDismiss?: () => void;
  expanded?: boolean;
}

export default function DynamicIsland({ data, onDismiss, expanded = false }: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    if (data.type !== 'idle') {
      setIsExpanded(true);

      // Auto-hide for non-processing states
      if (data.type !== 'processing') {
        setTimeout(() => setIsExpanded(false), 3000);

        const hideDelay = data.autoHide ?? 4000; // Default 4 seconds
        setTimeout(() => {
          setShouldShow(false);
          onDismiss?.();
        }, hideDelay);
      }
    }
  }, [data.type, data.autoHide, onDismiss]);

  const getIcon = () => {
    if (data.customIcon) {
      const CustomIcon = data.customIcon;
      return <CustomIcon className="w-5 h-5 text-white" />;
    }

    switch (data.type) {
      case 'processing':
        return <Loader2 className="w-5 h-5 text-white animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-white" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      case 'info':
        return <Info className="w-5 h-5 text-white" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-white" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-white" />;
      case 'download':
        return <Download className="w-5 h-5 text-white" />;
      case 'upload':
        return <Upload className="w-5 h-5 text-white" />;
      case 'save':
        return <Save className="w-5 h-5 text-white" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-white" />;
      case 'copy':
        return <Copy className="w-5 h-5 text-white" />;
      default:
        return <Bell className="w-5 h-5 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (data.type) {
      case 'processing':
      case 'payment':
      case 'upload':
      case 'download':
        return 'bg-gradient-to-r from-[#003630] to-[#004d40]';
      case 'success':
      case 'save':
      case 'share':
      case 'copy':
        return 'bg-gradient-to-r from-[#95e36c] to-[#6bc043]';
      case 'error':
      case 'delete':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default:
        return 'bg-black';
    }
  };

  const getDefaultTitle = () => {
    if (data.title) return data.title;

    switch (data.type) {
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      case 'payment':
        return 'Processing Payment';
      case 'delete':
        return 'Deleted';
      case 'download':
        return 'Downloaded';
      case 'upload':
        return 'Uploaded';
      case 'save':
        return 'Saved';
      case 'share':
        return 'Shared';
      case 'copy':
        return 'Copied';
      default:
        return 'Notification';
    }
  };

  if (!shouldShow || data.type === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 8px)'
        }}
      >
        <motion.div
          layout
          initial={false}
          animate={{
            width: isExpanded ? '90%' : '150px',
            height: isExpanded ? 'auto' : '37px',
            borderRadius: isExpanded ? '20px' : '18px',
            maxWidth: '420px'
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
          onClick={() => !isExpanded && setIsExpanded(true)}
          className={`
            ${getBackgroundColor()}
            shadow-2xl backdrop-blur-xl
            pointer-events-auto cursor-pointer
            relative overflow-hidden
          `}
        >
          {/* Compact Mode */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full gap-2 px-4"
              >
                {getIcon()}
                {data.type === 'processing' && (
                  <div className="flex gap-1">
                    <motion.div
                      className="w-1 h-1 bg-white rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    />
                    <motion.div
                      className="w-1 h-1 bg-white rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-1 h-1 bg-white rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Mode */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-[15px] mb-0.5">
                        {getDefaultTitle()}
                      </div>
                      {data.subtitle && (
                        <div className="text-white/80 text-[13px] mb-1">
                          {data.subtitle}
                        </div>
                      )}
                      {data.message && (
                        <div className="text-white/70 text-[13px] mb-1">
                          {data.message}
                        </div>
                      )}
                      {data.school && (
                        <div className="text-white/70 text-[12px]">
                          {data.school}
                        </div>
                      )}
                      {data.amount && (
                        <div className="text-white text-[17px] font-semibold mt-1">
                          {data.amount}
                        </div>
                      )}
                    </div>
                  </div>

                  {data.type !== 'processing' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShouldShow(false);
                        onDismiss?.();
                      }}
                      className="text-white/60 hover:text-white/90 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {data.type === 'processing' && data.progress !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
                  >
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${data.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * useDynamicIsland Hook
 * Hook to control Dynamic Island notifications from any component
 */
interface NotificationOptions {
  title?: string;
  subtitle?: string;
  message?: string;
  amount?: string;
  school?: string;
  progress?: number;
  autoHide?: number;
  customIcon?: LucideIcon;
}

export function useDynamicIsland() {
  const [islandData, setIslandData] = useState<DynamicIslandData>({ type: 'idle' });

  const show = useCallback((type: NotificationType, options: NotificationOptions = {}) => {
    setIslandData({
      type,
      title: options.title,
      subtitle: options.subtitle,
      message: options.message,
      amount: options.amount,
      school: options.school,
      progress: options.progress,
      autoHide: options.autoHide,
      customIcon: options.customIcon,
    });
  }, []);

  const success = useCallback((options: NotificationOptions = {}) => {
    show('success', {
      title: options.title || 'Success!',
      ...options,
    });
  }, [show]);

  const error = useCallback((options: NotificationOptions = {}) => {
    show('error', {
      title: options.title || 'Error',
      ...options,
    });
  }, [show]);

  const warning = useCallback((options: NotificationOptions = {}) => {
    show('warning', {
      title: options.title || 'Warning',
      ...options,
    });
  }, [show]);

  const info = useCallback((options: NotificationOptions = {}) => {
    show('info', {
      title: options.title || 'Info',
      ...options,
    });
  }, [show]);

  const showProcessing = useCallback((options: NotificationOptions = {}) => {
    show('processing', {
      title: options.title || 'Processing',
      ...options,
      autoHide: undefined, // Don't auto-hide processing notifications
    });
  }, [show]);

  const showSuccess = useCallback((options: NotificationOptions = {}) => {
    success(options);
  }, [success]);

  const showError = useCallback((options: NotificationOptions = {}) => {
    error(options);
  }, [error]);

  const showPayment = useCallback((options: NotificationOptions = {}) => {
    show('payment', {
      title: options.title || 'Processing Payment',
      ...options,
      autoHide: undefined,
    });
  }, [show]);

  const saved = useCallback((message: string = 'Changes saved successfully') => {
    show('save', {
      title: 'Saved',
      subtitle: message,
      autoHide: 3000,
    });
  }, [show]);

  const copied = useCallback((message: string = 'Copied to clipboard') => {
    show('copy', {
      title: 'Copied',
      subtitle: message,
      autoHide: 2500,
    });
  }, [show]);

  const shared = useCallback((message: string = 'Shared successfully') => {
    show('share', {
      title: 'Shared',
      subtitle: message,
      autoHide: 3000,
    });
  }, [show]);

  const deleted = useCallback((message: string = 'Deleted successfully') => {
    show('delete', {
      title: 'Deleted',
      subtitle: message,
      autoHide: 3000,
    });
  }, [show]);

  const downloaded = useCallback((message: string = 'Downloaded successfully') => {
    show('download', {
      title: 'Downloaded',
      subtitle: message,
      autoHide: 3000,
    });
  }, [show]);

  const uploaded = useCallback((message: string = 'Uploaded successfully') => {
    show('upload', {
      title: 'Uploaded',
      subtitle: message,
      autoHide: 3000,
    });
  }, [show]);

  const hide = useCallback(() => {
    setIslandData({ type: 'idle' });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setIslandData(prev => ({
      ...prev,
      progress,
    }));
  }, []);

  return {
    islandData,
    show,
    success,
    error,
    warning,
    info,
    showProcessing,
    showSuccess,
    showError,
    showPayment,
    saved,
    copied,
    shared,
    deleted,
    downloaded,
    uploaded,
    hide,
    updateProgress,
  };
}
