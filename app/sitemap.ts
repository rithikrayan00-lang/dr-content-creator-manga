import type { MetadataRoute } from 'next';
import { getCharacters, getMangaList, getPublishedChapters, getWorldEntries } from '@/lib/catalog';
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

  const seriesEntries = await Promise.all(manga.map(async (series) => {
    const [chapters, characters, worldEntries] = await Promise.all([
      getPublishedChapters(series.id),
      getCharacters(series.id),
      getWorldEntries(series.id),
    ]);
    return [
      {
        url: `${origin}/manga/${encodeURIComponent(series.slug)}`,
        lastModified: lastModified(series.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      ...(characters.items.length > 0 ? [{
        url: `${origin}/manga/${encodeURIComponent(series.slug)}/characters`,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }] : []),
      ...characters.items.map((character) => ({
        url: `${origin}/manga/${encodeURIComponent(series.slug)}/characters/${encodeURIComponent(character.slug)}`,
        lastModified: lastModified(series.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      })),
      ...(worldEntries.items.length > 0 ? [{
        url: `${origin}/manga/${encodeURIComponent(series.slug)}/world`,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }] : []),
      ...worldEntries.items.map((entry) => ({
        url: `${origin}/manga/${encodeURIComponent(series.slug)}/world/${encodeURIComponent(entry.slug)}`,
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      })),
      ...chapters.map((chapter) => ({
        url: `${origin}/manga/${encodeURIComponent(series.slug)}/chapter/${encodeURIComponent(chapter.slug)}`,
        lastModified: lastModified(chapter.published_at ?? chapter.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ];
  }));
  entries.push(...seriesEntries.flat());
  return entries;
}
