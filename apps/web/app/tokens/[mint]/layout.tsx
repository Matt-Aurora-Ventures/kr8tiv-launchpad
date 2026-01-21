import type { Metadata } from 'next';
import { tokenApi } from '@/lib/api';
import { generateTokenMetadata, generateTokenSchema, generateBreadcrumbSchema, BASE_URL, DEFAULT_METADATA } from '@/lib/seo';
import { JsonLd, MultiJsonLd } from '@/components/seo';

interface TokenLayoutProps {
  children: React.ReactNode;
  params: Promise<{ mint: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mint: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const token = await tokenApi.get(resolvedParams.mint);
    return generateTokenMetadata(token);
  } catch (error) {
    // Fallback metadata if token not found
    return {
      title: 'Token Not Found',
      description: 'The requested token could not be found.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

export default async function TokenLayout({ children, params }: TokenLayoutProps) {
  const resolvedParams = await params;

  // Fetch token for JSON-LD schemas (can fail gracefully)
  let schemas: object[] = [];

  try {
    const token = await tokenApi.get(resolvedParams.mint);

    // Token product schema
    schemas.push(generateTokenSchema(token));

    // Breadcrumb schema
    schemas.push(
      generateBreadcrumbSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Tokens', url: `${BASE_URL}/tokens` },
        { name: `${token.name} (${token.symbol})` },
      ])
    );
  } catch (error) {
    // Still provide breadcrumb for error page
    schemas.push(
      generateBreadcrumbSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Tokens', url: `${BASE_URL}/tokens` },
        { name: 'Token' },
      ])
    );
  }

  return (
    <>
      <MultiJsonLd schemas={schemas as any[]} />
      {children}
    </>
  );
}
