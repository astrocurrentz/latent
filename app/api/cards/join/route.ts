import { z } from "zod";
import { asApiError, ok, unauthorized } from "@/lib/api/http";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

const payloadSchema = z.object({
  code: z.string().trim().min(4)
});

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const payload = payloadSchema.parse(await request.json());

    const card = await getStore().joinCard(payload.code, userId);

    return ok({ card });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentication")) {
      return unauthorized(error.message);
    }

    return asApiError(error);
  }
}
