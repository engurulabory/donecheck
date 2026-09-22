export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function normalize(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON requires finite numbers.");
    return value;
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(object).sort()) {
      const item = object[key];
      if (typeof item === "undefined") continue;
      normalized[key] = normalize(item);
    }
    return normalized;
  }
  throw new TypeError("Canonical JSON accepts only JSON-serializable values.");
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}
