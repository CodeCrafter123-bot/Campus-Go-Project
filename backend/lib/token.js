import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";

/*
 * Login tokens (JSON Web Tokens signed with HMAC-SHA256).
 *
 * A token looks like  header.payload.signature  (each part base64url).
 * The payload holds the user id and an expiry date. The signature is made
 * with a secret only the server knows, so a token cannot be faked or edited:
 * changing one character makes the signature check fail.
 */

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60; // 7 days

// The secret comes from the JWT_SECRET environment variable. If it is not set,
// a random secret is created once and kept in the database, so tokens stay
// valid when the server restarts.
function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'tokenSecret'").get();
  if (row) return JSON.parse(row.value);
  const secret = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO settings (key, value) VALUES ('tokenSecret', ?)").run(JSON.stringify(secret));
  return secret;
}

const base64url = (value) => Buffer.from(value).toString("base64url");
const sign = (data) => createHmac("sha256", getSecret()).update(data).digest("base64url");

export function createToken(userId) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_LIFETIME_SECONDS }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

// Returns the user id stored in the token, or null if the token is invalid or expired.
export function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const expected = Buffer.from(sign(`${header}.${payload}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.sub || !data.exp || data.exp < Date.now() / 1000) return null;
    return data.sub;
  } catch {
    return null;
  }
}
