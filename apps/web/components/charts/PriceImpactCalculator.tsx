'use client';

import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, DollarSign } from 'lucide-react';
import { formatNumber, formatCompact } from '@/lib/utils';

interface PriceImpactCalculatorProps {
  currentPrice?: number;
  currentSupply?: number;
  totalSupply?: number;
  basePrice?: number;
  curveExponent?: number;
  availableLiquidity?: number;
}

export function PriceImpactCalculator({
  currentPrice = 0.00001,
  currentSupply = 250000000,
  totalSupply = 1000000000,
  basePrice = 0.000001,
  curveExponent = 1.5,
  availableLiquidity = 50000, // SOL
}: PriceImpactCalculatorProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('1000');

  const tradeAmount = parseFloat(amount) || 0;

  const calculation = useMemo(() => {
    // Calculate price for a given supply
    const getPrice = (supply: number) => {
      return basePrice * Math.pow(supply / totalSupply, curveExponent);
    };

    // Calculate tokens received/spent for a given SOL amount
    // This is a simplified calculation - real bonding curves use integrals
    const tokensPerSol = currentSupply / (availableLiquidity || 1);

    let tokensTraded: number;
    let newSupply: number;
    let newPrice: number;
    let avgPrice: number;
    let priceImpact: number;
    let slippage: number;

    if (tradeType === 'buy') {
      // Buying tokens increases supply
      tokensTraded = tradeAmount * tokensPerSol;
      newSupply = Math.min(currentSupply + tokensTraded, totalSupply);
      newPrice = getPrice(newSupply);
      avgPrice = (currentPrice + newPrice) / 2;
      priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
      slippage = ((avgPrice - currentPrice) / currentPrice) * 100;
    } else {
      // Selling tokens decreases supply
      tokensTraded = tradeAmount;
      newSupply = Math.max(currentSupply - tokensTraded, 0);
      newPrice = getPrice(newSupply);
      avgPrice = (currentPrice + newPrice) / 2;
      priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
      slippage = ((currentPrice - avgPrice) / currentPrice) * 100;
    }

    const solValue = tradeType === 'buy'
      ? tradeAmount
      : tokensTraded / tokensPerSol;

    const usdValue = solValue * 150; // Assuming SOL = $150

    return {
      tokensTraded,
      newSupply,
      newPrice,
      avgPrice,
      priceImpact,
      slippage,
      solValue,
      usdValue,
      isHighImpact: priceImpact > 5,
      isVeryHighImpact: priceImpact > 10,
    };
  }, [tradeType, tradeAmount, currentPrice, currentSupply, totalSupply, basePrice, curveExponent, availableLiquidity]);

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Price Impact Calculator</h3>
          <p className="text-sm text-muted-foreground">Estimate trade outcomes</p>
        </div>
      </div>

      {/* Trade Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTradeType('buy')}
          className={`flex-1 btn ${tradeType === 'buy' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ArrowUpRight className="h-4 w-4 mr-2" />
          Buy
        </button>
        <button
          onClick={() => setTradeType('sell')}
          className={`flex-1 btn ${tradeType === 'sell' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ArrowDownRight className="h-4 w-4 mr-2" />
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {tradeType === 'buy' ? 'Amount (SOL)' : 'Amount (Tokens)'}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input w-full"
          placeholder={tradeType === 'buy' ? 'Enter SOL amount' : 'Enter token amount'}
          min="0"
        />
        <div className="flex gap-2 mt-2">
          {tradeType === 'buy'
            ? [0.1, 1, 5, 10].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="btn-secondary text-xs py-1 px-2"
                >
                  {preset} SOL
                </button>
              ))
            : [1000, 10000, 100000, 1000000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="btn-secondary text-xs py-1 px-2"
                >
                  {formatCompact(preset)}
                </button>
              ))}
        </div>
      </div>

      {/* Results */}
      <div className="border-t pt-4 space-y-3">
        {/* Trade Summary */}
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {tradeType === 'buy' ? 'You Pay' : 'You Sell'}
              </p>
              <p className="font-semibold">
                {tradeType === 'buy'
                  ? `${formatNumber(tradeAmount, 4)} SOL`
                  : `${formatCompact(calculation.tokensTraded)} tokens`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {tradeType === 'buy' ? 'You Receive' : 'You Receive'}
              </p>
              <p className="font-semibold">
                {tradeType === 'buy'
                  ? `${formatCompact(calculation.tokensTraded)} tokens`
                  : `${formatNumber(calculation.solValue, 4)} SOL`}
              </p>
            </div>
          </div>
        </div>

        {/* Price Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Price</span>
            <span>${formatNumber(currentPrice, 8)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Average Price</span>
            <span>${formatNumber(calculation.avgPrice, 8)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price After Trade</span>
            <span className={tradeType === 'buy' ? 'text-green-500' : 'text-red-500'}>
              ${formatNumber(calculation.newPrice, 8)}
            </span>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-lg p-3 ${
            calculation.isVeryHighImpact
              ? 'bg-red-500/10 border border-red-500/20'
              : calculation.isHighImpact
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-secondary/50'
          }`}>
            <p className="text-xs text-muted-foreground">Price Impact</p>
            <p className={`font-semibold ${
              calculation.isVeryHighImpact
                ? 'text-red-500'
                : calculation.isHighImpact
                  ? 'text-yellow-500'
                  : ''
            }`}>
              {tradeType === 'buy' ? '+' : '-'}{formatNumber(calculation.priceImpact, 2)}%
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Slippage</p>
            <p className="font-semibold">{formatNumber(calculation.slippage, 2)}%</p>
          </div>
        </div>

        {/* Warning */}
        {calculation.isHighImpact && (
          <div className={`flex items-start gap-2 text-xs rounded-lg p-3 ${
            calculation.isVeryHighImpact
              ? 'bg-red-500/10 text-red-500'
              : 'bg-yellow-500/10 text-yellow-500'
          }`}>
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              {calculation.isVeryHighImpact
                ? 'Very high price impact! Consider reducing trade size.'
                : 'High price impact. Your trade may result in significant slippage.'}
            </p>
          </div>
        )}

        {/* USD Value */}
        <div className="text-center text-sm text-muted-foreground">
          ≈ ${formatNumber(calculation.usdValue, 2)} USD
        </div>
      </div>
    </div>
  );
}

export default PriceImpactCalculator;
