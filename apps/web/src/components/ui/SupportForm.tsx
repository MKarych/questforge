'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

const CATEGORIES = [
  { value: 'general', label: 'Общий вопрос' },
  { value: 'game', label: 'Проблема с игрой' },
  { value: 'account', label: 'Аккаунт и регистрация' },
  { value: 'payment', label: 'Оплата и подписки' },
  { value: 'technical', label: 'Техническая проблема' },
  { value: 'organizer', label: 'Для организаторов' },
  { value: 'other', label: 'Другое' },
];

export default function SupportForm() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    category: 'general',
    message: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiClient.createSupportTicket({
        email: formData.email,
        name: formData.name,
        category: formData.category,
        message: formData.message,
        attachments: files.map((f) => f.name),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отправке');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-surface-elevated rounded-lg w-1/3" />
        <div className="h-64 bg-surface-elevated rounded-xl" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">
          Ваше обращение принято!
        </h2>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          Мы получили ваше сообщение и ответим в ближайшее время. Обычно мы отвечаем в течение 24 часов в рабочие дни.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({ email: '', name: '', category: 'general', message: '' });
            setFiles([]);
          }}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          Отправить ещё обращение
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
          Email <span className="text-error">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
          Имя <span className="text-error">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          placeholder="Как к вам обращаться?"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-2">
          Тема обращения <span className="text-error">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
          Сообщение <span className="text-error">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={6}
          placeholder="Опишите вашу проблему или вопрос как можно подробнее..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y min-h-[140px]"
        />
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Вложения
        </label>
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20 transition-all cursor-pointer"
          />
        </div>
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((file, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-elevated rounded-lg text-sm text-text-secondary"
              >
                📎 {file.name}
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="ml-1 text-text-muted hover:text-error transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-xs text-text-muted">
          Максимальный размер файла: 50 МБ. Поддерживаемые форматы: JPEG, PNG, GIF, PDF, DOC, DOCX
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-primary/20"
      >
        {submitting ? 'Отправка...' : 'Отправить обращение'}
      </button>
    </form>
  );
}