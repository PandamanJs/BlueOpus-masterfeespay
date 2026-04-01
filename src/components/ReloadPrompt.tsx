import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Download, X } from 'lucide-react';

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error: any) {
            console.error('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-6 left-6 right-6 z-[9999] md:left-auto md:right-8 md:bottom-8 md:w-[400px]"
                >
                    <div className="bg-[#003630] rounded-3xl p-6 shadow-2xl border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                        {/* Background decorative element */}
                        <div className="absolute -top-12 -right-12 size-40 bg-[#95e36c]/10 rounded-full blur-3xl group-hover:bg-[#95e36c]/20 transition-colors duration-500" />

                        <div className="relative flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-[#95e36c]/20 flex items-center justify-center">
                                        <RefreshCw className={`size-5 text-[#95e36c] ${needRefresh ? 'animate-spin-slow' : ''}`} />
                                    </div>
                                    <h3 className="text-white font-semibold text-lg">
                                        {needRefresh ? 'Update Available' : 'Ready to use offline'}
                                    </h3>
                                </div>
                                <button
                                    onClick={close}
                                    className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="size-4 text-white/40" />
                                </button>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed">
                                {needRefresh
                                    ? 'A new version of Master-Fees is available. Update now to get the latest features and fixes.'
                                    : 'The app has been cached and is now ready to work without an internet connection.'}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                                {needRefresh && (
                                    <button
                                        onClick={() => updateServiceWorker(true)}
                                        className="flex-1 h-12 rounded-2xl bg-[#95e36c] hover:bg-[#7bc257] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Download className="size-4 text-[#003630]" />
                                        <span className="text-[#003630] font-bold text-sm">Update Now</span>
                                    </button>
                                )}
                                <button
                                    onClick={close}
                                    className={`h-12 rounded-2xl border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center px-6 ${!needRefresh ? 'w-full' : ''}`}
                                >
                                    <span className="text-white font-medium text-sm">Dismiss</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
