import Link from 'next/link';
import { CoverArt, Footer, Header, MangaGrid, SearchForm } from '@/components/platform';
import { getMangaBySlug, getMangaList, getPublishedChapters } from '@/lib/catalog';

export default async function Home() {
  const manga = await getMangaList();
  const featured = (await getMangaBySlug('eclipse-zero')) ?? manga[0];
  const chapterGroups = await Promise.all(manga.map(async (series) => [series.id, await getPublishedChapters(series.id)] as const));
  const latestBySeries = Object.fromEntries(chapterGroups.map(([id, chapters]) => [id, chapters[0] ?? null]));
  const featuredChapter = featured ? latestBySeries[featured.id] : null;
  const updates = chapterGroups.flatMap(([id, chapters]) => {
    const series = manga.find((item) => item.id === id);
    return series ? chapters.slice(0, 2).map((chapter) => ({ series, chapter })) : [];
  }).sort((a, b) => (b.chapter.published_at ?? b.chapter.created_at).localeCompare(a.chapter.published_at ?? a.chapter.created_at)).slice(0, 4);

  return <><Header /><main>
    <section className="hero-section shell"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> THE HOME OF ORIGINAL MANGA</div><h1>Stories that<br />stay with <em>you.</em></h1><p className="hero-description">Step into unforgettable worlds, meet the characters who define them, and read every chapter in one place.</p><div className="hero-actions"><Link className="button button-red" href={featuredChapter && featured ? `/manga/${featured.slug}/chapter/${featuredChapter.slug}` : featured ? `/manga/${featured.slug}` : '/manga'}>Read Now <span>↗</span></Link>{featured && <Link className="button button-outline" href={`/manga/${featured.slug}`}>View Details</Link>}</div><SearchForm /></div>
      {featured && <Link href={`/manga/${featured.slug}`} className="featured-art"><CoverArt manga={featured} large /><div className="featured-caption"><span>FEATURED SERIES</span><strong>{featured.title}</strong><small>{featured.genres.join(' · ') || 'Original manga'}</small></div><span className="featured-index">01</span></Link>}
    </section>
    <div className="ticker" aria-label="Platform highlights"><div>ORIGINAL WORLDS <i>✦</i> NEW CHAPTERS <i>✦</i> YOUR NEXT OBSESSION <i>✦</i> ORIGINAL WORLDS <i>✦</i> NEW CHAPTERS <i>✦</i></div></div>
    {featured && <section className="featured-detail shell"><div><div className="eyebrow">THE SPOTLIGHT</div><h2>{featured.title}</h2><p>{featured.synopsis}</p><div className="genre-row larger">{featured.genres.map((genre) => <span key={genre}>{genre}</span>)}</div></div><div className="spotlight-action"><span>{latestBySeries[featured.id] ? `LATEST · CHAPTER ${latestBySeries[featured.id]?.chapter_number}` : 'A NEW WORLD AWAITS'}</span><Link href={`/manga/${featured.slug}`} className="text-link">Discover the series <b>↗</b></Link></div></section>}
    <section className="section shell" id="trending"><div className="section-heading"><div><div className="eyebrow">FIND YOUR NEXT READ</div><h2>Explore the library</h2></div><Link className="text-link" href="/manga">View all manga <b>↗</b></Link></div><MangaGrid manga={manga.slice(0, 4)} latestBySeries={latestBySeries} /></section>
    <section className="section section-tinted" id="latest"><div className="shell"><div className="section-heading"><div><div className="eyebrow">FRESH OFF THE PRESS</div><h2>Latest updates</h2></div><Link className="text-link" href="/manga">Browse all series <b>↗</b></Link></div>{updates.length ? <div className="updates-list">{updates.map(({ series, chapter }) => <Link key={chapter.id} className="update-row" href={`/manga/${series.slug}/chapter/${chapter.slug}`}><span className="update-mark">✦</span><span className="update-series">{series.title}<small>CHAPTER {String(chapter.chapter_number).padStart(2, '0')}</small></span><strong>{chapter.title}</strong><span className="chapter-arrow">↗</span></Link>)}</div> : <div className="empty-state compact"><h3>No new chapters yet</h3><p>Published updates will appear here.</p></div>}</div></section>
    <section className="section shell" id="about"><div className="section-heading"><div><div className="eyebrow">MADE FOR STORY LOVERS</div><h2>More worlds. One home.</h2></div><p className="section-intro">A growing home for original manga. Discover a series, find your place, and read at your own pace.</p></div><div className="platform-note"><span>✦</span><p>Popularity rankings are not available yet. This library features verified series and clearly identified development samples only.</p></div></section>
  </main><Footer /></>;
}
