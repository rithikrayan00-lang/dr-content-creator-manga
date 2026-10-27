import { createClient } from '@supabase/supabase-js';

export type Manga = {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  cover_url: string | null;
  created_at: string;
  genres: string[];
  author: string | null;
  status: 'Ongoing' | 'Completed' | 'Hiatus' | null;
  sample?: boolean;
  cover_error?: string;
};

export type Chapter = {
  id: string;
  series_id: string;
  chapter_number: number;
  title: string;
  slug: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export type ChapterPage = { id: string; chapter_id: string; page_number: number; image_url: string; image_error?: string };
export type ChapterPagesResult = { pages: ChapterPage[]; error: string | null };

const demoManga: Manga[] = [
  {
    id: 'demo-eclipse-zero', title: 'Eclipse Zero', slug: 'eclipse-zero',
    synopsis: 'A world changed by an impossible eclipse. A hidden power. A truth powerful enough to rewrite everything. The journey begins here.',
    cover_url: null, created_at: '2026-01-01T00:00:00.000Z', genres: ['Action', 'Fantasy', 'Adventure'], author: 'Dr Content Creator', status: 'Ongoing', sample: true,
  },
  {
    id: 'sample-1', title: 'Sample: The Last Star', slug: 'sample-last-star',
    synopsis: 'A clearly marked development sample for previewing the multi-series catalogue layout.',
    cover_url: null, created_at: '2026-02-01T00:00:00.000Z', genres: ['Sci-Fi', 'Adventure'], author: null, status: 'Ongoing', sample: true,
  },
  {
    id: 'sample-2', title: 'Sample: Crimson Garden', slug: 'sample-crimson-garden',
    synopsis: 'A clearly marked development sample. Replace this entry with a series you are authorized to publish.',
    cover_url: null, created_at: '2026-03-01T00:00:00.000Z', genres: ['Fantasy', 'Romance'], author: null, status: 'Completed', sample: true,
  },
  {
    id: 'sample-3', title: 'Sample: Midnight Club', slug: 'sample-midnight-club',
    synopsis: 'A clearly marked development sample used to demonstrate genre browsing and responsive cards.',
    cover_url: null, created_at: '2026-04-01T00:00:00.000Z', genres: ['Horror', 'Comedy'], author: null, status: 'Hiatus', sample: true,
  },
];

const demoChapters: Chapter[] = [
  { id: 'demo-chapter-1', series_id: 'demo-eclipse-zero', chapter_number: 2, title: 'A Signal Beyond the Eclipse', slug: 'a-signal-beyond-the-eclipse', published: true, published_at: null, created_at: '2026-01-02T00:00:00.000Z' },
  { id: 'demo-chapter-2', series_id: 'demo-eclipse-zero', chapter_number: 1, title: 'The Day the Sky Went Dark', slug: 'the-day-the-sky-went-dark', published: true, published_at: null, created_at: '2026-01-01T00:00:00.000Z' },
];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function normalizeManga(row: Record<string, unknown>): Manga {
  return {
    id: String(row.id), title: String(row.title ?? 'Untitled'), slug: String(row.slug),
    synopsis: String(row.synopsis ?? ''), cover_url: typeof row.cover_url === 'string' ? row.cover_url : null,
    created_at: String(row.created_at ?? ''),
    genres: Array.isArray(row.genres) ? row.genres.filter((genre): genre is string => typeof genre === 'string') : [],
    author: typeof row.author === 'string' ? row.author : null,
    status: ['Ongoing', 'Completed', 'Hiatus'].includes(String(row.status)) ? row.status as Manga['status'] : null,
  };
}

function getStorageObjectPath(imageValue: string): string | null {
  if (imageValue.startsWith('manga-pages/')) return imageValue.slice('manga-pages/'.length);
  if (!/^https?:\/\//i.test(imageValue)) return imageValue;

  try {
    const imageUrl = new URL(imageValue);
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!projectUrl || imageUrl.origin !== new URL(projectUrl).origin) return null;
    const match = imageUrl.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/manga-pages\/(.+)$/);
    return match ? match[1].split('/').map((part) => decodeURIComponent(part)).join('/') : null;
  } catch {
    return null;
  }
}

async function resolveStorageImage(imageValue: string | null): Promise<{ imageUrl: string; error?: string }> {
  if (!imageValue) return { imageUrl: '', error: 'This page has no stored image path.' };
  const imagePath = getStorageObjectPath(imageValue);
  if (!imagePath) return { imageUrl: imageValue };
  const supabase = getSupabase();
  if (!supabase) return { imageUrl: '', error: 'Supabase is not configured for image retrieval.' };
  const { data, error } = await supabase.storage.from('manga-pages').createSignedUrl(imagePath, 3600);
  if (error) {
    const message = error.message.toLowerCase() === 'bucket not found'
      ? 'The private manga-pages storage bucket was not found.'
      : error.message.toLowerCase() === 'object not found'
        ? 'Supabase could not retrieve this private object. Verify the exact object name and published-page Storage SELECT policy.'
      : error.message;
    return { imageUrl: '', error: message };
  }
  return { imageUrl: data.signedUrl };
}

export async function getMangaList(): Promise<Manga[]> {
  const supabase = getSupabase();
  if (!supabase) return demoManga;
  const { data, error } = await supabase.from('series').select('*').order('created_at', { ascending: false });
  if (error || !data) return demoManga;
  return Promise.all(data.map(async (row) => {
    const manga = normalizeManga(row as Record<string, unknown>);
    const cover = await resolveStorageImage(manga.cover_url);
    return { ...manga, cover_url: cover.imageUrl || null, cover_error: cover.error };
  }));
}

export async function getMangaBySlug(slug: string): Promise<Manga | null> {
  const list = await getMangaList();
  const local = list.find((manga) => manga.slug === slug);
  if (local) return local;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from('series').select('*').eq('slug', slug).maybeSingle();
  if (!data) return null;
  const manga = normalizeManga(data as Record<string, unknown>);
  const cover = await resolveStorageImage(manga.cover_url);
  return { ...manga, cover_url: cover.imageUrl || null, cover_error: cover.error };
}

export async function getPublishedChapters(seriesId: string, slug?: string): Promise<Chapter[]> {
  const supabase = getSupabase();
  if (!supabase || seriesId.startsWith('demo-') || seriesId.startsWith('sample-')) {
    return demoChapters.filter((chapter) => chapter.series_id === seriesId);
  }
  let query = supabase.from('chapters').select('*').eq('series_id', seriesId).eq('published', true).order('chapter_number', { ascending: false });
  const { data, error } = await query;
  if (error || !data) return [];
  return data as Chapter[];
}

export async function getPublishedChapter(seriesId: string, chapterSlug: string): Promise<Chapter | null> {
  const chapters = await getPublishedChapters(seriesId);
  const local = chapters.find((chapter) => chapter.slug === chapterSlug);
  if (local) return local;
  const supabase = getSupabase();
  if (!supabase || seriesId.startsWith('demo-') || seriesId.startsWith('sample-')) return null;
  const { data } = await supabase.from('chapters').select('*').eq('series_id', seriesId).eq('slug', chapterSlug).eq('published', true).maybeSingle();
  return data as Chapter | null;
}

export async function getChapterPages(chapterId: string): Promise<ChapterPagesResult> {
  const supabase = getSupabase();
  if (!supabase) return { pages: [], error: 'Supabase is not configured.' };
  if (chapterId.startsWith('demo-')) return { pages: [], error: null };
  const { data, error } = await supabase.from('chapter_pages').select('*').eq('chapter_id', chapterId).order('page_number', { ascending: true });
  if (error || !data) return { pages: [], error: error?.message ?? 'Could not load chapter pages.' };
  const pages = await Promise.all((data as ChapterPage[]).map(async (page) => {
    const resolved = await resolveStorageImage(page.image_url);
    const requestedPath = getStorageObjectPath(page.image_url) ?? page.image_url;
    const diagnostic = `chapter_id=${page.chapter_id}; page_number=${page.page_number}; requested_storage_path=${requestedPath}`;
    return { ...page, image_url: resolved.imageUrl, image_error: resolved.error ? `${resolved.error} (${diagnostic})` : undefined };
  }));
  return { pages, error: null };
}
