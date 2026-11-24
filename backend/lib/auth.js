import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/token";
import { forbidden, unauthorized } from "@/lib/http";

/*
 * Protecting routes.
 * The app sends the token in every request:  Authorization: Bearer <token>
 * requireUser() checks it and returns the logged-in user (from the database).
 */

export const ROOT_ADMIN_ID = "admin";

export function getUserRow(userId) {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(userId);
}

// Shape sent to the app (never includes the password hash).
export function toPublicUser(row) {
  if (!row) return null;
  const savedLocations = getDb()
    .prepare("SELECT id, label, building_id AS buildingId, room FROM saved_locations WHERE user_id = ? ORDER BY rowid")
    .all(row.id)
    .map((l) => ({ ...l }));
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    universityId: row.university_id,
    faculty: row.faculty,
    phone: row.phone,
    role: row.role,
    frozen: Boolean(row.frozen),
    createdAt: row.created_at,
    savedLocations,
  };
}

export function requireUser(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const userId = verifyToken(token);
  if (!userId) throw unauthorized();

  const user = getUserRow(userId);
  // A deleted account behaves like a logged-out one.
  if (!user) throw unauthorized();
  // A frozen account is blocked immediately, even with a valid token.
  if (user.frozen) throw forbidden("This account has been frozen. Please contact the administrator.");
  return user;
}

export function requireAdmin(request) {
  const user = requireUser(request);
  if (user.role !== "admin") throw forbidden("Only admins can do this.");
  return user;
}
