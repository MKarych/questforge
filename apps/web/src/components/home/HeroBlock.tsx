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

function HeroContent({ hero }: { hero: HeroBlockProps['hero'] }) {
  if (!hero) return null;

  return (
    <section className="relative mb-16 overflow-hidden rounded-2xl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-surface-elevated" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 py-16 md:py-24">
        <div className="mb-6">
          <HeroLogo />
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-text-primary max-w-3xl">
          {hero.subtitle}
        </h1>

        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
          Присоединяйтесь к захватывающим квестам в вашем городе или создайте свою собственную игру
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={hero.ctaLink} className="btn-primary text-lg px-8 py-3">
            {hero.ctaText}
          </Link>
          <Link href={hero.secondaryCtaLink} className="btn-secondary text-lg px-8 py-3">
            {hero.secondaryCtaText}
          </Link>
        </div>
      </div>
    </section>
  );
}

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

export default function HeroBlock(props: HeroBlockProps) {
  if (props.loading) return <HeroSkeleton />;

  return (
    <ErrorBoundary blockName="Hero">
      <HeroContent hero={props.hero} />
    </ErrorBoundary>
  );
}