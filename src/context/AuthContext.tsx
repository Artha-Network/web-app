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

const APP_NAME = 'Artha Network';

// Helper: Generate nonce
function generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper: Create canonical message
function createCanonicalMessage(nonce: string, timestamp: number): string {
    return JSON.stringify({
        app: APP_NAME,
        action: "session_confirm",
        nonce,
        ts: timestamp
    });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { publicKey, signMessage, disconnect, connected } = useWallet();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authAttempted, setAuthAttempted] = useState(false);
    const heartbeatIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const clearError = useCallback(() => setError(null), []);

    // Heartbeat function to keep session alive
    const sendHeartbeat = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/auth/keepalive`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Heartbeat failed:', err);
            // If heartbeat fails, session might be expired
            setIsAuthenticated(false);
            setUser(null);
        }
    }, []);

    // Setup heartbeat interval when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // Send heartbeat every 5 minutes (300 seconds)
            heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);
            // Also send heartbeat on user activity
            const handleActivity = () => {
                sendHeartbeat();
            };
            window.addEventListener('mousedown', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('scroll', handleActivity);

            return () => {
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                }
                window.removeEventListener('mousedown', handleActivity);
                window.removeEventListener('keydown', handleActivity);
                window.removeEventListener('scroll', handleActivity);
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
                    setUser({
                        wallet: data.user.walletAddress,
                        id: data.user.id,
                        name: data.user.displayName,
                        displayName: data.user.displayName,
                        emailAddress: data.user.emailAddress,
                        profileComplete: data.user.profileComplete,
                        isNewUser: data.user.isNewUser ?? !data.user.profileComplete, // New if profile incomplete
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
            // 1. Create canonical message
            const nonce = generateNonce();
            const timestamp = Date.now();
            const message = createCanonicalMessage(nonce, timestamp);

            // 2. Sign Message
            const messageBytes = new TextEncoder().encode(message);
            const signature = await signMessage(messageBytes);

            // 3. Send to sign-in endpoint
            const signInRes = await fetch(`${API_BASE}/auth/sign-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    pubkey: publicKey.toBase58(),
                    message: message,
                    signature: Array.from(signature)
                })
            });

            if (!signInRes.ok) {
                const errorData = await signInRes.json().catch(() => ({ error: 'Authentication failed' }));
                throw new Error(errorData.error || 'Authentication failed');
            }

            const data = await signInRes.json();
            setIsAuthenticated(true);
            const profileComplete = !!(data.user.displayName && data.user.emailAddress);
            setUser({
                wallet: data.user.walletAddress,
                id: data.user.id,
                name: data.user.displayName,
                displayName: data.user.displayName,
                emailAddress: data.user.emailAddress,
                profileComplete,
                isNewUser: !profileComplete, // New if profile incomplete
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
    };

    const refreshUser = useCallback(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include', signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setIsAuthenticated(true);
                setUser({
                    wallet: data.user.walletAddress,
                    id: data.user.id,
                    name: data.user.displayName,
                    displayName: data.user.displayName,
                    emailAddress: data.user.emailAddress,
                    profileComplete: data.user.profileComplete,
                    isNewUser: data.user.isNewUser ?? !data.user.profileComplete, // New if profile incomplete
                });
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
