'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  createListing,
  getMarketplaceCategories,
  getMarketplaceTypes,
  getScenarios,
  getListingByScenarioId,
  type Scenario,
} from '@/lib/api/client';

function CreateListingForm() {
  const searchParams = useSearchParams();
  const scenarioIdParam = searchParams.get('scenarioId');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!scenarioIdParam);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    licenseType: 'SINGLE',
    category: '',
    tags: '',
    scenarioId: scenarioIdParam || '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, typeRes, scenRes] = await Promise.all([
          getMarketplaceCategories(),
          getMarketplaceTypes(),
          getScenarios({ published: true }),
        ]);
        setCategories(catRes.data);
        setLicenseTypes(typeRes.data);
        const scenariosData = scenRes.data.data;
        setScenarios(scenariosData);

        // Если передан scenarioId — предзаполняем форму
        if (scenarioIdParam) {
          const scenario = scenariosData.find(s => s.id === scenarioIdParam);
          if (scenario) {
            setFormData(prev => ({
              ...prev,
              title: scenario.name,
              scenarioId: scenario.id,
            }));
          }

          // Проверяем, нет ли уже листинга для этого сценария
          try {
            const listingRes = await getListingByScenarioId(scenarioIdParam);
            if (listingRes.data) {
              setSuccessMessage('Для этого сценария уже создан листинг');
              setCreatedListingId(listingRes.data.id);
            }
          } catch {
            // листинга нет — можно создавать
          }
        }
      } catch {
        // ignore
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, [scenarioIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await createListing({
        title: formData.title,
        description: formData.description,
        price: formData.price,
        licenseType: formData.licenseType,
        category: formData.category,
        tags,
        scenarioId: formData.scenarioId || undefined,
      });

      setSuccessMessage('Листинг успешно создан!');
      setCreatedListingId(res.data.id);
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании листинга');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <LoadingSpinner size="lg" className="py-12" />
        </main>
        <Footer />
      </div>
    );
  }

  // Если листинг уже существует для этого сценария — показываем сообщение
  if (successMessage && createdListingId && scenarioIdParam) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-6 py-4 rounded-lg mb-6">
              <p className="font-medium mb-2">{successMessage}</p>
              <Link
                href={`/marketplace/${createdListingId}`}
                className="inline-block mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
              >
                Перейти к листингу
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/marketplace" className="text-primary hover:underline text-sm">
            ← Назад в маркетплейс
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Создать листинг</h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMessage && createdListingId && !scenarioIdParam && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-6 py-4 rounded-lg mb-6">
            <p className="font-medium mb-2">{successMessage}</p>
            <Link
              href={`/marketplace/${createdListingId}`}
              className="inline-block mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
            >
              Перейти к листингу
            </Link>
          </div>
        )}

        {!successMessage && (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Название сценария"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
              placeholder="Опишите сценарий"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Цена (₽) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Тип лицензии *</label>
              <select
                required
                value={formData.licenseType}
                onChange={e => setFormData(prev => ({ ...prev, licenseType: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {licenseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Категория *</label>
              <select
                required
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Выберите категорию</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Сценарий</label>
              <select
                value={formData.scenarioId}
                onChange={e => setFormData(prev => ({ ...prev, scenarioId: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Без сценария</option>
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (v{s.version})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Теги (через запятую)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="detective, horror, family"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Создать листинг'}
            </button>
            <Link
              href="/marketplace"
              className="px-6 py-2 border border-border rounded-lg hover:bg-card transition-colors text-center"
            >
              Отмена
            </Link>
          </div>
        </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    }>
      <CreateListingForm />
    </Suspense>
  );
}