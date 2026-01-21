'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Trash2, Plus, Bell, BellOff } from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

interface WatchlistToken {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  alertEnabled?: boolean;
  alertPrice?: number;
}

interface WatchlistProps {
  tokens?: WatchlistToken[];
  onRemove?: (mint: string) => void;
  onToggleAlert?: (mint: string) => void;
  onSetAlertPrice?: (mint: string, price: number) => void;
  isLoading?: boolean;
  className?: string;
}

const STORAGE_KEY = 'kr8tiv_watchlist';

export function Watchlist({
  tokens: propTokens,
  onRemove,
  onToggleAlert,
  onSetAlertPrice,
  isLoading = false,
  className,
}: WatchlistProps) {
  const [tokens, setTokens] = useState<WatchlistToken[]>(propTokens || []);
  const [editingAlert, setEditingAlert] = useState<string | null>(null);
  const [alertValue, setAlertValue] = useState<string>('');

  // Load from localStorage on mount
  useEffect(() => {
    if (!propTokens) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setTokens(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load watchlist:', e);
        }
      }
    }
  }, [propTokens]);

  // Save to localStorage on change
  useEffect(() => {
    if (!propTokens) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }
  }, [tokens, propTokens]);

  const handleRemove = (mint: string) => {
    if (onRemove) {
      onRemove(mint);
    } else {
      setTokens((prev) => prev.filter((t) => t.mint !== mint));
    }
  };

  const handleToggleAlert = (mint: string) => {
    if (onToggleAlert) {
      onToggleAlert(mint);
    } else {
      setTokens((prev) =>
        prev.map((t) =>
          t.mint === mint ? { ...t, alertEnabled: !t.alertEnabled } : t
        )
      );
    }
  };

  const handleSetAlertPrice = (mint: string) => {
    const price = parseFloat(alertValue);
    if (isNaN(price) || price <= 0) return;

    if (onSetAlertPrice) {
      onSetAlertPrice(mint, price);
    } else {
      setTokens((prev) =>
        prev.map((t) =>
          t.mint === mint ? { ...t, alertPrice: price, alertEnabled: true } : t
        )
      );
    }
    setEditingAlert(null);
    setAlertValue('');
  };

  if (isLoading) {
    return (
      <div className={cn('card', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-secondary rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Watchlist</h3>
          <span className="text-sm text-muted-foreground">({tokens.length})</span>
        </div>
      </div>

      {/* Token List */}
      {tokens.length === 0 ? (
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Your watchlist is empty</p>
          <p className="text-sm text-muted-foreground">Star tokens to track them here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => {
            const isPositive = token.priceChange24h >= 0;

            return (
              <div
                key={token.mint}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.symbol}</span>
                      {token.alertEnabled && (
                        <Bell className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${formatNumber(token.price, 6)}</p>
                    <p className={cn('text-xs flex items-center justify-end gap-1', isPositive ? 'text-green-500' : 'text-red-500')}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? '+' : ''}{formatNumber(token.priceChange24h, 2)}%
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Alert button */}
                    {editingAlert === token.mint ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={alertValue}
                          onChange={(e) => setAlertValue(e.target.value)}
                          placeholder="Price"
                          className="input w-20 text-xs py-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSetAlertPrice(token.mint)}
                          className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (token.alertEnabled) {
                            handleToggleAlert(token.mint);
                          } else {
                            setEditingAlert(token.mint);
                            setAlertValue(token.alertPrice?.toString() || '');
                          }
                        }}
                        className={cn(
                          'p-1.5 rounded hover:bg-secondary transition-colors',
                          token.alertEnabled ? 'text-yellow-500' : 'text-muted-foreground'
                        )}
                        title={token.alertEnabled ? 'Disable alert' : 'Set price alert'}
                      >
                        {token.alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </button>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(token.mint)}
                      className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Market Cap Summary */}
      {tokens.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Watchlist Market Cap</span>
            <span className="font-medium">
              ${formatCompact(tokens.reduce((sum, t) => sum + t.marketCap, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Watchlist;
