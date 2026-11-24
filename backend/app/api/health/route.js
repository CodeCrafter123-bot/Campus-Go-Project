import { getDb } from "@/lib/db";

// GET /api/health → checks that the server and the database work.
export async function GET() {
  const db = getDb();
  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  return Response.json({
    ok: true,
    time: new Date().toISOString(),
    database: {
      stores: count("stores"),
      products: count("products"),
      buildings: count("buildings"),
      deliverySlots: count("delivery_slots"),
      users: count("users"),
      orders: count("orders"),
    },
  });
}
