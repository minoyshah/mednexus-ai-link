import { HttpError } from "./http.ts";

/** All valid trade ids (mirrors the aquilla_trade enum + the prototype). */
export const TRADES = [
  "roadside", "plumb", "elec", "hvac", "lock", "roof", "pest",
  "appliance", "garage", "handy", "paint", "land", "move", "clean", "other",
] as const;
export type Trade = (typeof TRADES)[number];

/** Trades that require a verified license + insurance (prototype licReq=true). */
export const LICENSED_TRADES = new Set<Trade>([
  "plumb", "elec", "hvac", "lock", "roof", "pest",
]);

export function isTrade(v: unknown): v is Trade {
  return typeof v === "string" && (TRADES as readonly string[]).includes(v);
}

/** Parse and lightly validate a JSON body, throwing 400 on malformed input. */
export async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    if (b && typeof b === "object" && !Array.isArray(b)) return b as Record<string, unknown>;
    throw new Error();
  } catch {
    throw new HttpError(400, "Expected a JSON object body");
  }
}

export function reqString(o: Record<string, unknown>, key: string, max = 4000): string {
  const v = o[key];
  if (typeof v !== "string" || v.trim().length === 0) throw new HttpError(400, `Missing "${key}"`);
  if (v.length > max) throw new HttpError(400, `"${key}" too long`);
  return v.trim();
}

export function optString(o: Record<string, unknown>, key: string, max = 4000): string | null {
  const v = o[key];
  if (v == null) return null;
  if (typeof v !== "string") throw new HttpError(400, `"${key}" must be a string`);
  if (v.length > max) throw new HttpError(400, `"${key}" too long`);
  return v.trim();
}

/** A non-negative money amount. Rejects NaN/Infinity/negatives. */
export function reqMoney(o: Record<string, unknown>, key: string): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
    throw new HttpError(400, `"${key}" must be a non-negative number`);
  }
  return v;
}

export function optMoney(o: Record<string, unknown>, key: string): number | null {
  return o[key] == null ? null : reqMoney(o, key);
}

export function reqBool(o: Record<string, unknown>, key: string): boolean {
  const v = o[key];
  if (typeof v !== "boolean") throw new HttpError(400, `"${key}" must be a boolean`);
  return v;
}

export function reqTrade(o: Record<string, unknown>, key = "trade"): Trade {
  const v = o[key];
  if (!isTrade(v)) throw new HttpError(400, `"${key}" must be a valid trade`);
  return v;
}

export function reqUuid(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (typeof v !== "string" || !/^[0-9a-f-]{36}$/i.test(v)) {
    throw new HttpError(400, `"${key}" must be a uuid`);
  }
  return v;
}
