import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stages = await prisma.dealStage.findMany({
    orderBy: { order: "asc" },
    include: {
      deals: {
        include: {
          customer: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
        where: { status: "OPEN" },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return NextResponse.json(stages);
}
