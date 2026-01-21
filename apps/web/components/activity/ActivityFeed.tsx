'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Flame,
  Droplets,
  Star,
  ExternalLink,
  Bell,
  BellOff,
} from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

type ActivityType = 'buy' | 'sell' | 'stake' | 'unstake' | 'launch' | 'burn' | 'lp_add' | 'graduation';

interface ActivityItem {
  id: string;
  type: ActivityType;
  tokenSymbol: string;
  tokenMint: string;
  amount: number;
  value: number;
  wallet: string;
  timestamp: Date;
  signature: string;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  isLive?: boolean;
  onToggleLive?: () => void;
  maxItems?: number;
  filterTypes?: ActivityType[];
  showFilters?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<ActivityType, { label: string; icon: typeof ArrowUpRight; color: string; bgColor: string }> = {
  buy: { label: 'Buy', icon: ArrowUpRight, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  sell: { label: 'Sell', icon: ArrowDownRight, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  stake: { label: 'Stake', icon: Coins, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  unstake: { label: 'Unstake', icon: Coins, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  launch: { label: 'Launch', icon: Star, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  burn: { label: 'Burn', icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  lp_add: { label: 'LP Add', icon: Droplets, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  graduation: { label: 'Graduation', icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
};

export function ActivityFeed({
  activities = [],
  isLive = false,
  onToggleLive,
  maxItems = 20,
  filterTypes,
  showFilters = true,
  className,
}: ActivityFeedProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<ActivityType>>(
    new Set(filterTypes || Object.keys(TYPE_CONFIG) as ActivityType[])
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Highlight new activities
  useEffect(() => {
    if (activities.length > 0 && isLive) {
      const newestId = activities[0]?.id;
      setHighlightedId(newestId);
      const timer = setTimeout(() => setHighlightedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [activities, isLive]);

  const filteredActivities = activities
    .filter((a) => selectedTypes.has(a.type))
    .slice(0, maxItems);

  const toggleType = (type: ActivityType) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const truncateWallet = (wallet: string) => `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;

  return (
    <div className={cn('card space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={cn('h-5 w-5', isLive && 'text-green-500 animate-pulse')} />
          <h3 className="font-semibold">Activity Feed</h3>
          {isLive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
              LIVE
            </span>
          )}
        </div>
        {onToggleLive && (
          <button
            onClick={onToggleLive}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isLive ? 'bg-green-500/10 text-green-500' : 'hover:bg-secondary'
            )}
            title={isLive ? 'Pause live updates' : 'Enable live updates'}
          >
            {isLive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_CONFIG) as ActivityType[]).map((type) => {
            const config = TYPE_CONFIG[type];
            const isSelected = selectedTypes.has(type);

            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={cn(
                  'flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors',
                  isSelected ? config.bgColor + ' ' + config.color : 'bg-secondary/50 text-muted-foreground'
                )}
              >
                <config.icon className="h-3 w-3" />
                {config.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Activity List */}
      <div ref={feedRef} className="space-y-2 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const config = TYPE_CONFIG[activity.type];
            const Icon = config.icon;
            const isHighlighted = activity.id === highlightedId;

            return (
              <div
                key={activity.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg transition-all duration-500',
                  isHighlighted ? 'bg-primary/20 scale-[1.02]' : 'bg-secondary/30 hover:bg-secondary/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', config.bgColor)}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">${activity.tokenSymbol}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{truncateWallet(activity.wallet)}</span>
                      <span>•</span>
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={cn('font-medium', config.color)}>
                    {activity.type === 'sell' ? '-' : '+'}
                    {formatCompact(activity.amount)}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <span>${formatNumber(activity.value, 2)}</span>
                    <a
                      href={`https://solscan.io/tx/${activity.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {filteredActivities.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Volume</p>
            <p className="font-medium">
              ${formatCompact(filteredActivities.reduce((sum, a) => sum + a.value, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Buys</p>
            <p className="font-medium text-green-500">
              {filteredActivities.filter((a) => a.type === 'buy').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sells</p>
            <p className="font-medium text-red-500">
              {filteredActivities.filter((a) => a.type === 'sell').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
