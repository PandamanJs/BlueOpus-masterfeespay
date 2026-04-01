/**
 * useDynamicIsland Hook
 * Universal notification system using Dynamic Island
 * Use this hook to show notifications from any component
 */

import { useCallback } from 'react';
import { DynamicIslandData, NotificationType } from '../components/DynamicIsland';
import { LucideIcon } from 'lucide-react';

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

export interface DynamicIslandHook {
  show: (type: NotificationType, options?: NotificationOptions) => void;
  success: (message: string, options?: Omit<NotificationOptions, 'title'>) => void;
  error: (message: string, options?: Omit<NotificationOptions, 'title'>) => void;
  warning: (message: string, options?: Omit<NotificationOptions, 'title'>) => void;
  info: (message: string, options?: Omit<NotificationOptions, 'title'>) => void;
  processing: (message: string, options?: Omit<NotificationOptions, 'title'>) => void;
  payment: (amount: string, school: string, options?: NotificationOptions) => void;
  saved: (message?: string) => void;
  copied: (message?: string) => void;
  shared: (message?: string) => void;
  deleted: (message?: string) => void;
  downloaded: (message?: string) => void;
  uploaded: (message?: string) => void;
  hide: () => void;
  updateProgress: (progress: number) => void;
}

export function useDynamicIsland(
  setIslandData: (data: DynamicIslandData) => void
): DynamicIslandHook {
  
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
  }, [setIslandData]);

  const success = useCallback((message: string, options: Omit<NotificationOptions, 'title'> = {}) => {
    show('success', {
      ...options,
      title: 'Success!',
      subtitle: message,
    });
  }, [show]);

  const error = useCallback((message: string, options: Omit<NotificationOptions, 'title'> = {}) => {
    show('error', {
      ...options,
      title: 'Error',
      subtitle: message,
    });
  }, [show]);

  const warning = useCallback((message: string, options: Omit<NotificationOptions, 'title'> = {}) => {
    show('warning', {
      ...options,
      title: 'Warning',
      subtitle: message,
    });
  }, [show]);

  const info = useCallback((message: string, options: Omit<NotificationOptions, 'title'> = {}) => {
    show('info', {
      ...options,
      title: 'Info',
      subtitle: message,
    });
  }, [show]);

  const processing = useCallback((message: string, options: Omit<NotificationOptions, 'title'> = {}) => {
    show('processing', {
      ...options,
      title: 'Processing',
      subtitle: message,
      autoHide: undefined, // Don't auto-hide processing notifications
    });
  }, [show]);

  const payment = useCallback((amount: string, school: string, options: NotificationOptions = {}) => {
    show('payment', {
      ...options,
      title: 'Processing Payment',
      amount,
      school,
      autoHide: undefined, // Don't auto-hide until payment completes
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
  }, [setIslandData]);

  const updateProgress = useCallback((progress: number) => {
    setIslandData(prev => ({
      ...prev,
      progress,
    }));
  }, [setIslandData]);

  return {
    show,
    success,
    error,
    warning,
    info,
    processing,
    payment,
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
