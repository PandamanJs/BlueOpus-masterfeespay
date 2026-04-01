import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UpdateNotification Component
 * 
 * Detects when a new version of the app is available and prompts
 * the user to refresh to get the latest updates.
 * 
 * Works by:
 * 1. Checking a version endpoint periodically
 * 2. Comparing with stored version in localStorage
 * 3. Showing a prominent update banner when mismatch detected
 * 4. Forcing a hard reload to bypass PWA cache
 */

const CURRENT_VERSION = '1.0.0'; // Update this with each deployment
const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds

export function UpdateNotification() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Check version on mount
        checkForUpdates();

        // Set up periodic version checks
        const interval = setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);

        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setUpdateAvailable(true);
            });
        }

        return () => clearInterval(interval);
    }, []);

    const checkForUpdates = async () => {
        try {
            // Check if there's a new service worker waiting
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration?.waiting) {
                    setUpdateAvailable(true);
                    return;
                }
            }

            // Also check version from a meta tag or API
            const storedVersion = localStorage.getItem('app_version');
            if (storedVersion && storedVersion !== CURRENT_VERSION) {
                setUpdateAvailable(true);
            } else if (!storedVersion) {
                localStorage.setItem('app_version', CURRENT_VERSION);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    };

    const handleUpdate = async () => {
        setIsUpdating(true);

        try {
            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // Clear service worker and reload
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration?.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                await registration?.unregister();
            }

            // Update stored version
            localStorage.setItem('app_version', CURRENT_VERSION);

            // Force hard reload
            window.location.reload();
        } catch (error) {
            console.error('Error updating app:', error);
            // Fallback: just reload
            window.location.reload();
        }
    };

    if (!updateAvailable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
            >
                <div className="pointer-events-auto bg-gradient-to-r from-[#003630] to-[#004d45] text-white shadow-2xl">
                    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-6 w-6 text-[#95e36c]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        New Update Available!
                                    </p>
                                    <p className="text-xs text-gray-200 mt-0.5">
                                        A new version of Master-Fees is ready. Update now to get the latest features and improvements.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-[#003630] bg-[#95e36c] hover:bg-[#85d35c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95e36c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
                                >
                                    {isUpdating ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="-ml-1 mr-2 h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                            Update Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
