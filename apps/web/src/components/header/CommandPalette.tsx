'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/api/client';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
  roles?: Array<'GUEST' | 'PLAYER' | 'ORGANIZER' | 'ADMIN'>;
}

interface CommandPaletteProps {
  user: User | null;
}

export default function CommandPalette({ user }: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const userRole = user?.role || 'PLAYER';

  const commands: Command[] = [
    {
      id: 'search-games',
      label: 'Поиск игры',
      description: 'Найти игру по названию или городу',
      icon: '🎮',
      action: () => router.push('/games'),
    },
    {
      id: 'search-users',
      label: 'Поиск пользователя',
      description: 'Найти пользователя по имени',
      icon: '👤',
      action: () => router.push('/teams'),
    },
    {
      id: 'create-game',
      label: 'Создать игру',
      description: 'Создать новую игру',
      icon: '➕',
      roles: ['ORGANIZER', 'ADMIN'],
      action: () => router.push('/organizer/games/create'),
    },
    {
      id: 'create-team',
      label: 'Создать команду',
      description: 'Создать новую команду',
      icon: '👥',
      roles: ['PLAYER', 'ORGANIZER', 'ADMIN'],
      action: () => router.push('/teams/create'),
    },
    {
      id: 'go-profile',
      label: 'Перейти в профиль',
      description: 'Открыть мой профиль',
      icon: '👤',
      roles: ['PLAYER', 'ORGANIZER', 'ADMIN'],
      action: () => user ? router.push(`/profile/${user.id}`) : router.push('/auth/login'),
    },
    {
      id: 'go-settings',
      label: 'Перейти в настройки',
      description: 'Открыть настройки профиля',
      icon: '⚙️',
      roles: ['PLAYER', 'ORGANIZER', 'ADMIN'],
      action: () => router.push('/profile/edit'),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (cmd.roles && !cmd.roles.includes(userRole as any)) return false;
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(lower) ||
      cmd.description?.toLowerCase().includes(lower)
    );
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    },
    [filteredCommands, selectedIndex]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-label="Палитра команд"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <svg className="w-5 h-5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите команду..."
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder-text-muted text-sm"
            aria-label="Поиск команд"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-text-muted bg-surface-elevated rounded">
            ESC
          </kbd>
        </div>

        {filteredCommands.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            Команды не найдены
          </div>
        ) : (
          <ul className="max-h-72 overflow-y-auto py-2" role="listbox">
            {filteredCommands.map((cmd, index) => (
              <li
                key={cmd.id}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <button
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-surface-elevated transition-colors ${
                    index === selectedIndex ? 'bg-surface-elevated' : ''
                  }`}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="text-lg">{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">
                      {cmd.label}
                    </div>
                    {cmd.description && (
                      <div className="text-xs text-text-muted">
                        {cmd.description}
                      </div>
                    )}
                  </div>
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