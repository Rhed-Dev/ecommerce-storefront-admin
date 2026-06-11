import { hash } from "bcryptjs";
import { getPrisma } from "@/lib/db";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { registerSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, registerSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password } = parsed.data;
  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, "An account with this email already exists");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hash(password, 12),
      role: "CUSTOMER",
    },
    select: { id: true, name: true, email: true },
  });

  return jsonOk({ user }, 201);
}
