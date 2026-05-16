import { BoundaryPredicate } from "./types.js";

function getPath(context: Record<string, unknown>, path: string): [boolean, unknown] {
  let cur: unknown = context;
  for (const part of path.split(".")) {
    if (typeof cur === "object" && cur !== null && part in cur) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return [false, null];
    }
  }
  return [true, cur];
}

function parseTime(value: string): number {
  // Replace trailing Z with +00:00 for ISO parsing compatibility
  const iso = value.endsWith("Z") ? value.slice(0, -1) + "+00:00" : value;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) throw new Error(`invalid ISO 8601 timestamp: ${value}`);
  return t;
}

function parseDurationSeconds(value: string): number {
  const match = value.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/
  );
  if (!match) {
    throw new Error(`unsupported ISO 8601 duration: ${value}`);
  }
  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseInt(match[4] || "0", 10);
  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds);
}

export function evalBoundary(
  pred: unknown,
  context: Record<string, unknown>,
  depth = 0
): [boolean, string | null] {
  if (depth > 10) return [false, "depth"];
  if (typeof pred !== "object" || pred === null) return [false, "malformed"];
  const p = pred as Record<string, unknown>;

  if ("all" in p) {
    const vals = (p.all as unknown[]).map((c) =>
      evalBoundary(c, context, depth + 1)
    );
    const err = vals.find(([, e]) => e)?.[1] ?? null;
    return [vals.every(([v]) => v), err];
  }
  if ("any" in p) {
    const vals = (p.any as unknown[]).map((c) =>
      evalBoundary(c, context, depth + 1)
    );
    const err = vals.find(([, e]) => e)?.[1] ?? null;
    return [vals.some(([v]) => v), err];
  }
  if ("not" in p) {
    const [ok, err] = evalBoundary(p.not, context, depth + 1);
    return [!ok, err];
  }
  if ("equals" in p) {
    const [path, expected] = p.equals as [string, unknown];
    const [ok, value] = getPath(context, path);
    return [ok && value === expected, null];
  }
  if ("in" in p) {
    const [path, values] = p.in as [string, unknown[]];
    const [ok, value] = getPath(context, path);
    return [ok && values.includes(value), null];
  }
  if ("range" in p) {
    const [path, lo, hi] = p.range as [string, number, number];
    const [ok, value] = getPath(context, path);
    return [ok && typeof value === "number" && lo <= value && value <= hi, null];
  }
  if ("present" in p) {
    const [ok] = getPath(context, p.present as string);
    return [ok, null];
  }
  if ("before" in p) {
    const [path, ts] = p.before as [string, string];
    const [ok, value] = getPath(context, path);
    return [ok && typeof value === "string" && parseTime(value) < parseTime(ts), null];
  }
  if ("after" in p) {
    const [path, ts] = p.after as [string, string];
    const [ok, value] = getPath(context, path);
    return [ok && typeof value === "string" && parseTime(value) > parseTime(ts), null];
  }
  if ("within" in p) {
    const [path, lo, hi] = p.within as [string, string, string];
    const [ok, value] = getPath(context, path);
    if (!ok || typeof value !== "string") return [false, null];
    const t = parseTime(value);
    return [parseTime(lo) <= t && t <= parseTime(hi), null];
  }
  if ("expired" in p) {
    const [ok, value] = getPath(context, p.expired as string);
    if (!ok || typeof value !== "string") return [false, null];
    const current = parseTime(
      (context._now as string) ??
        new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    );
    return [parseTime(value) < current, null];
  }
  if ("not_expired" in p) {
    const [ok, value] = getPath(context, p.not_expired as string);
    if (!ok || typeof value !== "string") return [false, null];
    const current = parseTime(
      (context._now as string) ??
        new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    );
    return [parseTime(value) >= current, null];
  }
  if ("age_lt" in p) {
    const [path, duration] = p.age_lt as [string, string];
    const [ok, value] = getPath(context, path);
    if (!ok || typeof value !== "string") return [false, null];
    const current = parseTime(
      (context._now as string) ??
        new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    );
    return [
      (current - parseTime(value)) / 1000 < parseDurationSeconds(duration),
      null,
    ];
  }
  if ("age_gt" in p) {
    const [path, duration] = p.age_gt as [string, string];
    const [ok, value] = getPath(context, path);
    if (!ok || typeof value !== "string") return [false, null];
    const current = parseTime(
      (context._now as string) ??
        new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    );
    return [
      (current - parseTime(value)) / 1000 > parseDurationSeconds(duration),
      null,
    ];
  }
  return [false, "not-defined"];
}
