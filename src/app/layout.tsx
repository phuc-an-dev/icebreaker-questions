import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Icebreaker Question Bank | Holographic Canvas Card Experience',
  description:
    'A curated collection of 236 icebreaker questions with interactive 3D holographic canvas cards, multi-tier category filters, and fullscreen presentation stage mode.',
};

/**
 * Inline script that runs before React hydration to set the correct theme
 * class on <html>, preventing a flash of wrong theme (FOUC).
 * Reads from localStorage; falls back to OS prefers-color-scheme.
 */
const FOUC_PREVENTION_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('icebreaker-theme');
    var isDark = t === 'dark' || ((!t || t === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e) {}
})()
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-content">
        <Script
          id="theme-fouc-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: FOUC_PREVENTION_SCRIPT }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
