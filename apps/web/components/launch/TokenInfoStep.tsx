'use client';

import { Image, Info } from 'lucide-react';
import { useLaunch } from '@/hooks/useLaunch';
import { cn, formatCompact } from '@/lib/utils';
import { DEFAULT_TOKEN_SUPPLY, DEFAULT_TOKEN_DECIMALS } from '@/lib/constants';

interface TokenInfoStepProps {
  onNext: () => void;
}

export function TokenInfoStep({ onNext }: TokenInfoStepProps) {
  const { tokenInfo, updateTokenInfo, isTokenInfoValid } = useLaunch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTokenInfoValid()) {
      onNext();
    }
  };

  const isValid = isTokenInfoValid();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Token Information</h2>
        <p className="text-muted-foreground">
          Enter the basic details for your token. These cannot be changed after launch.
        </p>
      </div>

      {/* Token Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="label">
          Token Name <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={tokenInfo.name}
          onChange={(e) => updateTokenInfo({ name: e.target.value })}
          placeholder="e.g., My Awesome Token"
          className="input"
          minLength={2}
          maxLength={32}
          required
        />
        <p className="text-xs text-muted-foreground">
          2-32 characters. Choose something memorable and unique.
        </p>
      </div>

      {/* Token Symbol */}
      <div className="space-y-2">
        <label htmlFor="symbol" className="label">
          Symbol <span className="text-destructive">*</span>
        </label>
        <input
          id="symbol"
          type="text"
          value={tokenInfo.symbol}
          onChange={(e) => updateTokenInfo({ symbol: e.target.value.toUpperCase() })}
          placeholder="e.g., MAT"
          className="input uppercase"
          minLength={2}
          maxLength={10}
          required
        />
        <p className="text-xs text-muted-foreground">
          2-10 characters. Typically 3-5 uppercase letters.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="label">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          value={tokenInfo.description}
          onChange={(e) => updateTokenInfo({ description: e.target.value })}
          placeholder="Describe your token project, its purpose, and what makes it unique..."
          className="textarea h-24"
          minLength={10}
          maxLength={500}
          required
        />
        <p className="text-xs text-muted-foreground">
          {tokenInfo.description.length}/500 characters
        </p>
      </div>

      {/* Token Image URL */}
      <div className="space-y-2">
        <label htmlFor="image" className="label">
          Image URL <span className="text-muted-foreground">(optional)</span>
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              id="image"
              type="url"
              value={tokenInfo.image}
              onChange={(e) => updateTokenInfo({ image: e.target.value })}
              placeholder="https://example.com/token-logo.png"
              className="input"
            />
          </div>
          {tokenInfo.image && (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border">
              <img
                src={tokenInfo.image}
                alt="Token preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Recommended: Square image, at least 200x200 pixels
        </p>
      </div>

      {/* Supply and Decimals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="supply" className="label">
            Total Supply <span className="text-destructive">*</span>
          </label>
          <input
            id="supply"
            type="number"
            value={tokenInfo.supply}
            onChange={(e) => updateTokenInfo({ supply: Number(e.target.value) })}
            className="input"
            min={1}
            max={1e15}
            required
          />
          <p className="text-xs text-muted-foreground">
            {formatCompact(tokenInfo.supply)} tokens
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="decimals" className="label">
            Decimals <span className="text-destructive">*</span>
          </label>
          <input
            id="decimals"
            type="number"
            value={tokenInfo.decimals}
            onChange={(e) => updateTokenInfo({ decimals: Number(e.target.value) })}
            className="input"
            min={0}
            max={18}
            required
          />
          <p className="text-xs text-muted-foreground">
            Standard: 9 (like SOL)
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-500">Important</p>
            <p className="text-sm text-muted-foreground mt-1">
              Token name, symbol, supply, and decimals are immutable once the token is created.
              Double-check everything before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid}
          className={cn(
            'btn-primary px-8',
            !isValid && 'opacity-50 cursor-not-allowed'
          )}
        >
          Continue to Tax Config
        </button>
      </div>
    </form>
  );
}

export default TokenInfoStep;
