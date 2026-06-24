// ============================================================
// Asset Manager — Управление медиа-файлами
// По спецификации docs/49 (раздел 2.2)
// ============================================================

import { Asset } from '../editor-store/editor.types';

export class AssetManager {
  private assets: Asset[] = [];
  private apiUrl: string;

  constructor(apiUrl: string = '/api') {
    this.apiUrl = apiUrl;
  }

  /**
   * Загрузить файл на сервер
   */
  async upload(file: File, type: Asset['type']): Promise<Asset> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    const response = await fetch(`${this.apiUrl}/assets/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload asset');
    }

    const result = await response.json();
    const asset: Asset = {
      id: result.data.id,
      url: result.data.url,
      type: result.data.type,
      name: result.data.name,
      size: result.data.size,
      createdAt: new Date(result.data.createdAt),
    };

    this.assets.push(asset);
    return asset;
  }

  /**
   * Получить все ассеты
   */
  getAll(): Asset[] {
    return [...this.assets];
  }

  /**
   * Получить ассеты по типу
   */
  getByType(type: Asset['type']): Asset[] {
    return this.assets.filter(a => a.type === type);
  }

  /**
   * Удалить ассет
   */
  async delete(id: string): Promise<void> {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    const response = await fetch(`${this.apiUrl}/assets/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to delete asset');
    }

    this.assets = this.assets.filter(a => a.id !== id);
  }

  /**
   * Получить URL ассета по asset:// ссылке
   */
  resolveAssetUrl(assetRef: string): string {
    if (assetRef.startsWith('asset://')) {
      const assetId = assetRef.replace('asset://', '');
      const asset = this.assets.find(a => a.id === assetId);
      return asset?.url || assetRef;
    }
    return assetRef;
  }

  /**
   * Загрузить ассеты с сервера
   */
  async loadAssets(): Promise<Asset[]> {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    const response = await fetch(`${this.apiUrl}/assets`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to load assets');
    }

    const result = await response.json();
    this.assets = result.data || [];
    return this.assets;
  }
}

// Singleton
export const assetManager = new AssetManager();