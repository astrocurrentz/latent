import { z } from "zod";
import { asApiError, created, unauthorized } from "@/lib/api/http";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

const payloadSchema = z.object({
  shared: z.boolean().default(false)
});

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const payload = payloadSchema.parse(await request.json());

    const card = await getStore().createCard({
      userId,
      shared: payload.shared
    });

    return created({ card });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentication")) {
      return unauthorized(error.message);
    }

    return asApiError(error);
  }
}
