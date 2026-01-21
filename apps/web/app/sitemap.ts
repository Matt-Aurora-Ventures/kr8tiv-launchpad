import { MetadataRoute } from 'next';
import { tokenApi } from '@/lib/api';
import { BASE_URL } from '@/lib/seo';

/**
 * Dynamic sitemap generator for SEO
 * Includes all static pages and dynamically fetches all tokens
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/launch`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/staking`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tokens`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // Fetch all tokens for dynamic pages
  let tokenPages: MetadataRoute.Sitemap = [];

  try {
    // Fetch tokens in batches to handle large lists
    const pageSize = 100;
    let page = 1;
    let hasMore = true;
    const allTokens: { mint: string; createdAt: string }[] = [];

    while (hasMore && page <= 10) {
      // Limit to 1000 tokens max
      const response = await tokenApi.list({
        page,
        pageSize,
        sortBy: 'createdAt',
        order: 'desc',
      });

      allTokens.push(
        ...response.items.map((token) => ({
          mint: token.mint,
          createdAt: token.createdAt,
        }))
      );

      hasMore = response.hasMore;
      page++;
    }

    tokenPages = allTokens.map((token) => ({
      url: `${BASE_URL}/tokens/${token.mint}`,
      lastModified: new Date(token.createdAt),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch (error) {
    // If API fails, still return static pages
    console.error('Failed to fetch tokens for sitemap:', error);
  }

  return [...staticPages, ...tokenPages];
}
