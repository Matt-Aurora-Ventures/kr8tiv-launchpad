'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Rocket,
  TrendingUp,
  Shield,
  Zap,
  ChevronRight,
  Play,
  Sparkles,
} from 'lucide-react';
import { cn, formatCompact } from '@/lib/utils';
import { Button } from '@/components/ui';

interface HeroSectionProps {
  stats?: {
    totalTokens: number;
    totalVolume: number;
    totalUsers: number;
    totalGraduated: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  const [animatedStats, setAnimatedStats] = useState({
    totalTokens: 0,
    totalVolume: 0,
    totalUsers: 0,
    totalGraduated: 0,
  });

  // Animate stats on mount
  useEffect(() => {
    if (!stats) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setAnimatedStats({
        totalTokens: Math.floor(stats.totalTokens * eased),
        totalVolume: Math.floor(stats.totalVolume * eased),
        totalUsers: Math.floor(stats.totalUsers * eased),
        totalGraduated: Math.floor(stats.totalGraduated * eased),
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats(stats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  const features = [
    {
      icon: Zap,
      title: 'Instant Launch',
      description: 'Create and deploy your token in under 2 minutes',
    },
    {
      icon: Shield,
      title: 'Secure Trading',
      description: 'Built on Solana with audited smart contracts',
    },
    {
      icon: TrendingUp,
      title: 'Fair Bonding Curve',
      description: 'Transparent pricing mechanism for all traders',
    },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              The #1 Solana Token Launchpad
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Launch Your Token
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                In Minutes
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Create, launch, and trade tokens on Solana with our fair bonding curve mechanism.
              No coding required. Stake KR8TIV for fee discounts and exclusive benefits.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/launch">
                <Button size="lg" className="w-full sm:w-auto">
                  <Rocket className="h-5 w-5 mr-2" />
                  Launch Token
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Play className="h-5 w-5 mr-2" />
                  Explore Tokens
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-12">
              {features.map((feature) => (
                <div key={feature.title} className="text-center lg:text-left">
                  <feature.icon className="h-6 w-6 text-primary mx-auto lg:mx-0 mb-2" />
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Stats / Visual */}
          <div className="relative">
            {/* Stats Card */}
            <div className="card border-2 border-primary/20">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Platform Statistics
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <StatItem
                  label="Tokens Launched"
                  value={formatCompact(animatedStats.totalTokens)}
                  icon="🚀"
                />
                <StatItem
                  label="Total Volume"
                  value={`$${formatCompact(animatedStats.totalVolume)}`}
                  icon="💰"
                />
                <StatItem
                  label="Active Users"
                  value={formatCompact(animatedStats.totalUsers)}
                  icon="👥"
                />
                <StatItem
                  label="Graduated to DEX"
                  value={formatCompact(animatedStats.totalGraduated)}
                  icon="🎓"
                />
              </div>

              {/* Live Indicator */}
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                <span className="text-sm text-muted-foreground">Live on Solana Mainnet</span>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 p-3 bg-background border border-border rounded-lg shadow-lg animate-float">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">+142%</p>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 p-3 bg-background border border-border rounded-lg shadow-lg animate-float-delayed">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">New Launch!</p>
                  <p className="text-xs text-muted-foreground">MEME Token</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Stat Item Component
interface StatItemProps {
  label: string;
  value: string;
  icon: string;
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <div className="text-center">
      <span className="text-2xl mb-1 block">{icon}</span>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default HeroSection;
