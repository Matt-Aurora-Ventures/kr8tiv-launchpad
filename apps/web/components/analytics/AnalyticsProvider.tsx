'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { analytics } from '@/lib/analytics';

/**
 * Inner component that uses useSearchParams (requires Suspense boundary)
 */
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { publicKey, connected } = useWallet();

  // Initialize analytics on mount
  useEffect(() => {
    analytics.init();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!pathname) return;

    // Construct page URL with search params
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    analytics.page(url, {
      path: pathname,
      search: searchParams?.toString() || '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }, [pathname, searchParams]);

  // Track wallet connection/disconnection and identify user
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toBase58();
      analytics.identify(walletAddress);
      analytics.track({
        name: 'wallet_connect',
        properties: {
          wallet_address: walletAddress.slice(0, 8) + '...',
        },
      });
    } else if (!connected) {
      analytics.track({
        name: 'wallet_disconnect',
        properties: {},
      });
      analytics.clearIdentity();
    }
  }, [connected, publicKey]);

  return null;
}

/**
 * Analytics Provider Component
 *
 * Wraps the application to provide analytics tracking for:
 * - Page views (automatic on route change)
 * - Wallet connect/disconnect events
 * - User identification by wallet address
 *
 * @example
 * // In app/layout.tsx
 * <AnalyticsProvider>
 *   {children}
 * </AnalyticsProvider>
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  );
}

export default AnalyticsProvider;
