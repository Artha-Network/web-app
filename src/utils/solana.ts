const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function isValidSolanaAddress(addr: string): boolean {
  if (typeof addr !== "string") return false;
  if (addr.length < 32 || addr.length > 44) return false;
  return BASE58_REGEX.test(addr);
}

