'use client';

import { Suspense } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import FollowingContent from './FollowingContent';

export default function FollowingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <button onClick={() => window.history.back()} className="hover:text-primary">← Назад</button>
          <span>/</span>
          <span className="text-text-primary">Подписки</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-6">Подписки</h1>

        <Suspense fallback={<LoadingSpinner />}>
          <FollowingContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}