/**
 * Sentry Edge Configuration for KR8TIV Launchpad
 *
 * This file configures Sentry for Edge runtime (middleware, edge API routes).
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Filter events
  beforeSend(event, hint) {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }
    return event;
  },

  // Release info
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'kr8tiv-web@1.0.0',
});
