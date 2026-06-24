import { type User } from '@/lib/api/client';
interface UseUserReturn {
    user: User | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    updateProfile: (data: Record<string, unknown>) => Promise<void>;
    updateAvatar: (avatarUrl: string) => Promise<void>;
    deleteAvatar: () => Promise<void>;
    isAuthenticated: boolean;
}
export declare function useUser(): UseUserReturn;
export {};
//# sourceMappingURL=useUser.d.ts.map