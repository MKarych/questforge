'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  getMarketplaceListing,
  updateListing,
  publishListing,
  unpublishListing,
  getMarketplaceCategories,
  getMarketplaceTypes,
  type MarketplaceListingDto,
} from '@/lib/api/client';

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListingDto | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    licenseType: '',
    category: '',
    tags: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const [listingRes, catRes, typeRes] = await Promise.all([
          getMarketplaceListing(params.id),
          getMarketplaceCategories(),
          getMarketplaceTypes(),
        ]);
        const item = listingRes.data;
        setListing(item);
        setFormData({
          title: item.title,
          description: item.description || '',
          price: item.price,
          licenseType: item.licenseType,
          category: item.category,
          tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        });
        setCategories(catRes.data);
        setLicenseTypes(typeRes.data);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      await updateListing(params.id, {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        licenseType: formData.licenseType,
        category: formData.category,
        tags,
      });
      setSuccess('Листинг обновлён');
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await publishListing(params.id);
      setSuccess('Листинг опубликован');
    } catch (err: any) {
      setError(err.message || 'Ошибка публикации');
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishListing(params.id);
      setSuccess('Листинг снят с публикации');
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center"><LoadingSpinner size="lg" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/marketplace/${params.id}`} className="text-primary hover:underline text-sm">
            ← Назад к листингу
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Редактировать листинг</h1>
          <div className="flex gap-2">
            {listing?.status === 'DRAFT' && (
              <button onClick={handlePublish} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Опубликовать
              </button>
            )}
            {listing?.status === 'PUBLISHED' && (
              <button onClick={handleUnpublish} className="px-4 py-2 border border-border rounded-lg hover:bg-card transition-colors text-sm">
                Снять с публикации
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Цена (₽)</label>
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
              <label className="block text-sm font-medium mb-1">Тип лицензии</label>
              <select
                value={formData.licenseType}
                onChange={e => setFormData(prev => ({ ...prev, licenseType: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {licenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Категория</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Теги (через запятую)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" /> : 'Сохранить'}
            </button>
            <Link
              href={`/marketplace/${params.id}`}
              className="px-6 py-2 border border-border rounded-lg hover:bg-card transition-colors"
            >
              Отмена
            </Link>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}