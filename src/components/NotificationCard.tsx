import React from 'react';
import { motion } from 'motion/react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'sonner';

export const NotificationCard: React.FC = () => {
    const { isSubscribed, isLoading, subscribe, unsubscribe, permission } = usePushNotifications();

    // Hide if push notifications are not supported
    if (typeof window !== 'undefined' && (!('serviceWorker' in navigator) || !('PushManager' in window))) {
        return null;
    }

    const handleToggle = async () => {
        try {
            if (isSubscribed) {
                await unsubscribe();
                toast.success('Reminders disabled');
            } else {
                await subscribe();
                toast.success('Reminders enabled! You will receive payment alerts.');
            }
        } catch (error: any) {
            if (error.message === 'Notification permission denied') {
                toast.error('Please enable notifications in your browser settings');
            } else {
                toast.error('Failed to update reminder settings');
            }
        }
    };

    if (permission === 'denied' && !isSubscribed) {
        return (
            <div className="mx-4 mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <BellOff size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="text-[14px] font-bold text-red-900">Notifications Blocked</h4>
                    <p className="text-[12px] text-red-700">Please enable notifications in your browser to receive payment reminders.</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-6 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm"
        >
            <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${isSubscribed ? 'bg-[#95e36c]/10 text-[#003630]' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {isSubscribed ? <Bell size={24} /> : <BellOff size={24} />}
                    </div>
                    <div className="flex flex-col">
                        <h4 className="text-[15px] font-bold text-[#1c1c1e]">Payment Reminders</h4>
                        <p className="text-[12px] text-[#8e8e93]">
                            {isSubscribed
                                ? 'We will alert you 3 days before fees are due'
                                : 'Get notified when school fees are due'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isSubscribed ? 'bg-[#95e36c]' : 'bg-gray-200'
                        }`}
                >
                    <span className="sr-only">Toggle reminders</span>
                    <span
                        className={`${isSubscribed ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-5 w-5 transform rounded-full bg-white transition-transform flex items-center justify-center shadow-sm`}
                    >
                        {isLoading && <Loader2 size={12} className="animate-spin text-[#95e36c]" />}
                    </span>
                </button>
            </div>

            {isSubscribed && (
                <div className="bg-[#f0fdf4] px-4 py-2 border-t border-[#dcfce7]">
                    <p className="text-[10px] font-medium text-[#166534] uppercase tracking-wider">
                        Active on this device
                    </p>
                </div>
            )}
        </motion.div>
    );
};
