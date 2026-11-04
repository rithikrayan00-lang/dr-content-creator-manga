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
export type Character = {
  id: string;
  series_id: string;
  name: string;
  slug: string;
  portrait_url: string | null;
  description: string;
  age: string | null;
  abilities: string[];
};
export type WorldEntryType = 'lore' | 'location' | 'kingdom' | 'faction' | 'timeline' | 'power_system';
export type WorldEntry = {
  id: string;
  series_id: string;
  entry_type: WorldEntryType;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image_url: string | null;
  sort_order: number;
};
export type CharacterRelationship = {
  related_character_id: string;
  relationship: string;
  description: string;
  related_character: Pick<Character, 'name' | 'slug'> | null;
};
export type ArchiveResult<T> = { items: T[]; error: string | null };

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

function getStorageObjectPath(imageValue: string, bucket: string): string | null {
  if (imageValue.startsWith(`${bucket}/`)) return imageValue.slice(`${bucket}/`.length);
  if (!/^https?:\/\//i.test(imageValue)) return imageValue;

  try {
    const imageUrl = new URL(imageValue);
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!projectUrl || imageUrl.origin !== new URL(projectUrl).origin) return null;
    const match = imageUrl.pathname.match(new RegExp(`^/storage/v1/object/(?:public|sign|authenticated)/${bucket}/(.+)$`));
    return match ? match[1].split('/').map((part) => decodeURIComponent(part)).join('/') : null;
  } catch {
    return null;
  }
}

async function resolveStorageImage(imageValue: string | null, bucket = 'manga-pages'): Promise<{ imageUrl: string; error?: string }> {
  if (!imageValue) return { imageUrl: '', error: 'This page has no stored image path.' };
  const imagePath = getStorageObjectPath(imageValue, bucket);
  if (!imagePath) return { imageUrl: imageValue };
  const supabase = getSupabase();
  if (!supabase) return { imageUrl: '', error: 'Supabase is not configured for image retrieval.' };
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(imagePath, 3600);
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

export async function resolveMangaAssetImage(imageValue: string | null): Promise<{ imageUrl: string | null; error?: string }> {
  const result = await resolveStorageImage(imageValue, 'manga-pages');
  return { imageUrl: result.imageUrl || null, error: result.error };
}

function isWorldEntryType(value: unknown): value is WorldEntryType {
  return ['lore', 'location', 'kingdom', 'faction', 'timeline', 'power_system'].includes(String(value));
}

async function resolveArchiveImage<T extends { image_url?: string | null; portrait_url?: string | null }>(item: T): Promise<T> {
  const imageKey = 'image_url' in item ? 'image_url' : 'portrait_url';
  const imageValue = item[imageKey] as string | null | undefined;
  if (!imageValue) return item;
  const resolved = await resolveStorageImage(imageValue);
  return { ...item, [imageKey]: resolved.imageUrl || null };
}

export async function getCharacters(seriesId: string): Promise<ArchiveResult<Character>> {
  const supabase = getSupabase();
  if (!supabase || seriesId.startsWith('demo-') || seriesId.startsWith('sample-')) return { items: [], error: null };
  const { data, error } = await supabase.from('characters').select('id,series_id,name,slug,portrait_url,description,age,abilities').eq('series_id', seriesId).eq('published', true).order('name');
  if (error) return { items: [], error: `Character archive unavailable: ${error.message}` };
  const characters = await Promise.all((data ?? []).map(async (row) => {
    const character = row as Character;
    const portrait = await resolveStorageImage(character.portrait_url);
    return { ...character, portrait_url: portrait.imageUrl || null };
  }));
  return { items: characters, error: null };
}

export async function getCharacterBySlug(seriesId: string, slug: string): Promise<Character | null> {
  const supabase = getSupabase();
  if (!supabase || seriesId.startsWith('demo-') || seriesId.startsWith('sample-')) return null;
  const { data, error } = await supabase.from('characters').select('id,series_id,name,slug,portrait_url,description,age,abilities').eq('series_id', seriesId).eq('slug', slug).eq('published', true).maybeSingle();
  if (error) throw new Error(`Character profile unavailable: ${error.message}`);
  if (!data) return null;
  const character = data as Character;
  const portrait = await resolveStorageImage(character.portrait_url);
  return { ...character, portrait_url: portrait.imageUrl || null };
}

export async function getCharacterRelationships(character: Character): Promise<ArchiveResult<CharacterRelationship>> {
  const supabase = getSupabase();
  if (!supabase) return { items: [], error: null };
  const { data, error } = await supabase.from('character_relationships').select('related_character_id,relationship,description').eq('character_id', character.id).order('relationship');
  if (error) return { items: [], error: `Character relationships unavailable: ${error.message}` };
  const relationships = (data ?? []) as Omit<CharacterRelationship, 'related_character'>[];
  if (!relationships.length) return { items: [], error: null };
  const relatedIds = relationships.map((item) => item.related_character_id);
  const { data: relatedCharacters, error: relatedError } = await supabase.from('characters').select('id,name,slug').in('id', relatedIds).eq('published', true);
  if (relatedError) return { items: [], error: `Related character profiles unavailable: ${relatedError.message}` };
  const byId = new Map((relatedCharacters ?? []).map((item) => [item.id, { name: item.name, slug: item.slug }]));
  return { items: relationships.map((item) => ({ ...item, related_character: byId.get(item.related_character_id) ?? null })).filter((item) => item.related_character), error: null };
}

export async function getCharacterWorldEntries(character: Character): Promise<ArchiveResult<WorldEntry>> {
  const supabase = getSupabase();
  if (!supabase) return { items: [], error: null };
  const { data, error } = await supabase.from('character_world_entries').select('world_entry_id').eq('character_id', character.id);
  if (error) return { items: [], error: `Character world links unavailable: ${error.message}` };
  const worldIds = new Set((data ?? []).map((item) => item.world_entry_id));
  if (!worldIds.size) return { items: [], error: null };
  const entries = await getWorldEntries(character.series_id);
  return { items: entries.items.filter((entry) => worldIds.has(entry.id)), error: entries.error };
}

export async function getWorldEntries(seriesId: string): Promise<ArchiveResult<WorldEntry>> {
  const supabase = getSupabase();
  if (!supabase || seriesId.startsWith('demo-') || seriesId.startsWith('sample-')) return { items: [], error: null };
  const { data, error } = await supabase.from('world_entries').select('id,series_id,entry_type,title,slug,summary,content,image_url,sort_order').eq('series_id', seriesId).eq('published', true).order('sort_order').order('title');
  if (error) return { items: [], error: `World archive unavailable: ${error.message}` };
  const entries = (data ?? []).filter((row) => isWorldEntryType(row.entry_type)) as WorldEntry[];
  return { items: await Promise.all(entries.map((entry) => resolveArchiveImage(entry))), error: null };
}

export async function getWorldEntryBySlug(seriesId: string, slug: string): Promise<WorldEntry | null> {
  const supabase = getSupabase();
  if (!supabase || seriesId.startsWith('demo-') || seriesId.startsWith('sample-')) return null;
  const { data, error } = await supabase.from('world_entries').select('id,series_id,entry_type,title,slug,summary,content,image_url,sort_order').eq('series_id', seriesId).eq('slug', slug).eq('published', true).maybeSingle();
  if (error) throw new Error(`World entry unavailable: ${error.message}`);
  if (!data || !isWorldEntryType(data.entry_type)) return null;
  return resolveArchiveImage(data as WorldEntry);
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
    const requestedPath = getStorageObjectPath(page.image_url, 'manga-pages') ?? page.image_url;
    const diagnostic = `chapter_id=${page.chapter_id}; page_number=${page.page_number}; requested_storage_path=${requestedPath}`;
    return { ...page, image_url: resolved.imageUrl, image_error: resolved.error ? `${resolved.error} (${diagnostic})` : undefined };
  }));
  return { pages, error: null };
}
