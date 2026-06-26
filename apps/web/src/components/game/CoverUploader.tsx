'use client';

import { useState, useCallback, useRef } from 'react';
import { uploadCover } from '@/lib/api/client';

interface CoverUploaderProps {
  gameId: string;
  currentCoverUrl?: string | null;
  onCoverUpdate: (url: string) => void;
}

export default function CoverUploader({ gameId, currentCoverUrl, onCoverUpdate }: CoverUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentCoverUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Можно загружать только изображения');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Максимальный размер файла — 10 МБ');
      return;
    }

    setUploading(true);
    setError(null);

    // Show local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadCover(gameId, formData);
      onCoverUpdate(res.data?.coverUrl || '');
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки обложки');
      setPreview(currentCoverUrl || null);
    } finally {
      setUploading(false);
    }
  }, [gameId, currentCoverUrl, onCoverUpdate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onCoverUpdate('');
  };

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Обложка игры</h3>

      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-video rounded-xl border-2 border-dashed transition-colors cursor-pointer flex items-center justify-center overflow-hidden ${
          preview ? 'border-primary/30' : 'border-border hover:border-primary/50'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Обложка" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {uploading ? 'Загрузка...' : 'Изменить обложку'}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <svg className="w-10 h-10 text-text-secondary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-text-secondary">
              {uploading ? 'Загрузка...' : 'Нажмите или перетащите файл'}
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">PNG, JPG, WebP до 10 МБ</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {preview && (
        <button
          onClick={handleRemove}
          disabled={uploading}
          className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          Удалить обложку
        </button>
      )}
    </div>
  );
}