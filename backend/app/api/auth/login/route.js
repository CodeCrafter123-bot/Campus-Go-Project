import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createToken } from "@/lib/token";
import { toPublicUser } from "@/lib/auth";
import { ApiError, badRequest, handler, readJson } from "@/lib/http";

// POST /api/auth/login
// Body: { email, password }
// Response: { token, user }
export const POST = handler(async (request) => {
  const { email, password } = await readJson(request);
  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    throw badRequest("Email and password are required.");
  }

  const user = getDb().prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  // Same message for "no such email" and "wrong password", so nobody can
  // find out which emails have an account.
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new ApiError(401, "Incorrect email or password.");
  }
  if (user.frozen) {
    throw new ApiError(403, "This account has been frozen. Please contact the administrator.");
  }

  return Response.json({ token: createToken(user.id), user: toPublicUser(user) });
});
