import type { Metadata } from 'next';
import { generateDashboardPageMetadata, generateBreadcrumbSchema, BASE_URL } from '@/lib/seo';
import { JsonLd } from '@/components/seo';

export const metadata: Metadata = generateDashboardPageMetadata();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'Dashboard' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      {children}
    </>
  );
}
