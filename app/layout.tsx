import type { Metadata } from 'next';
import { getSiteOrigin } from '@/lib/seo';
import './globals.css';
import './theme.css';
import './reader.css';
import './home.css';
import './universe.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: 'Dr Content Creator Manga | Discover Your Next Story',
  description: 'Explore original manga series, discover new chapters, and read every story in one place.',
  openGraph: {
    type: 'website',
    siteName: 'Dr Content Creator Manga',
    title: 'Dr Content Creator Manga | Discover Your Next Story',
    description: 'Explore original manga series, discover new chapters, and read every story in one place.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
