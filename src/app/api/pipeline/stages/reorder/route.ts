import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { stageIds } = body; // ordered array of stage IDs
  if (!Array.isArray(stageIds)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  for (let i = 0; i < stageIds.length; i++) {
    await prisma.dealStage.update({ where: { id: stageIds[i] }, data: { order: i } });
  }
  return NextResponse.json({ success: true });
}
