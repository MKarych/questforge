"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUser = useUser;
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
function useUser() {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const refresh = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await (0, client_1.getProfile)();
            setUser(response.data);
        }
        catch (err) {
            setUser(null);
            setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
        }
        finally {
            setLoading(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
            refresh();
        }
        else {
            setLoading(false);
        }
    }, [refresh]);
    const updateProfile = (0, react_1.useCallback)(async (data) => {
        await client_1.apiClient.patch('/users/me', data);
        await refresh();
    }, [refresh]);
    const updateAvatar = (0, react_1.useCallback)(async (avatarUrl) => {
        await client_1.apiClient.post('/users/me/avatar', { avatarUrl });
        await refresh();
    }, [refresh]);
    const deleteAvatar = (0, react_1.useCallback)(async () => {
        await client_1.apiClient.delete('/users/me/avatar');
        await refresh();
    }, [refresh]);
    return {
        user,
        loading,
        error,
        refresh,
        updateProfile,
        updateAvatar,
        deleteAvatar,
        isAuthenticated: !!user,
    };
}
//# sourceMappingURL=useUser.js.map