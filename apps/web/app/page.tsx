'use client';

import Link from 'next/link';
import {
  Rocket,
  Shield,
  Zap,
  Coins,
  TrendingUp,
  Users,
  ArrowRight,
  Check,
  Flame,
  Droplets,
  Wallet,
} from 'lucide-react';
import {
  HeroSection,
  StatsSection,
  FeaturedTokens,
  HowItWorks,
  RecentLaunches,
  FAQSection,
} from '@/components/home';

const features = [
  {
    icon: Rocket,
    title: 'Launch in Minutes',
    description: 'Create and deploy your token on Solana with a simple wizard. No coding required.',
  },
  {
    icon: Shield,
    title: 'Fully Customizable',
    description: 'Configure burn, LP, dividends, and custom wallets - all opt-in with sensible defaults.',
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'Your token goes live immediately on Solana with full trading capabilities.',
  },
  {
    icon: Coins,
    title: 'Stake for Discounts',
    description: 'Stake KR8TIV tokens to unlock up to 50% fee discounts and VIP benefits.',
  },
];

const taxFeatures = [
  {
    icon: Flame,
    title: 'Burn Tax',
    description: 'Automatically burn tokens on each transaction to create deflationary pressure.',
    color: 'text-red-500',
  },
  {
    icon: Droplets,
    title: 'LP Tax',
    description: 'Build liquidity automatically by adding to LP with every trade.',
    color: 'text-green-500',
  },
  {
    icon: Users,
    title: 'Dividends',
    description: 'Distribute rewards to holders proportionally based on their holdings.',
    color: 'text-blue-500',
  },
  {
    icon: Wallet,
    title: 'Custom Wallets',
    description: 'Route fees to marketing, development, or any custom wallet addresses.',
    color: 'text-purple-500',
  },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section - New component */}
      <HeroSection />

      {/* Stats Section - New component */}
      <StatsSection />

      {/* Featured Tokens - New component */}
      <FeaturedTokens />

      {/* How It Works - New component */}
      <HowItWorks />

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Launch
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete platform for creating and managing tokens on Solana with advanced features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card-hover">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tax Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Customizable Tax Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All tax features are <strong>opt-in</strong> and disabled by default.
              Enable only what your project needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {taxFeatures.map((feature) => (
              <div key={feature.title} className="card-hover">
                <div className={`h-12 w-12 rounded-lg bg-current/10 flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
              <Check className="h-4 w-4" />
              Maximum total tax: 25% for user protection
            </div>
          </div>
        </div>
      </section>

      {/* Staking Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Stake KR8TIV for{' '}
                <span className="gradient-text">Exclusive Benefits</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Hold and stake KR8TIV tokens to unlock fee discounts, priority features,
                and more. The longer you lock, the greater your benefits.
              </p>

              <div className="space-y-4">
                {[
                  { tier: 'Holder', stake: '1,000 KR8TIV', discount: '10%' },
                  { tier: 'Premium', stake: '10,000 KR8TIV', discount: '25%' },
                  { tier: 'VIP', stake: '100,000 KR8TIV', discount: '50%' },
                ].map((tier) => (
                  <div key={tier.tier} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
                    <div className="flex-1">
                      <p className="font-semibold">{tier.tier}</p>
                      <p className="text-sm text-muted-foreground">Stake {tier.stake}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{tier.discount}</p>
                      <p className="text-xs text-muted-foreground">fee discount</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/staking" className="btn-primary mt-8 inline-flex">
                Start Staking
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
              <div className="relative card p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-muted-foreground">Lock Duration Multipliers</span>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-3">
                  {[
                    { duration: '1 Week', multiplier: '1.0x' },
                    { duration: '1 Month', multiplier: '1.25x' },
                    { duration: '3 Months', multiplier: '1.5x' },
                    { duration: '6 Months', multiplier: '2.0x' },
                    { duration: '1 Year', multiplier: '3.0x' },
                  ].map((item, i) => (
                    <div
                      key={item.duration}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                    >
                      <span>{item.duration}</span>
                      <span className="font-bold text-primary">{item.multiplier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Launches - New component */}
      <RecentLaunches />

      {/* FAQ Section - New component */}
      <FAQSection />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Launch Your Token?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of creators who have launched their tokens on KR8TIV Launchpad.
            No coding required - just configure and deploy.
          </p>
          <Link href="/launch" className="btn-primary text-lg px-8 py-3 glow">
            <Rocket className="h-5 w-5 mr-2" />
            Launch Now
          </Link>
        </div>
      </section>
    </div>
  );
}
