'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, Wallet, AlertTriangle } from 'lucide-react';
import { formatNumber, formatCompact } from '@/lib/utils';

interface Holder {
  address: string;
  balance: number;
  percentage: number;
}

interface HolderDistributionProps {
  holders?: Holder[];
  totalSupply?: number;
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
  '#FFBB28',
];

export function HolderDistribution({
  holders = [],
  totalSupply = 1000000000,
  isLoading = false,
}: HolderDistributionProps) {
  // Calculate distribution metrics
  const metrics = useMemo(() => {
    if (holders.length === 0) {
      return {
        top10Percent: 0,
        top50Percent: 0,
        giniCoefficient: 0,
        whaleCount: 0,
        retailCount: 0,
        pieData: [],
      };
    }

    // Sort by balance descending
    const sorted = [...holders].sort((a, b) => b.balance - a.balance);

    // Top 10 holders percentage
    const top10 = sorted.slice(0, 10);
    const top10Percent = top10.reduce((sum, h) => sum + h.percentage, 0);

    // Top 50 holders percentage
    const top50 = sorted.slice(0, 50);
    const top50Percent = top50.reduce((sum, h) => sum + h.percentage, 0);

    // Whale count (holders with > 1% of supply)
    const whaleCount = sorted.filter((h) => h.percentage > 1).length;
    const retailCount = sorted.length - whaleCount;

    // Calculate Gini coefficient (measure of inequality)
    const n = sorted.length;
    let sumOfDifferences = 0;
    let totalBalance = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sumOfDifferences += Math.abs(sorted[i].balance - sorted[j].balance);
      }
      totalBalance += sorted[i].balance;
    }

    const giniCoefficient = n > 1 ? sumOfDifferences / (2 * n * totalBalance) : 0;

    // Prepare pie chart data
    const pieData = [
      ...top10.slice(0, 5).map((h, i) => ({
        name: `${h.address.slice(0, 4)}...${h.address.slice(-4)}`,
        value: h.percentage,
        balance: h.balance,
      })),
      {
        name: 'Others',
        value: 100 - top10.slice(0, 5).reduce((sum, h) => sum + h.percentage, 0),
        balance: totalSupply - top10.slice(0, 5).reduce((sum, h) => sum + h.balance, 0),
      },
    ];

    return {
      top10Percent,
      top50Percent,
      giniCoefficient,
      whaleCount,
      retailCount,
      pieData,
    };
  }, [holders, totalSupply]);

  // Concentration warning level
  const concentrationLevel = useMemo(() => {
    if (metrics.top10Percent > 80) return 'critical';
    if (metrics.top10Percent > 60) return 'high';
    if (metrics.top10Percent > 40) return 'moderate';
    return 'healthy';
  }, [metrics.top10Percent]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Holder Distribution</h3>
            <p className="text-sm text-muted-foreground">
              {holders.length.toLocaleString()} holders
            </p>
          </div>
        </div>

        {/* Concentration Indicator */}
        <div className={`badge ${
          concentrationLevel === 'critical' ? 'badge-destructive' :
          concentrationLevel === 'high' ? 'badge-warning' :
          concentrationLevel === 'moderate' ? 'badge-secondary' :
          'badge-success'
        }`}>
          {concentrationLevel === 'critical' ? 'Critical' :
           concentrationLevel === 'high' ? 'High Concentration' :
           concentrationLevel === 'moderate' ? 'Moderate' :
           'Healthy'}
        </div>
      </div>

      {/* Pie Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={metrics.pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {metrics.pieData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(data.value, 2)}%
                      </p>
                      <p className="text-sm">
                        {formatCompact(data.balance)} tokens
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Top 10 Holders</p>
          <p className={`font-semibold ${
            metrics.top10Percent > 60 ? 'text-red-500' :
            metrics.top10Percent > 40 ? 'text-yellow-500' :
            'text-green-500'
          }`}>
            {formatNumber(metrics.top10Percent, 1)}%
          </p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Top 50 Holders</p>
          <p className="font-semibold">{formatNumber(metrics.top50Percent, 1)}%</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-1">
            <Wallet className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Whales (&gt;1%)</p>
          </div>
          <p className="font-semibold">{metrics.whaleCount}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Gini Coefficient</p>
          <p className="font-semibold">{formatNumber(metrics.giniCoefficient, 3)}</p>
        </div>
      </div>

      {/* Warning for high concentration */}
      {concentrationLevel !== 'healthy' && (
        <div className={`flex items-start gap-2 text-xs rounded-lg p-3 ${
          concentrationLevel === 'critical'
            ? 'bg-red-500/10 text-red-500'
            : 'bg-yellow-500/10 text-yellow-500'
        }`}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            {concentrationLevel === 'critical'
              ? 'Very high concentration risk. Top holders control most of the supply.'
              : 'Moderate concentration. Be aware of whale wallet movements.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default HolderDistribution;
