'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Condition,
  ConditionGroup,
  SingleCondition,
  ConditionType,
  Operator,
  SYSTEM_VARIABLES,
  VariableDefinition,
} from '@/lib/editor-store/editor.types';
import { useEditorStore } from '@/lib/editor-store/editor.store';

// ==================== Types ====================

interface ConditionBuilderProps {
  /** Текущее условие (может быть SingleCondition или ConditionGroup) */
  value: Condition | null;
  /** Коллбэк при изменении условия */
  onChange: (condition: Condition | null) => void;
  /** Заголовок панели */
  title?: string;
  /** Показывать кнопку "Применить" */
  showApply?: boolean;
  /** Коллбэк при нажатии "Применить" */
  onApply?: () => void;
  /** Коллбэк при закрытии */
  onClose?: () => void;
  /** Дополнительные переменные для автодополнения */
  extraVariables?: VariableDefinition[];
  /** Режим отображения: full — полный, compact — компактный */
  mode?: 'full' | 'compact';
}

// ==================== Constants ====================

const CONDITION_TYPES: { value: ConditionType; label: string; icon: string }[] = [
  { value: 'variable', label: 'Переменная', icon: '📊' },
  { value: 'score', label: 'Очки', icon: '⭐' },
  { value: 'inventory', label: 'Инвентарь', icon: '🎒' },
  { value: 'flag', label: 'Флаг', icon: '🚩' },
  { value: 'role', label: 'Роль', icon: '👤' },
  { value: 'time', label: 'Время', icon: '⏱' },
  { value: 'random', label: 'Случайно', icon: '🎲' },
];

const OPERATORS: { value: Operator; label: string; symbol: string }[] = [
  { value: 'eq', label: 'Равно', symbol: '==' },
  { value: 'ne', label: 'Не равно', symbol: '!=' },
  { value: 'gt', label: 'Больше', symbol: '>' },
  { value: 'lt', label: 'Меньше', symbol: '<' },
  { value: 'gte', label: '≥', symbol: '>=' },
  { value: 'lte', label: '≤', symbol: '<=' },
  { value: 'contains', label: 'Содержит', symbol: '⊃' },
  { value: 'has', label: 'Имеет', symbol: '∋' },
];

const CONDITION_TYPE_ICONS: Record<ConditionType, string> = {
  variable: '📊',
  score: '⭐',
  inventory: '🎒',
  flag: '🚩',
  role: '👤',
  time: '⏱',
  random: '🎲',
};

// ==================== Helpers ====================

function createEmptyCondition(): SingleCondition {
  return {
    type: 'score',
    operator: 'gt',
    left: 'score',
    right: 0,
  };
}

function createConditionGroup(operator: 'AND' | 'OR'): ConditionGroup {
  return {
    operator,
    conditions: [createEmptyCondition()],
  };
}

function isConditionGroup(condition: Condition): condition is ConditionGroup {
  return 'operator' in condition && 'conditions' in condition;
}

function isSingleCondition(condition: Condition): condition is SingleCondition {
  return 'type' in condition && 'operator' in condition;
}

function getConditionLabel(condition: Condition): string {
  if (isConditionGroup(condition)) {
    return condition.operator === 'AND' ? 'И (AND)' : 'ИЛИ (OR)';
  }
  const typeLabel = CONDITION_TYPES.find(t => t.value === condition.type)?.label || condition.type;
  const opSymbol = OPERATORS.find(o => o.value === condition.operator)?.symbol || condition.operator;
  return `${typeLabel} ${condition.left} ${opSymbol} ${condition.right}`;
}

function validateCondition(condition: Condition): boolean {
  if (isConditionGroup(condition)) {
    return condition.conditions.length > 0 && condition.conditions.every(c => validateCondition(c));
  }
  // SingleCondition валидна, если заполнены left и right
  if (condition.left === '' || condition.right === '') return false;
  if (condition.left === undefined || condition.right === undefined) return false;
  return true;
}

function deepCloneCondition<T extends Condition>(condition: T): T {
  return JSON.parse(JSON.stringify(condition));
}

// ==================== Autocomplete Hook ====================

function useAutocomplete(extraVariables?: VariableDefinition[]) {
  const storeVariables = useEditorStore((s) => s.variables);
  const storeSettings = useEditorStore((s) => s.settings);

  const suggestions = useMemo(() => {
    const result: { label: string; value: string; icon: string; group: string }[] = [];

    // Системные переменные
    SYSTEM_VARIABLES.forEach(v => {
      result.push({
        label: v.name,
        value: v.name,
        icon: '⚙️',
        group: 'Системные',
      });
    });

    // Пользовательские переменные из store
    storeVariables.forEach(v => {
      result.push({
        label: v.name,
        value: v.name,
        icon: '📊',
        group: 'Пользовательские',
      });
    });

    // Дополнительные переменные
    extraVariables?.forEach(v => {
      result.push({
        label: v.name,
        value: v.name,
        icon: '📎',
        group: 'Дополнительные',
      });
    });

    return result;
  }, [storeVariables, storeSettings, extraVariables]);

  return suggestions;
}

// ==================== AutocompleteInput Component ====================

interface AutocompleteInputProps {
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  suggestions: { label: string; value: string; icon: string; group: string }[];
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
}

function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder = '',
  type = 'text',
  className = '',
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const stringValue = String(value);

  const filteredSuggestions = useMemo(() => {
    if (!filter) return suggestions;
    const lower = filter.toLowerCase();
    return suggestions.filter(s =>
      s.label.toLowerCase().includes(lower) || s.value.toLowerCase().includes(lower)
    );
  }, [suggestions, filter]);

  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, typeof suggestions> = {};
    filteredSuggestions.forEach(s => {
      if (!groups[s.group]) groups[s.group] = [];
      groups[s.group].push(s);
    });
    return groups;
  }, [filteredSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((suggestion: { label: string; value: string }) => {
    onChange(suggestion.value);
    setFilter('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
          handleSelect(filteredSuggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [isOpen, activeIndex, filteredSuggestions, handleSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setFilter(raw);
    if (type === 'number') {
      const num = parseFloat(raw);
      onChange(isNaN(num) ? 0 : num);
    } else {
      onChange(raw);
    }
    setIsOpen(true);
    setActiveIndex(-1);
  }, [type, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
    setFilter('');
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Задержка, чтобы успел сработать клик по dropdown
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={type === 'number' ? stringValue : (isFocused ? filter || stringValue : stringValue)}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`input-field text-xs ${className}`}
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto"
        >
          {Object.entries(groupedSuggestions).map(([group, items]) => (
            <div key={group}>
              <div className="px-2 py-1 text-[10px] font-semibold text-text-secondary uppercase tracking-wider bg-background-modifier-hover/50">
                {group}
              </div>
              {items.map((suggestion, idx) => {
                const globalIdx = filteredSuggestions.indexOf(suggestion);
                return (
                  <button
                    key={suggestion.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(suggestion);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                      globalIdx === activeIndex
                        ? 'bg-primary/20 text-text-primary'
                        : 'text-text-secondary hover:bg-background-modifier-hover'
                    }`}
                  >
                    <span>{suggestion.icon}</span>
                    <span className="font-mono">{suggestion.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== SingleConditionRow Component ====================

interface SingleConditionRowProps {
  condition: SingleCondition;
  onChange: (condition: SingleCondition) => void;
  onDelete: () => void;
  suggestions: { label: string; value: string; icon: string; group: string }[];
  isValid: boolean;
}

function SingleConditionRow({
  condition,
  onChange,
  onDelete,
  suggestions,
  isValid,
}: SingleConditionRowProps) {
  const handleTypeChange = useCallback((type: ConditionType) => {
    const newCondition: SingleCondition = {
      ...condition,
      type,
      left: type === 'score' ? 'score' : type === 'time' ? 'game.elapsed' : '',
    };
    onChange(newCondition);
  }, [condition, onChange]);

  const handleOperatorChange = useCallback((operator: Operator) => {
    onChange({ ...condition, operator });
  }, [condition, onChange]);

  const handleLeftChange = useCallback((value: string | number | boolean) => {
    onChange({ ...condition, left: value });
  }, [condition, onChange]);

  const handleRightChange = useCallback((value: string | number | boolean) => {
    onChange({ ...condition, right: value });
  }, [condition, onChange]);

  const leftSuggestions = useMemo(() => {
    if (condition.type === 'score') {
      return suggestions.filter(s => s.value === 'score' || s.value === 'team.score');
    }
    if (condition.type === 'time') {
      return suggestions.filter(s => s.value === 'game.time' || s.value === 'game.elapsed');
    }
    if (condition.type === 'role') {
      return suggestions.filter(s => s.value === 'player.role');
    }
    return suggestions;
  }, [condition.type, suggestions]);

  const rightPlaceholder = useMemo(() => {
    switch (condition.type) {
      case 'score': return 'Значение очков';
      case 'time': return 'Секунд';
      case 'inventory': return 'ID предмета';
      case 'flag': return 'Название флага';
      case 'role': return 'Имя роли';
      case 'random': return 'Шанс (0-100)%';
      default: return 'Значение';
    }
  }, [condition.type]);

  const rightType = useMemo(() => {
    if (condition.type === 'score' || condition.type === 'time' || condition.type === 'random') {
      return 'number' as const;
    }
    return 'text' as const;
  }, [condition.type]);

  return (
    <div
      className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-colors ${
        isValid
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-red-500/5 border-red-500/20'
      }`}
    >
      {/* Тип условия */}
      <select
        value={condition.type}
        onChange={(e) => handleTypeChange(e.target.value as ConditionType)}
        className="input-field text-xs w-auto min-w-[90px]"
        title="Тип условия"
      >
        {CONDITION_TYPES.map(t => (
          <option key={t.value} value={t.value}>
            {t.icon} {t.label}
          </option>
        ))}
      </select>

      {/* Левое значение */}
      <AutocompleteInput
        value={condition.left}
        onChange={handleLeftChange}
        suggestions={leftSuggestions}
        placeholder="Значение"
        className="w-24"
      />

      {/* Оператор */}
      <select
        value={condition.operator}
        onChange={(e) => handleOperatorChange(e.target.value as Operator)}
        className="input-field text-xs w-auto min-w-[60px]"
        title="Оператор"
      >
        {OPERATORS.map(op => (
          <option key={op.value} value={op.value}>
            {op.symbol}
          </option>
        ))}
      </select>

      {/* Правое значение */}
      <AutocompleteInput
        value={condition.right}
        onChange={handleRightChange}
        suggestions={suggestions}
        placeholder={rightPlaceholder}
        type={rightType}
        className="w-24"
      />

      {/* Индикатор валидности */}
      <span
        className={`text-sm shrink-0 ${isValid ? 'text-green-500' : 'text-red-500'}`}
        title={isValid ? 'Условие валидно' : 'Условие невалидно'}
      >
        {isValid ? '✓' : '✗'}
      </span>

      {/* Кнопка удаления */}
      <button
        onClick={onDelete}
        className="text-text-secondary hover:text-error transition-colors text-sm shrink-0 p-0.5"
        title="Удалить условие"
      >
        ✕
      </button>
    </div>
  );
}

// ==================== ConditionTreeNode Component ====================

interface ConditionTreeNodeProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onDelete: () => void;
  depth: number;
  suggestions: { label: string; value: string; icon: string; group: string }[];
  isRoot?: boolean;
}

function ConditionTreeNode({
  condition,
  onChange,
  onDelete,
  depth,
  suggestions,
  isRoot = false,
}: ConditionTreeNodeProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const isValid = useMemo(() => validateCondition(condition), [condition]);

  const handleAddCondition = useCallback(() => {
    const newCondition = createEmptyCondition();
    if (isConditionGroup(condition)) {
      const updated = deepCloneCondition(condition);
      updated.conditions.push(newCondition);
      onChange(updated);
    } else {
      // Превращаем одиночное условие в группу AND
      const group: ConditionGroup = {
        operator: 'AND',
        conditions: [deepCloneCondition(condition), newCondition],
      };
      onChange(group);
    }
  }, [condition, onChange]);

  const handleAddGroup = useCallback((operator: 'AND' | 'OR') => {
    const newGroup = createConditionGroup(operator);
    if (isConditionGroup(condition)) {
      const updated = deepCloneCondition(condition);
      updated.conditions.push(newGroup);
      onChange(updated);
    } else {
      const group: ConditionGroup = {
        operator,
        conditions: [deepCloneCondition(condition), newGroup],
      };
      onChange(group);
    }
  }, [condition, onChange]);

  const handleRemoveCondition = useCallback((index: number) => {
    if (!isConditionGroup(condition)) return;
    const updated = deepCloneCondition(condition);
    updated.conditions.splice(index, 1);
    if (updated.conditions.length === 1 && isSingleCondition(updated.conditions[0])) {
      // Если осталось одно условие — сворачиваем группу
      onChange(updated.conditions[0]);
    } else if (updated.conditions.length === 0) {
      onDelete();
    } else {
      onChange(updated);
    }
  }, [condition, onChange, onDelete]);

  const handleChildChange = useCallback((index: number, child: Condition) => {
    if (!isConditionGroup(condition)) return;
    const updated = deepCloneCondition(condition);
    updated.conditions[index] = child;
    onChange(updated);
  }, [condition, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const data = e.dataTransfer.getData('application/condition-type');
    if (data) {
      const conditionType = data as ConditionType;
      const newCondition: SingleCondition = {
        type: conditionType,
        operator: 'eq',
        left: '',
        right: '',
      };

      if (isConditionGroup(condition)) {
        const updated = deepCloneCondition(condition);
        updated.conditions.push(newCondition);
        onChange(updated);
      } else {
        const group: ConditionGroup = {
          operator: 'AND',
          conditions: [deepCloneCondition(condition), newCondition],
        };
        onChange(group);
      }
    }
  }, [condition, onChange]);

  // Single condition
  if (isSingleCondition(condition)) {
    return (
      <div
        className={`relative transition-colors rounded-lg ${
          isDragOver ? 'bg-primary/10 ring-2 ring-primary/40' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <SingleConditionRow
          condition={condition}
          onChange={onChange}
          onDelete={onDelete}
          suggestions={suggestions}
          isValid={isValid}
        />
      </div>
    );
  }

  // Condition group (AND/OR)
  return (
    <div
      className={`relative transition-colors ${
        isDragOver ? 'bg-primary/10 ring-2 ring-primary/40' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Заголовок группы */}
      <div className="flex items-center gap-2 mb-1.5">
        {/* Линия соединения для вложенных групп */}
        {depth > 0 && (
          <div className="w-4 h-px bg-border shrink-0" />
        )}

        {/* Селектор оператора группы */}
        <select
          value={condition.operator}
          onChange={(e) => {
            const updated = deepCloneCondition(condition);
            updated.operator = e.target.value as 'AND' | 'OR';
            onChange(updated);
          }}
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            condition.operator === 'AND'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
          }`}
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>

        <span className="text-[10px] text-text-secondary">
          ({condition.conditions.length} условий)
        </span>

        {/* Кнопка удаления группы (только если не корневая) */}
        {!isRoot && (
          <button
            onClick={onDelete}
            className="text-text-secondary hover:text-error transition-colors text-xs ml-auto"
            title="Удалить группу"
          >
            ✕
          </button>
        )}
      </div>

      {/* Дочерние условия с отступом */}
      <div
        className="space-y-1.5"
        style={{
          marginLeft: depth > 0 ? 16 : 0,
          borderLeft: depth > 0 ? '1px solid var(--border-color, #334155)' : 'none',
          paddingLeft: depth > 0 ? 8 : 0,
        }}
      >
        {condition.conditions.map((child, index) => (
          <ConditionTreeNode
            key={index}
            condition={child}
            onChange={(c) => handleChildChange(index, c)}
            onDelete={() => handleRemoveCondition(index)}
            depth={depth + 1}
            suggestions={suggestions}
          />
        ))}
      </div>

      {/* Кнопки добавления */}
      <div className="flex items-center gap-1 mt-1.5 ml-4">
        <button
          onClick={handleAddCondition}
          className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
        >
          + Условие
        </button>
        <button
          onClick={() => handleAddGroup('AND')}
          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
        >
          + AND
        </button>
        <button
          onClick={() => handleAddGroup('OR')}
          className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
        >
          + OR
        </button>
      </div>
    </div>
  );
}

// ==================== DraggableConditionType Component ====================

function DraggableConditionType({ type }: { type: typeof CONDITION_TYPES[0] }) {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/condition-type', type.value);
    e.dataTransfer.effectAllowed = 'copy';
  }, [type.value]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-background-modifier-hover/50 border border-border hover:border-primary/30 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-colors text-xs"
    >
      <span>{type.icon}</span>
      <span className="text-text-primary">{type.label}</span>
      <span className="text-text-secondary ml-auto">⠿</span>
    </div>
  );
}

// ==================== ConditionBuilder Component ====================

export default function ConditionBuilder({
  value,
  onChange,
  title = 'Редактор условий',
  showApply = false,
  onApply,
  onClose,
  extraVariables,
  mode = 'full',
}: ConditionBuilderProps) {
  const [localCondition, setLocalCondition] = useState<Condition | null>(value);
  const suggestions = useAutocomplete(extraVariables);

  // Синхронизация с внешним value
  useEffect(() => {
    setLocalCondition(value);
  }, [value]);

  const handleChange = useCallback((condition: Condition) => {
    setLocalCondition(condition);
    if (!showApply) {
      onChange(condition);
    }
  }, [onChange, showApply]);

  const handleApply = useCallback(() => {
    if (localCondition) {
      onChange(localCondition);
    }
    onApply?.();
  }, [localCondition, onChange, onApply]);

  const handleReset = useCallback(() => {
    setLocalCondition(null);
    onChange(null);
  }, [onChange]);

  const isValid = useMemo(() => {
    if (!localCondition) return true;
    return validateCondition(localCondition);
  }, [localCondition]);

  const conditionSummary = useMemo(() => {
    if (!localCondition) return 'Нет условий';
    if (isSingleCondition(localCondition)) {
      return getConditionLabel(localCondition);
    }
    const count = countConditions(localCondition);
    return `${localCondition.operator} (${count} условий)`;
  }, [localCondition]);

  // Compact mode — просто строка с краткой информацией
  if (mode === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary">
          {localCondition ? (
            <span className={`font-mono ${isValid ? 'text-green-500' : 'text-red-500'}`}>
              ⚡ {conditionSummary}
            </span>
          ) : (
            <span className="text-text-secondary">—</span>
          )}
        </span>
        <button
          onClick={() => setLocalCondition(createEmptyCondition())}
          className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          title="Добавить условие"
        >
          ⚡
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <span>⚡</span>
          <span>{title}</span>
        </h3>
        <div className="flex items-center gap-1">
          {localCondition && (
            <button
              onClick={handleReset}
              className="text-[10px] px-1.5 py-0.5 rounded text-text-secondary hover:text-error border border-border hover:border-error/30 transition-colors"
            >
              Сбросить
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Панель перетаскивания типов условий */}
      <div>
        <p className="text-[10px] text-text-secondary mb-1.5 font-medium uppercase tracking-wider">
          Типы условий (перетащите на дерево)
        </p>
        <div className="grid grid-cols-4 gap-1">
          {CONDITION_TYPES.map(t => (
            <DraggableConditionType key={t.value} type={t} />
          ))}
        </div>
      </div>

      {/* Дерево условий */}
      <div className="min-h-[60px] p-2 rounded-lg bg-background-modifier-hover/30 border border-border">
        {localCondition ? (
          <ConditionTreeNode
            condition={localCondition}
            onChange={handleChange}
            onDelete={() => setLocalCondition(null)}
            depth={0}
            suggestions={suggestions}
            isRoot
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <p className="text-xs text-text-secondary mb-2">
              Нет условий. Добавьте через кнопки ниже или перетащите тип условия.
            </p>
            <button
              onClick={() => setLocalCondition(createEmptyCondition())}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              + Добавить условие
            </button>
          </div>
        )}
      </div>

      {/* Кнопка "Применить" */}
      {showApply && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <span className={`text-[10px] ${isValid ? 'text-green-500' : 'text-red-500'}`}>
            {isValid ? '✓ Условие валидно' : '✗ Условие содержит ошибки'}
          </span>
          <button
            onClick={handleApply}
            disabled={!isValid}
            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Применить
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== Utility Functions ====================

function countConditions(condition: Condition): number {
  if (isSingleCondition(condition)) return 1;
  return condition.conditions.reduce((sum, c) => sum + countConditions(c), 0);
}

// ==================== Serialization Helpers ====================

/**
 * Сериализует Condition в человекочитаемую строку
 */
export function serializeCondition(condition: Condition | null): string {
  if (!condition) return '';
  if (isSingleCondition(condition)) {
    const opSymbol = OPERATORS.find(o => o.value === condition.operator)?.symbol || condition.operator;
    return `${CONDITION_TYPE_ICONS[condition.type]} ${condition.left} ${opSymbol} ${condition.right}`;
  }
  const items = condition.conditions.map(c => serializeCondition(c));
  return `(${items.join(` ${condition.operator} `)})`;
}

/**
 * Десериализует Condition из JSON (просто парсит, но для совместимости)
 */
export function deserializeCondition(json: string): Condition | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export {
  createEmptyCondition,
  createConditionGroup,
  isConditionGroup,
  isSingleCondition,
  validateCondition,
  getConditionLabel,
  CONDITION_TYPES,
  OPERATORS,
};