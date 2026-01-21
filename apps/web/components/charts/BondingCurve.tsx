'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, Info, Target } from 'lucide-react';
import { formatNumber, formatCompact } from '@/lib/utils';

interface BondingCurveProps {
  totalSupply?: number;
  currentSupply?: number;
  currentPrice?: number;
  graduationThreshold?: number;
  basePrice?: number;
  curveExponent?: number;
}

interface DataPoint {
  supply: number;
  price: number;
  isCurrent: boolean;
  isGraduation: boolean;
}

export function BondingCurve({
  totalSupply = 1000000000, // 1B
  currentSupply = 250000000, // 250M
  currentPrice = 0.00001,
  graduationThreshold = 500000000, // 500M (50%)
  basePrice = 0.000001,
  curveExponent = 1.5,
}: BondingCurveProps) {
  const [hoverData, setHoverData] = useState<DataPoint | null>(null);

  // Generate bonding curve data points
  const curveData = useMemo(() => {
    const points: DataPoint[] = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const supply = (i / steps) * totalSupply;
      // Bonding curve formula: price = basePrice * (supply / totalSupply) ^ exponent
      const price = basePrice * Math.pow(supply / totalSupply, curveExponent);

      points.push({
        supply,
        price,
        isCurrent: Math.abs(supply - currentSupply) < totalSupply / steps,
        isGraduation: Math.abs(supply - graduationThreshold) < totalSupply / steps,
      });
    }

    return points;
  }, [totalSupply, currentSupply, graduationThreshold, basePrice, curveExponent]);

  // Calculate key prices
  const graduationPrice = useMemo(() => {
    return basePrice * Math.pow(graduationThreshold / totalSupply, curveExponent);
  }, [basePrice, graduationThreshold, totalSupply, curveExponent]);

  const maxPrice = useMemo(() => {
    return basePrice * Math.pow(1, curveExponent);
  }, [basePrice, curveExponent]);

  // Progress percentage
  const progressPercent = (currentSupply / graduationThreshold) * 100;
  const supplyPercent = (currentSupply / totalSupply) * 100;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Bonding Curve</h3>
            <p className="text-sm text-muted-foreground">Price increases with supply</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Price</p>
          <p className="font-semibold text-lg">${formatNumber(currentPrice, 8)}</p>
        </div>
      </div>

      {/* Progress to Graduation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress to Graduation</span>
          <span className="font-medium">{formatNumber(progressPercent, 1)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0</span>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>Graduation: {formatCompact(graduationThreshold)}</span>
          </div>
          <span>{formatCompact(totalSupply)}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={curveData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={(e) => {
              if (e.activePayload?.[0]) {
                setHoverData(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoverData(null)}
          >
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="supply"
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${formatNumber(v, 6)}`}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={70}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const data = payload[0].payload as DataPoint;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="text-xs text-muted-foreground">Supply</p>
                      <p className="font-semibold">{formatCompact(data.supply)}</p>
                      <p className="text-xs text-muted-foreground mt-2">Price</p>
                      <p className="font-semibold">${formatNumber(data.price, 8)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Area under curve */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="none"
              fill="url(#curveGradient)"
            />

            {/* Main curve line */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />

            {/* Graduation threshold line */}
            <ReferenceLine
              x={graduationThreshold}
              stroke="hsl(var(--success))"
              strokeDasharray="5 5"
              label={{
                value: 'Graduation',
                position: 'top',
                fontSize: 10,
                fill: 'hsl(var(--success))',
              }}
            />

            {/* Current position dot */}
            <ReferenceDot
              x={currentSupply}
              y={currentPrice}
              r={6}
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key Prices */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="font-semibold text-sm">${formatNumber(currentPrice, 6)}</p>
          <p className="text-[10px] text-muted-foreground">{formatNumber(supplyPercent, 1)}% supply</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">At Graduation</p>
          <p className="font-semibold text-sm text-green-500">${formatNumber(graduationPrice, 6)}</p>
          <p className="text-[10px] text-muted-foreground">+{formatNumber((graduationPrice / currentPrice - 1) * 100, 0)}%</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Max Price</p>
          <p className="font-semibold text-sm">${formatNumber(maxPrice, 6)}</p>
          <p className="text-[10px] text-muted-foreground">100% supply</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Price follows a bonding curve: as supply increases, price increases exponentially.
          When supply reaches the graduation threshold, the token migrates to a DEX with full liquidity.
        </p>
      </div>
    </div>
  );
}

export default BondingCurve;
