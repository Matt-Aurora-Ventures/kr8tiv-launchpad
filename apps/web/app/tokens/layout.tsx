import type { Metadata } from 'next';
import { generateTokensPageMetadata, generateBreadcrumbSchema, BASE_URL } from '@/lib/seo';
import { JsonLd } from '@/components/seo';

export const metadata: Metadata = generateTokensPageMetadata();

export default function TokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'Tokens' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      {children}
    </>
  );
}
