import { redirect } from 'next/navigation';

export default async function LegacyChapterRoute({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	redirect(`/manga/eclipse-zero/chapter/${encodeURIComponent(slug)}`);
}
