/**
 * Sentry Server Configuration for KR8TIV Launchpad
 *
 * This file configures Sentry for the server-side of Next.js.
 * It runs in Node.js runtime for server components, API routes, and SSR.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Capture 100% of the transactions in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  beforeSend(event, hint) {
    // Filter out events without DSN
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }

    return event;
  },

  // Add release info
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'kr8tiv-web@1.0.0',
});
