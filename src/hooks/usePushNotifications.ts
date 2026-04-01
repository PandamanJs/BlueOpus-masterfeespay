import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// PUBLIC VAPID KEY (Replace with your own generated key)
const VAPID_PUBLIC_KEY = 'BI72mYv6yS9S0Yn7m3m8O9-6_J7_0n_0_0_0_0_0_0_0_0_0_0_0_0_0';

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const subscribe = async (parentId?: string) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('Push notifications not supported');
        }

        setIsLoading(true);
        try {
            // Request permission
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result !== 'granted') {
                throw new Error('Notification permission denied');
            }

            const registration = await navigator.serviceWorker.ready;

            // Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Save to Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .insert({
                    parent_id: parentId, // Optional: link to a parent if available
                    subscription: subscription.toJSON(),
                    browser_name: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                        navigator.userAgent.includes('Safari') ? 'Safari' : 'Firefox',
                    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
                });

            if (error) throw error;

            setIsSubscribed(true);
            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Optionally remove from Supabase
                // We'd need the endpoint to find the right record
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .match({ 'subscription->endpoint': subscription.endpoint });
            }

            setIsSubscribed(false);
        } catch (error) {
            console.error('Push unsubscription failed:', error);
        }
    };

    return {
        isSubscribed,
        isLoading,
        permission,
        subscribe,
        unsubscribe
    };
}
