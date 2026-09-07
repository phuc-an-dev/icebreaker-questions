import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
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

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://icebreaker.website';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Để mình hiểu nhau hơn | Icebreaker Questions',
    template: '%s | Để mình hiểu nhau hơn',
  },
  description:
    'Bộ câu hỏi mình tổng hợp cho các buổi gặp mặt, hội nhóm để mấy ní đỡ phải suy nghĩ phải hỏi gì',
  applicationName: 'Để Mình Hiểu Nhau Hơn',
  authors: [{ name: 'An Phuc' }],
  keywords: [
    'để mình hiểu nhau hơn',
    'icebreaker questions',
    'câu hỏi phá băng',
    'câu hỏi kết nối',
    'team building',
    'hội nhóm',
    'game kết nối',
  ],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: APP_URL,
    siteName: 'Để Mình Hiểu Nhau Hơn - Icebreaker Questions',
    title: 'Để mình hiểu nhau hơn',
    description:
      'Bộ câu hỏi mình tổng hợp cho các buổi gặp mặt, hội nhóm để mấy ní đỡ phải suy nghĩ phải hỏi gì',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Để mình hiểu nhau hơn - Icebreaker Questions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Để mình hiểu nhau hơn',
    description:
      'Bộ câu hỏi mình tổng hợp cho các buổi gặp mặt, hội nhóm để mấy ní đỡ phải suy nghĩ phải hỏi gì',
    images: ['/og-image.png'],
  },
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
        <Analytics />
      </body>
    </html>
  );
}
