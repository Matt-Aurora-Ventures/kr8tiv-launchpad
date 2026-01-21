'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

const faqs: FAQ[] = [
  {
    category: 'Getting Started',
    question: 'What is KR8TIV Launchpad?',
    answer: 'KR8TIV Launchpad is a decentralized token launch platform built on Solana. It allows anyone to create, launch, and trade tokens using a fair bonding curve mechanism. Tokens automatically graduate to a DEX when they reach a certain market cap threshold.',
  },
  {
    category: 'Getting Started',
    question: 'How do I launch a token?',
    answer: 'Launching a token is simple: 1) Connect your Solana wallet, 2) Fill in your token details (name, symbol, description), 3) Configure tokenomics (supply, allocations), 4) Pay the launch fee (0.1 SOL), and 5) Your token is live! The entire process takes less than 2 minutes.',
  },
  {
    category: 'Trading',
    question: 'What is a bonding curve?',
    answer: 'A bonding curve is a mathematical formula that determines the price of a token based on its supply. As more tokens are bought, the price increases along the curve. This creates a fair pricing mechanism where early buyers get lower prices, but everyone trades on the same transparent curve.',
  },
  {
    category: 'Trading',
    question: 'What happens when a token graduates?',
    answer: 'When a token reaches the graduation threshold (typically $69K market cap), it automatically transitions from the bonding curve to a standard Raydium liquidity pool. This provides more liquidity and allows the token to be traded on any Solana DEX aggregator.',
  },
  {
    category: 'Staking',
    question: 'What are the benefits of staking KR8TIV tokens?',
    answer: 'Staking KR8TIV tokens provides multiple benefits: fee discounts on trades and launches (up to 50%), higher staking rewards multipliers, early access to new features, and governance voting rights. The longer you stake, the higher your tier and rewards.',
  },
  {
    category: 'Staking',
    question: 'What are the staking tiers?',
    answer: 'There are 4 staking tiers: Bronze (1K+ KR8TIV, 10% fee discount), Silver (10K+ KR8TIV, 25% discount), Gold (50K+ KR8TIV, 35% discount), and Diamond (100K+ KR8TIV, 50% discount). Locking tokens for longer periods provides additional multipliers.',
  },
  {
    category: 'Fees',
    question: 'What are the platform fees?',
    answer: 'Token launch fee: 0.1 SOL. Trading fee: 1% per trade (split between liquidity providers and platform). Graduation fee: 2% of the liquidity pool. All fees are reduced for KR8TIV stakers based on their tier.',
  },
  {
    category: 'Security',
    question: 'Is KR8TIV Launchpad secure?',
    answer: 'Yes! Our smart contracts are audited by leading security firms, and we use industry-standard security practices. All transactions happen on-chain via Solana, ensuring transparency. However, always DYOR before trading any token.',
  },
];

interface FAQSectionProps {
  className?: string;
}

export function FAQSection({ className }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)));

  const filteredFaqs = activeCategory
    ? faqs.filter((f) => f.category === activeCategory)
    : faqs;

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about KR8TIV Launchpad. Can't find what you're looking for?{' '}
            <a href="mailto:support@kr8tiv.io" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-4 py-2 rounded-full text-sm transition-colors',
              !activeCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category || null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm transition-colors',
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {filteredFaqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://docs.kr8tiv.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Read Documentation
            </a>
            <a
              href="https://discord.gg/kr8tiv"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Join Discord Community
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// FAQ Item Component
interface FAQItemProps {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          {faq.category && (
            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full flex-shrink-0">
              {faq.category}
            </span>
          )}
          <span className="font-medium">{faq.question}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="p-4 pt-0 text-muted-foreground">
          {faq.answer}
        </div>
      </div>
    </div>
  );
}

export default FAQSection;
