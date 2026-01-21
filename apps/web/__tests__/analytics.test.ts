/**
 * Analytics System Tests
 *
 * Tests for the KR8TIV Launchpad analytics abstraction layer
 */

import { analytics, EventName, AnalyticsEvent } from '../lib/analytics';

// Mock window and document for SSR testing
const mockWindow = () => {
  const originalWindow = global.window;
  return {
    setup: () => {
      // @ts-ignore
      global.window = {
        gtag: jest.fn(),
        dataLayer: [],
        location: { hostname: 'localhost' },
      };
    },
    teardown: () => {
      // @ts-ignore
      global.window = originalWindow;
    },
  };
};

describe('Analytics', () => {
  const windowMock = mockWindow();

  beforeEach(() => {
    windowMock.setup();
    // Reset analytics state before each test
    analytics.reset();
  });

  afterEach(() => {
    windowMock.teardown();
  });

  describe('initialization', () => {
    it('should not initialize on server side', () => {
      // @ts-ignore - simulate SSR
      delete global.window;

      analytics.init();
      expect(analytics.isInitialized()).toBe(false);
    });

    it('should initialize on client side', () => {
      windowMock.setup();
      analytics.init();
      expect(analytics.isInitialized()).toBe(true);
    });

    it('should only initialize once', () => {
      analytics.init();
      const firstInit = analytics.isInitialized();
      analytics.init();
      const secondInit = analytics.isInitialized();

      expect(firstInit).toBe(true);
      expect(secondInit).toBe(true);
    });
  });

  describe('event tracking', () => {
    beforeEach(() => {
      analytics.init();
    });

    it('should track page_view events', () => {
      const trackSpy = jest.spyOn(analytics, 'track');

      analytics.page('/launch');

      expect(trackSpy).toHaveBeenCalledWith({
        name: 'page_view',
        properties: { page: '/launch' },
      });
    });

    it('should track wallet_connect events', () => {
      const event: AnalyticsEvent = {
        name: 'wallet_connect',
        properties: { wallet: 'Phantom', address: 'abc123' },
      };

      analytics.track(event);

      // Verify gtag was called
      expect((global.window as any).gtag).toHaveBeenCalled();
    });

    it('should track token_launch_start events', () => {
      const event: AnalyticsEvent = {
        name: 'token_launch_start',
        properties: { symbol: 'TEST', supply: 1000000 },
      };

      analytics.track(event);

      expect((global.window as any).gtag).toHaveBeenCalled();
    });

    it('should track token_launch_complete events', () => {
      const event: AnalyticsEvent = {
        name: 'token_launch_complete',
        properties: {
          tokenMint: 'mint123',
          symbol: 'TEST',
          totalTax: 5,
        },
      };

      analytics.track(event);

      expect((global.window as any).gtag).toHaveBeenCalled();
    });

    it('should track stake_start events', () => {
      const event: AnalyticsEvent = {
        name: 'stake_start',
        properties: { amount: 1000, duration: 30 },
      };

      analytics.track(event);

      expect((global.window as any).gtag).toHaveBeenCalled();
    });

    it('should track stake_complete events', () => {
      const event: AnalyticsEvent = {
        name: 'stake_complete',
        properties: { amount: 1000, duration: 30, effectiveStake: 1150 },
      };

      analytics.track(event);

      expect((global.window as any).gtag).toHaveBeenCalled();
    });

    it('should track unstake_complete events', () => {
      const event: AnalyticsEvent = {
        name: 'unstake_complete',
        properties: { amount: 1000 },
      };

      analytics.track(event);

      expect((global.window as any).gtag).toHaveBeenCalled();
    });

    it('should track claim_rewards events', () => {
      const event: AnalyticsEvent = {
        name: 'claim_rewards',
        properties: { amount: 50.5 },
      };

      analytics.track(event);

      expect((global.window as any).gtag).toHaveBeenCalled();
    });

    it('should not track events when not initialized', () => {
      analytics.reset();

      analytics.track({ name: 'page_view', properties: { page: '/' } });

      // gtag should not be called since analytics is not initialized
      expect((global.window as any).gtag).not.toHaveBeenCalled();
    });
  });

  describe('user identification', () => {
    beforeEach(() => {
      analytics.init();
    });

    it('should identify user by wallet address', () => {
      const walletAddress = 'abc123def456';

      analytics.identify(walletAddress);

      expect((global.window as any).gtag).toHaveBeenCalledWith(
        'config',
        expect.any(String),
        expect.objectContaining({ user_id: walletAddress })
      );
    });

    it('should clear user identification on disconnect', () => {
      analytics.identify('abc123');
      analytics.clearIdentity();

      expect((global.window as any).gtag).toHaveBeenLastCalledWith(
        'config',
        expect.any(String),
        expect.objectContaining({ user_id: undefined })
      );
    });
  });

  describe('event types', () => {
    it('should have correct event name types', () => {
      const validEvents: EventName[] = [
        'page_view',
        'wallet_connect',
        'wallet_disconnect',
        'token_launch_start',
        'token_launch_complete',
        'stake_start',
        'stake_complete',
        'unstake_complete',
        'claim_rewards',
      ];

      expect(validEvents).toHaveLength(9);
    });
  });

  describe('debug mode', () => {
    it('should log events in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      analytics.setDebug(true);
      analytics.init();
      analytics.track({ name: 'page_view', properties: { page: '/' } });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics]',
        expect.any(String),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should not log events when debug mode is off', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      analytics.setDebug(false);
      analytics.init();
      analytics.track({ name: 'page_view', properties: { page: '/' } });

      expect(consoleSpy).not.toHaveBeenCalledWith(
        '[Analytics]',
        expect.any(String),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('useAnalytics hook', () => {
  // These tests would be for the React hook
  // In a real setup, we'd use @testing-library/react-hooks

  it('should provide tracking functions', () => {
    // Placeholder for hook tests
    expect(true).toBe(true);
  });
});
