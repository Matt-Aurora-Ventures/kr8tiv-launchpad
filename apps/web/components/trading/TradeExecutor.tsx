'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  ArrowDownUp,
  Settings,
  Info,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';
import { Button, Input, Slider } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface Token {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  balance?: number;
  decimals: number;
}

interface TradeExecutorProps {
  token: Token;
  solBalance?: number;
  solPrice?: number;
  className?: string;
  onTradeComplete?: (signature: string) => void;
}

export function TradeExecutor({
  token,
  solBalance = 0,
  solPrice = 150,
  className,
  onTradeComplete,
}: TradeExecutorProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);

  // Calculate estimated output
  const estimate = useMemo(() => {
    const inputAmount = parseFloat(amount) || 0;
    if (inputAmount <= 0) return { output: 0, fee: 0, total: 0 };

    // Mock calculation - replace with actual bonding curve math
    const fee = inputAmount * 0.01; // 1% fee
    const priceWithImpact = token.price * (1 + (mode === 'buy' ? priceImpact : -priceImpact) / 100);

    if (mode === 'buy') {
      // SOL -> Token
      const output = (inputAmount - fee) / priceWithImpact;
      return { output, fee, total: inputAmount };
    } else {
      // Token -> SOL
      const output = (inputAmount - fee) * priceWithImpact;
      return { output, fee: fee * priceWithImpact, total: inputAmount };
    }
  }, [amount, mode, token.price, priceImpact]);

  // Calculate price impact based on trade size
  useEffect(() => {
    const inputAmount = parseFloat(amount) || 0;
    // Mock price impact - in reality, calculate from bonding curve
    const impact = Math.min(inputAmount * 0.1, 15); // Max 15% impact
    setPriceImpact(impact);
  }, [amount]);

  const maxAmount = mode === 'buy' ? solBalance : (token.balance || 0);

  const handleSetPercentage = (percentage: number) => {
    const max = mode === 'buy' ? solBalance : (token.balance || 0);
    setAmount((max * percentage / 100).toFixed(mode === 'buy' ? 4 : 2));
  };

  const handleExecute = async () => {
    if (!connected || !publicKey) {
      toast({ type: 'error', title: 'Error', message: 'Please connect your wallet' });
      return;
    }

    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast({ type: 'error', title: 'Error', message: 'Please enter a valid amount' });
      return;
    }

    if (inputAmount > maxAmount) {
      toast({ type: 'error', title: 'Error', message: 'Insufficient balance' });
      return;
    }

    setIsExecuting(true);

    try {
      // Simulate trade execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const signature = 'mock_signature_' + Date.now();

      toast({
        type: 'success',
        title: 'Trade Successful',
        message: `${mode === 'buy' ? 'Bought' : 'Sold'} ${formatNumber(estimate.output, 4)} ${mode === 'buy' ? token.symbol : 'SOL'}`,
      });

      setAmount('');
      onTradeComplete?.(signature);
    } catch (error) {
      toast({
        type: 'error',
        title: 'Trade Failed',
        message: error instanceof Error ? error.message : 'Transaction failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!connected) {
    return (
      <div className={cn('card text-center py-8', className)}>
        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Connect wallet to trade</p>
        <Button>Connect Wallet</Button>
      </div>
    );
  }

  return (
    <div className={cn('card', className)}>
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('buy')}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
            mode === 'buy'
              ? 'bg-green-500 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          )}
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          Buy
        </button>
        <button
          onClick={() => setMode('sell')}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg font-medium transition-all',
            mode === 'sell'
              ? 'bg-red-500 text-white'
              : 'bg-secondary hover:bg-secondary/80'
          )}
        >
          <TrendingDown className="h-4 w-4 inline mr-2" />
          Sell
        </button>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        {/* From */}
        <div className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">From</span>
            <span className="text-xs text-muted-foreground">
              Balance: {formatNumber(maxAmount, 4)} {mode === 'buy' ? 'SOL' : token.symbol}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {mode === 'buy' ? 'SOL' : token.symbol.slice(0, 2)}
              </div>
              <span className="font-medium">{mode === 'buy' ? 'SOL' : token.symbol}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSetPercentage(pct)}
                className="flex-1 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={() => setMode(mode === 'buy' ? 'sell' : 'buy')}
            className="p-2 bg-background border border-border rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        {/* To */}
        <div className="p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">To (estimated)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl font-bold">
              {estimate.output > 0 ? formatNumber(estimate.output, 4) : '0.00'}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {mode === 'buy' ? token.symbol.slice(0, 2) : 'SOL'}
              </div>
              <span className="font-medium">{mode === 'buy' ? token.symbol : 'SOL'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Details */}
      {parseFloat(amount) > 0 && (
        <div className="mt-4 p-3 bg-secondary/30 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span>
              1 {mode === 'buy' ? 'SOL' : token.symbol} ={' '}
              {formatNumber(mode === 'buy' ? 1 / token.price : token.price, 4)}{' '}
              {mode === 'buy' ? token.symbol : 'SOL'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price Impact</span>
            <span className={cn(priceImpact > 5 ? 'text-yellow-500' : priceImpact > 10 ? 'text-red-500' : '')}>
              {formatNumber(priceImpact, 2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform Fee (1%)</span>
            <span>
              {formatNumber(estimate.fee, 4)} {mode === 'buy' ? 'SOL' : token.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Slippage</span>
            <span>{slippage}%</span>
          </div>
        </div>
      )}

      {/* Price Impact Warning */}
      {priceImpact > 5 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-500">High Price Impact</p>
            <p className="text-muted-foreground">
              This trade will significantly affect the token price.
            </p>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="mt-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>

        {showSettings && (
          <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
            <Slider
              label="Slippage Tolerance"
              value={slippage}
              onChange={setSlippage}
              min={0.5}
              max={15}
              step={0.5}
              formatValue={(v) => `${v}%`}
            />
          </div>
        )}
      </div>

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={isExecuting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
        className={cn(
          'w-full mt-4',
          mode === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
        )}
      >
        {isExecuting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            {mode === 'buy' ? 'Buy' : 'Sell'} {token.symbol}
          </>
        )}
      </Button>

      {/* Disclaimer */}
      <p className="mt-3 text-xs text-muted-foreground text-center">
        Trading involves risk. Only trade what you can afford to lose.
      </p>
    </div>
  );
}

export default TradeExecutor;
