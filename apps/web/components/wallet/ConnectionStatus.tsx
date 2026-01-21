'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function ConnectionStatus({ showDetails = false, className }: ConnectionStatusProps) {
  const { connected, connecting, publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [rpcStatus, setRpcStatus] = useState<'connected' | 'slow' | 'error'>('connected');
  const [latency, setLatency] = useState<number | null>(null);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);

  // Check RPC connection health
  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const checkHealth = async () => {
      const start = performance.now();
      try {
        const slot = await connection.getSlot();
        const elapsed = performance.now() - start;

        if (mounted) {
          setLatency(Math.round(elapsed));
          setBlockHeight(slot);
          setRpcStatus(elapsed > 2000 ? 'slow' : 'connected');
        }
      } catch (error) {
        if (mounted) {
          setRpcStatus('error');
          setLatency(null);
        }
      }
    };

    checkHealth();
    interval = setInterval(checkHealth, 30000); // Check every 30s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [connection]);

  // Status colors and icons
  const getStatusConfig = () => {
    if (connecting) {
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        icon: Clock,
        label: 'Connecting...',
      };
    }

    if (!connected) {
      return {
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        icon: WifiOff,
        label: 'Not connected',
      };
    }

    if (rpcStatus === 'error') {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        icon: AlertCircle,
        label: 'Connection error',
      };
    }

    if (rpcStatus === 'slow') {
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        icon: Wifi,
        label: 'Slow connection',
      };
    }

    return {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: CheckCircle,
      label: 'Connected',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Simple status dot
  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('h-2 w-2 rounded-full', config.color.replace('text-', 'bg-'))} />
        {connected && (
          <span className="text-xs text-muted-foreground">
            {wallet?.adapter.name}
          </span>
        )}
      </div>
    );
  }

  // Detailed status
  return (
    <div className={cn('rounded-lg border p-3', config.bgColor, className)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', config.color)} />
        <div className="flex-1">
          <p className={cn('font-medium', config.color)}>{config.label}</p>
          {connected && publicKey && (
            <p className="text-xs text-muted-foreground truncate">
              {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
            </p>
          )}
        </div>
      </div>

      {connected && (
        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Wallet</p>
            <p className="font-medium">{wallet?.adapter.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Latency</p>
            <p className={cn('font-medium', latency && latency > 1000 ? 'text-yellow-500' : '')}>
              {latency ? `${latency}ms` : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Block Height</p>
            <p className="font-medium">{blockHeight?.toLocaleString() || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Network</p>
            <p className="font-medium capitalize">
              {process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
