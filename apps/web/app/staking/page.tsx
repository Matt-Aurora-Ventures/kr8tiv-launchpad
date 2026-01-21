'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import * as Tabs from '@radix-ui/react-tabs';
import { Wallet, PiggyBank, Gift, TrendingUp } from 'lucide-react';
import { useStaking } from '@/hooks/useStaking';
import { StakingStats } from '@/components/staking/StakingStats';
import { StakeForm } from '@/components/staking/StakeForm';
import { UnstakeForm } from '@/components/staking/UnstakeForm';
import { RewardsDisplay } from '@/components/staking/RewardsDisplay';
import { TierProgress } from '@/components/staking/TierProgress';
import { cn, formatNumber } from '@/lib/utils';

export default function StakingPage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    pool,
    isLoadingPool,
    userStake,
    isLoadingStake,
    currentTier,
    tierProgress,
    isLocked,
    timeUntilUnlock,
    stake,
    unstake,
    claimRewards,
    isStaking,
    isUnstaking,
    isClaiming,
    actionError,
  } = useStaking();

  // Mock balance for demo - in production, fetch from wallet
  const mockBalance = 50000;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
          <PiggyBank className="h-4 w-4" />
          Staking Pool
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Stake KR8TIV Tokens
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Stake your KR8TIV tokens to earn rewards and unlock fee discounts.
          Longer lock periods give you higher multipliers.
        </p>
      </div>

      {/* Pool Stats */}
      <StakingStats pool={pool} isLoading={isLoadingPool} />

      {/* Error Display */}
      {actionError && (
        <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{actionError}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="mt-12 grid lg:grid-cols-3 gap-8">
        {/* Staking Form */}
        <div className="lg:col-span-2">
          {!connected ? (
            <div className="card text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to stake KR8TIV tokens and start earning rewards
              </p>
              <button onClick={() => setVisible(true)} className="btn-primary">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </button>
            </div>
          ) : (
            <Tabs.Root defaultValue="stake" className="card">
              <Tabs.List className="flex border-b border-border mb-6">
                <Tabs.Trigger
                  value="stake"
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    'border-transparent text-muted-foreground hover:text-foreground',
                    'data-[state=active]:border-primary data-[state=active]:text-primary'
                  )}
                >
                  <PiggyBank className="h-4 w-4" />
                  Stake
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="unstake"
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    'border-transparent text-muted-foreground hover:text-foreground',
                    'data-[state=active]:border-primary data-[state=active]:text-primary'
                  )}
                  disabled={!userStake}
                >
                  <TrendingUp className="h-4 w-4" />
                  Unstake
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="rewards"
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    'border-transparent text-muted-foreground hover:text-foreground',
                    'data-[state=active]:border-primary data-[state=active]:text-primary'
                  )}
                >
                  <Gift className="h-4 w-4" />
                  Rewards
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="stake" className="outline-none">
                <StakeForm
                  onStake={stake}
                  isStaking={isStaking}
                  balance={mockBalance}
                />
              </Tabs.Content>

              <Tabs.Content value="unstake" className="outline-none">
                {userStake ? (
                  <UnstakeForm
                    userStake={userStake}
                    onUnstake={unstake}
                    isUnstaking={isUnstaking}
                    isLocked={isLocked}
                    timeUntilUnlock={timeUntilUnlock}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      You have no active stake to unstake.
                    </p>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="rewards" className="outline-none">
                <RewardsDisplay
                  userStake={userStake}
                  onClaim={claimRewards}
                  isClaiming={isClaiming}
                />
              </Tabs.Content>
            </Tabs.Root>
          )}
        </div>

        {/* Tier Progress */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6">Your Tier</h2>
          <TierProgress
            currentTier={currentTier}
            effectiveStake={userStake?.effectiveAmount || 0}
          />
        </div>
      </div>
    </div>
  );
}
