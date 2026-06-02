import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const stage = await prisma.dealStage.update({ where: { id }, data: body });
  return NextResponse.json(stage);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Move deals in this stage to first stage
  const firstStage = await prisma.dealStage.findFirst({ where: { id: { not: id } }, orderBy: { order: "asc" } });
  if (firstStage) {
    await prisma.deal.updateMany({ where: { stageId: id }, data: { stageId: firstStage.id } });
  }
  await prisma.dealStage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
