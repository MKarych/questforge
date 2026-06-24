"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ImageCropper;
const react_1 = require("react");
const react_image_crop_1 = __importStar(require("react-image-crop"));
require("react-image-crop/dist/ReactCrop.css");
function centerAspectCrop(mediaWidth, mediaHeight) {
    return (0, react_image_crop_1.centerCrop)((0, react_image_crop_1.makeAspectCrop)({ unit: '%', width: 100 }, 1 / 1, // square aspect ratio
    mediaWidth, mediaHeight), mediaWidth, mediaHeight);
}
function ImageCropper({ file, onCrop, onCancel }) {
    const [imgSrc, setImgSrc] = (0, react_1.useState)(null);
    const [crop, setCrop] = (0, react_1.useState)();
    const [completedCrop, setCompletedCrop] = (0, react_1.useState)(null);
    const imgRef = (0, react_1.useRef)(null);
    // Load image on mount
    (0, react_1.useState)(() => {
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result));
        reader.readAsDataURL(file);
    });
    const onImageLoad = (0, react_1.useCallback)((e) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height));
    }, []);
    const handleSave = (0, react_1.useCallback)(async () => {
        if (!completedCrop || !imgRef.current)
            return;
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const pixelCrop = {
            x: completedCrop.x * scaleX,
            y: completedCrop.y * scaleY,
            width: completedCrop.width * scaleX,
            height: completedCrop.height * scaleY,
        };
        // Output size — 256x256 для аватара
        const outputSize = 256;
        canvas.width = outputSize;
        canvas.height = outputSize;
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputSize, outputSize);
        canvas.toBlob((blob) => {
            if (blob) {
                onCrop(blob);
            }
        }, 'image/jpeg', 0.9);
    }, [completedCrop, onCrop]);
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-surface rounded-xl p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Обрезка фото
        </h3>

        <div className="flex justify-center mb-4 max-h-[400px] overflow-hidden rounded-lg">
          {imgSrc && (<react_image_crop_1.default crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={1 / 1} circularCrop minWidth={50}>
              <img ref={imgRef} src={imgSrc} alt="Crop preview" onLoad={onImageLoad} className="max-h-[400px] w-auto"/>
            </react_image_crop_1.default>)}
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} className="btn-primary text-sm px-6 py-2">
            Сохранить
          </button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=ImageCropper.js.map