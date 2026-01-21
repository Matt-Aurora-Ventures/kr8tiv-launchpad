'use client';

import { useState } from 'react';
import { Flame, Droplets, Users, Wallet, Plus, Trash2, AlertTriangle, Info } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { useLaunch } from '@/hooks/useLaunch';
import { cn, calculateTotalTax } from '@/lib/utils';
import {
  MAX_TOTAL_TAX_PERCENT,
  MAX_BURN_PERCENT,
  MAX_LP_PERCENT,
  MAX_DIVIDENDS_PERCENT,
  MAX_CUSTOM_WALLETS,
  MAX_CUSTOM_WALLET_PERCENT,
} from '@/lib/constants';
import { FeeBreakdownChart } from '../shared/FeeBreakdownChart';

interface TaxConfigStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function TaxConfigStep({ onNext, onBack }: TaxConfigStepProps) {
  const {
    taxConfig,
    updateTaxConfig,
    addCustomWallet,
    removeCustomWallet,
    updateCustomWallet,
    isTaxConfigValid,
  } = useLaunch();

  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');

  const validation = isTaxConfigValid();
  const totalTax = calculateTotalTax(taxConfig);

  const handleAddWallet = () => {
    if (
      newWalletAddress &&
      taxConfig.customWallets.length < MAX_CUSTOM_WALLETS
    ) {
      addCustomWallet({
        address: newWalletAddress,
        percent: 1,
        label: newWalletLabel || `Wallet ${taxConfig.customWallets.length + 1}`,
      });
      setNewWalletAddress('');
      setNewWalletLabel('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation.valid) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tax Configuration</h2>
        <p className="text-muted-foreground">
          All tax features are <strong>opt-in</strong> and disabled by default.
          Enable only what your project needs.
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              Maximum total tax: <strong>{MAX_TOTAL_TAX_PERCENT}%</strong>.
              Current total: <strong className={cn(totalTax > MAX_TOTAL_TAX_PERCENT && 'text-destructive')}>{totalTax}%</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Tax Options */}
        <div className="space-y-6">
          {/* Burn Tax */}
          <TaxToggle
            icon={Flame}
            iconColor="text-red-500"
            title="Burn Tax"
            description="Automatically burn tokens on each transaction"
            enabled={taxConfig.burnEnabled}
            onToggle={(enabled) =>
              updateTaxConfig({ burnEnabled: enabled, burnPercent: enabled ? 1 : 0 })
            }
            percent={taxConfig.burnPercent}
            maxPercent={MAX_BURN_PERCENT}
            onPercentChange={(percent) => updateTaxConfig({ burnPercent: percent })}
          />

          {/* LP Tax */}
          <TaxToggle
            icon={Droplets}
            iconColor="text-green-500"
            title="LP Tax"
            description="Add to liquidity pool on each transaction"
            enabled={taxConfig.lpEnabled}
            onToggle={(enabled) =>
              updateTaxConfig({ lpEnabled: enabled, lpPercent: enabled ? 1 : 0 })
            }
            percent={taxConfig.lpPercent}
            maxPercent={MAX_LP_PERCENT}
            onPercentChange={(percent) => updateTaxConfig({ lpPercent: percent })}
          />

          {/* Dividends Tax */}
          <TaxToggle
            icon={Users}
            iconColor="text-blue-500"
            title="Holder Dividends"
            description="Distribute rewards to token holders"
            enabled={taxConfig.dividendsEnabled}
            onToggle={(enabled) =>
              updateTaxConfig({ dividendsEnabled: enabled, dividendsPercent: enabled ? 1 : 0 })
            }
            percent={taxConfig.dividendsPercent}
            maxPercent={MAX_DIVIDENDS_PERCENT}
            onPercentChange={(percent) => updateTaxConfig({ dividendsPercent: percent })}
          />

          {/* Custom Wallets */}
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Custom Wallets</h3>
                    <p className="text-sm text-muted-foreground">
                      Route fees to marketing, dev, or other wallets
                    </p>
                  </div>
                  <Switch.Root
                    checked={taxConfig.customWalletsEnabled}
                    onCheckedChange={(enabled) =>
                      updateTaxConfig({ customWalletsEnabled: enabled })
                    }
                    className="w-11 h-6 bg-secondary rounded-full relative data-[state=checked]:bg-primary transition-colors"
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                  </Switch.Root>
                </div>

                {taxConfig.customWalletsEnabled && (
                  <div className="mt-4 space-y-3">
                    {taxConfig.customWallets.map((wallet, index) => (
                      <div key={index} className="p-3 bg-background rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={wallet.label}
                            onChange={(e) =>
                              updateCustomWallet(index, { label: e.target.value })
                            }
                            className="input h-8 text-sm flex-1"
                            placeholder="Label"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomWallet(index)}
                            className="btn-ghost h-8 w-8 p-0 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={wallet.address}
                          onChange={(e) =>
                            updateCustomWallet(index, { address: e.target.value })
                          }
                          className="input h-8 text-sm font-mono mb-2"
                          placeholder="Wallet address"
                        />
                        <div className="flex items-center gap-3">
                          <Slider.Root
                            value={[wallet.percent]}
                            onValueChange={([value]) =>
                              updateCustomWallet(index, { percent: value })
                            }
                            max={MAX_CUSTOM_WALLET_PERCENT}
                            step={0.5}
                            className="flex-1 h-5 flex items-center"
                          >
                            <Slider.Track className="bg-secondary relative h-2 flex-1 rounded-full">
                              <Slider.Range className="absolute bg-purple-500 h-full rounded-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow focus:outline-none" />
                          </Slider.Root>
                          <span className="text-sm font-medium w-12 text-right">
                            {wallet.percent}%
                          </span>
                        </div>
                      </div>
                    ))}

                    {taxConfig.customWallets.length < MAX_CUSTOM_WALLETS && (
                      <div className="p-3 bg-background rounded-lg border border-dashed border-border">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newWalletLabel}
                            onChange={(e) => setNewWalletLabel(e.target.value)}
                            className="input h-8 text-sm flex-1"
                            placeholder="Label (e.g., Marketing)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newWalletAddress}
                            onChange={(e) => setNewWalletAddress(e.target.value)}
                            className="input h-8 text-sm font-mono flex-1"
                            placeholder="Wallet address"
                          />
                          <button
                            type="button"
                            onClick={handleAddWallet}
                            disabled={!newWalletAddress}
                            className="btn-secondary h-8 px-3"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {MAX_CUSTOM_WALLETS - taxConfig.customWallets.length} slots remaining
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Chart */}
        <div className="card sticky top-24">
          <h3 className="font-semibold mb-4">Fee Distribution Preview</h3>
          <FeeBreakdownChart taxConfig={taxConfig} />
        </div>
      </div>

      {/* Validation Error */}
      {!validation.valid && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{validation.error}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="btn-outline">
          Back
        </button>
        <button
          type="submit"
          disabled={!validation.valid}
          className={cn(
            'btn-primary px-8',
            !validation.valid && 'opacity-50 cursor-not-allowed'
          )}
        >
          Review & Launch
        </button>
      </div>
    </form>
  );
}

// Tax Toggle Component
interface TaxToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  percent: number;
  maxPercent: number;
  onPercentChange: (percent: number) => void;
}

function TaxToggle({
  icon: Icon,
  iconColor,
  title,
  description,
  enabled,
  onToggle,
  percent,
  maxPercent,
  onPercentChange,
}: TaxToggleProps) {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', `${iconColor}/10`)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch.Root
              checked={enabled}
              onCheckedChange={onToggle}
              className="w-11 h-6 bg-secondary rounded-full relative data-[state=checked]:bg-primary transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>

          {enabled && (
            <div className="mt-4 flex items-center gap-3">
              <Slider.Root
                value={[percent]}
                onValueChange={([value]) => onPercentChange(value)}
                max={maxPercent}
                step={0.5}
                className="flex-1 h-5 flex items-center"
              >
                <Slider.Track className="bg-secondary relative h-2 flex-1 rounded-full">
                  <Slider.Range className={cn('absolute h-full rounded-full', iconColor.replace('text-', 'bg-'))} />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow focus:outline-none" />
              </Slider.Root>
              <span className="text-sm font-medium w-12 text-right">{percent}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaxConfigStep;
