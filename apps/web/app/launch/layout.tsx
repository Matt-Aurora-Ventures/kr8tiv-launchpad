import type { Metadata } from 'next';
import { generateLaunchPageMetadata, generateBreadcrumbSchema, generateFAQSchema, BASE_URL } from '@/lib/seo';
import { MultiJsonLd } from '@/components/seo';

export const metadata: Metadata = generateLaunchPageMetadata();

// FAQ content for the launch page
const launchFAQs = [
  {
    question: 'How much does it cost to launch a token on KR8TIV Launchpad?',
    answer: 'The base fee is 0.5 SOL to launch a token. KR8TIV stakers receive discounts up to 50% based on their staking tier.',
  },
  {
    question: 'What tokenomics can I customize?',
    answer: 'You can configure burn tax (deflationary), LP tax (automatic liquidity), dividends (holder rewards), and custom wallet allocations for marketing or development funds.',
  },
  {
    question: 'Is there a maximum tax I can set?',
    answer: 'Yes, the maximum total tax is capped at 25% to protect traders and ensure a healthy trading environment.',
  },
  {
    question: 'How long does it take to launch a token?',
    answer: 'Token deployment is instant once you complete the wizard and sign the transaction. Your token will be live on Solana immediately.',
  },
  {
    question: 'Do I need coding experience?',
    answer: 'No coding required. Our wizard guides you through every step with sensible defaults and clear explanations.',
  },
];

export default function LaunchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'Launch Token' },
  ]);

  const faqSchema = generateFAQSchema(launchFAQs);

  return (
    <>
      <MultiJsonLd schemas={[breadcrumbSchema, faqSchema]} />
      {children}
    </>
  );
}
