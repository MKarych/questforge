interface AvatarUploadProps {
    currentAvatar: string | null;
    onUpload: (file: File) => Promise<void>;
    onDelete: () => Promise<void>;
    uploading?: boolean;
}
export default function AvatarUpload({ currentAvatar, onUpload, onDelete }: AvatarUploadProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=AvatarUpload.d.ts.map