// ============================================================
// History Manager — Undo/Redo, Clipboard, Snapshot management
// По спецификации docs/49 (раздел 7.4)
// ============================================================

import {
  Scene,
  Edge,
  VariableDefinition,
  EditorSnapshot,
} from '../editor-store/editor.types';

export class HistoryManager {
  private undoStack: EditorSnapshot[] = [];
  private redoStack: EditorSnapshot[] = [];
  private maxHistory: number = 50;

  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory;
  }

  /**
   * Сохранить текущее состояние в undo stack
   */
  pushState(
    scenes: Scene[],
    edges: Edge[],
    variables: VariableDefinition[]
  ): void {
    const snapshot: EditorSnapshot = {
      scenes: JSON.parse(JSON.stringify(scenes)),
      edges: JSON.parse(JSON.stringify(edges)),
      variables: JSON.parse(JSON.stringify(variables)),
      timestamp: Date.now(),
    };

    this.undoStack.push(snapshot);

    // Ограничение размера
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    // Очищаем redo при новом действии
    this.redoStack = [];
  }

  /**
   * Undo — откат к предыдущему состоянию
   */
  undo(
    currentScenes: Scene[],
    currentEdges: Edge[],
    currentVariables: VariableDefinition[]
  ): { scenes: Scene[]; edges: Edge[]; variables: VariableDefinition[] } | null {
    if (this.undoStack.length === 0) return null;

    // Сохраняем текущее состояние в redo
    const currentSnapshot: EditorSnapshot = {
      scenes: JSON.parse(JSON.stringify(currentScenes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
      variables: JSON.parse(JSON.stringify(currentVariables)),
      timestamp: Date.now(),
    };
    this.redoStack.push(currentSnapshot);

    // Восстанавливаем предыдущее
    const previous = this.undoStack.pop()!;
    return {
      scenes: previous.scenes,
      edges: previous.edges,
      variables: previous.variables,
    };
  }

  /**
   * Redo — восстановление отменённого состояния
   */
  redo(
    currentScenes: Scene[],
    currentEdges: Edge[],
    currentVariables: VariableDefinition[]
  ): { scenes: Scene[]; edges: Edge[]; variables: VariableDefinition[] } | null {
    if (this.redoStack.length === 0) return null;

    // Сохраняем текущее состояние в undo
    const currentSnapshot: EditorSnapshot = {
      scenes: JSON.parse(JSON.stringify(currentScenes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
      variables: JSON.parse(JSON.stringify(currentVariables)),
      timestamp: Date.now(),
    };
    this.undoStack.push(currentSnapshot);

    // Восстанавливаем следующее
    const next = this.redoStack.pop()!;
    return {
      scenes: next.scenes,
      edges: next.edges,
      variables: next.variables,
    };
  }

  /**
   * Получить историю undo
   */
  getUndoStack(): EditorSnapshot[] {
    return [...this.undoStack];
  }

  /**
   * Получить историю redo
   */
  getRedoStack(): EditorSnapshot[] {
    return [...this.redoStack];
  }

  /**
   * Можно ли отменить
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Можно ли повторить
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Очистить историю
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Получить размер undo стека
   */
  getUndoSize(): number {
    return this.undoStack.length;
  }

  /**
   * Получить размер redo стека
   */
  getRedoSize(): number {
    return this.redoStack.length;
  }
}

// ==================== Clipboard Manager ====================
export class ClipboardManager {
  private clipboard: { scenes: Scene[]; edges: Edge[] } | null = null;

  /**
   * Скопировать сцены и рёбра в буфер обмена
   */
  copy(scenes: Scene[], edges: Edge[], sceneIds: string[]): void {
    const scenesToCopy = scenes.filter((s) => sceneIds.includes(s.id));
    const sceneIdSet = new Set(sceneIds);
    const edgesToCopy = edges.filter(
      (e) => sceneIdSet.has(e.source) && sceneIdSet.has(e.target)
    );

    this.clipboard = {
      scenes: JSON.parse(JSON.stringify(scenesToCopy)),
      edges: JSON.parse(JSON.stringify(edgesToCopy)),
    };
  }

  /**
   * Вставить сцены из буфера обмена
   */
  paste(): { scenes: Scene[]; edges: Edge[] } | null {
    if (!this.clipboard) return null;
    return {
      scenes: JSON.parse(JSON.stringify(this.clipboard.scenes)),
      edges: JSON.parse(JSON.stringify(this.clipboard.edges)),
    };
  }

  /**
   * Проверить, есть ли данные в буфере
   */
  hasData(): boolean {
    return this.clipboard !== null && this.clipboard.scenes.length > 0;
  }

  /**
   * Очистить буфер обмена
   */
  clear(): void {
    this.clipboard = null;
  }
}