'use client';

import { Unlock, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn, formatNumber, formatDate, formatRelativeTime } from '@/lib/utils';
import { UserStake } from '@/lib/api';

interface UnstakeFormProps {
  userStake: UserStake;
  onUnstake: () => Promise<boolean>;
  isUnstaking: boolean;
  isLocked: boolean;
  timeUntilUnlock: number | null;
}

export function UnstakeForm({
  userStake,
  onUnstake,
  isUnstaking,
  isLocked,
  timeUntilUnlock,
}: UnstakeFormProps) {
  const unlockDate = new Date(userStake.unlockDate);
  const daysRemaining = timeUntilUnlock
    ? Math.ceil(timeUntilUnlock / (1000 * 60 * 60 * 24))
    : 0;

  const handleUnstake = async () => {
    if (isLocked) return;
    await onUnstake();
  };

  return (
    <div className="space-y-6">
      {/* Current Stake Info */}
      <div className="p-4 bg-background rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Staked Amount</span>
          <span className="font-semibold">{formatNumber(userStake.amount, 0)} KR8TIV</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Effective Stake</span>
          <span className="font-semibold text-primary">
            {formatNumber(userStake.effectiveAmount, 0)} KR8TIV
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Lock Duration</span>
          <span className="font-semibold">{userStake.lockDuration} days</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Unlock Date</span>
          <span className={cn('font-semibold', isLocked ? 'text-yellow-500' : 'text-green-500')}>
            {formatDate(unlockDate)}
          </span>
        </div>
      </div>

      {/* Lock Status */}
      {isLocked ? (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
          <div className="flex gap-3">
            <Lock className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">Stake is Locked</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your stake will unlock in{' '}
                <strong className="text-foreground">{formatRelativeTime(unlockDate)}</strong>
                {daysRemaining > 0 && ` (${daysRemaining} days remaining)`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You cannot unstake until the lock period ends.
                Your rewards will continue to accumulate.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
          <div className="flex gap-3">
            <Unlock className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-500">Stake is Unlocked</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your lock period has ended. You can now unstake your tokens.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      {!isLocked && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground mt-1">
                Unstaking will reset your tier benefits and you will lose your current
                effective stake multiplier. Consider re-staking with a longer lock period
                for better benefits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unstake Button */}
      <button
        onClick={handleUnstake}
        disabled={isLocked || isUnstaking}
        className={cn(
          'w-full',
          isLocked ? 'btn-outline opacity-50 cursor-not-allowed' : 'btn-destructive'
        )}
      >
        {isUnstaking ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Unstaking...
          </>
        ) : isLocked ? (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Locked for {formatRelativeTime(unlockDate)}
          </>
        ) : (
          <>
            <Unlock className="h-4 w-4 mr-2" />
            Unstake {formatNumber(userStake.amount, 0)} KR8TIV
          </>
        )}
      </button>
    </div>
  );
}

export default UnstakeForm;
