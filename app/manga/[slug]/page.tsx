import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChapterRows, CoverArt, Footer, Header } from '@/components/platform';
import { getMangaBySlug, getPublishedChapters } from '@/lib/catalog';

export default async function MangaDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) notFound();
  const chapters = await getPublishedChapters(manga.id);
  const firstChapter = chapters[chapters.length - 1];

  return <><Header /><main className="shell page-main details-main"><div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/manga">Manga</Link><span>/</span><span>{manga.title}</span></div><section className="details-hero"><div className="details-cover"><CoverArt manga={manga} large /></div><div className="details-copy"><div className="eyebrow">SERIES PROFILE{manga.sample ? ' · DEVELOPMENT SAMPLE' : ''}</div><h1>{manga.title}</h1><p className="details-synopsis">{manga.synopsis || 'Synopsis coming soon.'}</p><div className="genre-row larger">{manga.genres.length ? manga.genres.map((genre) => <span key={genre}>{genre}</span>) : <span>Genres not specified</span>}</div><dl className="series-facts">{manga.author && <div><dt>Creator</dt><dd>{manga.author}</dd></div>}{manga.status && <div><dt>Status</dt><dd>{manga.status}</dd></div>}<div><dt>Chapters</dt><dd>{chapters.length ? chapters.length : 'Coming soon'}</dd></div></dl><div className="hero-actions">{firstChapter ? <Link className="button button-red" href={`/manga/${manga.slug}/chapter/${firstChapter.slug}`}>Start Reading <span>↗</span></Link> : <span className="button button-disabled" aria-disabled="true">Chapters coming soon</span>}<Link className="button button-outline" href="/manga">Back to library</Link></div></div></section><section className="chapter-section"><div className="section-heading"><div><div className="eyebrow">THE STORY SO FAR</div><h2>Chapters <span className="chapter-count">{chapters.length}</span></h2></div><span className="sort-note">Newest first</span></div><ChapterRows manga={manga} chapters={chapters} /></section></main><Footer /></>;
}
