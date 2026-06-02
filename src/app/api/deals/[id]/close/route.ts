import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, lostReason } = body;
  if (!["WON", "LOST"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: { status, lostReason: status === "LOST" ? lostReason : null },
    include: { stage: true, customer: { select: { name: true } }, owner: { select: { name: true } } },
  });

  return NextResponse.json(deal);
}
