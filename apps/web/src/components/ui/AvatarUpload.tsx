'use client';

import { useState, useRef, useCallback } from 'react';

interface AvatarUploadProps {
  currentAvatar: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  uploading?: boolean;
}

export default function AvatarUpload({ currentAvatar, onUpload, onDelete, uploading }: AvatarUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    setSelectedFile(null);
    setPreview(null);
  }, [selectedFile, onUpload]);

  const handleDelete = useCallback(async () => {
    await onDelete();
    setPreview(null);
    setSelectedFile(null);
  }, [onDelete]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayUrl = preview || currentAvatar;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar preview */}
      <div
        className={`
          relative w-32 h-32 rounded-full overflow-hidden cursor-pointer
          border-2 border-dashed transition-colors
          ${dragOver ? 'border-primary bg-primary/10' : 'border-surface-elevated hover:border-primary/50'}
          ${!displayUrl ? 'bg-surface-elevated' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {preview ? 'Выбрать другой' : 'Загрузить фото'}
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Actions */}
      <div className="flex gap-2">
        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
          >
            {uploading ? 'Загрузка...' : 'Сохранить фото'}
          </button>
        )}

        {!selectedFile && currentAvatar && (
          <button
            onClick={handleDelete}
            className="text-sm px-4 py-2 text-error hover:text-error/80 transition-colors"
          >
            Удалить фото
          </button>
        )}

        {!selectedFile && !currentAvatar && (
          <button
            onClick={handleClick}
            className="text-sm px-4 py-2 text-primary hover:text-primary-hover transition-colors"
          >
            Выбрать фото
          </button>
        )}

        {selectedFile && (
          <button
            onClick={() => { setSelectedFile(null); setPreview(null); }}
            className="text-sm px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Отмена
          </button>
        )}
      </div>

      <p className="text-xs text-text-secondary">
        Перетащите фото или нажмите для выбора. JPG, PNG, WEBP до 5MB.
      </p>
    </div>
  );
}