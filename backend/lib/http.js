/*
 * Small helpers shared by every API route.
 * All errors are sent the same way: { error: "message" } with an HTTP status,
 * and form errors also include { fields: { email: "message", ... } }.
 */

// Throw this anywhere in a route to send an error response.
export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export const badRequest = (message, fields) => new ApiError(400, message, fields);
export const unauthorized = (message = "Please log in again.") => new ApiError(401, message);
export const forbidden = (message = "You are not allowed to do this.") => new ApiError(403, message);
export const notFound = (message = "Not found.") => new ApiError(404, message);
export const conflict = (message) => new ApiError(409, message);

// Reads the JSON body of a request (an empty or invalid body becomes {}).
export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

/*
 * Wraps a route handler so that:
 *  - a thrown ApiError becomes a clean JSON error response
 *  - any other error becomes "500 Something went wrong" (and is logged)
 */
export function handler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        const body = { error: error.message };
        if (error.fields) body.fields = error.fields;
        return Response.json(body, { status: error.status });
      }
      console.error(error);
      return Response.json({ error: "Something went wrong on the server." }, { status: 500 });
    }
  };
}
