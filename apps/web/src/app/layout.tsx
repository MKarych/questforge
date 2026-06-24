import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import ScrollToTopWrapper from '@/components/ui/ScrollToTopWrapper';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Город Приключений | Adventure Engine',
    template: '%s | Город Приключений',
  },
  description:
    'Городские игры нового поколения. Создавай и проходи захватывающие квесты в своём городе. Присоединяйся к тысячам игроков!',
  keywords: [
    'квесты',
    'городские игры',
    'Adventure Engine',
    'командные игры',
    'поиск сокровищ',
    'квесты в городе',
    'активный отдых',
    'тимбилдинг',
  ],
  authors: [{ name: 'Город Приключений' }],
  creator: 'Город Приключений',
  publisher: 'Город Приключений',
  icons: {
    icon: '/images/logo/logo-square-icon.png',
    apple: '/images/logo/logo-square-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Город Приключений',
    title: 'Город Приключений | Городские игры нового поколения',
    description:
      'Создавай и проходи захватывающие квесты в своём городе. Присоединяйся к тысячам игроков!',
    url: 'https://adventure-engine.com',
    images: [
      {
        url: '/images/logo/logo-horizontal-full.png',
        width: 1200,
        height: 630,
        alt: 'Город Приключений',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Город Приключений',
    description:
      'Городские игры нового поколения. Создавай и проходи захватывающие квесты в своём городе.',
    images: ['/images/logo/logo-horizontal-full.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://adventure-engine.com',
  },
  category: 'games',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Город Приключений',
    url: 'https://adventure-engine.com',
    description:
      'Платформа для городских игр нового поколения. Создавай и проходи захватывающие квесты в своём городе.',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RUB',
    },
    author: {
      '@type': 'Organization',
      name: 'Город Приключений',
    },
  };

  return (
    <html lang="ru" className={inter.className}>
      <head>
        <meta name="theme-color" content="#0F1117" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="application-name" content="Город Приключений" />
        <meta name="apple-mobile-web-app-title" content="Город Приключений" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:* https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*;" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {children}
        <ScrollToTopWrapper />
      </body>
    </html>
  );
}
