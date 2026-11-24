import { getDb } from "@/lib/db";
import { requireUser, toPublicUser } from "@/lib/auth";
import { handler, notFound } from "@/lib/http";

// DELETE /api/locations/:locationId → remove one of YOUR saved locations.
export const DELETE = handler(async (request, { params }) => {
  const user = requireUser(request);
  const { locationId } = await params;
  // "AND user_id = ?" makes sure nobody can delete another user's location.
  const result = getDb()
    .prepare("DELETE FROM saved_locations WHERE id = ? AND user_id = ?")
    .run(locationId, user.id);
  if (result.changes === 0) throw notFound("Location not found.");
  return Response.json({ savedLocations: toPublicUser(user).savedLocations });
});
