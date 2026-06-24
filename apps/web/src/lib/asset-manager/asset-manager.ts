// ============================================================
// Asset Manager (spec 49.2.2)
// Централизованное хранение и управление медиа-файлами
// ============================================================

export type AssetType = 'image' | 'audio' | 'video' | 'map' | 'ar' | 'document';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  thumbnailUrl?: string;
  size: number; // bytes
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, any>;
}

export interface AssetFolder {
  id: string;
  name: string;
  type: AssetType;
  assets: Asset[];
  children: AssetFolder[];
}

// ==================== Asset Manager Class ====================

export class AssetManager {
  private assets: Map<string, Asset> = new Map();
  private listeners: Set<(assets: Asset[]) => void> = new Set();

  /**
   * Добавление ассета.
   */
  addAsset(asset: Asset): void {
    this.assets.set(asset.id, asset);
    this.notify();
  }

  /**
   * Удаление ассета.
   */
  removeAsset(id: string): void {
    this.assets.delete(id);
    this.notify();
  }

  /**
   * Получение ассета по ID.
   */
  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  /**
   * Получение всех ассетов.
   */
  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Получение ассетов по типу.
   */
  getAssetsByType(type: AssetType): Asset[] {
    return this.getAllAssets().filter((a) => a.type === type);
  }

  /**
   * Поиск ассетов по имени или тегам.
   */
  searchAssets(query: string): Asset[] {
    const q = query.toLowerCase();
    return this.getAllAssets().filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.mimeType.toLowerCase().includes(q)
    );
  }

  /**
   * Обновление ассета.
   */
  updateAsset(id: string, data: Partial<Asset>): void {
    const asset = this.assets.get(id);
    if (asset) {
      Object.assign(asset, data, { updatedAt: new Date() });
      this.notify();
    }
  }

  /**
   * Генерация asset:// URL.
   */
  getAssetUrl(assetId: string): string {
    return `asset://${assetId}`;
  }

  /**
   * Разрешение asset:// URL в полный URL.
   */
  resolveAssetUrl(assetUrl: string): string | null {
    if (!assetUrl.startsWith('asset://')) return assetUrl;
    const assetId = assetUrl.replace('asset://', '');
    const asset = this.getAsset(assetId);
    return asset?.url || null;
  }

  /**
   * Подписка на изменения.
   */
  subscribe(listener: (assets: Asset[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const all = this.getAllAssets();
    this.listeners.forEach((fn) => fn(all));
  }

  /**
   * Очистка всех ассетов.
   */
  clear(): void {
    this.assets.clear();
    this.notify();
  }

  get count(): number {
    return this.assets.size;
  }
}

// ==================== Структура папок по умолчанию ====================

export function createDefaultAssetStructure(): AssetFolder {
  return {
    id: 'root',
    name: 'assets',
    type: 'image',
    assets: [],
    children: [
      {
        id: 'images',
        name: 'images',
        type: 'image',
        assets: [],
        children: [],
      },
      {
        id: 'audio',
        name: 'audio',
        type: 'audio',
        assets: [],
        children: [],
      },
      {
        id: 'video',
        name: 'video',
        type: 'video',
        assets: [],
        children: [],
      },
      {
        id: 'maps',
        name: 'maps',
        type: 'map',
        assets: [],
        children: [],
      },
      {
        id: 'documents',
        name: 'documents',
        type: 'document',
        assets: [],
        children: [],
      },
    ],
  };
}

// ==================== Примеры asset:// ссылок ====================
// asset://images/building.jpg
// asset://audio/hint.mp3
// asset://video/intro.mp4
// asset://maps/city_center.png

// ==================== Singleton ====================

let defaultAssetManager: AssetManager | null = null;

export function getAssetManager(): AssetManager {
  if (!defaultAssetManager) {
    defaultAssetManager = new AssetManager();
  }
  return defaultAssetManager;
}

export function resetAssetManager(): void {
  defaultAssetManager = null;
}