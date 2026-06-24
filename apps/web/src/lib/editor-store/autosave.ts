// ============================================================
// AutoSave — Автосохранение в localStorage
// По спецификации docs/49 (раздел 7.3)
// ============================================================

import { Scene, Edge, VariableDefinition, GameSettings } from '../editor-store/editor.types';

const AUTOSAVE_KEY = 'questforge_editor_autosave';
const AUTOSAVE_INTERVAL = 30000; // 30 секунд

export interface AutoSaveData {
  scenarioId: string | null;
  name: string;
  description: string;
  scenes: Scene[];
  edges: Edge[];
  variables: VariableDefinition[];
  settings: GameSettings;
  viewport: { x: number; y: number; zoom: number };
  timestamp: number;
}

export class AutoSaveManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  /**
   * Запустить автосохранение
   */
  start(saveFn: () => void): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      saveFn();
    }, AUTOSAVE_INTERVAL);
  }

  /**
   * Остановить автосохранение
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Сохранить данные в localStorage
   */
  saveToLocalStorage(data: AutoSaveData): void {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[AutoSave] Failed to save to localStorage:', e);
    }
  }

  /**
   * Восстановить данные из localStorage
   */
  loadFromLocalStorage(): AutoSaveData | null {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;

      const data: AutoSaveData = JSON.parse(raw);

      // Проверка на актуальность (не старше 24 часов)
      const age = Date.now() - data.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(AUTOSAVE_KEY);
        return null;
      }

      return data;
    } catch (e) {
      console.warn('[AutoSave] Failed to load from localStorage:', e);
      return null;
    }
  }

  /**
   * Очистить автосохранение
   */
  clearLocalStorage(): void {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (e) {
      console.warn('[AutoSave] Failed to clear localStorage:', e);
    }
  }

  /**
   * Проверить, есть ли автосохранение
   */
  hasAutoSave(): boolean {
    try {
      return localStorage.getItem(AUTOSAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Получить время последнего автосохранения
   */
  getLastAutoSaveTime(): number | null {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const data: AutoSaveData = JSON.parse(raw);
      return data.timestamp;
    } catch {
      return null;
    }
  }
}

export const autoSaveManager = new AutoSaveManager();