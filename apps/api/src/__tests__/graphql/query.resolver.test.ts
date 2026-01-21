import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLContext } from '../../graphql/context';

// Mock PrismaClient
const mockPrismaClient = {
  token: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  staker: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  creator: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  automationJob: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  platformStats: {
    findUnique: vi.fn(),
  },
};

vi.mock('../../db/prisma', () => ({
  default: mockPrismaClient,
}));

describe('GraphQL Query Resolvers', () => {
  let server: ApolloServer<GraphQLContext>;

  beforeEach(async () => {
    // Dynamic import to ensure mocks are in place
    const { typeDefs } = await import('../../graphql/schema');
    const { resolvers } = await import('../../graphql/resolvers');

    const schema = makeExecutableSchema({ typeDefs, resolvers });
    server = new ApolloServer<GraphQLContext>({ schema });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('tokens query', () => {
    it('should return paginated list of tokens', async () => {
      const mockTokens = [
        {
          id: 'token-1',
          tokenMint: 'So1anaM1nt123456789',
          name: 'Test Token',
          symbol: 'TEST',
          description: 'A test token',
          imageUrl: 'https://example.com/image.png',
          creatorWallet: 'Cre4torWa11et123456789',
          status: 'ACTIVE',
          burnEnabled: true,
          burnPercentage: 100,
          lpEnabled: false,
          lpPercentage: 0,
          dividendsEnabled: false,
          dividendsPercentage: 0,
          totalVolumeUsd: 10000.5,
          totalVolumeSol: 100.5,
          holderCount: 150,
          currentPriceUsd: 0.01,
          currentPriceSol: 0.0001,
          marketCapUsd: 10000,
          totalFeesCollected: BigInt(1000000),
          totalBurned: BigInt(500000),
          totalToLp: BigInt(0),
          totalDividendsPaid: BigInt(0),
          launchedAt: new Date('2026-01-15'),
          graduatedAt: null,
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-20'),
        },
      ];

      mockPrismaClient.token.findMany.mockResolvedValue(mockTokens);
      mockPrismaClient.token.count.mockResolvedValue(1);

      const response = await server.executeOperation({
        query: `
          query GetTokens($first: Int, $after: String, $filter: TokenFilter) {
            tokens(first: $first, after: $after, filter: $filter) {
              edges {
                node {
                  id
                  tokenMint
                  name
                  symbol
                  status
                  stats {
                    totalVolumeUsd
                    holderCount
                    currentPriceUsd
                    marketCapUsd
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
                endCursor
              }
              totalCount
            }
          }
        `,
        variables: { first: 10 },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.tokens.edges).toHaveLength(1);
        expect(response.body.singleResult.data?.tokens.edges[0].node.name).toBe('Test Token');
        expect(response.body.singleResult.data?.tokens.totalCount).toBe(1);
      }
    });

    it('should filter tokens by status', async () => {
      mockPrismaClient.token.findMany.mockResolvedValue([]);
      mockPrismaClient.token.count.mockResolvedValue(0);

      const response = await server.executeOperation({
        query: `
          query GetTokens($filter: TokenFilter) {
            tokens(filter: $filter) {
              edges {
                node {
                  id
                  status
                }
              }
              totalCount
            }
          }
        `,
        variables: {
          filter: { status: 'GRADUATED' },
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
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(mockPrismaClient.token.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ status: 'GRADUATED' }),
          })
        );
      }
    });
  });

  describe('token query', () => {
    it('should return a single token by mint address', async () => {
      const mockToken = {
        id: 'token-1',
        tokenMint: 'So1anaM1nt123456789',
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token',
        imageUrl: 'https://example.com/image.png',
        creatorWallet: 'Cre4torWa11et123456789',
        status: 'ACTIVE',
        burnEnabled: true,
        burnPercentage: 100,
        lpEnabled: false,
        lpPercentage: 0,
        dividendsEnabled: false,
        dividendsPercentage: 0,
        totalVolumeUsd: 10000.5,
        totalVolumeSol: 100.5,
        holderCount: 150,
        currentPriceUsd: 0.01,
        currentPriceSol: 0.0001,
        marketCapUsd: 10000,
        totalFeesCollected: BigInt(1000000),
        totalBurned: BigInt(500000),
        totalToLp: BigInt(0),
        totalDividendsPaid: BigInt(0),
        launchedAt: new Date('2026-01-15'),
        graduatedAt: null,
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-20'),
        creator: {
          id: 'creator-1',
          wallet: 'Cre4torWa11et123456789',
          displayName: 'Test Creator',
          tokensLaunched: 5,
          totalVolumeUsd: 50000,
        },
      };

      mockPrismaClient.token.findUnique.mockResolvedValue(mockToken);

      const response = await server.executeOperation({
        query: `
          query GetToken($mint: String!) {
            token(mint: $mint) {
              id
              tokenMint
              name
              symbol
              creator {
                wallet
                displayName
              }
            }
          }
        `,
        variables: { mint: 'So1anaM1nt123456789' },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.token.name).toBe('Test Token');
        expect(response.body.singleResult.data?.token.creator.displayName).toBe('Test Creator');
      }
    });

    it('should return null for non-existent token', async () => {
      mockPrismaClient.token.findUnique.mockResolvedValue(null);

      const response = await server.executeOperation({
        query: `
          query GetToken($mint: String!) {
            token(mint: $mint) {
              id
              name
            }
          }
        `,
        variables: { mint: 'NonExistentMint123456789' },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.token).toBeNull();
      }
    });
  });

  describe('staker query', () => {
    it('should return staker info by wallet', async () => {
      const mockStaker = {
        id: 'staker-1',
        wallet: 'Sta4kerWa11et123456789',
        stakedAmount: BigInt(100000000000),
        weightedStake: BigInt(150000000000),
        lockEndTime: new Date('2026-06-15'),
        lockDuration: 180,
        tier: 'GOLD',
        totalRewardsClaimed: BigInt(5000000),
        pendingRewards: BigInt(1000000),
        lastClaimTime: new Date('2026-01-10'),
        createdAt: new Date('2025-07-15'),
        updatedAt: new Date('2026-01-20'),
      };

      mockPrismaClient.staker.findUnique.mockResolvedValue(mockStaker);

      const response = await server.executeOperation({
        query: `
          query GetStaker($wallet: String!) {
            staker(wallet: $wallet) {
              id
              wallet
              stakedAmount
              weightedStake
              tier
              lockEndTime
              feeDiscount
            }
          }
        `,
        variables: { wallet: 'Sta4kerWa11et123456789' },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.staker.tier).toBe('GOLD');
        expect(response.body.singleResult.data?.staker.feeDiscount).toBe(50); // GOLD tier = 50% discount
      }
    });
  });

  describe('platformStats query', () => {
    it('should return platform statistics', async () => {
      const mockStats = {
        id: 'platform',
        totalTokensLaunched: 150,
        totalVolumeUsd: 5000000,
        totalVolumeSol: 50000,
        totalFeesCollectedSol: 500,
        totalBurnedUsd: 100000,
        totalStakedKr8tiv: BigInt(10000000000000),
        activeTokens: 100,
        graduatedTokens: 30,
        uniqueCreators: 75,
        uniqueStakers: 500,
        updatedAt: new Date('2026-01-20'),
      };

      mockPrismaClient.platformStats.findUnique.mockResolvedValue(mockStats);

      const response = await server.executeOperation({
        query: `
          query GetPlatformStats {
            platformStats {
              totalTokensLaunched
              activeTokens
              graduatedTokens
              totalVolumeUsd
              totalStakedKr8tiv
              uniqueCreators
              uniqueStakers
            }
          }
        `,
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.platformStats.totalTokensLaunched).toBe(150);
        expect(response.body.singleResult.data?.platformStats.activeTokens).toBe(100);
      }
    });
  });

  describe('automationJobs query', () => {
    it('should return automation jobs for a token', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          tokenId: 'token-1',
          jobType: 'BURN',
          status: 'COMPLETED',
          triggerType: 'SCHEDULED',
          scheduledFor: new Date('2026-01-19'),
          startedAt: new Date('2026-01-19T12:00:00Z'),
          completedAt: new Date('2026-01-19T12:01:00Z'),
          claimedLamports: BigInt(1000000000),
          burnedTokens: BigInt(500000000),
          lpTokensAdded: BigInt(0),
          dividendsPaid: BigInt(0),
          errorMessage: null,
          retryCount: 0,
          createdAt: new Date('2026-01-19'),
          updatedAt: new Date('2026-01-19'),
        },
      ];

      mockPrismaClient.automationJob.findMany.mockResolvedValue(mockJobs);

      const response = await server.executeOperation({
        query: `
          query GetAutomationJobs($tokenId: ID!) {
            automationJobs(tokenId: $tokenId) {
              id
              jobType
              status
              burnedTokens
              completedAt
            }
          }
        `,
        variables: { tokenId: 'token-1' },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null,
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.automationJobs).toHaveLength(1);
        expect(response.body.singleResult.data?.automationJobs[0].jobType).toBe('BURN');
        expect(response.body.singleResult.data?.automationJobs[0].status).toBe('COMPLETED');
      }
    });
  });
});
