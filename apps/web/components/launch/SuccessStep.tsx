'use client';

import Link from 'next/link';
import {
  PartyPopper,
  Copy,
  ExternalLink,
  Twitter,
  Share2,
  LayoutDashboard,
  Search,
  Rocket,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLaunch } from '@/hooks/useLaunch';
import { useAnalytics } from '@/hooks/useAnalytics';
import { shortenAddress, copyToClipboard, calculateTotalTax } from '@/lib/utils';

export function SuccessStep() {
  const { tokenInfo, taxConfig, launchResult, reset } = useLaunch();
  const { trackLaunchComplete } = useAnalytics();
  const [copiedMint, setCopiedMint] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [tracked, setTracked] = useState(false);

  // Track successful launch once when component mounts with launchResult
  useEffect(() => {
    if (launchResult && !tracked) {
      const totalTax = calculateTotalTax(taxConfig);
      trackLaunchComplete(launchResult.mint, tokenInfo.symbol, totalTax, {
        name: tokenInfo.name,
        supply: tokenInfo.supply,
        decimals: tokenInfo.decimals,
        success: true,
      });
      setTracked(true);
    }
  }, [launchResult, tracked, tokenInfo, taxConfig, trackLaunchComplete]);

  if (!launchResult) {
    return null;
  }

  const { mint, txSignature, launchUrl } = launchResult;

  const handleCopyMint = async () => {
    const success = await copyToClipboard(mint);
    if (success) {
      setCopiedMint(true);
      setTimeout(() => setCopiedMint(false), 2000);
    }
  };

  const handleCopyTx = async () => {
    if (!txSignature) return;
    const success = await copyToClipboard(txSignature);
    if (success) {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I just launched ${tokenInfo.name} ($${tokenInfo.symbol}) on @KR8TIV Launchpad! Check it out:`
  )}&url=${encodeURIComponent(`https://kr8tiv.io/tokens/${mint}`)}`;

  return (
    <div className="text-center space-y-8">
      {/* Success Animation */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-green-500/20 rounded-full animate-ping" />
        </div>
        <div className="relative h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <PartyPopper className="h-12 w-12 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
        <p className="text-xl text-muted-foreground">
          <strong className="text-foreground">{tokenInfo.name}</strong> has been launched
        </p>
      </div>

      {/* Token Info Card */}
      <div className="card max-w-lg mx-auto text-left">
        <div className="flex items-center gap-4 mb-6">
          {tokenInfo.image ? (
            <img
              src={tokenInfo.image}
              alt={tokenInfo.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {tokenInfo.symbol.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold">{tokenInfo.name}</h3>
            <p className="text-muted-foreground">${tokenInfo.symbol}</p>
          </div>
        </div>

        {/* Mint Address */}
        <div className="p-4 bg-background rounded-lg mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Token Mint Address</span>
            <button
              onClick={handleCopyMint}
              className="btn-ghost h-6 px-2 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedMint ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="font-mono text-sm break-all">{mint}</p>
        </div>

        {/* Transaction */}
        {txSignature && (
          <div className="p-4 bg-background rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Transaction</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyTx}
                  className="btn-ghost h-6 px-2 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedTx ? 'Copied!' : 'Copy'}
                </button>
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost h-6 px-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </a>
              </div>
            </div>
            <p className="font-mono text-sm">{shortenAddress(txSignature, 12)}</p>
          </div>
        )}

        {launchUrl && (
          <div className="p-4 bg-background rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Launch Page</span>
              <a
                href={launchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost h-6 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </a>
            </div>
            <p className="text-sm break-all">{launchUrl}</p>
          </div>
        )}
      </div>

      {/* Share */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Share your launch</p>
        <div className="flex justify-center gap-3">
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Share on Twitter
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${tokenInfo.name} ($${tokenInfo.symbol})`,
                  text: `Check out ${tokenInfo.name} on KR8TIV Launchpad!`,
                  url: `https://kr8tiv.io/tokens/${mint}`,
                });
              }
            }}
            className="btn-outline"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href={`/tokens/${mint}`} className="btn-primary px-6">
          <Search className="h-4 w-4 mr-2" />
          View Token
        </Link>
        <Link href="/dashboard" className="btn-secondary px-6">
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Link>
        <button onClick={reset} className="btn-outline px-6">
          <Rocket className="h-4 w-4 mr-2" />
          Launch Another
        </button>
      </div>
    </div>
  );
}

export default SuccessStep;
