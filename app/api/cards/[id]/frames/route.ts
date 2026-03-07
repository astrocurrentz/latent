import { z } from "zod";
import { asApiError, created, unauthorized } from "@/lib/api/http";
import { LENSES } from "@/data/lenses";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

const payloadSchema = z.object({
  lensId: z.enum(LENSES.map((lens) => lens.id) as [string, ...string[]]),
  masterUri: z.string().min(1),
  derivativeUri: z.string().nullable().optional()
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await context.params;
    const payload = payloadSchema.parse(await request.json());

    const result = await getStore().captureFrame({
      cardId: id,
      userId,
      lensId: payload.lensId as never,
      masterUri: payload.masterUri,
      derivativeUri: payload.derivativeUri ?? null
    });

    return created(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentication")) {
      return unauthorized(error.message);
    }

    return asApiError(error);
  }
}
