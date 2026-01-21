'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

interface PriceChartProps {
  data?: PriceDataPoint[];
  currentPrice?: number;
  symbol?: string;
  isLoading?: boolean;
}

type TimeRange = '1H' | '24H' | '7D' | '30D' | 'ALL';

export function PriceChart({
  data = [],
  currentPrice = 0,
  symbol = 'TOKEN',
  isLoading = false,
}: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];

    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      '1H': 60 * 60 * 1000,
      '24H': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000,
      'ALL': Infinity,
    };

    const cutoff = now - ranges[timeRange];
    return data.filter((d) => d.timestamp >= cutoff);
  }, [data, timeRange]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (filteredData.length < 2) return { value: 0, percent: 0 };

    const firstPrice = filteredData[0].price;
    const lastPrice = filteredData[filteredData.length - 1].price;
    const change = lastPrice - firstPrice;
    const percentChange = (change / firstPrice) * 100;

    return { value: change, percent: percentChange };
  }, [filteredData]);

  const isPositive = priceChange.percent >= 0;

  // Format timestamp for x-axis
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === '1H' || timeRange === '24H') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">${symbol}</h3>
            <span className={`flex items-center text-sm ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {isPositive ? '+' : ''}{formatNumber(priceChange.percent, 2)}%
            </span>
          </div>
          <p className="text-2xl font-bold">${formatNumber(currentPrice, 8)}</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1">
          {(['1H', '24H', '7D', '30D', 'ALL'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`btn text-xs py-1 px-2 ${
                timeRange === range ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                minTickGap={50}
              />
              <YAxis
                tickFormatter={(v) => `$${formatNumber(v, 6)}`}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
                domain={['auto', 'auto']}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const data = payload[0].payload as PriceDataPoint;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(data.timestamp).toLocaleString()}
                        </p>
                        <p className="font-semibold">${formatNumber(data.price, 8)}</p>
                        {data.volume !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Vol: ${formatNumber(data.volume, 2)}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No price data available
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 text-center border-t pt-4">
        <div>
          <p className="text-xs text-muted-foreground">High</p>
          <p className="font-medium">
            ${formatNumber(Math.max(...filteredData.map((d) => d.price), 0), 6)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Low</p>
          <p className="font-medium">
            ${formatNumber(Math.min(...filteredData.map((d) => d.price), Infinity), 6)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Change</p>
          <p className={`font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}${formatNumber(priceChange.value, 8)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Data Points</p>
          <p className="font-medium">{filteredData.length}</p>
        </div>
      </div>
    </div>
  );
}

export default PriceChart;
