'use client';

import Link from 'next/link';
import Image from 'next/image';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { HeroSkeleton } from '@/components/ui/Skeleton';

interface HeroBlockProps {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
  } | null;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// HeroLogo
// ---------------------------------------------------------------------------

/** Полный логотип в Hero-блоке — обе версии рендерятся сразу, переключение через CSS */
function HeroLogo() {
  return (
    <div className="relative mx-auto" style={{ width: 360, height: 96 }}>
      {/* Светлая версия — видна при data-theme="light" */}
      <Image
        src="/images/logo/logo-full-light.svg"
        alt="Город Приключений"
        fill
        className="object-contain [html[data-theme='dark']_&]:hidden"
        priority
      />
      {/* Тёмная версия — видна при data-theme="dark" */}
      <Image
        src="/images/logo/logo-full-dark.svg"
        alt="Город Приключений"
        fill
        className="object-contain hidden [html[data-theme='dark']_&]:block"
        priority
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeroContent
// ---------------------------------------------------------------------------

function HeroContent({ hero }: { hero: HeroBlockProps['hero'] }) {
  if (!hero) return null;

  return (
    <section className="relative mb-16 overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Лёгкий градиентный акцент поверх фона */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent" />

      {/* Основной контент */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 py-16 md:py-24 lg:py-28">
        {/* Логотип */}
        <div className="mb-6">
          <HeroLogo />
        </div>

        {/* Слоган */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-text-primary max-w-3xl leading-tight">
          {hero.subtitle}
        </h1>

        {/* Подзаголовок */}
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Присоединяйтесь к захватывающим квестам в вашем городе или создайте свою собственную игру
        </p>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto sm:max-w-none">
          <Link
            href={hero.ctaLink}
            className="
              inline-flex items-center justify-center gap-2
              text-lg px-8 py-3.5 sm:px-10 sm:py-4
              font-semibold rounded-xl
              transition-all duration-200
              bg-primary hover:bg-primary-hover
              text-white
              shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
              hover:-translate-y-0.5
              active:translate-y-0
            "
          >
            {hero.ctaText}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <Link
            href={hero.secondaryCtaLink}
            className="
              inline-flex items-center justify-center gap-2
              text-lg px-8 py-3.5 sm:px-10 sm:py-4
              font-semibold rounded-xl
              transition-all duration-200
              bg-surface/80 backdrop-blur-sm
              hover:bg-surface-elevated
              text-text-primary
              border-2 border-border hover:border-primary/40
              shadow-md hover:shadow-lg
              hover:-translate-y-0.5
              active:translate-y-0
            "
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {hero.secondaryCtaText}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HeroBlock (экспорт по умолчанию)
// ---------------------------------------------------------------------------

export default function HeroBlock(props: HeroBlockProps) {
  if (props.loading) return <HeroSkeleton />;

  return (
    <ErrorBoundary blockName="Hero">
      <HeroContent hero={props.hero} />
    </ErrorBoundary>
  );
}