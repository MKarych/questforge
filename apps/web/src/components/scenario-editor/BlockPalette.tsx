import { BLOCK_TYPES, BlockType } from '@/types/scenario';

interface BlockPaletteProps {
  onDragStart: (event: React.DragEvent, blockType: BlockType) => void;
}

export default function BlockPalette({ onDragStart }: BlockPaletteProps) {
  return (
    <div className="w-64 bg-background border-r border-border p-4 overflow-y-auto">
      <h2 className="text-lg font-bold text-text-primary mb-4">🧩 Блоки</h2>
      
      <div className="space-y-2">
        {BLOCK_TYPES.map((block) => (
          <div
            key={block.type}
            draggable
            onDragStart={(event) => onDragStart(event, block)}
            className={`
              p-3 rounded-lg cursor-grab active:cursor-grabbing
              bg-background hover:bg-primary/10 border border-border
              hover:border-primary transition-all
              group
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${block.color} flex items-center justify-center text-xl`}>
                {block.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-text-primary text-sm">{block.label}</div>
                <div className="text-xs text-text-secondary">{block.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-xs text-text-secondary">
          💡 Перетащите блок на холст, чтобы добавить его в сценарий
        </p>
      </div>
    </div>
  );
}
