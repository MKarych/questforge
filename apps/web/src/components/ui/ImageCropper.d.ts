import 'react-image-crop/dist/ReactCrop.css';
interface ImageCropperProps {
    file: File;
    onCrop: (croppedBlob: Blob) => void;
    onCancel: () => void;
}
export default function ImageCropper({ file, onCrop, onCancel }: ImageCropperProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ImageCropper.d.ts.map