'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';

export interface AdminNotificationCounts {
  pendingApplications: number;
  pendingComplaints: number;
  newSupportTickets: number;
  pendingScenarios: number;
}

interface AdminNotificationBadgeProps {
  /** Рендер-проп для кнопки: получает total unread count */
  renderButton: (totalUnread: number) => React.ReactNode;
  /** Рендер-проп для пунктов меню: получает counts */
  renderMenuItems: (counts: AdminNotificationCounts) => React.ReactNode;
}

// Ключи для localStorage
const STORAGE_KEY_SOUND = 'admin_notifications_sound';
const STORAGE_KEY_TOASTS = 'admin_notifications_toasts';

/** Получить настройку из localStorage */
function getStorageBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(key);
  if (val === null) return defaultValue;
  return val === 'true';
}

/** Воспроизвести звук уведомления через Web Audio API */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Игнорируем ошибки воспроизведения звука
  }
}

// Глобальный Set для отслеживания уже показанных комбинаций уведомлений
// Ключ = "apps:N-complaints:M-tickets:K" — предотвращает дублирование на разных вкладках
const shownNotificationKeys = new Set<string>();

export default function AdminNotificationBadge({
  renderButton,
  renderMenuItems,
}: AdminNotificationBadgeProps) {
  const [counts, setCounts] = useState<AdminNotificationCounts>({
    pendingApplications: 0,
    pendingComplaints: 0,
    newSupportTickets: 0,
    pendingScenarios: 0,
  });
  const prevTotalRef = useRef(0);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await apiClient.getAdminNotificationCounts();
      const newCounts = res.data;
      setCounts(newCounts);

      const total = newCounts.pendingApplications + newCounts.pendingComplaints + newCounts.newSupportTickets + newCounts.pendingScenarios;
      const prevTotal = prevTotalRef.current;

      // Читаем настройки напрямую из localStorage каждый раз,
      // чтобы изменения на странице /admin/settings применялись сразу
      const soundOn = getStorageBoolean(STORAGE_KEY_SOUND, true);
      const toastsOn = getStorageBoolean(STORAGE_KEY_TOASTS, true);

      // Если появились новые уведомления (total > 0 и раньше было меньше)
      if (total > 0 && total > prevTotal) {
        // Уникальный ключ для этой комбинации уведомлений
        const notificationKey = `apps:${newCounts.pendingApplications}-complaints:${newCounts.pendingComplaints}-tickets:${newCounts.newSupportTickets}-scenarios:${newCounts.pendingScenarios}`;

        // Показываем уведомление только если эта комбинация ещё не была показана
        if (!shownNotificationKeys.has(notificationKey)) {
          shownNotificationKeys.add(notificationKey);

          // Звук
          if (soundOn) {
            playNotificationSound();
          }

          // Toast-баннеры
          if (toastsOn) {
            if (newCounts.pendingApplications > 0) {
              showToast('📋', `Новая заявка организатора!`, '/admin/requests');
            }
            if (newCounts.pendingComplaints > 0) {
              showToast('🚨', `Новая жалоба!`, '/admin/complaints');
            }
            if (newCounts.newSupportTickets > 0) {
              showToast('📬', `Новый тикет поддержки!`, '/admin/support');
            }
            if (newCounts.pendingScenarios > 0) {
              showToast('📜', `Новый сценарий на модерацию!`, '/admin/scenarios');
            }
          }
        }
      }

      prevTotalRef.current = total;
    } catch {
      // Игнорируем ошибки
    }
  }, []);

  // Опрашиваем каждые 30 секунд
  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const totalUnread = counts.pendingApplications + counts.pendingComplaints + counts.newSupportTickets + counts.pendingScenarios;

  return (
    <>
      {renderButton(totalUnread)}
      {renderMenuItems(counts)}
    </>
  );
}

// ============================================================
// Toast-уведомления
// ============================================================

interface ToastItem {
  id: string;
  icon: string;
  message: string;
  link: string;
}

let toastListeners: Array<(toasts: ToastItem[]) => void> = [];
let toasts: ToastItem[] = [];
let toastIdCounter = 0;

function notifyToastListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

function showToast(icon: string, message: string, link: string) {
  const id = `admin-toast-${++toastIdCounter}`;
  const item: ToastItem = { id, icon, message, link };
  toasts.push(item);
  notifyToastListeners();

  // Автоматически убираем через 6 секунд
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyToastListeners();
  }, 6000);
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyToastListeners();
}

/** Хук для подписки на toast-уведомления */
export function useAdminToasts(): ToastItem[] {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setItems);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setItems);
    };
  }, []);

  return items;
}

// ============================================================
// Компонент для отображения toast-ов
// ============================================================

export function AdminToastContainer() {
  const toasts = useAdminToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <a
          key={toast.id}
          href={toast.link}
          className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl shadow-2xl animate-slide-up hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer"
          onClick={() => removeToast(toast.id)}
        >
          <span className="text-2xl">{toast.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{toast.message}</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeToast(toast.id);
            }}
            className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </a>
      ))}
    </div>
  );
}