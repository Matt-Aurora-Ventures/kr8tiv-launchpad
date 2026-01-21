'use client';

import { useCallback } from 'react';
import { analytics, AnalyticsEvent, EventName } from '@/lib/analytics';

/**
 * Analytics hook for tracking user interactions
 *
 * Provides typed tracking functions for common events in the KR8TIV Launchpad.
 *
 * @example
 * const { trackLaunchStart, trackLaunchComplete, trackStake } = useAnalytics();
 *
 * // When user starts the launch wizard
 * trackLaunchStart('TEST', 1000000);
 *
 * // When token is successfully launched
 * trackLaunchComplete('mint123', 'TEST', 5);
 *
 * // When user completes staking
 * trackStake(1000, 30, 1150);
 */
export function useAnalytics() {
  /**
   * Track generic event
   */
  const track = useCallback((event: AnalyticsEvent) => {
    analytics.track(event);
  }, []);

  /**
   * Track page view
   */
  const trackPage = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    analytics.page(pageName, properties);
  }, []);

  /**
   * Track token launch wizard started
   */
  const trackLaunchStart = useCallback((symbol: string, supply: number) => {
    analytics.track({
      name: 'token_launch_start',
      properties: {
        symbol,
        supply,
      },
    });
  }, []);

  /**
   * Track token launch completed successfully
   */
  const trackLaunchComplete = useCallback(
    (tokenMint: string, symbol: string, totalTax: number, properties?: Record<string, unknown>) => {
      analytics.track({
        name: 'token_launch_complete',
        properties: {
          token_mint: tokenMint,
          symbol,
          total_tax: totalTax,
          ...properties,
        },
      });
    },
    []
  );

  /**
   * Track stake flow started
   */
  const trackStakeStart = useCallback((amount: number, duration: number) => {
    analytics.track({
      name: 'stake_start',
      properties: {
        amount,
        duration,
      },
    });
  }, []);

  /**
   * Track stake completed successfully
   */
  const trackStake = useCallback(
    (amount: number, duration: number, effectiveStake: number, tier?: string) => {
      analytics.track({
        name: 'stake_complete',
        properties: {
          amount,
          duration,
          effective_stake: effectiveStake,
          tier,
        },
      });
    },
    []
  );

  /**
   * Track unstake completed
   */
  const trackUnstake = useCallback((amount: number) => {
    analytics.track({
      name: 'unstake_complete',
      properties: {
        amount,
      },
    });
  }, []);

  /**
   * Track rewards claimed
   */
  const trackClaimRewards = useCallback((amount: number) => {
    analytics.track({
      name: 'claim_rewards',
      properties: {
        amount,
      },
    });
  }, []);

  /**
   * Track wallet connection
   */
  const trackWalletConnect = useCallback((walletName: string, walletAddress: string) => {
    analytics.track({
      name: 'wallet_connect',
      properties: {
        wallet_name: walletName,
        wallet_address: walletAddress.slice(0, 8) + '...',
      },
    });
    // Also identify the user
    analytics.identify(walletAddress);
  }, []);

  /**
   * Track wallet disconnection
   */
  const trackWalletDisconnect = useCallback(() => {
    analytics.track({
      name: 'wallet_disconnect',
      properties: {},
    });
    analytics.clearIdentity();
  }, []);

  return {
    track,
    trackPage,
    trackLaunchStart,
    trackLaunchComplete,
    trackStakeStart,
    trackStake,
    trackUnstake,
    trackClaimRewards,
    trackWalletConnect,
    trackWalletDisconnect,
  };
}

export default useAnalytics;
