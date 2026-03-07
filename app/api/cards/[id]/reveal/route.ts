import { asApiError, ok, unauthorized } from "@/lib/api/http";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await context.params;
    const frames = await getStore().listCardFrames(id, userId);

    return ok({ frames });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentication")) {
      return unauthorized(error.message);
    }

    return asApiError(error);
  }
}
