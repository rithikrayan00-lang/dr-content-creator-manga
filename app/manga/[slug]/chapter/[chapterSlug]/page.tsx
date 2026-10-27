import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChapterPicker, Footer, Header, ReaderPages } from '@/components/platform';
import { getChapterPages, getMangaBySlug, getPublishedChapter, getPublishedChapters } from '@/lib/catalog';

export default async function MangaReaderPage({ params }: { params: Promise<{ slug: string; chapterSlug: string }> }) {
  const { slug, chapterSlug } = await params;
  const manga = await getMangaBySlug(slug);
  if (!manga) notFound();
  const chapter = await getPublishedChapter(manga.id, chapterSlug);
  if (!chapter) notFound();
  const chapters = await getPublishedChapters(manga.id);
  const chapterOptions = chapters.some((item) => item.id === chapter.id)
    ? chapters
    : [...chapters, chapter].sort((a, b) => b.chapter_number - a.chapter_number);
  const currentIndex = chapterOptions.findIndex((item) => item.id === chapter.id);
  const next = chapterOptions[currentIndex - 1];
  const previous = chapterOptions[currentIndex + 1];
  const { pages, error: pagesError } = await getChapterPages(chapter.id);

  return <><Header /><main className="reader-shell"><div className="reader-top shell"><div className="breadcrumbs"><Link href={`/manga/${manga.slug}`}>{manga.title}</Link><span>/</span><span>Chapter {chapter.chapter_number}</span></div><div className="reader-title"><div><div className="eyebrow">{manga.title}</div><h1>Chapter {chapter.chapter_number}: {chapter.title}</h1></div><ChapterPicker mangaSlug={manga.slug} chapters={chapterOptions} currentSlug={chapter.slug} /></div></div><div className="reading-area"><ReaderPages key={chapter.id} chapterId={chapter.id} mangaTitle={manga.title} chapterNumber={chapter.chapter_number} pages={pages} error={pagesError} /></div><nav className="chapter-navigation shell" aria-label="Chapter navigation"><Link className={previous ? 'button button-outline' : 'button button-disabled'} aria-disabled={!previous} href={previous ? `/manga/${manga.slug}/chapter/${previous.slug}` : `/manga/${manga.slug}`}><span>←</span> Previous Chapter</Link><Link className="back-details" href={`/manga/${manga.slug}`}>Back to Manga Details</Link>{next ? <Link className="button button-red" href={`/manga/${manga.slug}/chapter/${next.slug}`}>Next Chapter <span>→</span></Link> : <span className="button button-disabled" aria-disabled="true">Next Chapter <span>→</span></span>}</nav></main><Footer /></>;
}
