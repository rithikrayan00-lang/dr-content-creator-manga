import type { Metadata } from 'next';
import './globals.css';
import './reader.css';

export const metadata: Metadata = {
  title: 'Dr Content Creator Manga | Discover Your Next Story',
  description: 'Explore original manga series, discover new chapters, and read every story in one place.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
