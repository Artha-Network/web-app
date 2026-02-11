import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '@/lib/config';

interface User {
    wallet: string;
    id?: string;
    name?: string;
    displayName?: string;
    emailAddress?: string;
    profileComplete?: boolean;
    isNewUser?: boolean; // true if user doesn't exist in database yet
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    error: string | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { publicKey, signMessage, disconnect, connected } = useWallet();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authAttempted, setAuthAttempted] = useState(false);

    const clearError = useCallback(() => setError(null), []);

    // Check existing session on mount
    const checkSession = useCallback(async (controller: AbortController, isCancelled: () => boolean) => {
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch(`${API_BASE}/api/session/me`, { credentials: 'include', signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                if (!isCancelled()) {
                    setIsAuthenticated(true);
                    // User object may include: wallet, id, name, displayName, emailAddress, profileComplete, isNewUser
                    setUser({
                        wallet: data.user.wallet,
                        id: data.user.id,
                        name: data.user.name || data.user.displayName,
                        displayName: data.user.displayName,
                        emailAddress: data.user.emailAddress,
                        profileComplete: data.user.profileComplete,
                        isNewUser: data.user.isNewUser,
                    });
                }
            } else {
                if (!isCancelled()) {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
        } catch (err) {
            if (!isCancelled()) {
                console.error('Session check failed', err);
                setIsAuthenticated(false);
            }
        } finally {
            clearTimeout(timeout);
            if (!isCancelled()) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        checkSession(controller, () => cancelled);

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [checkSession]);

    // Reset auth attempt when wallet disconnects
    useEffect(() => {
        if (!connected) {
            // Clear local state
            setAuthAttempted(false);
            setIsAuthenticated(false);
            setUser(null);
            setError(null);

            // Clear backend session to prevent stale session access
            fetch(`${API_BASE}/api/session/logout`, {
                method: 'POST',
                credentials: 'include'
            }).catch(err => {
                console.error('Failed to clear session on wallet disconnect:', err);
                // Continue anyway - local state is already cleared
            });
        }
    }, [connected]);

    const login = async () => {
        if (!publicKey || !signMessage) return;

        setIsLoading(true);
        setError(null);
        try {
            // 1. Get Challenge
            const challengeRes = await fetch(`${API_BASE}/api/session/challenge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: publicKey.toBase58() })
            });

            if (!challengeRes.ok) throw new Error('Failed to get challenge');
            const { challenge } = await challengeRes.json();

            // 2. Sign Message
            const message = new TextEncoder().encode(challenge);
            const signature = await signMessage(message);

            // 3. Verify Signature
            const verifyRes = await fetch(`${API_BASE}/api/session/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    wallet: publicKey.toBase58(),
                    signature: Array.from(signature)
                })
            });

            if (!verifyRes.ok) throw new Error('Verification failed');

            const data = await verifyRes.json();
            setIsAuthenticated(true);
            // User object may include: wallet, id, name, displayName, emailAddress, profileComplete, isNewUser
            setUser({
                wallet: data.user.wallet,
                id: data.user.id,
                name: data.user.name || data.user.displayName,
                displayName: data.user.displayName,
                emailAddress: data.user.emailAddress,
                profileComplete: data.user.profileComplete,
                isNewUser: data.user.isNewUser,
            });

        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Authentication failed');
            disconnect();
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE}/api/session/logout`, { method: 'POST', credentials: 'include' });
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            setError(null);
            disconnect();
        }
    };

    const refreshUser = useCallback(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch(`${API_BASE}/api/session/me`, { credentials: 'include', signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setIsAuthenticated(true);
                setUser({
                    wallet: data.user.wallet,
                    id: data.user.id,
                    name: data.user.name || data.user.displayName,
                    displayName: data.user.displayName,
                    emailAddress: data.user.emailAddress,
                    profileComplete: data.user.profileComplete,
                    isNewUser: data.user.isNewUser,
                });
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
        } finally {
            clearTimeout(timeout);
        }
    }, []);

    // Auto-trigger login if wallet connected but not authenticated and hasn't tried yet
    useEffect(() => {
        if (connected && !isAuthenticated && !isLoading && !authAttempted && publicKey && signMessage) {
            setAuthAttempted(true);
            login();
        }
    }, [connected, isAuthenticated, isLoading, authAttempted, publicKey, signMessage, login]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, error, login, logout, clearError, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
