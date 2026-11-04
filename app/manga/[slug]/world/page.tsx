import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchiveNotice, WorldEntryCard } from '@/components/universe';
import { Footer, Header } from '@/components/platform';
import { getMangaBySlug, getWorldEntries } from '@/lib/catalog';
import { createPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const manga = await getMangaBySlug(slug);
  return manga
    ? createPageMetadata(`${manga.title} World Guide | Dr Content Creator Manga`, `Explore the lore, locations and factions of ${manga.title}.`, `/manga/${encodeURIComponent(manga.slug)}/world`)
    : createPageMetadata('World guide | Dr Content Creator Manga', 'Explore manga worlds and lore.', `/manga/${encodeURIComponent(slug)}/world`);
}

export default async function WorldGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) notFound();
  const { items: entries, error } = await getWorldEntries(manga.id);

  return <><Header /><main className="shell page-main universe-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href={`/manga/${encodeURIComponent(manga.slug)}`}>{manga.title}</Link><span>/</span><span>World guide</span></div>
    <div className="page-intro"><div className="eyebrow">BEYOND THE PAGES</div><h1>{manga.title} <em>world guide.</em></h1><p>Explore the lore, places, powers and histories behind the story.</p></div>
    <ArchiveNotice error={error} />
    {entries.length ? <div className="universe-grid">{entries.map((entry) => <WorldEntryCard key={entry.id} mangaSlug={manga.slug} entry={entry} />)}</div> : !error ? <div className="empty-state"><h2>This world is still being mapped</h2><p>Published universe entries will appear here.</p><Link className="text-link" href={`/manga/${encodeURIComponent(manga.slug)}`}>Back to {manga.title}</Link></div> : null}
  </main><Footer /></>;
}
