'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

export type TransactionType = 'stake' | 'unstake' | 'claim' | 'launch' | 'buy' | 'sell' | 'transfer';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  signature: string;
  type: TransactionType;
  status: TransactionStatus;
  amount?: number;
  token?: string;
  timestamp: Date;
  fee?: number;
  slot?: number;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  maxItems?: number;
  showFilters?: boolean;
  className?: string;
}

const TYPE_CONFIG: Record<TransactionType, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  stake: { label: 'Stake', icon: ArrowUpRight, color: 'text-green-500' },
  unstake: { label: 'Unstake', icon: ArrowDownRight, color: 'text-orange-500' },
  claim: { label: 'Claim Rewards', icon: ArrowDownRight, color: 'text-blue-500' },
  launch: { label: 'Token Launch', icon: ArrowUpRight, color: 'text-purple-500' },
  buy: { label: 'Buy', icon: ArrowUpRight, color: 'text-green-500' },
  sell: { label: 'Sell', icon: ArrowDownRight, color: 'text-red-500' },
  transfer: { label: 'Transfer', icon: ArrowUpRight, color: 'text-gray-500' },
};

const STATUS_CONFIG: Record<TransactionStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-500' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-green-500' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-500' },
};

export function TransactionHistory({
  transactions = [],
  isLoading = false,
  onRefresh,
  maxItems = 10,
  showFilters = true,
  className,
}: TransactionHistoryProps) {
  const { connected } = useWallet();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');

  const filteredTransactions = transactions
    .filter((tx) => filter === 'all' || tx.type === filter)
    .filter((tx) => statusFilter === 'all' || tx.status === statusFilter)
    .slice(0, maxItems);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const truncateSignature = (sig: string) => {
    return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
  };

  if (!connected) {
    return (
      <div className={cn('card text-center py-8', className)}>
        <p className="text-muted-foreground">Connect wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className={cn('card space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Transaction History</h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TransactionType | 'all')}
              className="input text-sm py-1"
            >
              <option value="all">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
            className="input text-sm py-1"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const typeConfig = TYPE_CONFIG[tx.type];
            const statusConfig = STATUS_CONFIG[tx.status];
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={tx.signature}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center bg-background', typeConfig.color)}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{typeConfig.label}</span>
                      <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTimestamp(tx.timestamp)}</span>
                      <span>•</span>
                      <a
                        href={`https://solscan.io/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {truncateSignature(tx.signature)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {tx.amount && (
                    <p className={cn('font-semibold', typeConfig.color)}>
                      {tx.type === 'sell' || tx.type === 'unstake' ? '-' : '+'}
                      {formatCompact(tx.amount)} {tx.token || 'SOL'}
                    </p>
                  )}
                  {tx.fee && (
                    <p className="text-xs text-muted-foreground">
                      Fee: {formatNumber(tx.fee, 6)} SOL
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {transactions.length > maxItems && (
        <div className="text-center pt-2">
          <button className="text-sm text-primary hover:underline">
            View all {transactions.length} transactions
          </button>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
