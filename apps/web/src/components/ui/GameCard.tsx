'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { GameCard as GameCardType } from '@/lib/api/client';
import ImageModal from './ImageModal';

const DEFAULT_LOGO = '/images/logo/logo-full-light.svg';

interface GameCardProps {
  game: GameCardType;
}

export default function GameCard({ game }: GameCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const coverImage = game.imageUrl || DEFAULT_LOGO;
  const hasCustomImage = !!game.imageUrl;
  const isPlaceholder = hasCustomImage && game.imageUrl?.includes('placehold.co');
  const isLocalUpload = hasCustomImage && game.imageUrl?.startsWith('/uploads/');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Бесплатно' : `${price} ₽`;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!hasCustomImage) return;
    e.preventDefault();
    e.stopPropagation();
    setModalOpen(true);
  };

  return (
    <>
      <Link href={`/games/${game.id}`} className="card-hover block group">
        <div className="overflow-hidden rounded-lg mb-4">
          <div className="relative w-full h-48 bg-surface-elevated">
            <button
              type="button"
              onClick={handleImageClick}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label="Открыть обложку"
            />
            <Image
              src={coverImage}
              alt={game.title}
              fill
              className={`${hasCustomImage ? 'object-cover group-hover:scale-105' : 'object-contain p-6'} transition-transform duration-300 pointer-events-none`}
              quality={hasCustomImage && !isPlaceholder ? 85 : 100}
              unoptimized={!hasCustomImage || isPlaceholder || isLocalUpload}
            />
            {!hasCustomImage && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            )}
          </div>
        </div>

      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
          {game.title}
        </h3>
        {game.averageRating > 0 && (
          <div className="flex items-center gap-1 text-warning">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium">{game.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <p className="text-text-secondary text-sm mb-3 line-clamp-2">
        {game.description || 'Описание игры'}
      </p>

      <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {game.city}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {game.duration} мин
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-text-muted">{formatDate(game.date)}</span>
        <span className="text-primary font-semibold">{formatPrice(game.price)}</span>
      </div>
    </Link>

      {modalOpen && hasCustomImage && (
        <ImageModal
          src={coverImage}
          alt={game.title}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
