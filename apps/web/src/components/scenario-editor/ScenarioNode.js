"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const reactflow_1 = require("reactflow");
const ScenarioNode = ({ id, data, selected }) => {
    const hasError = data.validationStatus === 'error';
    const isBlocked = data.validationStatus === 'blocked';
    return (<div className={`
        px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] max-w-[300px]
        transition-all
        ${selected
            ? 'border-primary ring-2 ring-primary/30'
            : hasError
                ? 'border-error ring-2 ring-error/30'
                : isBlocked
                    ? 'border-gray-600 opacity-60'
                    : 'border-border'}
        bg-background hover:shadow-lg transition-shadow
      `}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{data.icon}</span>
        <span className="font-semibold text-text-primary text-sm">{data.label}</span>
        {hasError && (<span className="ml-auto text-error text-xs" title={data.validationMessage || 'Ошибка'}>
            ⚠️
          </span>)}
        {isBlocked && (<span className="ml-auto text-gray-500 text-xs" title="Блок заблокирован">
            🔒
          </span>)}
      </div>
      
      {data.question && (<p className="text-xs text-text-secondary line-clamp-2">
          {data.question}
        </p>)}

      {hasError && data.validationMessage && (<p className="text-[10px] text-error mt-1 line-clamp-1">
          {data.validationMessage}
        </p>)}

      <reactflow_1.Handle type="target" position={reactflow_1.Position.Top} id={`${id}-target`} className="!bg-primary !w-3 !h-3 !border-2 !border-white"/>
      <reactflow_1.Handle type="source" position={reactflow_1.Position.Bottom} id={`${id}-source`} className="!bg-primary !w-3 !h-3 !border-2 !border-white"/>
    </div>);
};
exports.default = (0, react_1.memo)(ScenarioNode);
//# sourceMappingURL=ScenarioNode.js.map