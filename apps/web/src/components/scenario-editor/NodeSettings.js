"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NodeSettings;
const react_1 = require("react");
function NodeSettings({ node, allNodes, onUpdate, onDelete, onClose }) {
    const [data, setData] = (0, react_1.useState)({
        label: '',
        question: '',
    });
    (0, react_1.useEffect)(() => {
        if (node?.data) {
            setData(node.data);
        }
    }, [node]);
    if (!node)
        return null;
    const handleChange = (field, value) => {
        const newData = { ...data, [field]: value };
        setData(newData);
        onUpdate(node.id, newData);
    };
    const nodeTypeLabels = {
        START: '🚀 Старт',
        FINISH: '🏁 Финиш',
        TEXT: '📝 Текст',
        CODE: '🔢 Код',
        PHOTO: '📷 Фото',
        GPS: '📍 GPS',
        QR: '📱 QR',
        CHOICE: '🎯 Выбор',
        TIMER: '⏱ Таймер',
        BRANCH: '🔀 Ветвление',
        NPC: '🗣 NPC',
        AR: '🧩 AR',
    };
    const renderCommonFields = () => (<>
      {/* Label */}
      <div>
        <label className="label text-sm">Заголовок блока</label>
        <input type="text" value={data.label || ''} onChange={(e) => handleChange('label', e.target.value)} className="input-field text-sm" placeholder="Название блока"/>
      </div>

      {/* Question (for most node types) */}
      {node.type !== 'START' && node.type !== 'FINISH' && (<>
          <div>
            <label className="label text-sm">Текст задания</label>
            <textarea value={data.question || ''} onChange={(e) => handleChange('question', e.target.value)} className="input-field text-sm min-h-[80px]" placeholder="Опишите задание для участников..." rows={3}/>
          </div>

          {/* Hint */}
          <div>
            <label className="label text-sm">Подсказка</label>
            <textarea value={data.hint || ''} onChange={(e) => handleChange('hint', e.target.value)} className="input-field text-sm" placeholder="Подсказка для игроков (опционально)" rows={2}/>
          </div>

          {/* Points and Penalty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-sm">Очки за задание</label>
              <input type="number" value={data.points ?? 10} onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)} className="input-field text-sm"/>
            </div>
            <div>
              <label className="label text-sm">Штраф за ошибку</label>
              <input type="number" value={data.penalty ?? 0} onChange={(e) => handleChange('penalty', parseInt(e.target.value) || 0)} className="input-field text-sm"/>
            </div>
          </div>
        </>)}
    </>);
    const renderTEXTFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Правильный ответ</label>
        <input type="text" value={data.textAnswer || ''} onChange={(e) => handleChange('textAnswer', e.target.value)} className="input-field text-sm" placeholder="Введите правильный текстовый ответ"/>
      </div>
    </div>);
    const renderCODEFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Правильный код</label>
        <input type="text" value={data.code || ''} onChange={(e) => handleChange('code', e.target.value)} className="input-field text-sm" placeholder="Введите правильный код"/>
      </div>
      <div>
        <label className="label text-sm">Количество попыток</label>
        <input type="number" value={data.attempts ?? 3} onChange={(e) => handleChange('attempts', parseInt(e.target.value) || 1)} className="input-field text-sm" min={1}/>
      </div>
    </div>);
    const renderPHOTOFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Требования к фото</label>
        <textarea value={data.photoRequirements || ''} onChange={(e) => handleChange('photoRequirements', e.target.value)} className="input-field text-sm min-h-[60px]" placeholder="Опишите, какое фото нужно сделать..." rows={2}/>
      </div>
    </div>);
    const renderGPSFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Широта (lat)</label>
        <input type="number" value={data.coordinates?.lat ?? 0} onChange={(e) => handleChange('coordinates', {
            lat: parseFloat(e.target.value) || 0,
            lng: data.coordinates?.lng ?? 0,
        })} className="input-field text-sm" step="0.000001"/>
      </div>
      <div>
        <label className="label text-sm">Долгота (lng)</label>
        <input type="number" value={data.coordinates?.lng ?? 0} onChange={(e) => handleChange('coordinates', {
            lat: data.coordinates?.lat ?? 0,
            lng: parseFloat(e.target.value) || 0,
        })} className="input-field text-sm" step="0.000001"/>
      </div>
      <div>
        <label className="label text-sm">Радиус (метры)</label>
        <input type="number" value={data.radius ?? 50} onChange={(e) => handleChange('radius', parseInt(e.target.value) || 10)} className="input-field text-sm" min={1}/>
      </div>
      <div className="p-3 bg-primary/10 rounded text-xs text-text-secondary">
        ⚠️ Для GPS-заданий требуется доступ к геолокации игрока
      </div>
    </div>);
    const renderQRFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Данные QR-кода</label>
        <input type="text" value={data.qrData || ''} onChange={(e) => handleChange('qrData', e.target.value)} className="input-field text-sm" placeholder="Введите данные, которые будет сканировать QR-код"/>
      </div>
    </div>);
    const renderCHOICEFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Варианты ответов</label>
        <div className="space-y-2">
          {(data.options ?? []).map((option, index) => (<div key={index} className="flex gap-2 items-center">
              <input type="radio" name="correctOption" checked={data.correctOption === index} onChange={() => handleChange('correctOption', index)} className="accent-primary"/>
              <input type="text" value={option} onChange={(e) => {
                const newOptions = [...(data.options ?? [])];
                newOptions[index] = e.target.value;
                handleChange('options', newOptions);
            }} className="input-field text-sm flex-1" placeholder={`Вариант ${index + 1}`}/>
              <button type="button" onClick={() => {
                const newOptions = (data.options ?? []).filter((_, i) => i !== index);
                const newCorrectOption = data.correctOption ?? 0;
                const newCorrect = newCorrectOption >= newOptions.length ? newOptions.length - 1 : newCorrectOption;
                handleChange('options', newOptions);
                if (newOptions.length > 0)
                    handleChange('correctOption', newCorrect);
            }} className="text-error hover:text-error/80 text-xl">
                ×
              </button>
            </div>))}
          <button type="button" onClick={() => handleChange('options', [...(data.options ?? []), ''])} className="btn-secondary text-sm w-full">
            + Добавить вариант
          </button>
        </div>
      </div>
    </div>);
    const renderTIMERFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Длительность (секунды)</label>
        <input type="number" value={data.duration ?? 60} onChange={(e) => handleChange('duration', parseInt(e.target.value) || 10)} className="input-field text-sm" min={1}/>
      </div>
      <div className="p-3 bg-primary/10 rounded text-xs text-text-secondary">
        ⏱ Таймер ограничивает время прохождения этого задания
      </div>
    </div>);
    const renderBRANCHFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Ветки переходов</label>
        <div className="space-y-2">
          {(data.branches ?? []).map((branch, index) => (<div key={index} className="flex gap-2">
              <input type="text" value={branch.label} onChange={(e) => {
                const newBranches = [...(data.branches ?? [])];
                newBranches[index] = { ...branch, label: e.target.value };
                handleChange('branches', newBranches);
            }} className="input-field text-sm flex-1" placeholder={`Метка ветки ${index + 1}`}/>
              <input type="text" value={branch.target} onChange={(e) => {
                const newBranches = [...(data.branches ?? [])];
                newBranches[index] = { ...branch, target: e.target.value };
                handleChange('branches', newBranches);
            }} className="input-field text-sm w-32" placeholder="ID узла"/>
              <button type="button" onClick={() => {
                const newBranches = (data.branches ?? []).filter((_, i) => i !== index);
                handleChange('branches', newBranches);
            }} className="text-error hover:text-error/80">
                ×
              </button>
            </div>))}
          <button type="button" onClick={() => handleChange('branches', [...(data.branches ?? []), { label: 'Далее', target: '' }])} className="btn-secondary text-sm w-full">
            + Добавить ветку
          </button>
        </div>
      </div>
    </div>);
    const renderNPCFields = () => (<div className="space-y-4">
      <div>
        <label className="label text-sm">Имя персонажа</label>
        <input type="text" value={data.npcName || ''} onChange={(e) => handleChange('npcName', e.target.value)} className="input-field text-sm" placeholder="Имя NPC"/>
      </div>
      <div>
        <label className="label text-sm">Описание персонажа</label>
        <textarea value={data.npcDescription || ''} onChange={(e) => handleChange('npcDescription', e.target.value)} className="input-field text-sm min-h-[60px]" placeholder="Внешность, характер персонажа..." rows={2}/>
      </div>
      <div>
        <label className="label text-sm">Диалоги</label>
        <div className="space-y-3">
          {(data.npcDialogues ?? []).map((dialogue, index) => (<div key={index} className="p-3 bg-background/50 rounded border border-border">
              <div className="flex gap-2 mb-2">
                <input type="text" value={dialogue.npcText} onChange={(e) => {
                const newDialogues = [...(data.npcDialogues ?? [])];
                newDialogues[index] = { ...dialogue, npcText: e.target.value };
                handleChange('npcDialogues', newDialogues);
            }} className="input-field text-sm flex-1" placeholder={`Реплика NPC ${index + 1}`}/>
                <button type="button" onClick={() => {
                const newDialogues = (data.npcDialogues ?? []).filter((_, i) => i !== index);
                handleChange('npcDialogues', newDialogues);
            }} className="text-error hover:text-error/80">
                  ×
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Варианты ответов:</label>
                {(dialogue.options ?? []).map((option, optIndex) => (<div key={optIndex} className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <input type="text" value={option.text} onChange={(e) => {
                    const newDialogues = [...(data.npcDialogues ?? [])];
                    const newOptions = [...(dialogue.options ?? [])];
                    newOptions[optIndex] = { ...option, text: e.target.value };
                    newDialogues[index] = { ...dialogue, options: newOptions };
                    handleChange('npcDialogues', newDialogues);
                }} className="input-field text-sm flex-1" placeholder={`Ответ ${optIndex + 1}`}/>
                      <button type="button" onClick={() => {
                    const newDialogues = [...(data.npcDialogues ?? [])];
                    const newOptions = (dialogue.options ?? []).filter((_, i) => i !== optIndex);
                    newDialogues[index] = { ...dialogue, options: newOptions };
                    handleChange('npcDialogues', newDialogues);
                }} className="text-error hover:text-error/80 text-lg">
                        ×
                      </button>
                    </div>
                    <select value={option.target} onChange={(e) => {
                    const newDialogues = [...(data.npcDialogues ?? [])];
                    const newOptions = [...(dialogue.options ?? [])];
                    newOptions[optIndex] = { ...option, target: e.target.value };
                    newDialogues[index] = { ...dialogue, options: newOptions };
                    handleChange('npcDialogues', newDialogues);
                }} className="input-field text-xs w-full">
                      <option value="">— Выберите следующий узел —</option>
                      {availableTargetNodes.map((n) => (<option key={n.id} value={n.id}>
                          {n.data.icon} {n.data.label} ({n.id.slice(0, 8)}...)
                        </option>))}
                    </select>
                  </div>))}
                <button type="button" onClick={() => {
                const newDialogues = [...(data.npcDialogues ?? [])];
                newDialogues[index] = {
                    ...dialogue,
                    options: [...(dialogue.options ?? []), { text: '', target: '' }],
                };
                handleChange('npcDialogues', newDialogues);
            }} className="btn-secondary text-xs w-full mt-1">
                  + Добавить ответ
                </button>
              </div>
            </div>))}
          <button type="button" onClick={() => handleChange('npcDialogues', [
            ...(data.npcDialogues ?? []),
            { npcText: '', options: [{ text: '', target: '' }] },
        ])} className="btn-secondary text-sm w-full">
            + Добавить реплику NPC
          </button>
        </div>
      </div>
    </div>);
    // Generate list of available target nodes (excluding current node and FINISH for non-NPC)
    const availableTargetNodes = (0, react_1.useMemo)(() => {
        return allNodes.filter((n) => n.id !== node?.id);
    }, [allNodes, node?.id]);
    return (<div className="w-80 bg-background border-l border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text-primary truncate">
            Настройки: {nodeTypeLabels[node.type]}
          </h2>
          <p className="text-xs text-text-secondary font-mono truncate">
            ID: {node.id}
          </p>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl ml-2 shrink-0">
          ×
        </button>
      </div>

      <div className="space-y-4">
        {renderCommonFields()}

        {node.type === 'TEXT' && renderTEXTFields()}
        {node.type === 'CODE' && renderCODEFields()}
        {node.type === 'PHOTO' && renderPHOTOFields()}
        {node.type === 'GPS' && renderGPSFields()}
        {node.type === 'QR' && renderQRFields()}
        {node.type === 'CHOICE' && renderCHOICEFields()}
        {node.type === 'TIMER' && renderTIMERFields()}
        {node.type === 'BRANCH' && renderBRANCHFields()}
        {node.type === 'NPC' && renderNPCFields()}

        {/* Delete button */}
        {node.type !== 'START' && node.type !== 'FINISH' && (<div className="pt-4 border-t border-border">
            <button onClick={() => onDelete(node.id)} className="btn-error w-full">
              🗑 Удалить блок
            </button>
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=NodeSettings.js.map