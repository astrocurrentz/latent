import { asApiError, ok, unauthorized } from "@/lib/api/http";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await context.params;
    const card = await getStore().developCard(id, userId);

    return ok({ card });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentication")) {
      return unauthorized(error.message);
    }

    return asApiError(error);
  }
}
