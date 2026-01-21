import type { Metadata } from 'next';
import { generateStakingPageMetadata, generateBreadcrumbSchema, generateFAQSchema, BASE_URL } from '@/lib/seo';
import { MultiJsonLd } from '@/components/seo';

export const metadata: Metadata = generateStakingPageMetadata();

// FAQ content for the staking page
const stakingFAQs = [
  {
    question: 'What are the staking tiers?',
    answer: 'There are three tiers: Holder (1,000 KR8TIV, 20% discount), Premium (10,000 KR8TIV, 60% discount), and VIP (100,000 KR8TIV, 100% discount).',
  },
  {
    question: 'How do lock duration multipliers work?',
    answer: 'Longer lock periods increase your effective stake: 1 week (1x), 1 month (1.25x), 3 months (1.5x), 6 months (1.75x), 1 year (2x).',
  },
  {
    question: 'Can I unstake early?',
    answer: 'Tokens can only be unstaked after the lock period ends. Choose your lock duration carefully.',
  },
  {
    question: 'When do I receive staking rewards?',
    answer: 'Rewards accrue continuously and can be claimed at any time without affecting your staked balance.',
  },
  {
    question: 'What benefits do I get from staking?',
    answer: 'Stakers receive fee discounts on token launches, priority access to features, and continuous staking rewards.',
  },
];

export default function StakingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'Staking' },
  ]);

  const faqSchema = generateFAQSchema(stakingFAQs);

  return (
    <>
      <MultiJsonLd schemas={[breadcrumbSchema, faqSchema]} />
      {children}
    </>
  );
}
