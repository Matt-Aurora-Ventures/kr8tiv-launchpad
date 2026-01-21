'use client';

import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { cn } from '@/lib/utils';

interface WalletAvatarProps {
  address?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Generate a deterministic color from an address
function addressToColor(address: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];

  const hash = address.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

// Generate a deterministic pattern
function addressToPattern(address: string): React.ReactNode {
  const seed = address.split('').reduce((acc, char, i) => {
    return acc + char.charCodeAt(0) * (i + 1);
  }, 0);

  // Create unique pattern shapes based on address
  const shapes = [];
  for (let i = 0; i < 4; i++) {
    const x = ((seed >> (i * 4)) & 15) * 6.25;
    const y = ((seed >> (i * 4 + 2)) & 15) * 6.25;
    const size = 20 + ((seed >> (i * 3)) & 7) * 5;

    shapes.push(
      <circle
        key={i}
        cx={`${x}%`}
        cy={`${y}%`}
        r={`${size}%`}
        className="fill-white/20"
      />
    );
  }

  return shapes;
}

export function WalletAvatar({ address, size = 'md', className }: WalletAvatarProps) {
  const { publicKey } = useWallet();
  const walletAddress = address || publicKey?.toBase58();

  const { color, pattern, initials } = useMemo(() => {
    if (!walletAddress) {
      return {
        color: 'bg-muted',
        pattern: null,
        initials: '?',
      };
    }

    return {
      color: addressToColor(walletAddress),
      pattern: addressToPattern(walletAddress),
      initials: walletAddress.slice(0, 2).toUpperCase(),
    };
  }, [walletAddress]);

  const sizeClasses = {
    sm: 'h-6 w-6 text-[8px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-12 w-12 text-sm',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center font-bold text-white',
        color,
        sizeClasses[size],
        className
      )}
    >
      {/* Pattern overlay */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {pattern}
      </svg>

      {/* Initials */}
      <span className="relative z-10">{initials}</span>
    </div>
  );
}

export default WalletAvatar;
