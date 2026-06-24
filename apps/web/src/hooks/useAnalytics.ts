'use client';

import { useCallback } from 'react';

type AnalyticsEvent =
  | 'hero_cta_click'
  | 'search_submit'
  | 'game_click'
  | 'category_click'
  | 'organizer_click'
  | 'team_click'
  | 'become_organizer_click'
  | 'login_click'
  | 'cta_click';

interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Хук для отправки событий аналитики.
 * В текущей реализации — console.log.
 * В будущем — заменить на реальный SDK (Yandex.Metrica, Google Analytics и т.д.)
 */
export function useAnalytics() {
  const track = useCallback((event: AnalyticsEvent, payload?: AnalyticsPayload) => {
    // TODO: заменить на реальный SDK аналитики
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, payload);
    }

    // Пример интеграции с Yandex.Metrica
    // if (typeof window !== 'undefined' && (window as any).ym) {
    //   (window as any).ym(ACCOUNT_ID, 'reachGoal', event, payload);
    // }

    // Пример интеграции с Google Analytics 4
    // if (typeof window !== 'undefined' && (window as any).gtag) {
    //   (window as any).gtag('event', event, payload);
    // }
  }, []);

  /**
   * Отправка метрик производительности
   */
  const trackPerformance = useCallback((metrics: {
    lcp?: number;
    fcp?: number;
    ttfb?: number;
    cls?: number;
  }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Performance metrics:', metrics);
    }
    // TODO: отправить в APM систему
  }, []);

  /**
   * Отправка ошибок в телеметрию
   */
  const trackError = useCallback((error: Error, context?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Analytics] Error${context ? ` [${context}]` : ''}:`, error);
    }
    // TODO: отправить в Sentry / APM
  }, []);

  return { track, trackPerformance, trackError };
}