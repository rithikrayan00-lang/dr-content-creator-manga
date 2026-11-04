import type { MetadataRoute } from 'next';
import { getMangaList, getPublishedChapters } from '@/lib/catalog';
import { getSiteOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

function lastModified(value: string): Date | undefined {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const manga = (await getMangaList()).filter((series) => !series.sample);
  const entries: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: 'daily', priority: 1 },
    { url: `${origin}/manga`, changeFrequency: 'daily', priority: 0.9 },
  ];

  const chapterEntries = await Promise.all(manga.map(async (series) => {
    const chapters = await getPublishedChapters(series.id);
    return [
      {
        url: `${origin}/manga/${encodeURIComponent(series.slug)}`,
        lastModified: lastModified(series.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      ...chapters.map((chapter) => ({
        url: `${origin}/manga/${encodeURIComponent(series.slug)}/chapter/${encodeURIComponent(chapter.slug)}`,
        lastModified: lastModified(chapter.published_at ?? chapter.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ];
  }));
  entries.push(...chapterEntries.flat());
  return entries;
}
