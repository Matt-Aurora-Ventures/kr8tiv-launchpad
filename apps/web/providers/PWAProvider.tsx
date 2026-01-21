'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { InstallPrompt, UpdatePrompt } from '@/components/pwa';
import { registerServiceWorker, type SWRegistrationResult } from '@/lib/sw-register';

interface PWAContextValue {
  isRegistered: boolean;
  registration: SWRegistrationResult | null;
}

const PWAContext = createContext<PWAContextValue>({
  isRegistered: false,
  registration: null,
});

export function usePWAContext() {
  return useContext(PWAContext);
}

interface PWAProviderProps {
  children: ReactNode;
  /** Show install prompt banner */
  showInstallPrompt?: boolean;
  /** Show update notification banner */
  showUpdatePrompt?: boolean;
  /** Delay before showing install prompt (ms) */
  installPromptDelay?: number;
}

export function PWAProvider({
  children,
  showInstallPrompt = true,
  showUpdatePrompt = true,
  installPromptDelay = 5000,
}: PWAProviderProps) {
  const [registration, setRegistration] = useState<SWRegistrationResult | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Register service worker on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only register in production or when explicitly enabled
    const shouldRegister =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!shouldRegister) {
      console.log('[PWA] Service worker disabled in development');
      return;
    }

    registerServiceWorker({
      onOfflineReady: () => {
        console.log('[PWA] App ready for offline use');
      },
    }).then((result) => {
      setRegistration(result);
      setIsRegistered(result.success);
    });
  }, []);

  return (
    <PWAContext.Provider value={{ isRegistered, registration }}>
      {children}
      {showInstallPrompt && <InstallPrompt showDelay={installPromptDelay} />}
      {showUpdatePrompt && <UpdatePrompt />}
    </PWAContext.Provider>
  );
}
