'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/lib/editor-store/editor.store';
import { RoleDefinition } from '@/lib/editor-store/editor.types';

interface RoleManagerProps {
  onClose: () => void;
}

const TEAM_OPTIONS: { value: RoleDefinition['team']; label: string; color: string }[] = [
  { value: 'red', label: '🔴 Красная', color: 'bg-red-500' },
  { value: 'blue', label: '🔵 Синяя', color: 'bg-blue-500' },
  { value: 'neutral', label: '⚪ Нейтральная', color: 'bg-gray-400' },
];

const VISIBILITY_OPTIONS: { value: RoleDefinition['visibility']; label: string }[] = [
  { value: 'all', label: '👁 Все видят' },
  { value: 'role_only', label: '👤 Только роль' },
  { value: 'hidden', label: '🙈 Скрыта' },
];

const DEFAULT_ICONS = ['👤', '🕵️', '🧙', '🦸', '🧛', '🤴', '👸', '🎅', '🧝', '🧟', '🧞', '🧜'];

function RoleEditModal({
  role,
  onSave,
  onDelete,
  onClose,
}: {
  role: RoleDefinition | null;
  onSave: (data: Partial<RoleDefinition> & { id?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [team, setTeam] = useState<RoleDefinition['team']>(role?.team || 'neutral');
  const [visibility, setVisibility] = useState<RoleDefinition['visibility']>(role?.visibility || 'all');
  const [icon, setIcon] = useState(role?.icon || '👤');
  const [count, setCount] = useState(role?.count || 1);
  const [permissionsStr, setPermissionsStr] = useState(role?.permissions?.join(', ') || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: role?.id,
      name: name.trim(),
      description: description.trim(),
      team,
      visibility,
      icon,
      count: Math.max(1, count),
      permissions: permissionsStr.split(',').map((p) => p.trim()).filter(Boolean),
      winCondition: role?.winCondition || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            {role ? '✏️ Редактировать роль' : '➕ Новая роль'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="label text-sm">Название роли</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-sm"
              placeholder="Например: Мафия, Доктор, Шериф"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label text-sm">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field text-sm min-h-[60px]"
              placeholder="Описание роли и её способностей..."
              rows={2}
            />
          </div>

          {/* Team */}
          <div>
            <label className="label text-sm">Команда</label>
            <div className="flex gap-2">
              {TEAM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTeam(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    team === opt.value
                      ? `${opt.color} text-white ring-2 ring-offset-2 ring-offset-background ring-${opt.value === 'red' ? 'red' : opt.value === 'blue' ? 'blue' : 'gray'}-500`
                      : 'bg-background-modifier-hover text-text-secondary hover:bg-background-modifier-active'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="label text-sm">Видимость</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as RoleDefinition['visibility'])}
              className="input-field text-sm"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="label text-sm">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all ${
                    icon === ic
                      ? 'bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                      : 'bg-background-modifier-hover hover:bg-background-modifier-active'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div>
            <label className="label text-sm">Количество игроков с этой ролью</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="input-field text-sm"
              min={1}
              max={100}
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="label text-sm">Права (через запятую)</label>
            <input
              type="text"
              value={permissionsStr}
              onChange={(e) => setPermissionsStr(e.target.value)}
              className="input-field text-sm"
              placeholder="Например: kill, heal, check"
            />
            <p className="text-[10px] text-text-secondary mt-1">
              Права определяют, какие действия доступны игроку с этой ролью
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div>
            {role && onDelete && (
              <button
                onClick={onDelete}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                🗑 Удалить роль
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="btn-primary text-sm disabled:opacity-40"
            >
              {role ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoleManager({ onClose }: RoleManagerProps) {
  const roles = useEditorStore((s) => s.roles);
  const addRole = useEditorStore((s) => s.addRole);
  const updateRole = useEditorStore((s) => s.updateRole);
  const removeRole = useEditorStore((s) => s.removeRole);

  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleCreate = (data: Partial<RoleDefinition> & { id?: string }) => {
    const newRole: RoleDefinition = {
      id: uuidv4(),
      name: data.name || '',
      description: data.description || '',
      team: data.team || 'neutral',
      permissions: data.permissions || [],
      winCondition: data.winCondition || null,
      visibility: data.visibility || 'all',
      icon: data.icon || '👤',
      count: data.count || 1,
    };
    addRole(newRole);
    setShowNewModal(false);
  };

  const handleEdit = (data: Partial<RoleDefinition> & { id?: string }) => {
    if (editingRole && data.id) {
      updateRole(data.id, data);
      setEditingRole(null);
    }
  };

  const handleDelete = () => {
    if (editingRole) {
      removeRole(editingRole.id);
      setEditingRole(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    // Визуальный фидбек через dataTransfer
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    // Переупорядочивание через манипуляцию массивом
    const state = useEditorStore.getState();
    const reordered = [...state.roles];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    // Обновляем через settings.roles
    useEditorStore.setState({
      roles: reordered,
      settings: { ...state.settings, roles: reordered },
      isDirty: true,
    });
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const teamColor = (team: RoleDefinition['team']) => {
    switch (team) {
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'neutral': return 'bg-gray-400';
    }
  };

  const teamLabel = (team: RoleDefinition['team']) => {
    switch (team) {
      case 'red': return '🔴';
      case 'blue': return '🔵';
      case 'neutral': return '⚪';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">👤</span>
              <h2 className="text-base font-semibold text-text-primary">Управление ролями</h2>
              <span className="text-xs text-text-secondary bg-background-modifier-hover px-2 py-0.5 rounded-full">
                {roles.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewModal(true)}
                className="btn-primary text-sm"
              >
                ➕ Добавить роль
              </button>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {roles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-4">👤</span>
                <p className="text-base font-medium text-text-primary mb-1">Роли не настроены</p>
                <p className="text-sm text-text-secondary mb-4">
                  Добавьте роли для создания сложных игр (мафия, RPG, корпоративы)
                </p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="btn-primary text-sm"
                >
                  ➕ Создать первую роль
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Название</div>
                  <div className="col-span-2">Команда</div>
                  <div className="col-span-2">Кол-во</div>
                  <div className="col-span-2">Видимость</div>
                  <div className="col-span-2"></div>
                </div>

                {/* Role rows */}
                {roles.map((role, index) => (
                  <div
                    key={role.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                      dragIndex === index
                        ? 'opacity-50 bg-primary/10 ring-2 ring-primary/30'
                        : 'hover:bg-background-modifier-hover border border-transparent hover:border-border'
                    }`}
                  >
                    {/* Drag handle + Icon */}
                    <div className="col-span-1 flex items-center gap-1">
                      <span className="text-xs text-text-secondary cursor-grab">⠿</span>
                      <span className="text-lg">{role.icon}</span>
                    </div>

                    {/* Name */}
                    <div className="col-span-3">
                      <p className="text-sm font-medium text-text-primary truncate">{role.name}</p>
                      {role.description && (
                        <p className="text-[10px] text-text-secondary truncate">{role.description}</p>
                      )}
                    </div>

                    {/* Team */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white ${teamColor(role.team)}`}>
                        {teamLabel(role.team)} {role.team === 'red' ? 'Красные' : role.team === 'blue' ? 'Синие' : 'Нейтралы'}
                      </span>
                    </div>

                    {/* Count */}
                    <div className="col-span-2">
                      <span className="text-sm font-mono text-text-primary">{role.count}</span>
                    </div>

                    {/* Visibility */}
                    <div className="col-span-2">
                      <span className="text-xs text-text-secondary">
                        {role.visibility === 'all' ? '👁 Все' : role.visibility === 'role_only' ? '👤 Роль' : '🙈 Скрыта'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-1">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="text-xs text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-background-modifier-hover transition-colors"
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeRole(role.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                        title="Удалить"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          {roles.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-background-modifier-hover/50">
              <p className="text-[10px] text-text-secondary">
                💡 Перетаскивайте роли для изменения порядка. Роли опциональны — если не настроены, игра работает как обычно.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Role Modal */}
      {showNewModal && (
        <RoleEditModal
          role={null}
          onSave={handleCreate}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <RoleEditModal
          role={editingRole}
          onSave={handleEdit}
          onDelete={handleDelete}
          onClose={() => setEditingRole(null)}
        />
      )}
    </>
  );
}