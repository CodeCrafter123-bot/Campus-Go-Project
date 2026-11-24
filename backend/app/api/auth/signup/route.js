import { randomUUID } from "node:crypto";
import { getDb, getSetting, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createToken } from "@/lib/token";
import { getUserRow, toPublicUser } from "@/lib/auth";
import { badRequest, conflict, handler, readJson } from "@/lib/http";
import {
  cleanPhone,
  runValidators,
  validateEmail,
  validateFaculty,
  validateFullName,
  validatePassword,
  validatePhone,
  validateUniversityId,
} from "@/lib/validation";

// POST /api/auth/signup → creates a student/staff account and logs it in.
// Body: { fullName, email, universityId, faculty, phone, password }
// Response 201: { token, user }
export const POST = handler(async (request) => {
  const body = await readJson(request);
  const fields = runValidators({
    fullName: () => validateFullName(body.fullName),
    email: () => validateEmail(body.email),
    universityId: () => validateUniversityId(body.universityId),
    faculty: () => validateFaculty(body.faculty),
    phone: () => validatePhone(body.phone),
    password: () => validatePassword(body.password),
  });
  if (Object.keys(fields).length > 0) throw badRequest("Please fix the highlighted fields.", fields);

  const db = getDb();
  const email = body.email.trim().toLowerCase();
  const universityId = body.universityId.trim().toUpperCase();

  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    throw conflict("An account with this email already exists.");
  }
  if (db.prepare("SELECT 1 FROM users WHERE university_id = ? AND role = 'user'").get(universityId)) {
    throw conflict("An account with this ID already exists.");
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const welcome = getSetting("settings").initialWalletBalance;

  // The account and its welcome credit are saved together (all or nothing).
  transaction(db, () => {
    db.prepare(
      `INSERT INTO users (id, full_name, email, password_hash, university_id, faculty, phone, role, wallet_balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'user', ?, ?)`
    ).run(id, body.fullName.trim(), email, hashPassword(body.password), universityId, body.faculty, cleanPhone(body.phone), welcome, now);
    db.prepare(
      "INSERT INTO wallet_transactions (id, user_id, type, amount, description, created_at) VALUES (?, ?, 'topup', ?, 'Welcome credit', ?)"
    ).run(randomUUID(), id, welcome, now);
  });

  // Sign-up can never create an admin: the role is always 'user'.
  return Response.json({ token: createToken(id), user: toPublicUser(getUserRow(id)) }, { status: 201 });
});
