'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import * as Slider from '@radix-ui/react-slider';
import { Wallet, Lock, TrendingUp, Loader2, Info } from 'lucide-react';
import { cn, formatNumber, calculateEffectiveStake, calculateUnlockDate, formatDate, getStakingTier } from '@/lib/utils';
import { LOCK_DURATIONS, STAKING_TIERS } from '@/lib/constants';
import { useAnalytics } from '@/hooks/useAnalytics';

interface StakeFormProps {
  onStake: (amount: number, lockDuration: number) => Promise<boolean>;
  isStaking: boolean;
  balance?: number;
}

export function StakeForm({ onStake, isStaking, balance = 0 }: StakeFormProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [amount, setAmount] = useState<string>('');
  const [lockDurationIndex, setLockDurationIndex] = useState(0);

  const numericAmount = parseFloat(amount) || 0;
  const selectedDuration = LOCK_DURATIONS[lockDurationIndex];
  const effectiveStake = calculateEffectiveStake(numericAmount, selectedDuration.days);
  const unlockDate = calculateUnlockDate(selectedDuration.days);
  const projectedTier = getStakingTier(effectiveStake);

  const handleStake = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (numericAmount <= 0 || numericAmount > balance) return;

    const success = await onStake(numericAmount, selectedDuration.days);
    if (success) {
      setAmount('');
    }
  };

  const handleMaxAmount = () => {
    setAmount(balance.toString());
  };

  const isValidAmount = numericAmount > 0 && numericAmount <= balance;

  return (
    <div className="space-y-6">
      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="label">Stake Amount</label>
          <span className="text-sm text-muted-foreground">
            Balance: {formatNumber(balance, 0)} KR8TIV
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="input pr-20 text-lg"
            min={0}
            max={balance}
          />
          <button
            onClick={handleMaxAmount}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost h-7 px-2 text-xs"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Lock Duration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="label">Lock Duration</label>
          <span className="text-sm font-medium text-primary">
            {selectedDuration.multiplier}x multiplier
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {LOCK_DURATIONS.map((duration, index) => (
            <button
              key={duration.days}
              onClick={() => setLockDurationIndex(index)}
              className={cn(
                'p-3 rounded-lg border text-center transition-all',
                lockDurationIndex === index
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <p className="font-semibold text-sm">{duration.label}</p>
              <p className="text-xs text-muted-foreground">{duration.multiplier}x</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>
            Unlock date: <strong className="text-foreground">{formatDate(unlockDate)}</strong>
          </span>
        </div>
      </div>

      {/* Preview */}
      {numericAmount > 0 && (
        <div className="p-4 bg-background rounded-lg space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Stake Preview
          </h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Base Amount</p>
              <p className="font-semibold">{formatNumber(numericAmount, 0)} KR8TIV</p>
            </div>
            <div>
              <p className="text-muted-foreground">Effective Stake</p>
              <p className="font-semibold text-primary">{formatNumber(effectiveStake, 0)} KR8TIV</p>
            </div>
            <div>
              <p className="text-muted-foreground">Multiplier</p>
              <p className="font-semibold">{selectedDuration.multiplier}x</p>
            </div>
            <div>
              <p className="text-muted-foreground">Projected Tier</p>
              <p className={cn('font-semibold', STAKING_TIERS[projectedTier].discount > 0 && 'text-primary')}>
                {STAKING_TIERS[projectedTier].name}
              </p>
            </div>
          </div>

          {STAKING_TIERS[projectedTier].discount > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-sm">
                You will receive{' '}
                <strong className="text-primary">{STAKING_TIERS[projectedTier].discount}% discount</strong>{' '}
                on launch fees
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-500">How it works</p>
            <p className="text-muted-foreground mt-1">
              Longer lock durations give you a higher effective stake through multipliers.
              This helps you reach higher tiers faster and earn more rewards.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      {!connected ? (
        <button onClick={() => setVisible(true)} className="btn-primary w-full">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet to Stake
        </button>
      ) : (
        <button
          onClick={handleStake}
          disabled={!isValidAmount || isStaking}
          className={cn(
            'btn-primary w-full',
            (!isValidAmount || isStaking) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isStaking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Staking...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Stake {numericAmount > 0 ? formatNumber(numericAmount, 0) : ''} KR8TIV
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default StakeForm;
