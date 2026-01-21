'use client';

import { useEffect, useState } from 'react';
import {
  Rocket,
  Users,
  TrendingUp,
  DollarSign,
  Coins,
  ArrowUpRight,
  Activity,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  description?: string;
}

const platformStats: Stat[] = [
  {
    label: 'Tokens Launched',
    value: '12,847',
    change: '+156 today',
    changeType: 'positive',
    icon: Rocket,
    description: 'Total tokens created on the platform',
  },
  {
    label: 'Total Volume',
    value: '$847M',
    change: '+$12.4M (24h)',
    changeType: 'positive',
    icon: DollarSign,
    description: 'All-time trading volume',
  },
  {
    label: 'Active Traders',
    value: '89,421',
    change: '+2,847 this week',
    changeType: 'positive',
    icon: Users,
    description: 'Unique wallets that have traded',
  },
  {
    label: 'Graduated Tokens',
    value: '3,241',
    change: '25% graduation rate',
    changeType: 'neutral',
    icon: TrendingUp,
    description: 'Tokens that reached Raydium',
  },
];

interface StatsSectionProps {
  className?: string;
}

export function StatsSection({ className }: StatsSectionProps) {
  return (
    <section className={cn('py-16 md:py-24 bg-secondary/30', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
            <Activity className="h-4 w-4" />
            Platform Stats
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Numbers Speak
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators and traders on Solana's fastest-growing token launchpad
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} />
          ))}
        </div>

        {/* Live Activity Ticker */}
        <div className="mt-12">
          <LiveActivityTicker />
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const [displayValue, setDisplayValue] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Animate the number on mount
    const timer = setTimeout(() => {
      setDisplayValue(stat.value);
      setHasAnimated(true);
    }, index * 100);

    return () => clearTimeout(timer);
  }, [stat.value, index]);

  return (
    <div className="card text-center group hover:border-primary/50 transition-all">
      {/* Icon */}
      <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <stat.icon className="h-7 w-7 text-primary" />
      </div>

      {/* Value */}
      <div
        className={cn(
          'text-3xl md:text-4xl font-bold mb-2 transition-all duration-500',
          hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        {displayValue}
      </div>

      {/* Label */}
      <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>

      {/* Change */}
      {stat.change && (
        <div
          className={cn(
            'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full',
            stat.changeType === 'positive' && 'bg-green-500/10 text-green-500',
            stat.changeType === 'negative' && 'bg-red-500/10 text-red-500',
            stat.changeType === 'neutral' && 'bg-secondary text-muted-foreground'
          )}
        >
          {stat.changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
          {stat.change}
        </div>
      )}
    </div>
  );
}

// Live activity mock data
interface Activity {
  id: string;
  type: 'launch' | 'trade' | 'graduate';
  token: string;
  symbol: string;
  value?: string;
  time: string;
}

const mockActivities: Activity[] = [
  { id: '1', type: 'launch', token: 'Moon Cat', symbol: 'MCAT', time: '2s ago' },
  { id: '2', type: 'trade', token: 'Solana Pepe', symbol: 'SPEPE', value: '$1,240', time: '5s ago' },
  { id: '3', type: 'graduate', token: 'Based Chad', symbol: 'CHAD', time: '12s ago' },
  { id: '4', type: 'trade', token: 'Wojak Token', symbol: 'WOJ', value: '$890', time: '18s ago' },
  { id: '5', type: 'launch', token: 'Degen AI', symbol: 'DGENAI', time: '25s ago' },
  { id: '6', type: 'trade', token: 'Gigachad', symbol: 'GIGA', value: '$3,200', time: '30s ago' },
];

function LiveActivityTicker() {
  const [activities, setActivities] = useState(mockActivities);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities((prev) => {
        const shuffled = [...prev];
        // Shuffle array to simulate new activities
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'launch':
        return <Rocket className="h-3 w-3 text-blue-500" />;
      case 'trade':
        return <Coins className="h-3 w-3 text-green-500" />;
      case 'graduate':
        return <Zap className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'launch':
        return (
          <>
            <span className="font-medium">{activity.token}</span> launched
          </>
        );
      case 'trade':
        return (
          <>
            <span className="text-green-500">{activity.value}</span> trade on{' '}
            <span className="font-medium">{activity.symbol}</span>
          </>
        );
      case 'graduate':
        return (
          <>
            <span className="font-medium">{activity.token}</span> graduated to Raydium!
          </>
        );
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-secondary/30 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-secondary/30 to-transparent z-10" />

      {/* Activity ticker */}
      <div className="flex items-center gap-6 animate-marquee">
        {[...activities, ...activities].map((activity, index) => (
          <div
            key={`${activity.id}-${index}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-full text-xs whitespace-nowrap border border-border"
          >
            {getActivityIcon(activity.type)}
            {getActivityText(activity)}
            <span className="text-muted-foreground">• {activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatsSection;
