import crypto from "crypto";
import { p256, p384, p521 } from "@noble/curves/nist.js";
import KJUR from "jsrsasign";
import { b64uEncode, b64uDecode } from "./canonical.js";

function hashForDigest(digest: Buffer): string {
  if (digest.length === 32) return "sha256";
  if (digest.length === 48) return "sha384";
  if (digest.length === 64) return "sha512";
  throw new Error(`unsupported prehash length: ${digest.length}`);
}

function getNobleCurve(name: string) {
  if (name === "P-256" || name === "P256") return p256;
  if (name === "P-384" || name === "P384") return p384;
  if (name === "P-521" || name === "P521") return p521;
  throw new Error(`unknown ECDSA curve: ${name}`);
}

function derEncodeEcdsaSig(r: Buffer, s: Buffer): Buffer {
  function encodeInt(b: Buffer): Buffer {
    let i = 0;
    while (i < b.length && b[i] === 0) i++;
    let out = b.slice(i);
    if (out.length === 0) out = Buffer.from([0]);
    if (out[0] & 0x80) out = Buffer.concat([Buffer.from([0x00]), out]);
    return Buffer.concat([Buffer.from([0x02, out.length]), out]);
  }
  const intR = encodeInt(r);
  const intS = encodeInt(s);
  const totalLen = intR.length + intS.length;
  let lenBytes: Buffer;
  if (totalLen < 128) {
    lenBytes = Buffer.from([totalLen]);
  } else if (totalLen < 256) {
    lenBytes = Buffer.from([0x81, totalLen]);
  } else {
    lenBytes = Buffer.from([0x82, totalLen >> 8, totalLen & 0xff]);
  }
  return Buffer.concat([Buffer.from([0x30]), lenBytes, intR, intS]);
}

const ECDSA_CURVE_NAME: Record<string, string> = {
  "ECDSA-P256": "secp256r1",
  "ECDSA-P384": "secp384r1",
  "ECDSA-P521": "secp521r1",
};

export function generateKeypair(sigAlg: string): crypto.KeyPairKeyObjectResult {
  if (sigAlg === "Ed25519") {
    return crypto.generateKeyPairSync("ed25519");
  }
  if (sigAlg === "ECDSA-P256") {
    return crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  }
  if (sigAlg === "ECDSA-P384") {
    return crypto.generateKeyPairSync("ec", { namedCurve: "P-384" });
  }
  if (sigAlg === "ECDSA-P521") {
    return crypto.generateKeyPairSync("ec", { namedCurve: "P-521" });
  }
  if (sigAlg === "RSA-PSS-2048") {
    return crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  }
  if (sigAlg === "RSA-PSS-3072") {
    return crypto.generateKeyPairSync("rsa", { modulusLength: 3072 });
  }
  if (sigAlg === "RSA-PSS-4096") {
    return crypto.generateKeyPairSync("rsa", { modulusLength: 4096 });
  }
  throw new Error(`unknown signature algorithm: ${sigAlg}`);
}

export function publicKeyExportB64u(publicKey: crypto.KeyObject): string {
  const raw = publicKey.export({ type: "spki", format: "der" });
  return b64uEncode(raw);
}

export function publicKeyImportB64u(publicKeyB64u: string): crypto.KeyObject {
  return crypto.createPublicKey({
    key: b64uDecode(publicKeyB64u),
    format: "der",
    type: "spki",
  });
}

export function signDigest(
  privateKey: crypto.KeyObject,
  sigAlg: string,
  digest: Buffer
): Buffer {
  if (sigAlg === "Ed25519") {
    return crypto.sign(null, digest, privateKey);
  }
  const hashName = hashForDigest(digest);
  if (sigAlg.startsWith("ECDSA-")) {
    const curveName = sigAlg.slice(6);
    const curve = getNobleCurve(curveName);
    const jwk = privateKey.export({ format: "jwk" }) as { d: string };
    const d = b64uDecode(jwk.d);
    const sig = curve.sign(digest, d, { prehash: false });
    const nBytes =
      curveName === "P-521" || curveName === "P521" ? 66 :
      curveName === "P-384" || curveName === "P384" ? 48 : 32;
    const r = Buffer.from(sig.slice(0, nBytes));
    const s = Buffer.from(sig.slice(nBytes));
    return derEncodeEcdsaSig(r, s);
  }
  if (sigAlg.startsWith("RSA-PSS-")) {
    const pem = privateKey.export({ format: "pem", type: "pkcs8" }) as string;
    const rsaPriv = KJUR.KEYUTIL.getKey(pem) as any;
    const sigHex = rsaPriv.signWithMessageHashPSS(
      digest.toString("hex"),
      hashName,
      digest.length
    );
    return Buffer.from(sigHex, "hex");
  }
  throw new Error(`unknown signature algorithm: ${sigAlg}`);
}

export function verifyDigest(
  publicKeyB64u: string,
  sigAlg: string,
  digest: Buffer,
  signature: Buffer
): boolean {
  if (sigAlg === "Ed25519") {
    const keyObj = publicKeyImportB64u(publicKeyB64u);
    return crypto.verify(null, digest, keyObj, signature);
  }
  const hashName = hashForDigest(digest);
  if (sigAlg.startsWith("ECDSA-")) {
    try {
      const curveName = ECDSA_CURVE_NAME[sigAlg];
      const pubDer = b64uDecode(publicKeyB64u);
      const jwk = crypto
        .createPublicKey({ key: pubDer, format: "der", type: "spki" })
        .export({ format: "jwk" }) as { x: string; y: string };
      const xHex = b64uDecode(jwk.x).toString("hex");
      const yHex = b64uDecode(jwk.y).toString("hex");
      const pubHex = "04" + xHex + yHex;
      const ECDSA = (KJUR as any).crypto.ECDSA;
      const ecdsa = new ECDSA({ curve: curveName, pub: pubHex });
      return ecdsa.verifyWithMessageHash(
        digest.toString("hex"),
        signature.toString("hex")
      );
    } catch {
      return false;
    }
  }
  if (sigAlg.startsWith("RSA-PSS-")) {
    const pubDer = b64uDecode(publicKeyB64u);
    const pubPem = crypto
      .createPublicKey({ key: pubDer, format: "der", type: "spki" })
      .export({ type: "spki", format: "pem" }) as string;
    const rsaPub = KJUR.KEYUTIL.getKey(pubPem) as any;
    return rsaPub.verifyWithMessageHashPSS(
      digest.toString("hex"),
      signature.toString("hex"),
      hashName,
      digest.length
    );
  }
  throw new Error(`unknown signature algorithm: ${sigAlg}`);
}
