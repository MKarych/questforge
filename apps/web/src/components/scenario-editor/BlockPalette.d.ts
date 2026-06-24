import { BlockType } from '@/types/scenario';
interface BlockPaletteProps {
    onDragStart: (event: React.DragEvent, blockType: BlockType) => void;
    onClick?: (blockType: BlockType) => void;
}
export default function BlockPalette({ onDragStart, onClick }: BlockPaletteProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=BlockPalette.d.ts.map