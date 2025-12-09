/**
 * Common formatting utilities
 */

export const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

export const formatUsd = (value?: string | number) => {
    const parsed = Number(value ?? 0);
    return `$${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getExplorerUrl = (txSig: string, cluster: string = import.meta.env.VITE_SOLANA_CLUSTER || 'custom') => {
    return `https://explorer.solana.com/tx/${txSig}?cluster=${cluster}`;
};

export const shortAddress = (value?: string | null) => {
    if (!value) return "—";
    return `${value.slice(0, 4)}…${value.slice(-4)}`;
};
