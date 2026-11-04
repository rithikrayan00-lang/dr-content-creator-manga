'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Chapter, Manga } from '@/lib/catalog';

export function Header({ readerMode = false }: { readerMode?: boolean }) {
  return <header className={`site-header${readerMode ? ' reader-header' : ''}`}><div className="shell nav"><Link className="brand" href="/" aria-label="Dr Content Creator Manga home"><span className="brand-mark">D</span><span>DR CONTENT <b>CREATOR</b><small>MANGA LIBRARY</small></span></Link><nav className="navlinks" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/manga">Explore Manga</Link><Link href="/#latest">Latest Chapters</Link><Link href="/manga#genres">Genres</Link><Link href="/search">Search</Link></nav></div></header>;
}

export function Footer() {
  return <footer className="footer"><div className="shell footer-inner"><Link className="brand" href="/"><span className="brand-mark">D</span><span>DR CONTENT <b>CREATOR</b><small>MANGA LIBRARY</small></span></Link><p>Original stories. Worlds without limits.</p><nav aria-label="Footer navigation"><Link href="/#about">About</Link><a href="mailto:contact@drcontentcreator.com">Contact</a><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms</Link></nav><small>© {new Date().getFullYear()} Dr Content Creator Manga. All rights reserved.</small></div></footer>;
}

export function CoverArt({ manga, large = false }: { manga: Manga; large?: boolean }) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>(manga.cover_url ? 'loading' : 'error');

  useEffect(() => {
    setImageState(manga.cover_url ? 'loading' : 'error');
  }, [manga.cover_url]);

  return <div className={`cover-art ${large ? 'cover-art-large' : ''}`}>
    {manga.cover_url && imageState !== 'error' && <Image src={manga.cover_url} alt={`${manga.title} cover`} fill sizes={large ? '(max-width: 760px) 90vw, 440px' : '(max-width: 760px) 45vw, 220px'} unoptimized priority={large} onLoad={() => setImageState('loaded')} onError={() => setImageState('error')} style={{ opacity: imageState === 'loaded' ? 1 : 0 }} />}
    {imageState === 'loading' && <span className="cover-loading" role="status">Loading cover…</span>}
    {(!manga.cover_url || imageState === 'error') && <div className="cover-fallback"><span>DR CONTENT CREATOR PRESENTS</span><strong>{manga.title}</strong><small>{manga.cover_error ? 'COVER UNAVAILABLE' : manga.sample ? 'DEVELOPMENT SAMPLE' : 'MANGA SERIES'}</small>{manga.cover_error && <small className="cover-error-message">{manga.cover_error}</small>}<i /></div>}
  </div>;
}

export function MangaCard({ manga, latest }: { manga: Manga; latest?: Chapter | null }) {
  return <article className="manga-card"><Link href={`/manga/${encodeURIComponent(manga.slug)}`} className="card-cover-link" aria-label={`View ${manga.title}`}><CoverArt manga={manga} />{manga.status && <span className="status-pill">{manga.status}</span>}</Link><div className="card-copy"><div className="genre-row">{manga.genres.slice(0, 2).map((genre) => <span key={genre}>{genre}</span>)}</div><h3><Link href={`/manga/${encodeURIComponent(manga.slug)}`}>{manga.title}</Link></h3><p>{latest ? `Chapter ${latest.chapter_number}: ${latest.title}` : manga.sample ? 'Development sample · no published chapters' : 'No published chapters yet'}</p><Link className="text-link" href={`/manga/${encodeURIComponent(manga.slug)}`}>View details <b>↗</b></Link></div></article>;
}

export function MangaGrid({ manga, latestBySeries = {}, emptyMessage = 'No manga found.' }: { manga: Manga[]; latestBySeries?: Record<string, Chapter | null>; emptyMessage?: string }) {
  if (!manga.length) return <div className="empty-state"><span>✦</span><h3>Nothing here yet</h3><p>{emptyMessage}</p></div>;
  return <div className="manga-grid">{manga.map((item) => <MangaCard key={item.id} manga={item} latest={latestBySeries[item.id]} />)}</div>;
}

export function MangaBrowser({ manga, query = '' }: { manga: Manga[]; query?: string }) {
  const [search, setSearch] = useState(query);
  const [genre, setGenre] = useState('All genres');
  const [sort, setSort] = useState('newest');
  const genres = useMemo(() => [...new Set(manga.flatMap((item) => item.genres))].sort((a, b) => a.localeCompare(b)), [manga]);
  const filtered = useMemo(() => manga.filter((item) => {
    const matchesTitle = item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    return matchesTitle && (genre === 'All genres' || item.genres.includes(genre));
  }).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : b.created_at.localeCompare(a.created_at)), [manga, search, genre, sort]);
  return <>
    <div className="browser-controls"><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search manga titles" placeholder="Search manga titles…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="sort-field"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Recently added</option><option value="title">Title A–Z</option></select></label></div>
    <div id="genres" className="filter-row" aria-label="Filter by genre"><button className={genre === 'All genres' ? 'filter-chip active' : 'filter-chip'} onClick={() => setGenre('All genres')}>All genres</button>{genres.map((item) => <button key={item} className={genre === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setGenre(item)}>{item}</button>)}</div>
    <p className="results-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'series' : 'series'}</p><MangaGrid manga={filtered} emptyMessage="Try a different title or clear the selected genre filter." />
  </>;
}

export function SearchForm({ initialQuery = '' }: { initialQuery?: string }) {
  const [value, setValue] = useState(initialQuery);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(value.trim())}`;
  }
  return <form className="hero-search" onSubmit={submit}><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search manga" placeholder="Find your next story…" value={value} onChange={(event) => setValue(event.target.value)} /></label><button className="button button-red" type="submit">Search</button></form>;
}

export function ChapterRows({ manga, chapters }: { manga: Manga; chapters: Chapter[] }) {
  if (!chapters.length) return <div className="empty-state compact"><span>☾</span><h3>No chapters published yet</h3><p>Check back later for updates to {manga.title}.</p></div>;
  return <div className="chapter-list">{chapters.map((chapter) => <Link key={chapter.id} className="chapter-row" href={`/manga/${encodeURIComponent(manga.slug)}/chapter/${encodeURIComponent(chapter.slug)}`}><span className="chapter-number">CH. {String(chapter.chapter_number).padStart(2, '0')}</span><span className="chapter-title">{chapter.title}</span><time>{chapter.published_at ? new Date(chapter.published_at).toLocaleDateString() : 'Published'}</time><span className="chapter-arrow">↗</span></Link>)}</div>;
}

export function ReaderPages({ chapterId, mangaTitle, chapterNumber, pages, error }: { chapterId: string; mangaTitle: string; chapterNumber: number; pages: { id: string; page_number: number; image_url: string; image_error?: string }[]; error: string | null }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const readerRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number } | null>(null);

  function changePage(nextIndex: number) {
    setPageIndex(nextIndex);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function toggleZoom() {
    setZoom((current) => current === 1 ? 2.5 : 1);
    setPan({ x: 0, y: 0 });
  }

  function clampPan(x: number, y: number) {
    const frame = frameRef.current;
    const image = frame?.querySelector('img');
    if (!frame || !image) return { x, y };
    const maxX = Math.max(0, image.clientWidth * (zoom - 1) / 2);
    const maxY = Math.max(0, image.clientHeight * (zoom - 1) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

  async function toggleFullscreen() {
    setFullscreenError('');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await readerRef.current?.requestFullscreen();
      }
    } catch (fullscreenFailure) {
      setFullscreenError(fullscreenFailure instanceof Error ? fullscreenFailure.message : 'Fullscreen is unavailable in this browser.');
    }
  }

  useEffect(() => {
    function updateFullscreenState() {
      setIsFullscreen(document.fullscreenElement === readerRef.current);
    }
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  useEffect(() => {
    setPageIndex(0);
    setImageStates({});
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [chapterId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        changePage(Math.max(0, pageIndex - 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        changePage(Math.min(pages.length - 1, pageIndex + 1));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages.length, pageIndex]);

  if (error) return <div className="empty-state reader-empty" role="alert"><h2>Could not load chapter pages</h2><p>{error}</p></div>;
  if (!pages.length) return <div className="empty-state reader-empty"><span>◫</span><h2>No pages in this chapter yet</h2><p>Page artwork has not been uploaded for Chapter {chapterNumber}.</p></div>;

  const currentIndex = Math.min(pageIndex, pages.length - 1);
  const page = pages[currentIndex];
  const imageState = imageStates[page.id] ?? 'loading';
  const imageError = page.image_error || (imageState === 'error' ? 'The image URL could not be loaded. Check the Storage object and its published-page read policy.' : '');

  return <section ref={readerRef} className={`reader-page-view${isFullscreen ? ' reader-fullscreen' : ''}`} aria-label={`${mangaTitle}, Chapter ${chapterNumber} pages`}>
    <div className="reader-tools" aria-label="Reading controls">
      <button className="reader-tool-button" type="button" onClick={toggleZoom} aria-pressed={zoom > 1}>{zoom > 1 ? 'Reset zoom' : 'Zoom in'}</button>
      <button className="reader-tool-button" type="button" onClick={toggleFullscreen}>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
    </div>
    <figure className="reader-page-current">
      <div ref={frameRef} className={`reader-image-frame${zoom > 1 ? ' is-zoomed' : ''}`} onDoubleClick={toggleZoom} onPointerDown={(event) => {
        if (zoom === 1) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y };
      }} onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        setPan(clampPan(drag.panX + event.clientX - drag.startX, drag.panY + event.clientY - drag.startY));
      }} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
        {page.image_url && !page.image_error && imageState !== 'error' && <Image className="reader-artwork" src={page.image_url} alt={`${mangaTitle}, Chapter ${chapterNumber}, page ${page.page_number}`} width={1000} height={1400} sizes="(max-width: 1040px) 100vw, 1040px" unoptimized onLoad={() => setImageStates((current) => ({ ...current, [page.id]: 'loaded' }))} onError={() => setImageStates((current) => ({ ...current, [page.id]: 'error' }))} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} />}
        {!imageError && imageState !== 'loaded' && <span className="image-loading">Loading page {page.page_number}…</span>}
        {imageError && <div className="reader-image-error" role="alert"><strong>Page {page.page_number} image unavailable</strong><span>{imageError}</span></div>}
      </div>
      <figcaption>PAGE {String(page.page_number).padStart(2, '0')}</figcaption>
    </figure>
    <nav className="reader-page-controls" aria-label="Page navigation">
      <span className="reader-page-count" aria-live="polite">Page {page.page_number} of {pages.length}</span>
      <label className="reader-page-select"><span>Go to page</span><select aria-label="Go to page" value={currentIndex} onChange={(event) => changePage(Number(event.target.value))}>{pages.map((item, index) => <option key={item.id} value={index}>Page {item.page_number}</option>)}</select></label>
      <div className="reader-page-buttons">
        <button className="button button-outline" type="button" disabled={currentIndex === 0} onClick={() => changePage(Math.max(0, currentIndex - 1))}>← Previous Page</button>
        <button className="button button-red" type="button" disabled={currentIndex === pages.length - 1} onClick={() => changePage(Math.min(pages.length - 1, currentIndex + 1))}>Next Page →</button>
      </div>
    </nav>
    {fullscreenError && <p className="reader-fullscreen-error" role="alert">{fullscreenError}</p>}
  </section>;
}

export function ChapterPicker({ mangaSlug, chapters, currentSlug }: { mangaSlug: string; chapters: Chapter[]; currentSlug: string }) {
  return <label className="chapter-select-label">Jump to chapter<select aria-label="Jump to chapter" value={currentSlug} onChange={(event) => { window.location.href = `/manga/${encodeURIComponent(mangaSlug)}/chapter/${encodeURIComponent(event.target.value)}`; }}>{chapters.map((chapter) => <option key={chapter.id} value={chapter.slug}>Chapter {chapter.chapter_number}: {chapter.title}</option>)}</select></label>;
}
