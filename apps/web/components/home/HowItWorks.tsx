'use client';

import Link from 'next/link';
import {
  Wallet,
  FileText,
  Rocket,
  TrendingUp,
  Gift,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  details: string[];
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Connect Wallet',
    description: 'Link your Solana wallet to get started',
    icon: Wallet,
    details: [
      'Support for Phantom, Solflare, and more',
      'No account creation needed',
      'Your keys, your tokens',
    ],
  },
  {
    number: 2,
    title: 'Configure Token',
    description: 'Set your token name, symbol, and supply',
    icon: FileText,
    details: [
      'Choose from bonding, fair, or presale launch',
      'Customize tokenomics',
      'Add social links and description',
    ],
  },
  {
    number: 3,
    title: 'Launch & Trade',
    description: 'Deploy and start trading immediately',
    icon: Rocket,
    details: [
      'Token live in seconds',
      'Fair bonding curve pricing',
      'Instant liquidity for all trades',
    ],
  },
  {
    number: 4,
    title: 'Graduate to DEX',
    description: 'Automatic Raydium listing at threshold',
    icon: TrendingUp,
    details: [
      'Graduates at $69K market cap',
      'Automatic liquidity provision',
      'Trade on any Solana DEX',
    ],
  },
];

interface HowItWorksProps {
  className?: string;
}

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section className={cn('py-16 md:py-24 bg-secondary/30', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
            <Gift className="h-4 w-4" />
            Simple Process
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Launch your token in 4 simple steps. No coding required.
            From idea to tradeable token in under 2 minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-y-1/2 z-0">
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* Step Card */}
              <div className="card h-full relative z-10">
                {/* Step Number */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">{step.number}</span>
                  </div>
                  <step.icon className="h-6 w-6 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {step.description}
                </p>

                {/* Details */}
                <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/launch">
            <Button size="lg">
              <Rocket className="h-5 w-5 mr-2" />
              Start Launching Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Alternative Timeline Layout
export function HowItWorksTimeline({ className }: HowItWorksProps) {
  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Journey to Launch
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow these simple steps to launch your token on Solana
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative pl-12 pb-12 last:pb-0">
              {/* Timeline Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
              )}

              {/* Timeline Dot */}
              <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {step.number}
              </div>

              {/* Content */}
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <step.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                <div className="flex flex-wrap gap-2">
                  {step.details.map((detail, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs bg-secondary rounded-full"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
