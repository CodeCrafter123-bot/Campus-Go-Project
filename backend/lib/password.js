import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/*
 * Password hashing with scrypt (built into Node.js).
 * We never store the real password, only "scrypt$<salt>$<hash>".
 * A random salt makes two identical passwords produce different hashes.
 */

const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);
  // timingSafeEqual avoids leaking information through response time.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
