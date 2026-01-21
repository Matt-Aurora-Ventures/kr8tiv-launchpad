'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Droplets, TrendingUp, Percent, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

interface LiquidityData {
  timestamp: number;
  tvl: number;
  volume: number;
}

interface LiquidityPoolProps {
  tokenSymbol?: string;
  tvl?: number;
  tvlChange24h?: number;
  volume24h?: number;
  volumeChange24h?: number;
  fees24h?: number;
  apr?: number;
  tokenReserve?: number;
  solReserve?: number;
  historicalData?: LiquidityData[];
  isLoading?: boolean;
  className?: string;
}

export function LiquidityPool({
  tokenSymbol = 'TOKEN',
  tvl = 0,
  tvlChange24h = 0,
  volume24h = 0,
  volumeChange24h = 0,
  fees24h = 0,
  apr = 0,
  tokenReserve = 0,
  solReserve = 0,
  historicalData = [],
  isLoading = false,
  className,
}: LiquidityPoolProps) {
  const tokenPrice = useMemo(() => {
    if (tokenReserve === 0) return 0;
    return (solReserve * 150) / tokenReserve; // Assuming SOL = $150
  }, [tokenReserve, solReserve]);

  const poolRatio = useMemo(() => {
    const total = tokenReserve + (solReserve * 150 / tokenPrice || 1);
    return {
      token: total > 0 ? (tokenReserve / total) * 100 : 50,
      sol: total > 0 ? ((solReserve * 150 / tokenPrice) / total) * 100 : 50,
    };
  }, [tokenReserve, solReserve, tokenPrice]);

  if (isLoading) {
    return (
      <div className={cn('card', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-secondary rounded" />
          <div className="h-32 bg-secondary rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">{tokenSymbol}/SOL Liquidity Pool</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm flex items-center gap-1',
            tvlChange24h >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {tvlChange24h >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {tvlChange24h >= 0 ? '+' : ''}{formatNumber(tvlChange24h, 2)}%
          </span>
        </div>
      </div>

      {/* TVL Chart */}
      {historicalData.length > 0 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <p className="text-xs text-muted-foreground">
                          {new Date(payload[0].payload.timestamp).toLocaleDateString()}
                        </p>
                        <p className="font-semibold">${formatCompact(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="tvl"
                stroke="rgb(59, 130, 246)"
                fill="url(#tvlGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">TVL</span>
          </div>
          <p className="font-semibold">${formatCompact(tvl)}</p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">24h Volume</span>
          </div>
          <p className="font-semibold">${formatCompact(volume24h)}</p>
          <p className={cn(
            'text-xs',
            volumeChange24h >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {volumeChange24h >= 0 ? '+' : ''}{formatNumber(volumeChange24h, 2)}%
          </p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">24h Fees</span>
          </div>
          <p className="font-semibold">${formatCompact(fees24h)}</p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="h-4 w-4" />
            <span className="text-xs">APR</span>
          </div>
          <p className="font-semibold text-green-500">{formatNumber(apr, 2)}%</p>
        </div>
      </div>

      {/* Pool Composition */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Pool Composition</p>

        {/* Ratio Bar */}
        <div className="h-4 rounded-full overflow-hidden flex">
          <div
            className="bg-primary transition-all"
            style={{ width: `${poolRatio.token}%` }}
          />
          <div
            className="bg-purple-500 transition-all"
            style={{ width: `${poolRatio.sol}%` }}
          />
        </div>

        {/* Reserve Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                {tokenSymbol.slice(0, 2)}
              </div>
              <span className="text-sm">{tokenSymbol}</span>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatCompact(tokenReserve)}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(poolRatio.token, 1)}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                SOL
              </div>
              <span className="text-sm">SOL</span>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatNumber(solReserve, 2)}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(poolRatio.sol, 1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Implied Price */}
      <div className="text-center pt-2 border-t">
        <p className="text-xs text-muted-foreground">Implied Price</p>
        <p className="font-medium">1 {tokenSymbol} = ${formatNumber(tokenPrice, 8)}</p>
      </div>
    </div>
  );
}

export default LiquidityPool;
