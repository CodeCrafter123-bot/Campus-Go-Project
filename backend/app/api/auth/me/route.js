import { getDb } from "@/lib/db";
import { getUserRow, requireUser, toPublicUser } from "@/lib/auth";
import { badRequest, handler, readJson } from "@/lib/http";
import { cleanPhone, validateFaculty, validateFullName, validatePhone } from "@/lib/validation";

// GET /api/auth/me → the logged-in user (used when the app starts with a saved token).
export const GET = handler(async (request) => {
  const user = requireUser(request);
  return Response.json({ user: toPublicUser(user) });
});

// PATCH /api/auth/me → edit your own profile.
// Body (all optional): { fullName, phone, faculty }
// Email, ID and role can't be changed here.
export const PATCH = handler(async (request) => {
  const user = requireUser(request);
  const body = await readJson(request);

  const changes = {};
  const fields = {};
  if (body.fullName !== undefined) {
    const error = validateFullName(body.fullName);
    if (error) fields.fullName = error;
    else changes.full_name = body.fullName.trim();
  }
  if (body.phone !== undefined) {
    const error = validatePhone(body.phone);
    if (error) fields.phone = error;
    else changes.phone = cleanPhone(body.phone);
  }
  if (body.faculty !== undefined && user.role === "user") {
    const error = validateFaculty(body.faculty);
    if (error) fields.faculty = error;
    else changes.faculty = body.faculty;
  }
  if (Object.keys(fields).length > 0) throw badRequest("Please fix the highlighted fields.", fields);

  const columns = Object.keys(changes);
  if (columns.length > 0) {
    // Column names come from our own fixed list above, never from the request.
    const sets = columns.map((c) => `${c} = ?`).join(", ");
    getDb().prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(changes), user.id);
  }
  return Response.json({ user: toPublicUser(getUserRow(user.id)) });
});
