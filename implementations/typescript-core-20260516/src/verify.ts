import {
  Bundle,
  VerificationResult,
  SPEC_ID,
  SPEC_VER,
  CANONICAL_ENCODING,
  PROFILES,
  DIGEST_ALGORITHMS,
  SIGNATURE_ALGORITHMS,
  PROOF_KINDS,
} from "./types.js";
import { canonicalBytes, b64uEncode } from "./canonical.js";
import { digestBytes } from "./digest.js";
import { verifyDigest } from "./signature.js";
import { evalBoundary } from "./boundary.js";
import { verifyLineage } from "./lineage.js";

function withoutSeal(bundle: Record<string, unknown>): Record<string, unknown> {
  const out = { ...bundle };
  delete out.seal;
  return out;
}

function profileRank(profile: string): number {
  return (PROFILES as readonly string[]).indexOf(profile);
}

export function verifyBundle(
  bundle: unknown,
  publicKeyB64u?: string | null,
  options?: {
    context?: Record<string, unknown>;
    providedBundles?: Record<string, Bundle>;
    maxDepth?: number;
    now?: string;
  }
): VerificationResult {
  const trace: string[] = [];
  try {
    if (typeof bundle !== "object" || bundle === null) {
      return { outcome: "malformed", trace: ["bundle is not an object"], bundle_id: null, digest_b64u: null };
    }
    const b = bundle as Record<string, unknown>;
    const hdr = b.hdr as Record<string, unknown> | undefined;
    const meta = b.meta as Record<string, unknown> | undefined;
    const refs = b.refs as unknown[] | undefined;
    const seal = b.seal as Record<string, unknown> | undefined;

    if (
      typeof hdr !== "object" || hdr === null ||
      typeof meta !== "object" || meta === null ||
      typeof seal !== "object" || seal === null ||
      !Array.isArray(refs)
    ) {
      return { outcome: "malformed", trace: ["missing object fields"], bundle_id: null, digest_b64u: null };
    }

    if (hdr.spec_id !== SPEC_ID) {
      return { outcome: "malformed", trace: ["spec_id mismatch"], bundle_id: null, digest_b64u: null };
    }
    if (hdr.spec_ver !== SPEC_VER) {
      return { outcome: "unknown-version", trace: ["version gate"], bundle_id: (hdr.bundle_id as string) ?? null, digest_b64u: null };
    }
    const profile = hdr.profile as string;
    if (!PROFILES.includes(profile as (typeof PROFILES)[number])) {
      return { outcome: "malformed", trace: ["unknown profile"], bundle_id: (hdr.bundle_id as string) ?? null, digest_b64u: null };
    }

    const digestAlg = meta.digest_alg as string;
    const sigAlg = meta.sig_alg as string;
    const proofKind = meta.proof_kind as string;

    if (
      !DIGEST_ALGORITHMS.includes(digestAlg as (typeof DIGEST_ALGORITHMS)[number]) ||
      !SIGNATURE_ALGORITHMS.includes(sigAlg as (typeof SIGNATURE_ALGORITHMS)[number])
    ) {
      return { outcome: "not-defined-in-this-version", trace: ["unregistered algorithm"], bundle_id: (hdr.bundle_id as string) ?? null, digest_b64u: null };
    }
    if (!PROOF_KINDS.includes(proofKind as (typeof PROOF_KINDS)[number])) {
      return { outcome: "not-defined-in-this-version", trace: ["unregistered proof kind"], bundle_id: (hdr.bundle_id as string) ?? null, digest_b64u: null };
    }
    if (meta.canonical_encoding !== CANONICAL_ENCODING) {
      return { outcome: "malformed", trace: ["canonical encoding mismatch"], bundle_id: (hdr.bundle_id as string) ?? null, digest_b64u: null };
    }

    const canon = canonicalBytes(withoutSeal(b));
    const digest = digestBytes(canon, digestAlg);
    const digestB64u = b64uEncode(digest);

    if (seal.digest_alg !== digestAlg || seal.sig_alg !== sigAlg) {
      return { outcome: "malformed", trace: ["seal/meta algorithm mismatch"], bundle_id: (hdr.bundle_id as string) ?? null, digest_b64u: digestB64u };
    }
    if (seal.digest_b64u !== digestB64u) {
      return { outcome: "invalid-signature", trace: ["digest mismatch"], bundle_id: (hdr.bundle_id as string) ?? null, digest_b64u: digestB64u };
    }
    trace.push("integrity digest verified");

    if (proofKind === "signature") {
      const key = publicKeyB64u ?? (meta.public_key_b64u as string) ?? "";
      if (
        !verifyDigest(
          key,
          sigAlg,
          digest,
          Buffer.from((seal.signature_b64u as string) ?? "", "base64url")
        )
      ) {
        return {
          outcome: "invalid-signature",
          trace: [...trace, "signature failed"],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
      trace.push("primary signature verified");
    } else {
      if (!seal.proof_cert) {
        return {
          outcome: "missing-side-info",
          trace: [...trace, "proof_cert absent"],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
      return {
        outcome: "indeterminate",
        trace: [...trace, `proof-kind ${proofKind} checker not executed by this reference`],
        bundle_id: (hdr.bundle_id as string) ?? null,
        digest_b64u: digestB64u,
      };
    }

    if (meta.expiration !== undefined) {
      const current = new Date(
        options?.now ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
      ).getTime();
      if (current > new Date(meta.expiration as string).getTime()) {
        return {
          outcome: "out-of-bounds",
          trace: [...trace, "expired"],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
    }

    if (profileRank(profile) >= profileRank("PB-BOUNDARY-1")) {
      const boundary = (meta.boundary as Record<string, unknown>) ?? { all: [] };
      const [ok, err] = evalBoundary(boundary, options?.context ?? {});
      if (err === "not-defined") {
        return {
          outcome: "not-defined-in-this-version",
          trace: [...trace, "boundary atom not defined"],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
      if (err) {
        return {
          outcome: "malformed",
          trace: [...trace, `boundary error: ${err}`],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
      if (!ok) {
        return {
          outcome: "out-of-bounds",
          trace: [...trace, "boundary false"],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
      trace.push("boundary verified");
    }

    if (profileRank(profile) >= profileRank("PB-LINEAGE-1")) {
      const lineageOutcome = verifyLineage(
        b as unknown as Bundle,
        options?.providedBundles ?? {},
        options?.maxDepth ?? 16
      );
      if (lineageOutcome !== "verified") {
        return {
          outcome: lineageOutcome,
          trace: [...trace, "lineage failed"],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
      trace.push("lineage verified");
    }

    if (profile === "PB-REGULATED-1") {
      const hitl = meta.hitl;
      if (typeof hitl !== "object" || hitl === null) {
        return {
          outcome: "policy-denied",
          trace: [...trace, "hitl absent"],
          bundle_id: (hdr.bundle_id as string) ?? null,
          digest_b64u: digestB64u,
        };
      }
      trace.push("regulated gate present");
    }

    return {
      outcome: "verified",
      trace,
      bundle_id: (hdr.bundle_id as string) ?? null,
      digest_b64u: digestB64u,
    };
  } catch (exc) {
    return {
      outcome: "malformed",
      trace: [`exception: ${exc}`],
      bundle_id: null,
      digest_b64u: null,
    };
  }
}
