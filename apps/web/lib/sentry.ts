/**
 * Sentry Client Utilities for KR8TIV Launchpad Web App
 *
 * Provides helper functions for error tracking, user identification,
 * and breadcrumb management in the frontend application.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Capture an error with optional context and tags
 */
export function captureError(
  error: Error,
  context?: Record<string, any>,
  tags?: Record<string, string>
): void {
  Sentry.captureException(error, {
    extra: context,
    tags,
  });
}

/**
 * Capture a message with specified severity level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set the current user based on wallet address
 */
export function setUser(wallet: string): void {
  Sentry.setUser({
    id: wallet,
    wallet,
  });
}

/**
 * Clear user data (on disconnect)
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  category: string = 'user'
): void {
  Sentry.addBreadcrumb({
    message,
    level: 'info',
    category,
    data,
  });
}

/**
 * Set transaction context for performance monitoring
 */
export function setTransactionContext(
  name: string,
  data?: Record<string, any>
): void {
  Sentry.setTag('transaction', name);
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      Sentry.setExtra(key, value);
    });
  }
}

/**
 * Track wallet connection events
 */
export function trackWalletConnection(
  wallet: string | undefined,
  status: 'connected' | 'disconnected' | 'error'
): void {
  const message =
    status === 'connected'
      ? 'Wallet connected'
      : status === 'disconnected'
        ? 'Wallet disconnected'
        : 'Wallet connection error';

  Sentry.addBreadcrumb({
    message,
    category: 'wallet',
    level: status === 'error' ? 'error' : 'info',
    data: {
      wallet,
      status,
      timestamp: new Date().toISOString(),
    },
  });

  if (status === 'connected' && wallet) {
    setUser(wallet);
  } else if (status === 'disconnected') {
    clearUser();
  }
}

/**
 * Track token launch events
 */
export function trackTokenLaunch(
  stage: 'start' | 'success' | 'error',
  data: Record<string, any>
): void {
  const messages: Record<string, string> = {
    start: 'Token launch started',
    success: 'Token launch succeeded',
    error: 'Token launch failed',
  };

  Sentry.addBreadcrumb({
    message: messages[stage],
    category: 'launch',
    level: stage === 'error' ? 'error' : 'info',
    data: {
      ...data,
      stage,
      timestamp: new Date().toISOString(),
    },
  });

  if (stage === 'error' && data.error) {
    captureError(
      new Error(data.error),
      { ...data, stage },
      { feature: 'token-launch' }
    );
  }
}

/**
 * Track staking actions
 */
export function trackStakingAction(
  action: 'stake' | 'unstake' | 'claim',
  data: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message: `Staking action: ${action}`,
    category: 'staking',
    level: 'info',
    data: {
      ...data,
      action,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track API errors
 */
export function trackApiError(
  endpoint: string,
  error: Error,
  statusCode?: number
): void {
  Sentry.withScope((scope) => {
    scope.setTag('api.endpoint', endpoint);
    scope.setTag('api.status', statusCode?.toString() || 'unknown');
    scope.setExtra('endpoint', endpoint);
    scope.setExtra('statusCode', statusCode);
    Sentry.captureException(error);
  });
}

/**
 * Track navigation events
 */
export function trackNavigation(path: string, previousPath?: string): void {
  Sentry.addBreadcrumb({
    message: `Navigated to ${path}`,
    category: 'navigation',
    level: 'info',
    data: {
      path,
      previousPath,
      timestamp: new Date().toISOString(),
    },
  });
}
