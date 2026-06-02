import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { stageId } = body;

  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldStageId = deal.stageId;

  const updated = await prisma.deal.update({
    where: { id },
    data: { stageId },
    include: { stage: true, customer: { select: { name: true } }, owner: { select: { name: true } } },
  });

  await prisma.dealStageLog.create({
    data: { dealId: id, fromStageId: oldStageId, toStageId: stageId, userId: user.id },
  });

  return NextResponse.json(updated);
}
