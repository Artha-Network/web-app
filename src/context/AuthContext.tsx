import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { API_BASE } from '@/lib/config';

interface User {
    wallet: string;
    id?: string;
    name?: string;
    displayName?: string;
    emailAddress?: string;
    profileComplete?: boolean;
    isNewUser?: boolean;
    reputationScore?: number;
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

const APP_NAME = 'Artha Network';

function generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function createCanonicalMessage(nonce: string, timestamp: number): string {
    return JSON.stringify({
        app: APP_NAME,
        action: "session_confirm",
        nonce,
        ts: timestamp
    });
}

function parseUserFromResponse(data: any): User {
    const profileComplete = !!(data.user.displayName && data.user.emailAddress);
    return {
        wallet: data.user.walletAddress,
        id: data.user.id,
        name: data.user.displayName,
        displayName: data.user.displayName,
        emailAddress: data.user.emailAddress,
        profileComplete: data.user.profileComplete ?? profileComplete,
        isNewUser: data.user.isNewUser ?? !profileComplete,
        reputationScore: parseFloat(data.user.reputationScore) || 0,
    };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { publicKey, signMessage, disconnect, connected } = useWallet();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authAttempted, setAuthAttempted] = useState(false);
    const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastActivityHeartbeatRef = useRef(0);

    const clearError = useCallback(() => setError(null), []);

    const sendHeartbeat = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/auth/keepalive`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Heartbeat failed:', err);
            setIsAuthenticated(false);
            setUser(null);
        }
    }, []);

    // Heartbeat: interval every 5 min + throttled activity listener (max once per 60s)
    useEffect(() => {
        if (isAuthenticated) {
            heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);

            const handleActivity = () => {
                const now = Date.now();
                if (now - lastActivityHeartbeatRef.current < 60_000) return;
                lastActivityHeartbeatRef.current = now;
                sendHeartbeat();
            };
            window.addEventListener('mousedown', handleActivity);
            window.addEventListener('keydown', handleActivity);

            return () => {
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
                window.removeEventListener('mousedown', handleActivity);
                window.removeEventListener('keydown', handleActivity);
            };
        } else {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
        }
    }, [isAuthenticated, sendHeartbeat]);

    // Check existing session on mount
    const checkSession = useCallback(async (controller: AbortController, isCancelled: () => boolean) => {
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include', signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                if (!isCancelled()) {
                    setIsAuthenticated(true);
                    setUser(parseUserFromResponse(data));
                }
            } else if (!isCancelled()) {
                setIsAuthenticated(false);
                setUser(null);
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
        return () => { cancelled = true; controller.abort(); };
    }, [checkSession]);

    // Clear state when wallet disconnects
    useEffect(() => {
        if (!connected) {
            setAuthAttempted(false);
            setIsAuthenticated(false);
            setUser(null);
            setError(null);

            fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            }).catch(() => {
                // Best-effort — local state is already cleared
            });
        }
    }, [connected]);

    const login = useCallback(async () => {
        if (!publicKey || !signMessage) return;

        setIsLoading(true);
        setError(null);
        try {
            const nonce = generateNonce();
            const timestamp = Date.now();
            const message = createCanonicalMessage(nonce, timestamp);

            const messageBytes = new TextEncoder().encode(message);
            const signature = await signMessage(messageBytes);

            const signInRes = await fetch(`${API_BASE}/auth/sign-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    pubkey: publicKey.toBase58(),
                    message,
                    signature: Array.from(signature)
                })
            });

            if (!signInRes.ok) {
                const errorData = await signInRes.json().catch(() => ({ error: 'Authentication failed' }));
                throw new Error(errorData.error || 'Authentication failed');
            }

            const data = await signInRes.json();
            setIsAuthenticated(true);
            setUser(parseUserFromResponse(data));
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Authentication failed');
            disconnect();
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, signMessage, disconnect]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            setError(null);
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
            disconnect();
        }
    }, [disconnect]);

    const refreshUser = useCallback(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include', signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setIsAuthenticated(true);
                setUser(parseUserFromResponse(data));
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            clearTimeout(timeout);
        }
    }, []);

    // Auto-trigger login when wallet connects but user is not yet authenticated
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
