/**
 * Runtime configuration with environment variable fallbacks.
 * Centralizes all environment-specific values.
 */

// In production: empty string = same-origin (Vercel rewrites proxy to actions-server)
// In development: fall back to localhost:4000 for direct backend access
const _apiUrl = import.meta.env.VITE_ACTIONS_SERVER_URL;
export const API_BASE = (_apiUrl != null && _apiUrl !== "" ? _apiUrl : (import.meta.env.DEV ? "http://localhost:4000" : "")).replace(/\/+$/, "");

// USDC Mint Address (Devnet default if not specified)
export const USDC_MINT = import.meta.env.VITE_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
