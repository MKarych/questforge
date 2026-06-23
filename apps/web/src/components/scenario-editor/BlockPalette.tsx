import { useState, useMemo } from 'react';
import { BLOCK_TYPES, BLOCK_CATEGORIES, BlockType, NodeType } from '@/types/scenario';

interface BlockPaletteProps {
  onDragStart: (event: React.DragEvent, blockType: BlockType) => void;
  onClick?: (blockType: BlockType) => void;
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
      blocks: cat.blocks.filter((type) => {
        const block = BLOCK_TYPES.find((b) => b.type === type);
        if (!block) return false;
        return (
          block.label.toLowerCase().includes(query) ||
          block.description.toLowerCase().includes(query) ||
          block.type.toLowerCase().includes(query)
        );
      }),
    })).filter((cat) => cat.blocks.length > 0);
  }, [searchQuery]);

  const isARBlock = (type: NodeType) => type === 'AR';

  return (
    <div className="w-64 bg-background border-r border-border p-4 overflow-y-auto flex flex-col">
      <h2 className="text-lg font-bold text-text-primary mb-3">🧩 Блоки</h2>

      {/* Search field */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Поиск блоков..."
          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            text-text-primary placeholder-text-secondary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {filteredCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.blocks.map((type) => {
                const block = BLOCK_TYPES.find((b) => b.type === type);
                if (!block) return null;
                const isDisabled = isARBlock(type);

                return (
                  <div
                    key={block.type}
                    draggable={!isDisabled}
                    onDragStart={(event) => {
                      if (!isDisabled) onDragStart(event, block);
                    }}
                    onClick={() => {
                      if (!isDisabled && onClick) onClick(block);
                    }}
                    className={`
                      p-3 rounded-lg cursor-grab active:cursor-grabbing
                      transition-all group
                      ${isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-background border border-border'
                        : 'bg-background hover:bg-primary/10 border border-border hover:border-primary'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-xl
                        ${isDisabled ? 'bg-gray-700' : block.color}
                      `}>
                        {block.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${isDisabled ? 'text-text-secondary' : 'text-text-primary'}`}>
                            {block.label}
                          </span>
                          {isDisabled && (
                            <span className="text-[10px] text-text-secondary bg-surface px-1.5 py-0.5 rounded">
                              Скоро
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-secondary truncate">
                          {block.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-text-secondary text-sm">
            Блоки не найдены
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-text-secondary text-center">
          💡 Перетащите блок на холст, чтобы добавить его в сценарий
        </p>
      </div>
    </div>
  );
}
