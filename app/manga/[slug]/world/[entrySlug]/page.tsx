import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WorldEntryDetails } from '@/components/universe';
import { Footer, Header } from '@/components/platform';
import { getMangaBySlug, getWorldEntryBySlug } from '@/lib/catalog';
import { createPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; entrySlug: string }> }): Promise<Metadata> {
  const { slug, entrySlug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) return createPageMetadata('World entry | Dr Content Creator Manga', 'Explore manga world-building entries.', `/manga/${encodeURIComponent(slug)}/world/${encodeURIComponent(entrySlug)}`);
  const entry = await getWorldEntryBySlug(manga.id, entrySlug);
  return entry
    ? createPageMetadata(`${entry.title} | ${manga.title} World Guide`, entry.summary || `Discover ${entry.title} in the world of ${manga.title}.`, `/manga/${encodeURIComponent(manga.slug)}/world/${encodeURIComponent(entry.slug)}`)
    : createPageMetadata('World entry | Dr Content Creator Manga', `Explore the world of ${manga.title}.`, `/manga/${encodeURIComponent(manga.slug)}/world/${encodeURIComponent(entrySlug)}`);
}

export default async function WorldEntryPage({ params }: { params: Promise<{ slug: string; entrySlug: string }> }) {
  const { slug, entrySlug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) notFound();
  const entry = await getWorldEntryBySlug(manga.id, entrySlug);
  if (!entry) notFound();

  return <><Header /><main className="shell page-main universe-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href={`/manga/${encodeURIComponent(manga.slug)}`}>{manga.title}</Link><span>/</span><Link href={`/manga/${encodeURIComponent(manga.slug)}/world`}>World guide</Link><span>/</span><span>{entry.title}</span></div>
    <WorldEntryDetails entry={entry} />
  </main><Footer /></>;
}
