import { useState, useEffect } from 'react';

interface LencoCustomer {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

interface LencoPaymentConfig {
    key: string;
    reference: string;
    amount: number;
    currency: string;
    email: string; // Required by Lenco
    channels: string[];
    customer: Omit<LencoCustomer, 'email'>; // Email is top-level param
    split?: Array<{ account: string; amount: number }>; // Optional Split Inflow
    onSuccess: (response: any) => void;
    onClose: () => void;
    onConfirmationPending: () => void;
}

declare global {
    interface Window {
        LencoPay: {
            getPaid: (config: any) => void;
        };
    }
}

export const useLenco = () => {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Load Lenco script
    useEffect(() => {
        // Check if script is already present
        if (document.querySelector('script[src="https://pay.lenco.co/js/v1/inline.js"]')) {
            setIsScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://pay.lenco.co/js/v1/inline.js';
        script.async = true;

        script.onload = () => {
            setIsScriptLoaded(true);
        };

        script.onerror = () => {
            setLoadError('Failed to load Lenco payment script');
        };

        document.body.appendChild(script);

        return () => {
            // Cleanup if needed, but usually keeping script is fine
        };
    }, []);

    const initiatePayment = (config: LencoPaymentConfig) => {
        if (!isScriptLoaded) {
            console.error('Lenco script not loaded yet');
            return;
        }

        if (!window.LencoPay) {
            console.error('LencoPay object not found');
            return;
        }

        window.LencoPay.getPaid(config);
    };

    return { isScriptLoaded, loadError, initiatePayment };
};
