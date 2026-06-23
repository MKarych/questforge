'use client';

import { useState, useRef, useCallback } from 'react';
import ImageCropper from './ImageCropper';

interface AvatarUploadProps {
  currentAvatar: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  uploading?: boolean;
}

export default function AvatarUpload({ currentAvatar, onUpload, onDelete }: AvatarUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== Drag-and-drop на всю зону компонента =====
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setShowCropper(true);
    }
  }, []);

  // ===== Выбор файла через клик (единый обработчик для всего) =====
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowCropper(true);
    }
    // Сбрасываем value, чтобы можно было выбрать тот же файл повторно
    e.target.value = '';
  }, []);

  // ===== Обрезка завершена =====
  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], selectedFile?.name || 'avatar.jpg', {
      type: 'image/jpeg',
    });
    setShowCropper(false);
    setSelectedFile(null);
    await onUpload(croppedFile);
  }, [onUpload, selectedFile]);

  // ===== Отмена обрезки =====
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setSelectedFile(null);
  }, []);

  // ===== Удаление аватара =====
  const handleDelete = useCallback(async () => {
    await onDelete();
  }, [onDelete]);

  // ===== Клик в любом месте зоны =====
  const handleZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayUrl = currentAvatar;

  return (
    <>
      {/* Вся зона — drag-and-drop + click */}
      <div
        className={`
          flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer
          ${dragOver
            ? 'border-primary bg-primary/10'
            : 'border-surface-elevated hover:border-primary/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleZoneClick}
      >
        {/* Avatar preview */}
        <div
          className={`
            relative w-32 h-32 rounded-full overflow-hidden
            border-2 border-dashed transition-colors pointer-events-none
            ${dragOver ? 'border-primary bg-primary/10' : 'border-surface-elevated'}
            ${!displayUrl ? 'bg-surface-elevated' : ''}
          `}
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
              {displayUrl ? 'Изменить фото' : 'Загрузить фото'}
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
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {currentAvatar && (
            <button
              onClick={handleDelete}
              className="text-sm px-4 py-2 text-error hover:text-error/80 transition-colors"
            >
              Удалить фото
            </button>
          )}

          {!currentAvatar && (
            <button
              onClick={handleZoneClick}
              className="text-sm px-4 py-2 text-primary hover:text-primary-hover transition-colors"
            >
              Выбрать фото
            </button>
          )}
        </div>

        <p className="text-xs text-text-secondary pointer-events-none">
          Перетащите фото или нажмите для выбора. JPG, PNG, WEBP до 5MB.
        </p>
      </div>

      {/* Cropper modal */}
      {showCropper && selectedFile && (
        <ImageCropper
          file={selectedFile}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}