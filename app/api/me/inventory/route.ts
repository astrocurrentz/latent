import { asApiError, ok, unauthorized } from "@/lib/api/http";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const result = await getStore().getInventory(userId);

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentication")) {
      return unauthorized(error.message);
    }

    return asApiError(error);
  }
}
