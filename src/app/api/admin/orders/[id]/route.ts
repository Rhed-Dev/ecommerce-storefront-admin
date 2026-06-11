import { getPrisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/guard";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { orderStatusUpdateSchema } from "@/lib/validators";
import { canTransition, nextStatuses } from "@/lib/orders";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  const parsed = await parseJsonBody(req, orderStatusUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return jsonError(404, "Order not found");

  const target = parsed.data.status;
  if (!canTransition(order.status, target)) {
    return jsonError(409, `Cannot move order from ${order.status} to ${target}`, {
      allowed: nextStatuses(order.status),
    });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: target },
    select: { id: true, number: true, status: true, updatedAt: true },
  });
  return jsonOk({ order: updated });
}
