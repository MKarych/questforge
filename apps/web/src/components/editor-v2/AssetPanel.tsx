'use client';

import { useState, useEffect, useCallback } from 'react';
import { Asset, AssetType, getAssetManager } from '@/lib/asset-manager/asset-manager';

interface AssetPanelProps {
  onSelectAsset?: (asset: Asset) => void;
  selectedAssetId?: string | null;
  filterType?: AssetType | 'all';
}

export default function AssetPanel({ onSelectAsset, selectedAssetId, filterType = 'all' }: AssetPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>(filterType);
  const assetManager = getAssetManager();

  useEffect(() => {
    setAssets(assetManager.getAllAssets());
    const unsubscribe = assetManager.subscribe((updated) => setAssets(updated));
    return unsubscribe;
  }, [assetManager]);

  const filteredAssets = assets.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getTypeIcon = (type: AssetType): string => {
    switch (type) {
      case 'image': return '🖼';
      case 'audio': return '🎵';
      case 'video': return '🎬';
      case 'map': return '🗺';
      case 'ar': return '🥽';
      case 'document': return '📄';
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const typeMap: Record<string, AssetType> = {
        'image/': 'image',
        'audio/': 'audio',
        'video/': 'video',
      };

      let assetType: AssetType = 'document';
      for (const [prefix, t] of Object.entries(typeMap)) {
        if (file.type.startsWith(prefix)) {
          assetType = t as AssetType;
          break;
        }
      }

      const asset: Asset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: assetType,
        url: URL.createObjectURL(file),
        size: file.size,
        mimeType: file.type,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        metadata: {},
      };

      assetManager.addAsset(asset);
    });
  }, [assetManager]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    assetManager.removeAsset(id);
  }, [assetManager]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-text-primary mb-3">📁 Медиа-файлы</h2>

        {/* Upload */}
        <label className="block w-full px-4 py-2 bg-primary text-white rounded-lg text-center cursor-pointer hover:bg-primary-dark transition-colors text-sm font-medium">
          📤 Загрузить файл
          <input
            type="file"
            multiple
            accept="image/*,audio/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Поиск..."
          className="w-full mt-2 px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-primary"
        />

        {/* Type filter */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {(['all', 'image', 'audio', 'video', 'map'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-border'
              }`}
            >
              {t === 'all' ? 'Все' : getTypeIcon(t) + ' ' + t}
            </button>
          ))}
        </div>
      </div>

      {/* Assets grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAssets.length === 0 && (
          <div className="text-center py-8 text-text-secondary text-sm">
            {assets.length === 0
              ? '📁 Нет файлов. Загрузите изображения, аудио или видео.'
              : 'Ничего не найдено'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onSelectAsset?.(asset)}
              className={`
                relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all group
                ${selectedAssetId === asset.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-background'
                }
              `}
            >
              {/* Preview */}
              <div className="h-20 bg-surface flex items-center justify-center text-3xl">
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                ) : asset.type === 'audio' ? (
                  '🎵'
                ) : asset.type === 'video' ? (
                  '🎬'
                ) : (
                  '📄'
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <div className="text-xs font-medium text-text-primary truncate">{asset.name}</div>
                <div className="text-[10px] text-text-secondary">
                  {getTypeIcon(asset.type)} {formatSize(asset.size)}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(asset.id, e)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border text-xs text-text-secondary text-center">
        Всего: {assets.length} файлов
      </div>
    </div>
  );
}

// ==================== Asset Picker (для вставки в NodeSettings) ====================

interface AssetPickerProps {
  value?: string;
  onChange: (assetUrl: string) => void;
  assetType?: AssetType | 'all';
  label?: string;
}

export function AssetPicker({ value, onChange, assetType = 'all', label = 'Медиа-файл' }: AssetPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const assetManager = getAssetManager();

  const selectedAsset = value ? assetManager.getAsset(value.replace('asset://', '')) : null;

  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-left hover:border-primary transition-colors"
        >
          {selectedAsset ? (
            <span className="flex items-center gap-2">
              <span>
                {selectedAsset.type === 'image' ? '🖼' : selectedAsset.type === 'audio' ? '🎵' : '🎬'}
              </span>
              <span className="text-text-primary truncate">{selectedAsset.name}</span>
            </span>
          ) : (
            <span className="text-text-secondary">Выбрать {label.toLowerCase()}...</span>
          )}
        </button>
        {value && (
          <button
            onClick={() => onChange('')}
            className="px-2 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="bg-background rounded-xl shadow-2xl w-[600px] h-[500px] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">Выберите {label.toLowerCase()}</h3>
              <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text-primary text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssetPanel
                onSelectAsset={(asset) => {
                  onChange(assetManager.getAssetUrl(asset.id));
                  setIsOpen(false);
                }}
                filterType={assetType}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}