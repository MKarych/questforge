'use client';

import Link from 'next/link';
import Header from '@/components/ui/Header';

export default function OrganizerPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="text-6xl mb-6">🎯</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Станьте организатором игр
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Создавайте захватывающие городские квесты, управляйте играми и зарабатывайте
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/register" className="btn-primary">
              Стать организатором
            </Link>
            <Link href="/organizer/dashboard" className="btn-secondary">
              Панель организатора
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="card">
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary">Конструктор сценариев</h3>
            <p className="text-text-secondary">
              Создавайте сценарии с разными типами заданий: текст, код, фото, GPS, QR-коды
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary">Управление играми</h3>
            <p className="text-text-secondary">
              Отслеживайте прогресс команд в реальном времени, управляйте сессиями
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary">Монетизация</h3>
            <p className="text-text-secondary">
              Устанавливайте цену на игры, получайте доход от каждой команды
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Подайте заявку</h3>
              <p className="text-text-secondary text-sm">
                Заполните форму и расскажите о своём опыте
              </p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Создайте сценарий</h3>
              <p className="text-text-secondary text-sm">
                Используйте конструктор для создания увлекательного квеста
              </p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Пройдите модерацию</h3>
              <p className="text-text-secondary text-sm">
                Наша команда проверит качество вашего сценария
              </p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Запустите игру</h3>
              <p className="text-text-secondary text-sm">
                Опубликуйте игру и принимайте команды
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="card text-center py-12 bg-primary/10 border-primary">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Готовы создать свою первую игру?
          </h2>
          <p className="text-text-secondary mb-6 max-w-xl mx-auto">
            Присоединяйтесь к сообществу организаторов Adventure Engine и начните проводить захватывающие городские квесты
          </p>
          <Link href="/organizer/scenarios/create" className="btn-primary">
            Создать сценарий
          </Link>
        </section>
      </div>
    </div>
  );
}
