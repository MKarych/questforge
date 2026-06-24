"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ImageModal;
const react_1 = require("react");
function ImageModal({ src, alt, onClose }) {
    const [scale, setScale] = (0, react_1.useState)(1);
    const [position, setPosition] = (0, react_1.useState)({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = (0, react_1.useState)(false);
    const [dragStart, setDragStart] = (0, react_1.useState)({ x: 0, y: 0 });
    const imageRef = (0, react_1.useRef)(null);
    // Закрытие по Escape
    (0, react_1.useEffect)(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    // Зум колесиком мыши
    const handleWheel = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => {
            const next = Math.max(0.25, Math.min(10, prev + delta));
            return next;
        });
    }, []);
    // Перетаскивание изображения при зуме
    const handleMouseDown = (0, react_1.useCallback)((e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    }, [scale, position]);
    const handleMouseMove = (0, react_1.useCallback)((e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    }, [isDragging, dragStart]);
    const handleMouseUp = (0, react_1.useCallback)(() => {
        setIsDragging(false);
    }, []);
    // Сброс зума при двойном клике
    const handleDoubleClick = (0, react_1.useCallback)(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);
    // Закрытие по клику на backdrop (не на картинке)
    const handleBackdropClick = (0, react_1.useCallback)((e) => {
        if (e.target === e.currentTarget)
            onClose();
    }, [onClose]);
    return (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackdropClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Кнопка закрытия */}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Закрыть">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      {/* Индикатор зума */}
      {scale !== 1 && (<div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
          {Math.round(scale * 100)}%
        </div>)}

      {/* Изображение */}
      <div className="select-none" style={{
            maxWidth: '95vw',
            maxHeight: '95vh',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={src} alt={alt} draggable={false} onWheel={handleWheel} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick} className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-shadow duration-200" style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
        }}/>
      </div>
    </div>);
}
//# sourceMappingURL=ImageModal.js.map