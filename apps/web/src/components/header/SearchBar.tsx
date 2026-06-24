'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'game' | 'team' | 'organizer' | 'city' | 'tag';
  label: string;
  description?: string;
  href: string;
}

// Мок-данные для поиска (пока без API)
const MOCK_RESULTS: SearchResult[] = [];

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(MOCK_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      // TODO: заменить на реальный API поиска
      setResults([]);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        router.push(results[selectedIndex].href);
        onClose();
        setQuery('');
      }
    },
    [results, selectedIndex, router, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 md:left-auto md:right-0 md:top-auto md:absolute md:mt-2 z-50 mx-4 md:mx-0 md:w-96"
    >
      <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск игр, команд, организаторов..."
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder-text-muted text-sm"
            aria-label="Поиск"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
          />
          <button
            onClick={() => { onClose(); setQuery(''); }}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Закрыть поиск"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isSearching && (
          <div className="px-4 py-3 text-sm text-text-muted">
            Поиск...
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className="px-4 py-3 text-sm text-text-muted">
            Ничего не найдено
          </div>
        )}

        {results.length > 0 && (
          <ul id="search-results" role="listbox" className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <li
                key={`${result.type}-${result.id}`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <button
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface-elevated transition-colors ${
                    index === selectedIndex ? 'bg-surface-elevated' : ''
                  }`}
                  onClick={() => {
                    router.push(result.href);
                    onClose();
                    setQuery('');
                  }}
                >
                  <span className="text-lg">
                    {result.type === 'game' && '🎮'}
                    {result.type === 'team' && '👥'}
                    {result.type === 'organizer' && '👤'}
                    {result.type === 'city' && '📍'}
                    {result.type === 'tag' && '🏷️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {result.label}
                    </div>
                    {result.description && (
                      <div className="text-xs text-text-muted truncate">
                        {result.description}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-text-muted uppercase shrink-0">
                    {result.type === 'game' && 'Игра'}
                    {result.type === 'team' && 'Команда'}
                    {result.type === 'organizer' && 'Организатор'}
                    {result.type === 'city' && 'Город'}
                    {result.type === 'tag' && 'Тег'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="px-4 py-2 border-t border-border bg-surface-elevated/50">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>↑↓ Навигация</span>
            <span>↵ Выбрать</span>
            <span>Esc Закрыть</span>
          </div>
        </div>
      </div>
    </div>
  );
}