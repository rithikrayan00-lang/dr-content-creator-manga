import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CharacterDetails } from '@/components/universe';
import { Footer, Header } from '@/components/platform';
import { getCharacterBySlug, getCharacterRelationships, getCharacterWorldEntries, getMangaBySlug } from '@/lib/catalog';
import { createPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; characterSlug: string }> }): Promise<Metadata> {
  const { slug, characterSlug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) return createPageMetadata('Character profile | Dr Content Creator Manga', 'Explore manga character profiles.', `/manga/${encodeURIComponent(slug)}/characters/${encodeURIComponent(characterSlug)}`);
  const character = await getCharacterBySlug(manga.id, characterSlug);
  return character
    ? createPageMetadata(`${character.name} | ${manga.title}`, character.description || `Meet ${character.name} from ${manga.title}.`, `/manga/${encodeURIComponent(manga.slug)}/characters/${encodeURIComponent(character.slug)}`)
    : createPageMetadata('Character profile | Dr Content Creator Manga', `Explore characters from ${manga.title}.`, `/manga/${encodeURIComponent(manga.slug)}/characters/${encodeURIComponent(characterSlug)}`);
}

export default async function CharacterProfilePage({ params }: { params: Promise<{ slug: string; characterSlug: string }> }) {
  const { slug, characterSlug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) notFound();
  const character = await getCharacterBySlug(manga.id, characterSlug);
  if (!character) notFound();
  const [relationshipsResult, worldEntriesResult] = await Promise.all([
    getCharacterRelationships(character),
    getCharacterWorldEntries(character),
  ]);

  return <><Header /><main className="shell page-main universe-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href={`/manga/${encodeURIComponent(manga.slug)}`}>{manga.title}</Link><span>/</span><Link href={`/manga/${encodeURIComponent(manga.slug)}/characters`}>Characters</Link><span>/</span><span>{character.name}</span></div>
    <CharacterDetails mangaSlug={manga.slug} character={character} relationships={relationshipsResult.items} worldEntries={worldEntriesResult.items} />
    {relationshipsResult.error && <p className="archive-notice" role="status">{relationshipsResult.error}</p>}
    {worldEntriesResult.error && <p className="archive-notice" role="status">{worldEntriesResult.error}</p>}
  </main><Footer /></>;
}
