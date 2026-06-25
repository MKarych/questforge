'use client';

import { useEffect, useState } from 'react';

export function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const htmlEl = document.documentElement;
    const current = htmlEl.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      const newTheme = htmlEl.getAttribute('data-theme') || 'light';
      setTheme(newTheme === 'dark' ? 'dark' : 'light');
    });

    observer.observe(htmlEl, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}