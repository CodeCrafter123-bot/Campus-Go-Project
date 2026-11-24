import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ROOT_ADMIN_ID, getUserRow, toPublicUser } from "@/lib/auth";
import { badRequest, conflict, forbidden, notFound } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { runValidators, validateEmail, validatePassword, validateRequired } from "@/lib/validation";

/*
 * Admin actions on user accounts.
 * Protection rules (checked on the server, so they can't be skipped):
 *  - an admin can't freeze or delete their OWN account
 *  - the main admin account (admin@ua.edu.lb) can never be frozen or deleted
 */

const PAST = { freeze: "frozen", delete: "deleted" };

// Returns the target user, or throws if the action is not allowed.
export function checkTarget(admin, targetId, action) {
  const target = getUserRow(targetId);
  if (!target) throw notFound("User not found.");
  if (target.id === admin.id) throw forbidden(`You can't ${action} your own account.`);
  if (target.id === ROOT_ADMIN_ID) throw forbidden(`The main admin account can't be ${PAST[action]}.`);
  return target;
}

export function listUsers(search) {
  const rows = getDb().prepare("SELECT * FROM users ORDER BY created_at").all();
  const users = rows.map(toPublicUser);
  const q = typeof search === "string" ? search.trim().toLowerCase() : "";
  if (!q) return users;
  return users.filter((u) =>
    [u.fullName, u.email, u.universityId].some((value) => String(value || "").toLowerCase().includes(q))
  );
}

export function setFrozen(admin, targetId, frozen) {
  if (typeof frozen !== "boolean") throw badRequest("frozen must be true or false.");
  checkTarget(admin, targetId, "freeze");
  getDb().prepare("UPDATE users SET frozen = ? WHERE id = ?").run(frozen ? 1 : 0, targetId);
  return toPublicUser(getUserRow(targetId));
}

// Deleting a user also deletes their locations, wallet history and orders
// (ON DELETE CASCADE in the database schema).
export function deleteUser(admin, targetId) {
  checkTarget(admin, targetId, "delete");
  getDb().prepare("DELETE FROM users WHERE id = ?").run(targetId);
}

export function createAdmin(body) {
  const fields = runValidators({
    fullName: () => validateRequired(body.fullName, "Name"),
    email: () => validateEmail(body.email),
    password: () => validatePassword(body.password),
  });
  if (Object.keys(fields).length > 0) throw badRequest("Please fix the highlighted fields.", fields);

  const email = body.email.trim().toLowerCase();
  if (getDb().prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    throw conflict("An account with this email already exists.");
  }
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO users (id, full_name, email, password_hash, university_id, faculty, phone, role, wallet_balance, created_at)
       VALUES (?, ?, ?, ?, 'ADMIN', 'Administration', '', 'admin', 0, ?)`
    )
    .run(id, body.fullName.trim(), email, hashPassword(body.password), new Date().toISOString());
  return toPublicUser(getUserRow(id));
}
