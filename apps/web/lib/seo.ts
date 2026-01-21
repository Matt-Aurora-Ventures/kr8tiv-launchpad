import type { Metadata } from 'next';
import type { TokenInfo } from './api';

// Base URL for the application
export const BASE_URL = 'https://launchpad.kr8tiv.com';

// Default metadata values
export const DEFAULT_METADATA = {
  siteName: 'KR8TIV Launchpad',
  title: 'KR8TIV Launchpad | Launch Tokens on Solana',
  description:
    'Launch tokens on Solana with customizable tokenomics, staking rewards, and automated fee distribution. Powered by Bags.fm.',
  keywords: [
    'solana',
    'token launch',
    'launchpad',
    'staking',
    'defi',
    'crypto',
    'token creator',
    'tokenomics',
    'burn tax',
    'liquidity pool',
    'dividends',
    'solana tokens',
    'web3',
  ],
  author: 'KR8TIV',
  twitterHandle: '@KR8TIV',
  ogImage: '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
};

// Generate base metadata with defaults
export function generateBaseMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: DEFAULT_METADATA.title,
      template: `%s | ${DEFAULT_METADATA.siteName}`,
    },
    description: DEFAULT_METADATA.description,
    keywords: DEFAULT_METADATA.keywords,
    authors: [{ name: DEFAULT_METADATA.author }],
    creator: DEFAULT_METADATA.author,
    publisher: DEFAULT_METADATA.author,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: BASE_URL,
      siteName: DEFAULT_METADATA.siteName,
      title: DEFAULT_METADATA.title,
      description: DEFAULT_METADATA.description,
      images: [
        {
          url: DEFAULT_METADATA.ogImage,
          width: DEFAULT_METADATA.ogImageWidth,
          height: DEFAULT_METADATA.ogImageHeight,
          alt: DEFAULT_METADATA.siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: DEFAULT_METADATA.twitterHandle,
      creator: DEFAULT_METADATA.twitterHandle,
      title: DEFAULT_METADATA.title,
      description: DEFAULT_METADATA.description,
      images: [DEFAULT_METADATA.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add your verification codes here when needed
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
    },
    alternates: {
      canonical: BASE_URL,
    },
    ...overrides,
  };
}

// Generate metadata for a specific token page
export function generateTokenMetadata(token: TokenInfo): Metadata {
  const title = `${token.name} (${token.symbol})`;
  const description =
    token.description ||
    `Trade ${token.name} ($${token.symbol}) on Solana. View price, market cap, volume, and tokenomics on KR8TIV Launchpad.`;
  const url = `${BASE_URL}/tokens/${token.mint}`;
  const image = token.image || DEFAULT_METADATA.ogImage;

  return {
    title,
    description,
    keywords: [
      token.name,
      token.symbol,
      'solana token',
      'crypto',
      'defi',
      ...DEFAULT_METADATA.keywords.slice(0, 5),
    ],
    openGraph: {
      type: 'website',
      url,
      title: `${title} | ${DEFAULT_METADATA.siteName}`,
      description,
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: `${token.name} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: DEFAULT_METADATA.twitterHandle,
      creator: DEFAULT_METADATA.twitterHandle,
      title: `${title} | ${DEFAULT_METADATA.siteName}`,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Generate metadata for the launch page
export function generateLaunchPageMetadata(): Metadata {
  return {
    title: 'Launch Your Token',
    description:
      'Create and deploy your own token on Solana in minutes. Customize burn rates, liquidity pool contributions, dividends, and more. No coding required.',
    keywords: [
      'create token',
      'launch token',
      'solana token creator',
      'deploy token',
      'no code token',
      ...DEFAULT_METADATA.keywords,
    ],
    openGraph: {
      title: `Launch Your Token | ${DEFAULT_METADATA.siteName}`,
      description:
        'Create and deploy your own token on Solana in minutes. Customize tokenomics with burn, LP, and dividends.',
      url: `${BASE_URL}/launch`,
    },
    alternates: {
      canonical: `${BASE_URL}/launch`,
    },
  };
}

// Generate metadata for the staking page
export function generateStakingPageMetadata(): Metadata {
  return {
    title: 'Stake KR8TIV',
    description:
      'Stake KR8TIV tokens to earn rewards and unlock fee discounts up to 100%. Lock longer for higher multipliers.',
    keywords: [
      'stake kr8tiv',
      'staking rewards',
      'fee discount',
      'solana staking',
      'defi staking',
      ...DEFAULT_METADATA.keywords,
    ],
    openGraph: {
      title: `Stake KR8TIV | ${DEFAULT_METADATA.siteName}`,
      description:
        'Stake KR8TIV tokens to earn rewards and unlock fee discounts up to 100%.',
      url: `${BASE_URL}/staking`,
    },
    alternates: {
      canonical: `${BASE_URL}/staking`,
    },
  };
}

// Generate metadata for the tokens list page
export function generateTokensPageMetadata(): Metadata {
  return {
    title: 'Explore Tokens',
    description:
      'Discover and explore tokens launched on KR8TIV Launchpad. View market caps, volumes, holders, and tokenomics for Solana tokens.',
    keywords: [
      'explore tokens',
      'solana tokens',
      'token list',
      'crypto tokens',
      'defi tokens',
      ...DEFAULT_METADATA.keywords,
    ],
    openGraph: {
      title: `Explore Tokens | ${DEFAULT_METADATA.siteName}`,
      description:
        'Discover and explore tokens launched on KR8TIV Launchpad.',
      url: `${BASE_URL}/tokens`,
    },
    alternates: {
      canonical: `${BASE_URL}/tokens`,
    },
  };
}

// Generate metadata for the dashboard page
export function generateDashboardPageMetadata(): Metadata {
  return {
    title: 'Dashboard',
    description:
      'Manage your tokens, view analytics, and track your staking rewards on KR8TIV Launchpad.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `Dashboard | ${DEFAULT_METADATA.siteName}`,
      description: 'Manage your tokens and staking on KR8TIV Launchpad.',
      url: `${BASE_URL}/dashboard`,
    },
    alternates: {
      canonical: `${BASE_URL}/dashboard`,
    },
  };
}

// JSON-LD Schema generators

export interface WebsiteSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    '@type': string;
    target: string;
    'query-input': string;
  };
}

export function generateWebsiteSchema(): WebsiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_METADATA.siteName,
    url: BASE_URL,
    description: DEFAULT_METADATA.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/tokens?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  description: string;
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_METADATA.author,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/KR8TIV',
      // Add other social profiles here
    ],
    description: DEFAULT_METADATA.description,
  };
}

export interface ProductSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  image?: string;
  url: string;
  brand: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

export function generateTokenSchema(token: TokenInfo): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${token.name} (${token.symbol})`,
    description:
      token.description ||
      `${token.name} is a token on Solana with customizable tokenomics.`,
    image: token.image,
    url: `${BASE_URL}/tokens/${token.mint}`,
    brand: {
      '@type': 'Brand',
      name: DEFAULT_METADATA.siteName,
    },
    offers: {
      '@type': 'Offer',
      price: token.stats.price.toString(),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

export interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: {
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }[];
}

export function generateBreadcrumbSchema(
  items: { name: string; url?: string }[]
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

export interface FAQSchema {
  '@context': string;
  '@type': string;
  mainEntity: {
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }[];
}

export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Utility to combine multiple schemas for a page
export function combineSchemas(
  ...schemas: (
    | WebsiteSchema
    | OrganizationSchema
    | ProductSchema
    | BreadcrumbSchema
    | FAQSchema
  )[]
): string {
  if (schemas.length === 1) {
    return JSON.stringify(schemas[0]);
  }
  return JSON.stringify(schemas);
}
