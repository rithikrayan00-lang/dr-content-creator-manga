export type Chapter = { id: string; title: string; slug: string; chapter_number: number; published: boolean; created_at?: string };
export const demoChapters: Chapter[] = [
  { id: 'demo-1', title: 'The Day the Sky Went Dark', slug: 'the-day-the-sky-went-dark', chapter_number: 1, published: true },
  { id: 'demo-2', title: 'A Signal Beyond the Eclipse', slug: 'a-signal-beyond-the-eclipse', chapter_number: 2, published: true },
];
