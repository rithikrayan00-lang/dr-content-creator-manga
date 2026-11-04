'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const countClass = manga.length === 1 ? ' manga-grid-single' : '';
  return <div className={`manga-grid${countClass}`}>{manga.map((item) => <MangaCard key={item.id} manga={item} latest={latestBySeries[item.id]} />)}</div>;
}

export function MangaBrowser({ manga, query = '', initialGenre = 'All genres' }: { manga: Manga[]; query?: string; initialGenre?: string }) {
  const [search, setSearch] = useState(query);
  const [genre, setGenre] = useState(initialGenre);
  const [sort, setSort] = useState('newest');
  const genres = useMemo(() => [...new Set(manga.flatMap((item) => item.genres))].sort((a, b) => a.localeCompare(b)), [manga]);
  const filtered = useMemo(() => manga.filter((item) => {
    const matchesTitle = item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    return matchesTitle && (genre === 'All genres' || item.genres.includes(genre));
  }).sort((a, b) => sort === 'title'
    ? a.title.localeCompare(b.title)
    : sort === 'ongoing'
      ? Number(b.status === 'Ongoing') - Number(a.status === 'Ongoing') || b.created_at.localeCompare(a.created_at)
      : b.created_at.localeCompare(a.created_at)), [manga, search, genre, sort]);
  return <>
    <div className="browser-controls"><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search manga titles" placeholder="Search manga titles…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="sort-field"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Recently added</option><option value="title">Title A–Z</option><option value="ongoing">Ongoing first</option></select></label></div>
    <div id="genres" className="filter-row" aria-label="Filter by genre"><button className={genre === 'All genres' ? 'filter-chip active' : 'filter-chip'} onClick={() => setGenre('All genres')}>All genres</button>{genres.map((item) => <button key={item} className={genre === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setGenre(item)}>{item}</button>)}</div>
    <p className="results-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'series' : 'series'} found</p><MangaGrid manga={filtered} emptyMessage="Try a different title or clear the selected genre filter." />
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

type ReaderMode = 'single' | 'double' | 'vertical';
type ReadingDirection = 'rtl' | 'ltr';
type ReaderBackground = 'black' | 'grey' | 'white';
type ReaderFit = 'width' | 'height' | 'original';

type ReaderSettings = {
  mode: ReaderMode;
  direction: ReadingDirection;
  background: ReaderBackground;
  fit: ReaderFit;
  controlsVisible: boolean;
};

const READER_SETTINGS_KEY = 'dr-manga-reader-settings';

export function ReaderPages({ chapterId, mangaTitle, chapterNumber, pages, error }: { chapterId: string; mangaTitle: string; chapterNumber: number; pages: { id: string; page_number: number; image_url: string; image_error?: string }[]; error: string | null }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<ReaderMode>('single');
  const [direction, setDirection] = useState<ReadingDirection>('rtl');
  const [background, setBackground] = useState<ReaderBackground>('black');
  const [fit, setFit] = useState<ReaderFit>('width');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const readerRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number } | null>(null);
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const shouldScrollToPageRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);

  const changePage = useCallback((nextIndex: number, shouldScroll = false) => {
    setPageIndex(Math.max(0, Math.min(pages.length - 1, nextIndex)));
    if (shouldScroll && mode === 'vertical') shouldScrollToPageRef.current = true;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [mode, pages.length]);

  const movePage = useCallback((delta: -1 | 1) => {
    if (mode !== 'double') {
      changePage(pageIndex + delta, true);
      return;
    }

    const spreadStart = pageIndex === 0 ? 0 : 1 + Math.floor((pageIndex - 1) / 2) * 2;
    if (delta > 0) {
      const nextStart = spreadStart === 0 ? 1 : spreadStart + 2;
      if (nextStart < pages.length) changePage(nextStart, true);
    } else {
      changePage(spreadStart <= 1 ? 0 : spreadStart - 2, true);
    }
  }, [changePage, mode, pageIndex, pages.length]);

  function toggleZoom() {
    setZoom((current) => current === 1 ? 2.5 : 1);
    setPan({ x: 0, y: 0 });
  }

  const setSelectedPage = useCallback((index: number) => {
    const pageStart = mode === 'double' && index > 0 ? 1 + Math.floor((index - 1) / 2) * 2 : index;
    changePage(pageStart, true);
  }, [changePage, mode]);

  function clampPan(x: number, y: number) {
    const frame = frameRef.current;
    const image = frame?.querySelector('img');
    if (!frame || !image) return { x, y };
    const maxX = Math.max(0, image.clientWidth * (zoom - 1) / 2);
    const maxY = Math.max(0, image.clientHeight * (zoom - 1) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || zoom > 1) event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType === 'touch') {
      activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.current.size === 2) {
        const points = [...activePointers.current.values()];
        pinchRef.current = { distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y), zoom };
        dragRef.current = null;
        return;
      }
    }
    if (zoom === 1 && event.pointerType !== 'touch') return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointers.current.has(event.pointerId)) {
      activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = [...activePointers.current.values()];
      if (points.length === 2 && pinchRef.current) {
        const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
        setZoom(Math.max(1, Math.min(3, pinchRef.current.zoom * distance / pinchRef.current.distance)));
        return;
      }
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan(clampPan(drag.panX + event.clientX - drag.startX, drag.panY + event.clientY - drag.startY));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    activePointers.current.delete(event.pointerId);
    if (activePointers.current.size < 2) pinchRef.current = null;
    dragRef.current = null;
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
    try {
      const stored = localStorage.getItem(READER_SETTINGS_KEY);
      if (stored) {
        const settings: Partial<ReaderSettings> = JSON.parse(stored) as Partial<ReaderSettings>;
        if (settings.mode === 'single' || settings.mode === 'double' || settings.mode === 'vertical') setMode(settings.mode);
        if (settings.direction === 'rtl' || settings.direction === 'ltr') setDirection(settings.direction);
        if (settings.background === 'black' || settings.background === 'grey' || settings.background === 'white') setBackground(settings.background);
        if (settings.fit === 'width' || settings.fit === 'height' || settings.fit === 'original') setFit(settings.fit);
        if (typeof settings.controlsVisible === 'boolean') setControlsVisible(settings.controlsVisible);
      }
    } catch (settingsError) {
      console.error('Could not restore manga reader settings.', settingsError);
    }
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    const settings: ReaderSettings = { mode, direction, background, fit, controlsVisible };
    try {
      localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (settingsError) {
      console.error('Could not save manga reader settings.', settingsError);
    }
  }, [mode, direction, background, fit, controlsVisible, settingsReady]);

  useEffect(() => {
    setPageIndex(0);
    setImageStates({});
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setProgressReady(false);
    try {
      const savedPage = Number(localStorage.getItem(`dr-manga-progress:${chapterId}`));
      const savedIndex = pages.findIndex((page) => page.page_number === savedPage);
      if (savedIndex >= 0) setPageIndex(savedIndex);
    } catch (progressError) {
      console.error('Could not restore manga reading progress.', progressError);
    }
    setProgressReady(true);
  }, [chapterId, pages]);

  useEffect(() => {
    if (!progressReady || !pages.length) return;
    try {
      localStorage.setItem(`dr-manga-progress:${chapterId}`, String(pages[pageIndex]?.page_number ?? pages[0].page_number));
    } catch (progressError) {
      console.error('Could not save manga reading progress.', progressError);
    }
  }, [chapterId, pageIndex, pages, progressReady]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return;
      const previousKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      const nextKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      if (event.key === previousKey) {
        event.preventDefault();
        movePage(-1);
      } else if (event.key === nextKey) {
        event.preventDefault();
        movePage(1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, movePage]);

  useEffect(() => {
    if (mode !== 'vertical') return;
    const pagesElement = readerRef.current?.querySelectorAll<HTMLElement>('[data-reader-page-index]');
    if (!pagesElement?.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) changePage(Number((visible.target as HTMLElement).dataset.readerPageIndex));
    }, { threshold: [0.35, 0.65] });
    pagesElement.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [changePage, mode, pages.length]);

  useEffect(() => {
    if (mode !== 'vertical' || !shouldScrollToPageRef.current) return;
    readerRef.current?.querySelector(`[data-reader-page-index="${pageIndex}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    shouldScrollToPageRef.current = false;
  }, [mode, pageIndex]);

  if (error) return <div className="empty-state reader-empty" role="alert"><h2>Could not load chapter pages</h2><p>{error}</p></div>;
  if (!pages.length) return <div className="empty-state reader-empty"><span>◫</span><h2>No pages in this chapter yet</h2><p>Page artwork has not been uploaded for Chapter {chapterNumber}.</p></div>;

  const currentIndex = Math.min(pageIndex, pages.length - 1);
  const page = pages[currentIndex];
  const imageState = imageStates[page.id] ?? 'loading';
  const imageError = page.image_error || (imageState === 'error' ? 'The image URL could not be loaded. Check the Storage object and its published-page read policy.' : '');
  const spreadStart = currentIndex === 0 ? 0 : 1 + Math.floor((currentIndex - 1) / 2) * 2;
  const spreadPages = mode === 'double' ? pages.slice(spreadStart, spreadStart === 0 ? 1 : spreadStart + 2) : [page];
  const visiblePages = direction === 'rtl' ? [...spreadPages].reverse() : spreadPages;
  const firstVisiblePage = spreadPages[0]?.page_number;
  const lastVisiblePage = spreadPages[spreadPages.length - 1]?.page_number;
  const readerClassName = `reader-page-view${isFullscreen ? ' reader-fullscreen' : ''} reader-background-${background}${mode === 'vertical' ? ' reader-mode-vertical' : ''}`;

  return <section ref={readerRef} className={readerClassName} aria-label={`${mangaTitle}, Chapter ${chapterNumber} pages`}>
    {controlsVisible && <div className="reader-tools" aria-label="Reading controls">
      <button className="reader-tool-button" type="button" aria-expanded={settingsOpen} aria-controls="reader-settings" onClick={() => setSettingsOpen((open) => !open)}>Settings</button>
      <button className="reader-tool-button" type="button" onClick={toggleFullscreen}>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
      <button className="reader-tool-button" type="button" onClick={() => setControlsVisible(false)}>Hide controls</button>
    </div>}
    {controlsVisible && settingsOpen && <div id="reader-settings" className="reader-settings-panel" aria-label="Reader settings">
      <label className="reader-setting">Reading mode<select aria-label="Reading mode" value={mode} onChange={(event) => { setMode(event.target.value as ReaderMode); setPageIndex((index) => index > 0 && event.target.value === 'double' ? 1 + Math.floor((index - 1) / 2) * 2 : index); }}><option value="single">Single page</option><option value="double">Double page</option><option value="vertical">Long strip</option></select></label>
      <label className="reader-setting">Direction<select aria-label="Reading direction" value={direction} onChange={(event) => setDirection(event.target.value as ReadingDirection)}><option value="rtl">Right to left</option><option value="ltr">Left to right</option></select></label>
      <label className="reader-setting">Image fit<select aria-label="Image fit" value={fit} onChange={(event) => setFit(event.target.value as ReaderFit)}><option value="width">Fit width</option><option value="height">Fit height</option><option value="original">Original size</option></select></label>
      <label className="reader-setting">Background<select aria-label="Reader background" value={background} onChange={(event) => setBackground(event.target.value as ReaderBackground)}><option value="black">Black</option><option value="grey">Dark grey</option><option value="white">White</option></select></label>
      <div className="reader-setting"><span>Zoom</span><div className="reader-zoom-tools" aria-label="Zoom controls"><button className="reader-tool-button" type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - .25))}>−</button><button className="reader-tool-button" type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + .25))}>+</button><button className="reader-tool-button" type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button></div></div>
      <label className="reader-setting">Go to page<select aria-label="Go to page" value={currentIndex} onChange={(event) => setSelectedPage(Number(event.target.value))}>{pages.map((item, index) => <option key={item.id} value={index}>Page {item.page_number}</option>)}</select></label>
    </div>}
    {!controlsVisible && <button className="reader-tool-button reader-show-controls" type="button" onClick={() => setControlsVisible(true)}>Show reader controls</button>}
    {mode === 'vertical' ? <div className="reader-vertical-pages">{pages.map((item, index) => {
      const state = imageStates[item.id] ?? 'loading';
      const itemError = item.image_error || (state === 'error' ? 'The image URL could not be loaded. Check the Storage object and its published-page Storage policy.' : '');
      return <figure key={item.id} data-reader-page-index={index} className={`reader-page-current reader-vertical-page${index === currentIndex ? ' is-current' : ''}`} onClick={() => changePage(index)}>
        <div ref={index === currentIndex ? frameRef : undefined} className={`reader-image-frame${zoom > 1 ? ' is-zoomed' : ''} reader-fit-${fit}`} onDoubleClick={toggleZoom} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
          {item.image_url && !item.image_error && state !== 'error' && <Image className="reader-artwork" src={item.image_url} alt={`${mangaTitle}, Chapter ${chapterNumber}, page ${item.page_number}`} width={1000} height={1400} sizes="(max-width: 1040px) 100vw, 1040px" unoptimized loading="lazy" onLoad={() => setImageStates((current) => ({ ...current, [item.id]: 'loaded' }))} onError={() => setImageStates((current) => ({ ...current, [item.id]: 'error' }))} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} />}
          {!itemError && state !== 'loaded' && <span className="image-loading">Loading page {item.page_number}…</span>}
          {itemError && <div className="reader-image-error" role="alert"><strong>Page {item.page_number} image unavailable</strong><span>{itemError}</span>{!item.image_error && <button type="button" className="button button-outline" onClick={(event) => { event.stopPropagation(); setImageStates((current) => ({ ...current, [item.id]: 'loading' })); }}>Retry image</button>}</div>}
        </div><figcaption>PAGE {String(item.page_number).padStart(2, '0')}</figcaption>
      </figure>;
    })}</div> : <div className={`reader-spread${mode === 'double' ? ' is-double' : ''}${mode === 'double' && spreadStart === 0 && direction === 'rtl' ? ' is-first-rtl' : ''}`} dir="ltr">
      {visiblePages.map((item) => {
        const state = imageStates[item.id] ?? 'loading';
        const itemError = item.image_error || (state === 'error' ? 'The image URL could not be loaded. Check the Storage object and its published-page Storage policy.' : '');
        return <figure key={item.id} className="reader-page-current">
          <div ref={item.id === page.id ? frameRef : undefined} className={`reader-image-frame${zoom > 1 ? ' is-zoomed' : ''} reader-fit-${fit}`} onDoubleClick={toggleZoom} onTouchStart={(event) => { touchStartRef.current = event.touches.length === 1 ? event.touches[0].clientX : null; }} onTouchEnd={(event) => {
            if (touchStartRef.current === null || event.changedTouches.length !== 1) return;
            const distance = event.changedTouches[0].clientX - touchStartRef.current;
            touchStartRef.current = null;
            if (Math.abs(distance) < 55) return;
            const movingForward = direction === 'rtl' ? distance < 0 : distance > 0;
            movePage(movingForward ? 1 : -1);
          }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            {item.image_url && !item.image_error && state !== 'error' && <Image className="reader-artwork" src={item.image_url} alt={`${mangaTitle}, Chapter ${chapterNumber}, page ${item.page_number}`} width={1000} height={1400} sizes="(max-width: 1040px) 100vw, 1040px" unoptimized loading="lazy" onLoad={() => setImageStates((current) => ({ ...current, [item.id]: 'loaded' }))} onError={() => setImageStates((current) => ({ ...current, [item.id]: 'error' }))} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} />}
            {!itemError && state !== 'loaded' && <span className="image-loading">Loading page {item.page_number}…</span>}
            {itemError && <div className="reader-image-error" role="alert"><strong>Page {item.page_number} image unavailable</strong><span>{itemError}</span>{!item.image_error && <button type="button" className="button button-outline" onClick={() => setImageStates((current) => ({ ...current, [item.id]: 'loading' }))}>Retry image</button>}</div>}
          </div><figcaption>PAGE {String(item.page_number).padStart(2, '0')}</figcaption>
        </figure>;
      })}
    </div>}
    {controlsVisible && <nav className="reader-page-controls" aria-label="Page navigation">
      <div className="reader-page-buttons">
        <button className="button button-outline" type="button" disabled={currentIndex === 0} onClick={() => movePage(-1)}>← Previous Page</button>
        <span className="reader-page-count" aria-live="polite">{firstVisiblePage === lastVisiblePage ? `Page ${firstVisiblePage}` : `Pages ${firstVisiblePage}–${lastVisiblePage}`} of {pages.length}</span>
        <button className="button button-red" type="button" disabled={currentIndex >= pages.length - 1 || (mode === 'double' && (spreadStart === 0 ? 1 : spreadStart + 2) >= pages.length)} onClick={() => movePage(1)}>Next Page →</button>
      </div>
    </nav>}
    {fullscreenError && <p className="reader-fullscreen-error" role="alert">{fullscreenError}</p>}
  </section>;
}

export function ChapterPicker({ mangaSlug, chapters, currentSlug }: { mangaSlug: string; chapters: Chapter[]; currentSlug: string }) {
  return <label className="chapter-select-label">Jump to chapter<select aria-label="Jump to chapter" value={currentSlug} onChange={(event) => { window.location.href = `/manga/${encodeURIComponent(mangaSlug)}/chapter/${encodeURIComponent(event.target.value)}`; }}>{chapters.map((chapter) => <option key={chapter.id} value={chapter.slug}>Chapter {chapter.chapter_number}: {chapter.title}</option>)}</select></label>;
}
