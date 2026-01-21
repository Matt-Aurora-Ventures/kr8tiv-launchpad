'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Rocket,
  Coins,
  BarChart3,
  Wallet,
  Menu,
  X,
  Star,
  Settings,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/launch', label: 'Launch', icon: Rocket },
  { href: '/tokens', label: 'Tokens', icon: BarChart3 },
  { href: '/staking', label: 'Stake', icon: Coins },
];

const SECONDARY_ITEMS: NavItem[] = [
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export function MobileNav() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-1 right-1/4 text-[8px] px-1 rounded-full bg-primary text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-72 bg-background z-50 md:hidden animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Wallet Status */}
              <div className="p-4 border-b">
                <div className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  connected ? 'bg-green-500/10' : 'bg-secondary'
                )}>
                  <Wallet className={cn('h-5 w-5', connected ? 'text-green-500' : 'text-muted-foreground')} />
                  <div>
                    <p className="font-medium text-sm">
                      {connected ? 'Wallet Connected' : 'Not Connected'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {connected ? 'Ready to trade' : 'Connect to start'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    Navigation
                  </p>
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    Account
                  </p>
                  {SECONDARY_ITEMS.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t">
                <a
                  href="https://docs.kr8tiv.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer for bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}

export default MobileNav;
