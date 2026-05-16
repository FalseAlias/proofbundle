export function b64uEncode(data: Buffer): string {
  return data.toString("base64url").replace(/=+$/, "");
}

export function b64uDecode(text: string): Buffer {
  const pad = "=".repeat((4 - (text.length % 4)) % 4);
  return Buffer.from((text + pad).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function canonicalNumber(value: number): string {
  if (typeof value !== "number") {
    throw new TypeError("bool is not a JSON number here");
  }
  if (!Number.isFinite(value)) {
    throw new Error("NaN and Infinity are malformed");
  }
  if (Number.isInteger(value)) {
    return BigInt(value).toString();
  }
  const s = value.toExponential(14);
  const [mantissa, expStr] = s.split("e");
  const exp = parseInt(expStr, 10);
  const sign = mantissa.startsWith("-") ? "-" : "";
  const absMantissa = sign ? mantissa.slice(1) : mantissa;
  const useSci = exp < -4 || exp >= 15;
  if (useSci) {
    let m = absMantissa.replace(/\.$/, "").replace(/\.?0+$/, "");
    const expPart =
      exp < 0
        ? Math.abs(exp) < 10
          ? "-0" + Math.abs(exp)
          : String(exp)
        : String(exp);
    return sign + m + "e" + expPart;
  }
  const digits = absMantissa.replace(".", "");
  const dp = exp + 1;
  let result: string;
  if (dp > 0) {
    const intPart = sign + digits.slice(0, dp);
    let fracPart = digits.slice(dp);
    result = fracPart ? intPart + "." + fracPart : intPart;
  } else {
    const zeros = "0".repeat(-dp);
    result = sign + "0." + zeros + digits;
  }
  result = result.replace(/\.(\d*?)0+$/, (_m, p1) => (p1 ? "." + p1 : ""));
  result = result.replace(/\.$/, "");
  return result;
}

function canonicalString(value: string): string {
  return JSON.stringify(value.normalize("NFC"));
}

export function canonical(value: unknown): string {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "number") return canonicalNumber(value);
  if (typeof value === "string") return canonicalString(value);
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonical(item)).join(",") + "]";
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (!keys.every((k) => typeof k === "string")) {
      throw new Error("JSON object keys must be strings");
    }
    keys.sort((a, b) => {
      const ac = Array.from(a).map((c) => c.codePointAt(0)!);
      const bc = Array.from(b).map((c) => c.codePointAt(0)!);
      const len = Math.min(ac.length, bc.length);
      for (let i = 0; i < len; i++) {
        if (ac[i] !== bc[i]) return ac[i] - bc[i];
      }
      return ac.length - bc.length;
    });
    return (
      "{" +
      keys
        .map((k) => canonicalString(k) + ":" + canonical(obj[k]))
        .join(",") +
      "}"
    );
  }
  throw new Error(`unsupported JSON value: ${typeof value}`);
}

export function canonicalBytes(value: unknown): Buffer {
  return Buffer.from(canonical(value), "utf-8");
}
