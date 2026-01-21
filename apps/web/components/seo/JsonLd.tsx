import type {
  WebsiteSchema,
  OrganizationSchema,
  ProductSchema,
  BreadcrumbSchema,
  FAQSchema,
} from '@/lib/seo';

type SchemaType =
  | WebsiteSchema
  | OrganizationSchema
  | ProductSchema
  | BreadcrumbSchema
  | FAQSchema;

interface JsonLdProps {
  schema: SchemaType | SchemaType[];
}

/**
 * JSON-LD structured data component for SEO
 *
 * Usage:
 * ```tsx
 * import { JsonLd } from '@/components/seo/JsonLd';
 * import { generateTokenSchema } from '@/lib/seo';
 *
 * <JsonLd schema={generateTokenSchema(token)} />
 * ```
 */
export function JsonLd({ schema }: JsonLdProps) {
  const jsonLdString = JSON.stringify(schema);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
    />
  );
}

/**
 * Multiple JSON-LD schemas component
 * Renders multiple schemas as separate script tags for better parsing
 */
interface MultiJsonLdProps {
  schemas: SchemaType[];
}

export function MultiJsonLd({ schemas }: MultiJsonLdProps) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export default JsonLd;
