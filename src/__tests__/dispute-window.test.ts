import { describe, it, expect } from "vitest";

/**
 * Dispute window calculation extracted from Step3.tsx.
 * Vehicle deals (vin present) get 5-day window.
 * Non-vehicle deals get 7-day window.
 */
function calculateDisputeDeadline(
  completionDeadline: string | undefined,
  vin: string | undefined
): number | undefined {
  if (!completionDeadline) return undefined;
  const DISPUTE_WINDOW_DAYS = vin ? 5 : 7;
  return (
    Math.floor(new Date(completionDeadline).getTime() / 1000) +
    DISPUTE_WINDOW_DAYS * 24 * 60 * 60
  );
}

describe("Dispute window calculation", () => {
  const deadline = "2026-04-15T12:00:00Z";
  const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);

  it("uses 5-day window for vehicle deals (VIN present)", () => {
    const result = calculateDisputeDeadline(deadline, "1HGBH41JXMN109186");
    expect(result).toBe(deadlineUnix + 5 * 24 * 60 * 60);
  });

  it("uses 7-day window for non-vehicle deals (no VIN)", () => {
    const result = calculateDisputeDeadline(deadline, undefined);
    expect(result).toBe(deadlineUnix + 7 * 24 * 60 * 60);
  });

  it("uses 7-day window when VIN is empty string", () => {
    const result = calculateDisputeDeadline(deadline, "");
    expect(result).toBe(deadlineUnix + 7 * 24 * 60 * 60);
  });

  it("returns undefined when no completion deadline", () => {
    const result = calculateDisputeDeadline(undefined, "1HGBH41JXMN109186");
    expect(result).toBeUndefined();
  });
});
