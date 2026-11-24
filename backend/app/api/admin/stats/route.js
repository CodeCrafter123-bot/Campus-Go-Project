import { requireAdmin } from "@/lib/auth";
import { handler } from "@/lib/http";
import { computeStats } from "@/lib/adminStats";
import { listUsers } from "@/lib/admin";
import { listAllOrders } from "@/lib/orders";

// GET /api/admin/stats → numbers for the admin dashboard (users, sales,
// orders per day for the last 7 days, top products, most active stores).
export const GET = handler(async (request) => {
  requireAdmin(request);
  return Response.json({ stats: computeStats(listAllOrders(), listUsers()) });
});
