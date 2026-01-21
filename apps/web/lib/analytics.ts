/**
 * Analytics Abstraction Layer
 *
 * Provides a unified interface for tracking user interactions across
 * multiple analytics providers (Google Analytics 4, Mixpanel).
 *
 * Usage:
 *   import { analytics } from '@/lib/analytics';
 *   analytics.init();
 *   analytics.track({ name: 'token_launch_complete', properties: { ... } });
 */

// Event types for type-safe tracking
export type EventName =
  | 'page_view'
  | 'wallet_connect'
  | 'wallet_disconnect'
  | 'token_launch_start'
  | 'token_launch_complete'
  | 'stake_start'
  | 'stake_complete'
  | 'unstake_complete'
  | 'claim_rewards';

// Event structure
export interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, unknown>;
}

// Provider configuration
interface AnalyticsConfig {
  gaId?: string;
  mixpanelToken?: string;
  debug?: boolean;
}

// Extend Window to include analytics globals
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    mixpanel?: {
      init: (token: string, config?: Record<string, unknown>) => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      identify: (id: string) => void;
      reset: () => void;
      people: {
        set: (properties: Record<string, unknown>) => void;
      };
    };
  }
}

/**
 * Analytics singleton class
 */
class Analytics {
  private initialized = false;
  private debug = false;
  private config: AnalyticsConfig = {};

  /**
   * Initialize analytics with configured providers
   */
  init(config?: AnalyticsConfig): void {
    // Don't initialize on server side
    if (typeof window === 'undefined') {
      return;
    }

    // Don't reinitialize
    if (this.initialized) {
      return;
    }

    // Set configuration
    this.config = {
      gaId: config?.gaId || process.env.NEXT_PUBLIC_GA_ID,
      mixpanelToken: config?.mixpanelToken || process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
      debug: config?.debug ?? process.env.NODE_ENV === 'development',
    };

    this.debug = this.config.debug || false;

    // Initialize Google Analytics
    if (this.config.gaId) {
      this.initGA(this.config.gaId);
    }

    // Initialize Mixpanel
    if (this.config.mixpanelToken) {
      this.initMixpanel(this.config.mixpanelToken);
    }

    this.initialized = true;

    if (this.debug) {
      console.log('[Analytics] Initialized', {
        ga: !!this.config.gaId,
        mixpanel: !!this.config.mixpanelToken,
      });
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private initGA(measurementId: string): void {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Define gtag function
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_path: window.location.pathname,
      // Anonymize IP for GDPR compliance
      anonymize_ip: true,
      // Don't send page views automatically - we handle them manually
      send_page_view: false,
    });
  }

  /**
   * Initialize Mixpanel
   */
  private initMixpanel(token: string): void {
    // Only initialize if Mixpanel script is loaded
    if (!window.mixpanel) {
      if (this.debug) {
        console.warn('[Analytics] Mixpanel script not loaded');
      }
      return;
    }

    window.mixpanel.init(token, {
      debug: this.debug,
      track_pageview: false,
      persistence: 'localStorage',
    });
  }

  /**
   * Track an analytics event
   */
  track(event: AnalyticsEvent): void {
    if (!this.initialized) {
      if (this.debug) {
        console.warn('[Analytics] Not initialized, skipping event:', event.name);
      }
      return;
    }

    const { name, properties = {} } = event;

    // Add timestamp
    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
    };

    if (this.debug) {
      console.log('[Analytics]', name, enrichedProperties);
    }

    // Send to GA4
    this.trackGA(name, enrichedProperties);

    // Send to Mixpanel
    this.trackMixpanel(name, enrichedProperties);
  }

  /**
   * Track event in Google Analytics
   */
  private trackGA(eventName: string, properties: Record<string, unknown>): void {
    if (!window.gtag || !this.config.gaId) return;

    // Map our event names to GA4 recommended event names where applicable
    const gaEventMapping: Record<string, string> = {
      page_view: 'page_view',
      wallet_connect: 'login',
      wallet_disconnect: 'logout',
      token_launch_start: 'begin_checkout',
      token_launch_complete: 'purchase',
      stake_start: 'add_to_cart',
      stake_complete: 'purchase',
      unstake_complete: 'refund',
      claim_rewards: 'earn_virtual_currency',
    };

    const mappedEvent = gaEventMapping[eventName] || eventName;

    window.gtag('event', mappedEvent, {
      event_category: 'engagement',
      event_label: eventName,
      ...properties,
    });
  }

  /**
   * Track event in Mixpanel
   */
  private trackMixpanel(eventName: string, properties: Record<string, unknown>): void {
    if (!window.mixpanel) return;

    window.mixpanel.track(eventName, properties);
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: Record<string, unknown>): void {
    this.track({
      name: 'page_view',
      properties: {
        page: pageName,
        ...properties,
      },
    });
  }

  /**
   * Identify user (by wallet address)
   */
  identify(walletAddress: string): void {
    if (!this.initialized) return;

    if (this.debug) {
      console.log('[Analytics] Identify user:', walletAddress.slice(0, 8) + '...');
    }

    // GA4 user identification
    if (window.gtag && this.config.gaId) {
      window.gtag('config', this.config.gaId, {
        user_id: walletAddress,
      });
    }

    // Mixpanel user identification
    if (window.mixpanel) {
      window.mixpanel.identify(walletAddress);
      window.mixpanel.people.set({
        wallet_address: walletAddress,
        $name: walletAddress.slice(0, 8) + '...',
      });
    }
  }

  /**
   * Clear user identification (on wallet disconnect)
   */
  clearIdentity(): void {
    if (!this.initialized) return;

    if (this.debug) {
      console.log('[Analytics] Clear user identity');
    }

    // GA4 - clear user ID
    if (window.gtag && this.config.gaId) {
      window.gtag('config', this.config.gaId, {
        user_id: undefined,
      });
    }

    // Mixpanel - reset user
    if (window.mixpanel) {
      window.mixpanel.reset();
    }
  }

  /**
   * Check if analytics is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Set debug mode
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /**
   * Reset analytics state (useful for testing)
   */
  reset(): void {
    this.initialized = false;
    this.debug = false;
    this.config = {};
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export class for testing
export { Analytics };
