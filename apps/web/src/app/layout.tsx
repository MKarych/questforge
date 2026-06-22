import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Город Приключений | Adventure City',
  description: 'Городские игры нового поколения. Создавай и проходи квесты в своём городе.',
  openGraph: {
    title: 'Город Приключений',
  },
  keywords: ['квесты', 'городские игры', 'Adventure Engine', 'командные игры'],
  icons: {
    icon: '/images/logo/favicon.png',
    apple: '/images/logo/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.className}>
      <head>
        <meta name="theme-color" content="#0F1117" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
