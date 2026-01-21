'use client';

import { useState } from 'react';
import { Gift, Loader2, TrendingUp, Clock } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { UserStake } from '@/lib/api';

interface RewardsDisplayProps {
  userStake: UserStake | null;
  onClaim: () => Promise<{ success: boolean; amount?: number }>;
  isClaiming: boolean;
}

export function RewardsDisplay({ userStake, onClaim, isClaiming }: RewardsDisplayProps) {
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);

  const pendingRewards = userStake?.pendingRewards || 0;
  const hasRewards = pendingRewards > 0;

  const handleClaim = async () => {
    const result = await onClaim();
    if (result.success && result.amount) {
      setClaimedAmount(result.amount);
      setShowClaimSuccess(true);
      setTimeout(() => {
        setShowClaimSuccess(false);
        setClaimedAmount(null);
      }, 3000);
    }
  };

  if (!userStake) {
    return (
      <div className="text-center p-8">
        <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Stake KR8TIV tokens to start earning rewards
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Rewards */}
      <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
        <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-1">Pending Rewards</p>
        <p className="text-3xl font-bold gradient-text">
          {formatNumber(pendingRewards, 4)}
        </p>
        <p className="text-sm text-muted-foreground">KR8TIV</p>
      </div>

      {/* Claim Success Message */}
      {showClaimSuccess && claimedAmount && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-green-500">Rewards Claimed!</p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(claimedAmount, 4)} KR8TIV added to your wallet
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reward Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Earning Rate</span>
          </div>
          <p className="font-semibold">
            ~{formatNumber((pendingRewards / 24) * 365, 2)} KR8TIV/year
          </p>
        </div>
        <div className="p-4 bg-background rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Next Reward</span>
          </div>
          <p className="font-semibold">Every block</p>
        </div>
      </div>

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={!hasRewards || isClaiming}
        className={cn(
          'btn-primary w-full',
          (!hasRewards || isClaiming) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isClaiming ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Claiming...
          </>
        ) : (
          <>
            <Gift className="h-4 w-4 mr-2" />
            Claim {formatNumber(pendingRewards, 4)} KR8TIV
          </>
        )}
      </button>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Rewards are calculated based on your effective stake and automatically compound.
        Claim anytime - there are no minimum thresholds.
      </p>
    </div>
  );
}

export default RewardsDisplay;
