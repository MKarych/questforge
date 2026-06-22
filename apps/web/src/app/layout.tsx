import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Adventure Engine — Платформа городских игр',
  description: 'Создавайте и проводите захватывающие городские квесты. Присоединяйтесь к игре прямо сейчас!',
  keywords: ['квесты', 'городские игры', 'Adventure Engine', 'командные игры'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#0F1117" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
