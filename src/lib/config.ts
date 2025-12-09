/**
 * Runtime configuration with environment variable fallbacks.
 * Centralizes all environment-specific values.
 */

export const API_BASE = import.meta.env.VITE_ACTIONS_SERVER_URL || "http://localhost:4000";
export const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC || "https://api.devnet.solana.com";

// USDC Mint Address (Devnet default if not specified)
export const USDC_MINT = import.meta.env.VITE_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const APP_CONFIG = {
    API_BASE,
    SOLANA_RPC,
    USDC_MINT,
} as const;
