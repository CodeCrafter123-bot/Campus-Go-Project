import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { requireUser, toPublicUser } from "@/lib/auth";
import { getBuilding } from "@/lib/catalog";
import { badRequest, handler, readJson } from "@/lib/http";
import { runValidators, validateRequired, validateRoom } from "@/lib/validation";

const MAX_LOCATIONS = 10;

// GET /api/locations → the user's saved delivery locations.
export const GET = handler(async (request) => {
  const user = requireUser(request);
  return Response.json({ savedLocations: toPublicUser(user).savedLocations });
});

// POST /api/locations → save a new delivery location.
// Body: { label, buildingId, room }
// Response 201: { location, savedLocations }
export const POST = handler(async (request) => {
  const user = requireUser(request);
  const body = await readJson(request);

  const fields = runValidators({
    label: () => validateRequired(body.label, "Name") || (body.label.trim().length > 30 ? "Name is too long (max 30 characters)." : null),
    buildingId: () => (getBuilding(body.buildingId) ? null : "Please choose a building."),
    room: () => validateRoom(body.room),
  });
  if (Object.keys(fields).length > 0) throw badRequest("Please fix the highlighted fields.", fields);

  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS n FROM saved_locations WHERE user_id = ?").get(user.id).n;
  if (count >= MAX_LOCATIONS) throw badRequest(`You can save up to ${MAX_LOCATIONS} locations.`);

  const location = {
    id: randomUUID(),
    label: body.label.trim(),
    buildingId: body.buildingId,
    room: body.room.trim().toUpperCase(),
  };
  db.prepare("INSERT INTO saved_locations (id, user_id, label, building_id, room) VALUES (?, ?, ?, ?, ?)")
    .run(location.id, user.id, location.label, location.buildingId, location.room);

  return Response.json({ location, savedLocations: toPublicUser(user).savedLocations }, { status: 201 });
});
