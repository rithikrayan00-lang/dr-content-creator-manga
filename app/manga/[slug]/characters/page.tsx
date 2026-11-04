import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchiveNotice, CharacterCard } from '@/components/universe';
import { Footer, Header } from '@/components/platform';
import { getCharacters, getMangaBySlug } from '@/lib/catalog';
import { createPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const manga = await getMangaBySlug(slug);
  return manga
    ? createPageMetadata(`${manga.title} Characters | Dr Content Creator Manga`, `Meet the characters of ${manga.title}.`, `/manga/${encodeURIComponent(manga.slug)}/characters`)
    : createPageMetadata('Character archive | Dr Content Creator Manga', 'Explore manga character profiles.', `/manga/${encodeURIComponent(slug)}/characters`);
}

export default async function CharacterArchivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) notFound();
  const { items: characters, error } = await getCharacters(manga.id);

  return <><Header /><main className="shell page-main universe-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href={`/manga/${encodeURIComponent(manga.slug)}`}>{manga.title}</Link><span>/</span><span>Characters</span></div>
    <div className="page-intro"><div className="eyebrow">MEET THE CAST</div><h1>{manga.title} <em>characters.</em></h1><p>Character profiles, abilities and connections from this story.</p></div>
    <ArchiveNotice error={error} />
    {characters.length ? <div className="universe-grid">{characters.map((character) => <CharacterCard key={character.id} mangaSlug={manga.slug} character={character} />)}</div> : !error ? <div className="empty-state"><h2>The character archive is taking shape</h2><p>Published character profiles will appear here.</p><Link className="text-link" href={`/manga/${encodeURIComponent(manga.slug)}`}>Back to {manga.title}</Link></div> : null}
  </main><Footer /></>;
}
