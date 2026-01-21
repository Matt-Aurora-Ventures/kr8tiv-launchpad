'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Rocket,
  AlertTriangle,
  Wallet,
  Coins,
  FileText,
  Settings,
  Check,
  Loader2,
} from 'lucide-react';
import { useLaunch } from '@/hooks/useLaunch';
import { useDiscount } from '@/hooks/useDiscount';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn, formatCompact, calculateTotalTax } from '@/lib/utils';
import { BASE_LAUNCH_FEE_SOL, BASE_LAUNCH_FEE_PERCENT } from '@/lib/constants';
import { TaxBadges } from '../shared/TaxBadges';
import { FeeBreakdownChart } from '../shared/FeeBreakdownChart';

interface ReviewStepProps {
  onBack: () => void;
}

export function ReviewStep({ onBack }: ReviewStepProps) {
  const { connected, publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const { tokenInfo, taxConfig, launch, isLaunching, launchError, launchResult } = useLaunch();
  const { discount } = useDiscount();
  const { trackLaunchStart, trackLaunchComplete, track } = useAnalytics();
  const [confirmed, setConfirmed] = useState(false);

  const totalTax = calculateTotalTax(taxConfig);
  const effectiveFee = discount?.effectiveFee ?? BASE_LAUNCH_FEE_PERCENT;
  const discountPercent = discount?.discount ?? 0;

  const handleLaunch = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!confirmed) return;

    // Track launch attempt
    trackLaunchStart(tokenInfo.symbol, tokenInfo.supply);

    try {
      let signatureBase64 = '';
      if (signMessage) {
        // Create message to sign
        const message = `Launch token: ${tokenInfo.name} (${tokenInfo.symbol})`;
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await signMessage(encodedMessage);
        signatureBase64 = Buffer.from(signature).toString('base64');
      }

      await launch(signatureBase64, publicKey.toBase58());

      // Track successful launch (launchResult will be populated by the store)
      // Note: The actual tracking happens in the success step when we have the mint address
    } catch (error) {
      console.error('Failed to sign message:', error);
      // Track failed launch attempt
      track({
        name: 'token_launch_complete',
        properties: {
          symbol: tokenInfo.symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Launch</h2>
        <p className="text-muted-foreground">
          Review your token configuration before launching. This cannot be changed after.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Token Info Review */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Token Information</h3>
          </div>

          <div className="flex items-start gap-4 mb-4">
            {tokenInfo.image ? (
              <img
                src={tokenInfo.image}
                alt={tokenInfo.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {tokenInfo.symbol.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h4 className="text-xl font-bold">{tokenInfo.name}</h4>
              <p className="text-muted-foreground">${tokenInfo.symbol}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{tokenInfo.description}</p>

          <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Total Supply</p>
              <p className="font-semibold">{formatCompact(tokenInfo.supply)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Decimals</p>
              <p className="font-semibold">{tokenInfo.decimals}</p>
            </div>
          </div>
        </div>

        {/* Tax Config Review */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Tax Configuration</h3>
          </div>

          {totalTax > 0 ? (
            <>
              <TaxBadges taxConfig={taxConfig} className="mb-4" />
              <FeeBreakdownChart taxConfig={taxConfig} />
            </>
          ) : (
            <div className="p-6 text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium">No Transaction Tax</p>
              <p className="text-sm text-muted-foreground">
                Your token will have 0% tax on all transactions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Launch Fee */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Launch Fee</h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Network Fee</p>
            <p className="text-xl font-bold">{BASE_LAUNCH_FEE_SOL} SOL</p>
          </div>

          <div className="p-4 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Platform Fee</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold">{effectiveFee.toFixed(2)}%</p>
              {discountPercent > 0 && (
                <span className="text-sm text-green-500">
                  (-{discountPercent}% from staking)
                </span>
              )}
            </div>
          </div>

          {discount && discount.tier !== 'NONE' && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-primary mb-1">Your Tier</p>
              <p className="text-xl font-bold text-primary">{discount.tier}</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation */}
      <div className="card border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-500 mb-2">Final Confirmation</h4>
            <p className="text-sm text-muted-foreground mb-4">
              By launching this token, you confirm that:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                You have reviewed all token information and it is correct
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                You understand the tax configuration cannot be changed after launch
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                You agree to pay the launch fee
              </li>
            </ul>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">
                I confirm and agree to proceed with the launch
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Error */}
      {launchError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{launchError}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="btn-outline">
          Back
        </button>

        {!connected ? (
          <button onClick={() => setVisible(true)} className="btn-primary px-8">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={handleLaunch}
            disabled={!confirmed || isLaunching}
            className={cn(
              'btn-primary px-8 glow',
              (!confirmed || isLaunching) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Launch Token
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReviewStep;
