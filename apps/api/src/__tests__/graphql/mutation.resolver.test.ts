import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLContext } from '../../graphql/context';

// Mock PrismaClient
const mockPrismaClient = {
  token: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  staker: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  creator: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  automationJob: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  platformStats: {
    upsert: vi.fn(),
  },
};

// Mock services
vi.mock('../../services/launchpad.service', () => ({
  LaunchpadService: {
    launchToken: vi.fn(),
  },
}));

vi.mock('../../services/staking.service', () => ({
  StakingService: {
    stake: vi.fn(),
    unstake: vi.fn(),
    claimRewards: vi.fn(),
  },
}));

vi.mock('../../services/automation.service', () => ({
  AutomationService: {
    triggerJob: vi.fn(),
  },
}));

vi.mock('../../db/prisma', () => ({
  default: mockPrismaClient,
}));

describe('GraphQL Mutation Resolvers', () => {
  let server: ApolloServer<GraphQLContext>;

  beforeEach(async () => {
    const { typeDefs } = await import('../../graphql/schema');
    const { resolvers } = await import('../../graphql/resolvers');

    const schema = makeExecutableSchema({ typeDefs, resolvers });
    server = new ApolloServer<GraphQLContext>({ schema });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('launchToken mutation', () => {
    it('should launch a new token', async () => {
      const { LaunchpadService } = await import('../../services/launchpad.service');

      const mockLaunchResult = {
        success: true,
        tokenId: 'new-token-id',
        tokenMint: 'NewTokenMint123456789',
        configKey: 'ConfigKey123456789',
        bagsPoolAddress: 'PoolAddress123456789',
        launchUrl: 'https://bags.fm/token/NewTokenMint123456789',
      };

      (LaunchpadService.launchToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockLaunchResult);

      const response = await server.executeOperation({
        query: `
          mutation LaunchToken($input: LaunchTokenInput!) {
            launchToken(input: $input) {
              success
              tokenId
              tokenMint
              configKey
              bagsPoolAddress
              launchUrl
              error
            }
          }
        `,
        variables: {
          input: {
            name: 'New Token',
            symbol: 'NEW',
            description: 'A new test token',
            creatorWallet: 'Cre4torWa11et123456789',
            burnEnabled: true,
            burnPercentage: 100,
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Cre4torWa11et123456789', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.launchToken.success).toBe(true);
        expect(response.body.singleResult.data?.launchToken.tokenMint).toBe('NewTokenMint123456789');
      }
    });

    it('should reject launch without authentication', async () => {
      const response = await server.executeOperation({
        query: `
          mutation LaunchToken($input: LaunchTokenInput!) {
            launchToken(input: $input) {
              success
              error
            }
          }
        `,
        variables: {
          input: {
            name: 'New Token',
            symbol: 'NEW',
            creatorWallet: 'Cre4torWa11et123456789',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: null, // Not authenticated
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        // Should either return error in data or throw GraphQL error
        const hasError = response.body.singleResult.errors !== undefined ||
          (response.body.singleResult.data?.launchToken?.success === false);
        expect(hasError).toBe(true);
      }
    });
  });

  describe('stake mutation', () => {
    it('should stake tokens successfully', async () => {
      const { StakingService } = await import('../../services/staking.service');

      const mockStakeResult = {
        success: true,
        signature: 'TxSignature123456789',
        newStakedAmount: '100000000000000',
        newTier: 'VIP',
      };

      (StakingService.stake as ReturnType<typeof vi.fn>).mockResolvedValue(mockStakeResult);

      const response = await server.executeOperation({
        query: `
          mutation Stake($input: StakeInput!) {
            stake(input: $input) {
              success
              signature
              staker {
                wallet
                stakedAmount
                tier
              }
              error
            }
          }
        `,
        variables: {
          input: {
            wallet: 'Sta4kerWa11et123456789',
            amount: '100000000000000',
            lockDurationDays: 180,
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Sta4kerWa11et123456789', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.stake.success).toBe(true);
        expect(response.body.singleResult.data?.stake.signature).toBe('TxSignature123456789');
      }
    });
  });

  describe('unstake mutation', () => {
    it('should unstake tokens successfully', async () => {
      const { StakingService } = await import('../../services/staking.service');

      const mockUnstakeResult = {
        success: true,
        signature: 'UnstakeTxSig123456789',
        newStakedAmount: '10000000000000',
        newTier: 'PREMIUM',
      };

      (StakingService.unstake as ReturnType<typeof vi.fn>).mockResolvedValue(mockUnstakeResult);

      const response = await server.executeOperation({
        query: `
          mutation Unstake($input: UnstakeInput!) {
            unstake(input: $input) {
              success
              signature
              staker {
                wallet
                stakedAmount
                tier
              }
              error
            }
          }
        `,
        variables: {
          input: {
            wallet: 'Sta4kerWa11et123456789',
            amount: '50000000000',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Sta4kerWa11et123456789', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.unstake.success).toBe(true);
      }
    });

    it('should reject unstake before lock period ends', async () => {
      const { StakingService } = await import('../../services/staking.service');

      (StakingService.unstake as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Tokens are still locked. Lock period ends: 2026-06-15',
      });

      const response = await server.executeOperation({
        query: `
          mutation Unstake($input: UnstakeInput!) {
            unstake(input: $input) {
              success
              error
            }
          }
        `,
        variables: {
          input: {
            wallet: 'Sta4kerWa11et123456789',
            amount: '50000000000',
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Sta4kerWa11et123456789', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.unstake.success).toBe(false);
        expect(response.body.singleResult.data?.unstake.error).toContain('locked');
      }
    });
  });

  describe('claimRewards mutation', () => {
    it('should claim rewards successfully', async () => {
      const { StakingService } = await import('../../services/staking.service');

      (StakingService.claimRewards as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        signature: 'ClaimTxSig123456789',
        amount: '5000000000',
      });

      const response = await server.executeOperation({
        query: `
          mutation ClaimRewards($wallet: String!) {
            claimRewards(wallet: $wallet) {
              success
              signature
              amount
              error
            }
          }
        `,
        variables: {
          wallet: 'Sta4kerWa11et123456789',
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Sta4kerWa11et123456789', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.claimRewards.success).toBe(true);
        expect(response.body.singleResult.data?.claimRewards.amount).toBe('5000000000');
      }
    });
  });

  describe('triggerAutomation mutation (admin only)', () => {
    it('should trigger automation job as admin', async () => {
      const { AutomationService } = await import('../../services/automation.service');

      (AutomationService.triggerJob as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        jobId: 'new-job-id',
        message: 'Automation job triggered successfully',
      });

      const response = await server.executeOperation({
        query: `
          mutation TriggerAutomation($input: TriggerAutomationInput!) {
            triggerAutomation(input: $input) {
              success
              jobId
              message
              error
            }
          }
        `,
        variables: {
          input: {
            tokenId: 'token-1',
            jobType: 'BURN',
            immediate: true,
          },
        },
      }, {
        contextValue: {
          prisma: mockPrismaClient,
          user: { wallet: 'Adm1nWa11et123456789', isAdmin: true },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.triggerAutomation.success).toBe(true);
        expect(response.body.singleResult.data?.triggerAutomation.jobId).toBe('new-job-id');
      }
    });

    it('should reject automation trigger from non-admin', async () => {
      const response = await server.executeOperation({
        query: `
          mutation TriggerAutomation($input: TriggerAutomationInput!) {
            triggerAutomation(input: $input) {
              success
              error
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
          user: { wallet: 'RegularUser123456789', isAdmin: false },
          requestId: 'test-request-id',
        },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        // Should have an error (either GraphQL error or success=false)
        const hasError = response.body.singleResult.errors !== undefined ||
          response.body.singleResult.data?.triggerAutomation?.success === false;
        expect(hasError).toBe(true);
      }
    });
  });
});
