import { createHash } from "node:crypto";

function normalize(value) {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

function hashObject(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export { canonicalJson, hashObject };
