/**
 * Sentry Client Configuration for KR8TIV Launchpad
 *
 * This file configures Sentry for the browser/client-side.
 * It initializes error tracking, session replay, and performance monitoring.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment (production, staging, development)
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/api\.kr8tiv\.io/,
        /^https:\/\/kr8tiv\.io/,
      ],
    }),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: 'dark',
      buttonLabel: 'Report a Bug',
      submitButtonLabel: 'Submit Bug Report',
      formTitle: 'Report a Bug',
      nameLabel: 'Name',
      namePlaceholder: 'Your Name',
      emailLabel: 'Email',
      emailPlaceholder: 'your.email@example.org',
      isRequiredLabel: '(required)',
      messageLabel: 'Description',
      messagePlaceholder: 'What happened? What did you expect?',
      successMessageText: 'Thank you for your feedback!',
    }),
  ],

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Ignore common errors that aren't actionable
  ignoreErrors: [
    // Network errors
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    'ChunkLoadError',

    // Wallet adapter errors that are expected
    'WalletNotReadyError',
    'WalletConnectionError',
    'WalletDisconnectedError',

    // User cancelled actions
    'User rejected',
    'Transaction cancelled',
  ],

  // Before sending the event to Sentry
  beforeSend(event, hint) {
    // Filter out events in development (still log for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Event captured:', event);
    }

    // Don't send events without DSN configured
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }

    return event;
  },

  // Add release info for source maps
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'kr8tiv-web@1.0.0',
});
