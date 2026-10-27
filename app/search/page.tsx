import Link from 'next/link';
import { Footer, Header, MangaBrowser } from '@/components/platform';
import { getMangaList } from '@/lib/catalog';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const manga = await getMangaList();
  return <><Header /><main className="shell page-main"><div className="page-intro"><div className="eyebrow">SEARCH THE LIBRARY</div><h1>Find your <em>story.</em></h1><p>Search by title or filter the collection by genre.</p></div><MangaBrowser manga={manga} query={q} /><div className="back-link"><Link href="/manga">← Explore all manga</Link></div></main><Footer /></>;
}
