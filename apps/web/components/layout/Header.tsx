'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Rocket,
  LayoutDashboard,
  Coins,
  PiggyBank,
  Search,
  ChevronDown,
  Trophy,
  Vote,
  Users,
  Gift,
  Award,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletButton } from './WalletButton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navigation = [
  { name: 'Launch', href: '/launch', icon: Rocket },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'Staking', href: '/staking', icon: PiggyBank },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const moreLinks = [
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Governance', href: '/governance', icon: Vote },
  { name: 'Referrals', href: '/referrals', icon: Users },
  { name: 'Achievements', href: '/achievements', icon: Award },
  { name: 'Airdrop', href: '/airdrop', icon: Gift },
];

export function Header() {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMoreLinkActive = moreLinks.some((link) => pathname === link.href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">KR8TIV</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                onBlur={() => setTimeout(() => setMoreMenuOpen(false), 200)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isMoreLinkActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                More
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    moreMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {moreMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 py-2 bg-card border border-border rounded-lg shadow-lg animate-fade-in">
                  {moreLinks.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Theme Toggle, Wallet Button, and Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <WalletButton />
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {[...navigation, ...moreLinks].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
