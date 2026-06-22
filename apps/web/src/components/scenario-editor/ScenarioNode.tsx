import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ScenarioNodeData } from '@/types/scenario';

const ScenarioNode = ({ data, selected }: NodeProps<ScenarioNodeData>) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] max-w-[300px]
        ${selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'}
        bg-background hover:shadow-lg transition-shadow
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{data.icon}</span>
        <span className="font-semibold text-text-primary text-sm">{data.label}</span>
      </div>
      
      {data.question && (
        <p className="text-xs text-text-secondary line-clamp-2">
          {data.question}
        </p>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(ScenarioNode);
