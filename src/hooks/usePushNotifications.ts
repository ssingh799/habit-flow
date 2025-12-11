import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Firebase configuration - replace with your actual values
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported && user) {
      checkExistingToken();
    }
  }, [user]);

  const checkExistingToken = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', user.id)
      .limit(1);

    setIsEnabled(data && data.length > 0);
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported || !user) return false;

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }

      // Register service worker
      await registerServiceWorker();

      // Dynamically import Firebase
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken } = await import('firebase/messaging');

      const app = initializeApp(FIREBASE_CONFIG);
      const messaging = getMessaging(app);

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (token) {
        // Save token to database
        const { error } = await supabase
          .from('device_tokens')
          .upsert(
            { user_id: user.id, token },
            { onConflict: 'user_id,token' }
          );

        if (error) {
          console.error('Error saving token:', error);
          toast({
            title: 'Error',
            description: 'Failed to save notification settings.',
            variant: 'destructive',
          });
        } else {
          setIsEnabled(true);
          toast({
            title: 'Notifications enabled',
            description: 'You will receive reminders for incomplete tasks.',
          });
        }
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user, toast]);

  const disableNotifications = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to disable notifications.',
          variant: 'destructive',
        });
      } else {
        setIsEnabled(false);
        toast({
          title: 'Notifications disabled',
          description: 'You will no longer receive task reminders.',
        });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  }, [user, toast]);

  return {
    isSupported,
    isEnabled,
    isLoading,
    requestPermission,
    disableNotifications,
  };
}
