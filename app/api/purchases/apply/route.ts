import { z } from "zod";
import { asApiError, ok, unauthorized } from "@/lib/api/http";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

const payloadSchema = z.object({
  productId: z.string().min(1),
  transactionId: z.string().min(3)
});

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const payload = payloadSchema.parse(await request.json());

    const result = await getStore().applyPurchase({
      userId,
      productId: payload.productId,
      transactionId: payload.transactionId
    });

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentication")) {
      return unauthorized(error.message);
    }

    return asApiError(error);
  }
}
