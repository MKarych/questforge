'use client';

import Link from 'next/link';
import type { Category } from '@/lib/api/client';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface CategoriesGridProps {
  categories: Category[] | null;
}

const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Детектив', slug: 'detective', icon: '🕵️', gamesCount: 0 },
  { id: '2', name: 'Хоррор', slug: 'horror', icon: '🎭', gamesCount: 0 },
  { id: '3', name: 'Квест', slug: 'quest', icon: '🏙️', gamesCount: 0 },
  { id: '4', name: 'Квиз', slug: 'quiz', icon: '🧠', gamesCount: 0 },
  { id: '5', name: 'Семейный', slug: 'family', icon: '👨‍👩‍👧‍👦', gamesCount: 0 },
  { id: '6', name: 'Корпоративный', slug: 'corporate', icon: '🏢', gamesCount: 0 },
];

function CategoriesContent({ categories }: { categories: Category[] }) {
  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">Категории</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {displayCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/games?type=${cat.slug.toUpperCase()}`}
            className="card-hover flex flex-col items-center justify-center p-4 text-center group"
          >
            <span className="text-3xl mb-2">{cat.icon}</span>
            <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
              {cat.name}
            </span>
            {cat.gamesCount > 0 && (
              <span className="text-xs text-text-muted mt-1">{cat.gamesCount} игр</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function CategoriesGrid(props: CategoriesGridProps) {
  return (
    <ErrorBoundary blockName="Категории">
      <CategoriesContent categories={props.categories || []} />
    </ErrorBoundary>
  );
}