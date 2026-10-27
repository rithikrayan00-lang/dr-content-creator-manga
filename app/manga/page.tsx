import Link from 'next/link';
import { Footer, Header, MangaBrowser } from '@/components/platform';
import { getMangaList } from '@/lib/catalog';

export default async function BrowseMangaPage() {
  const manga = await getMangaList();
  return <><Header /><main className="shell page-main"><div className="page-intro"><div className="eyebrow">THE COMPLETE LIBRARY</div><h1>Explore <em>manga.</em></h1><p>Search the collection and find a story that speaks to you.</p></div>{manga.length ? <MangaBrowser manga={manga} /> : <div className="empty-state"><h2>The library is taking a breather</h2><p>We couldn&apos;t find any published series. Please try again later.</p><Link className="text-link" href="/">Back to home</Link></div>}</main><Footer /></>;
}
