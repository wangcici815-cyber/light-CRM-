import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  const stages = await prisma.dealStage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(stages);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const maxOrder = await prisma.dealStage.aggregate({ _max: { order: true } });
  const stage = await prisma.dealStage.create({
    data: { name: body.name, color: body.color || "#6366f1", probability: body.probability || 0, order: (maxOrder._max.order ?? -1) + 1 },
  });
  return NextResponse.json(stage);
}
