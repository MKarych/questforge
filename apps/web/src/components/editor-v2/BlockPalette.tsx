'use client';

import { useState, useMemo } from 'react';
import { BLOCK_CATEGORIES, BlockDefinition } from '@/lib/editor-store/editor.types';

interface BlockPaletteProps {
  onDragStart: (event: React.DragEvent, block: BlockDefinition) => void;
  onClick?: (block: BlockDefinition) => void;
}

export default function BlockPalette({ onDragStart, onClick }: BlockPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return BLOCK_CATEGORIES;
    }

    const query = searchQuery.toLowerCase().trim();
    return BLOCK_CATEGORIES.map((cat) => ({
      ...cat,
      blocks: cat.blocks.filter(
        (block) =>
          block.label.toLowerCase().includes(query) ||
          block.description.toLowerCase().includes(query) ||
          block.type.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.blocks.length > 0);
  }, [searchQuery]);

  return (
    <div className="w-[180px] bg-background border-r border-border flex flex-col">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Поиск..."
            className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-md
              focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary
              text-text-primary placeholder-text-secondary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filteredCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 px-0.5">
              {category.name}
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {category.blocks.map((block) => (
                <div
                  key={`${block.type}-${block.label}`}
                  draggable={!block.experimental}
                  onDragStart={(event) => {
                    if (!block.experimental) onDragStart(event, block);
                  }}
                  onClick={() => {
                    if (!block.experimental && onClick) onClick(block);
                  }}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg
                    cursor-grab active:cursor-grabbing transition-all group
                    ${block.experimental
                      ? 'opacity-30 cursor-not-allowed bg-background border border-border'
                      : 'bg-background hover:bg-primary/10 border border-border hover:border-primary/50'
                    }
                  `}
                  title={block.description}
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm ${block.experimental ? '' : block.color}`}>
                    {block.icon}
                  </div>
                  <span className={`text-[10px] leading-tight text-center truncate w-full ${block.experimental ? 'text-text-secondary' : 'text-text-primary'}`}>
                    {block.label}
                  </span>
                  {block.experimental && (
                    <span className="text-[8px] text-text-secondary bg-surface px-1 rounded">
                      Скоро
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-6 text-text-secondary text-xs">
            Блоки не найдены
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border">
        <p className="text-[10px] text-text-secondary text-center">
          💡 Перетащи на холст
        </p>
      </div>
    </div>
  );
}