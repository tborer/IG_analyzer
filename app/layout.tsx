import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plexmono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dossier — Profile Audit',
  description:
    'An honest, specific audit of your existing Instagram, TikTok, or other social profile — photo by photo, scored and explained, with what to add next.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="bg-ink text-bone font-body antialiased bg-grain min-h-screen">
        {children}
      </body>
    </html>
  );
}
