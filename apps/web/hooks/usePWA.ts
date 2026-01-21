'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  skipWaiting,
  isStandalone,
  isIOSSafari,
  type SWRegistrationResult,
} from '@/lib/sw-register';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UsePWAReturn {
  /** Whether the app can be installed */
  isInstallable: boolean;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
  /** Whether running on iOS Safari (shows manual install instructions) */
  isIOSSafari: boolean;
  /** Whether a service worker update is available */
  updateAvailable: boolean;
  /** Whether offline mode is ready */
  offlineReady: boolean;
  /** Trigger the install prompt */
  install: () => Promise<'accepted' | 'dismissed' | null>;
  /** Apply the pending update (reloads page) */
  applyUpdate: () => void;
  /** Dismiss the install prompt */
  dismissInstall: () => void;
  /** Service worker registration result */
  swRegistration: SWRegistrationResult | null;
}

const INSTALL_DISMISSED_KEY = 'kr8tiv-pwa-install-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWA(): UsePWAReturn {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [iosSafari, setIOSSafari] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistration, setSWRegistration] = useState<SWRegistrationResult | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if install was recently dismissed
  const wasRecentlyDismissed = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (!dismissed) return false;
    const dismissedAt = parseInt(dismissed, 10);
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  }, []);

  // Initialize PWA state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode
    setIsInstalled(isStandalone());
    setIOSSafari(isIOSSafari());

    // Register service worker
    registerServiceWorker({
      onUpdateAvailable: (registration) => {
        console.log('[PWA] Update available');
        setUpdateAvailable(true);
        setPendingRegistration(registration);
      },
      onUpdateInstalled: () => {
        console.log('[PWA] Update installed, reloading');
        window.location.reload();
      },
      onOfflineReady: () => {
        console.log('[PWA] Offline ready');
        setOfflineReady(true);
      },
    }).then(setSWRegistration);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;

      // Don't show if recently dismissed
      if (wasRecentlyDismissed()) {
        console.log('[PWA] Install prompt suppressed (recently dismissed)');
        return;
      }

      console.log('[PWA] Install prompt available');
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.removeItem(INSTALL_DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [wasRecentlyDismissed]);

  // Trigger install prompt
  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return null;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);

      setDeferredPrompt(null);
      setIsInstallable(false);

      return outcome;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return null;
    }
  }, [deferredPrompt]);

  // Apply pending update
  const applyUpdate = useCallback(() => {
    if (pendingRegistration) {
      skipWaiting(pendingRegistration);
    }
  }, [pendingRegistration]);

  // Dismiss install prompt
  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
    setDeferredPrompt(null);
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOSSafari: iosSafari,
    updateAvailable,
    offlineReady,
    install,
    applyUpdate,
    dismissInstall,
    swRegistration,
  };
}
