'use client';

import { useState } from 'react';

type Language = 'ru' | 'en';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState<Language>('ru');
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
  ];

  const switchLang = (code: Language) => {
    setLang(code);
    setIsOpen(false);
    // TODO: синхронизировать с settings.language в профиле пользователя
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
        aria-label="Выбрать язык"
        aria-expanded={isOpen}
      >
        <span className="text-base">🌐</span>
        <span className="hidden sm:inline font-medium">{lang.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[80px]">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLang(l.code)}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-surface-elevated transition-colors ${
                lang === l.code ? 'text-primary font-medium' : 'text-text-secondary'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}