const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type SessionRole = "admin";

export type AdminSessionClaims = {
  sub: string;
  role: SessionRole;
  tenant: string;
  iat: number;
  exp: number;
  csrf: string;
};

function toBase64Url(bytes: Uint8Array): string {
  const base64 =
    typeof btoa === "function"
      ? (() => {
          let binary = "";
          for (const b of bytes) binary += String.fromCharCode(b);
          return btoa(binary);
        })()
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(Buffer.from(padded, "base64"));
}

function getSecretCandidates(): string[] {
  return [
    process.env.ADMIN_SESSION_SECRET_CURRENT,
    process.env.ADMIN_SESSION_SECRET,
    process.env.SESSION_SECRET,
    process.env.ADMIN_SESSION_SECRET_PREVIOUS,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signDetached(payloadB64: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payloadB64));
  return toBase64Url(new Uint8Array(signature));
}

export async function signAdminSession(claims: AdminSessionClaims): Promise<string> {
  const [current] = getSecretCandidates();
  if (!current) throw new Error("ADMIN_SESSION_SECRET_CURRENT is required");
  const payloadB64 = toBase64Url(textEncoder.encode(JSON.stringify(claims)));
  const signature = await signDetached(payloadB64, current);
  return `${payloadB64}.${signature}`;
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionClaims | null> {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const secrets = getSecretCandidates();
  if (secrets.length === 0) return null;

  for (const secret of secrets) {
    const expected = await signDetached(payloadB64, secret);
    if (expected !== signature) continue;
    try {
      const raw = textDecoder.decode(fromBase64Url(payloadB64));
      const claims = JSON.parse(raw) as AdminSessionClaims;
      const now = Math.floor(Date.now() / 1000);
      if (claims.exp <= now) return null;
      if (claims.role !== "admin") return null;
      if (!claims.tenant || typeof claims.tenant !== "string") return null;
      return claims;
    } catch {
      return null;
    }
  }

  return null;
}

export function createCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const cfIp = headers.get("cf-connecting-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || cfIp || "local").trim();
}

export function getAllowedCorsOrigins(): string[] {
  const csv = process.env.CORS_ALLOW_ORIGINS || "";
  return csv
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function sanitizeText(value: string, max = 2000): string {
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}
