import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLContext } from '../../graphql/context';

// Mock PrismaClient
const mockPrismaClient = {
  token: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  staker: {
    findUnique: vi.fn(),
  },
};

vi.mock('../../db/prisma', () => ({
  default: mockPrismaClient,
}));

describe('GraphQL Directives', () => {
  describe('@auth directive', () => {
    let server: ApolloServer<GraphQLContext>;

    beforeEach(async () => {
      const { typeDefs } = await import('../../graphql/schema');
      const { resolvers } = await import('../../graphql/resolvers');
      const { authDirectiveTransformer } = await import('../../graphql/directives/auth.directive');

      let schema = makeExecutableSchema({ typeDefs, resolvers });
      schema = authDirectiveTransformer(schema);
      server = new ApolloServer<GraphQLContext>({ schema });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should allow access to public queries without authentication', async () => {
      mockPrismaClient.token.findMany.mockResolvedValue([]);
      mockPrismaClient.token.count.mockResolvedValue(0);

      const response = await server.executeOperation({
        query: `
          query GetTokens {
            tokens {
              edges {
                node {
                  id
                }
              }
            }
          }
        `,
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null, // Not authenticated
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
      }
    });

    it('should block protected mutations without authentication', async () => {
      const response = await server.executeOperation({
        query: `
          mutation LaunchToken($input: LaunchTokenInput!) {
            launchToken(input: $input) {
              success
            }
          }
        `,
        variables: {
          input: {
            name: 'Test',
            symbol: 'TEST',
            creatorWallet: 'Wallet123',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toContain('Authentication required');
      }
    });

    it('should allow authenticated users to access protected mutations', async () => {
      const { LaunchpadService } = await import('../../services/launchpad.service');
      (LaunchpadService.launchToken as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        tokenId: 'token-1',
      });

      const response = await server.executeOperation({
        query: `
          mutation LaunchToken($input: LaunchTokenInput!) {
            launchToken(input: $input) {
              success
            }
          }
        `,
        variables: {
          input: {
            name: 'Test',
            symbol: 'TEST',
            creatorWallet: 'Wallet123',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Wallet123', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        // Should not have auth error
        const authError = response.body.singleResult.errors?.find(
          e => e.message.includes('Authentication required')
        );
        expect(authError).toBeUndefined();
      }
    });

    it('should block admin-only operations from regular users', async () => {
      const response = await server.executeOperation({
        query: `
          mutation TriggerAutomation($input: TriggerAutomationInput!) {
            triggerAutomation(input: $input) {
              success
            }
          }
        `,
        variables: {
          input: {
            tokenId: 'token-1',
            jobType: 'BURN',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'RegularUser', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toContain('Admin access required');
      }
    });

    it('should allow admin operations for admin users', async () => {
      const { AutomationService } = await import('../../services/automation.service');
      (AutomationService.triggerJob as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        jobId: 'job-1',
        message: 'Job triggered',
      });

      const response = await server.executeOperation({
        query: `
          mutation TriggerAutomation($input: TriggerAutomationInput!) {
            triggerAutomation(input: $input) {
              success
            }
          }
        `,
        variables: {
          input: {
            tokenId: 'token-1',
            jobType: 'BURN',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'AdminWallet', isAdmin: true },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        // Should not have admin error
        const adminError = response.body.singleResult.errors?.find(
          e => e.message.includes('Admin access required')
        );
        expect(adminError).toBeUndefined();
      }
    });
  });

  describe('@rateLimit directive', () => {
    let server: ApolloServer<GraphQLContext>;
    const mockRateLimiter = {
      consume: vi.fn(),
      get: vi.fn(),
    };

    beforeEach(async () => {
      vi.resetModules();

      // Mock rate limiter
      vi.mock('../../graphql/directives/rateLimit.directive', async (importOriginal) => {
        const original = await importOriginal<typeof import('../../graphql/directives/rateLimit.directive')>();
        return {
          ...original,
          rateLimiter: mockRateLimiter,
        };
      });

      const { typeDefs } = await import('../../graphql/schema');
      const { resolvers } = await import('../../graphql/resolvers');
      const { rateLimitDirectiveTransformer } = await import('../../graphql/directives/rateLimit.directive');

      let schema = makeExecutableSchema({ typeDefs, resolvers });
      schema = rateLimitDirectiveTransformer(schema);
      server = new ApolloServer<GraphQLContext>({ schema });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should allow requests under rate limit', async () => {
      mockRateLimiter.consume.mockResolvedValue({ remainingPoints: 9 });
      mockPrismaClient.token.findMany.mockResolvedValue([]);
      mockPrismaClient.token.count.mockResolvedValue(0);

      const response = await server.executeOperation({
        query: `
          query GetTokens {
            tokens {
              edges {
                node {
                  id
                }
              }
            }
          }
        `,
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
          ip: '127.0.0.1',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
      }
    });

    it('should block requests exceeding rate limit', async () => {
      mockRateLimiter.consume.mockRejectedValue({
        remainingPoints: 0,
        msBeforeNext: 60000,
      });

      const response = await server.executeOperation({
        query: `
          query GetTokens {
            tokens {
              edges {
                node {
                  id
                }
              }
            }
          }
        `,
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
          ip: '127.0.0.1',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toContain('Rate limit exceeded');
      }
    });

    it('should apply different limits for mutations', async () => {
      // Launch mutations should have stricter limits
      mockRateLimiter.consume.mockRejectedValue({
        remainingPoints: 0,
        msBeforeNext: 3600000, // 1 hour
      });

      const response = await server.executeOperation({
        query: `
          mutation LaunchToken($input: LaunchTokenInput!) {
            launchToken(input: $input) {
              success
            }
          }
        `,
        variables: {
          input: {
            name: 'Test',
            symbol: 'TEST',
            creatorWallet: 'Wallet123',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Wallet123', isAdmin: false },
          requestId: 'test-request-id',
          ip: '127.0.0.1',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
      }
    });
  });
});
