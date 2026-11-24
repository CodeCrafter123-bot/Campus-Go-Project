import { requireAdmin } from "@/lib/auth";
import { handler, readJson } from "@/lib/http";
import { createAdmin, listUsers } from "@/lib/admin";

// GET /api/admin/users?search=text → all accounts (search by name, email or ID). Admins only.
export const GET = handler(async (request) => {
  requireAdmin(request);
  const search = request.nextUrl.searchParams.get("search");
  return Response.json({ users: listUsers(search) });
});

// POST /api/admin/users → create a new ADMIN account. Admins only.
// Body: { fullName, email, password }
export const POST = handler(async (request) => {
  requireAdmin(request);
  const user = createAdmin(await readJson(request));
  return Response.json({ user }, { status: 201 });
});
