'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CHART_COLORS } from '@/lib/constants';
import { TaxConfig } from '@/lib/api';

interface FeeBreakdownChartProps {
  taxConfig: TaxConfig;
  className?: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

export function FeeBreakdownChart({ taxConfig, className }: FeeBreakdownChartProps) {
  const data: ChartDataItem[] = [];

  if (taxConfig.burnEnabled && taxConfig.burnPercent > 0) {
    data.push({
      name: 'Burn',
      value: taxConfig.burnPercent,
      color: CHART_COLORS.burn,
    });
  }

  if (taxConfig.lpEnabled && taxConfig.lpPercent > 0) {
    data.push({
      name: 'Liquidity Pool',
      value: taxConfig.lpPercent,
      color: CHART_COLORS.lp,
    });
  }

  if (taxConfig.dividendsEnabled && taxConfig.dividendsPercent > 0) {
    data.push({
      name: 'Dividends',
      value: taxConfig.dividendsPercent,
      color: CHART_COLORS.dividends,
    });
  }

  taxConfig.customWallets.forEach((wallet, index) => {
    if (wallet.percent > 0) {
      data.push({
        name: wallet.label || `Custom ${index + 1}`,
        value: wallet.percent,
        color: CHART_COLORS.custom,
      });
    }
  });

  const totalTax = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[200px] ${className}`}>
        <p className="text-muted-foreground text-center">
          No taxes enabled.<br />
          <span className="text-sm">Your token will have 0% transaction tax.</span>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-center mb-4">
        <span className="text-2xl font-bold">{totalTax.toFixed(1)}%</span>
        <span className="text-muted-foreground ml-2">Total Tax</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value}%`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend
            formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Breakdown list */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeeBreakdownChart;
