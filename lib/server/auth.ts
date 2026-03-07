export function getUserIdFromRequest(request: Request): string {
  const explicit = request.headers.get("x-user-id");
  if (explicit) {
    return explicit;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer dev_")) {
    return authHeader.slice("Bearer ".length);
  }

  throw new Error("Missing authentication context. Pass x-user-id header or a dev bearer token.");
}
