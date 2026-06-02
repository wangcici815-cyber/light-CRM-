import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId");
  const stageId = searchParams.get("stageId");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 50;

  const where: any = {};
  if (ownerId) where.ownerId = ownerId;
  if (stageId) where.stageId = stageId;
  if (user.role === "MEMBER") where.ownerId = user.id;

  const [data, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        stage: true,
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deal.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, amount, expectedCloseDate, remark, stageId, customerId, ownerId } = body;

  if (!title || !stageId || !customerId) {
    return NextResponse.json({ error: "标题、阶段、客户为必填" }, { status: 400 });
  }

  const deal = await prisma.deal.create({
    data: {
      title,
      amount: amount ? parseFloat(amount) : undefined,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      remark,
      stageId,
      customerId,
      ownerId: ownerId || user.id,
    },
    include: {
      stage: true,
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  // Log stage change
  await prisma.dealStageLog.create({
    data: { dealId: deal.id, toStageId: stageId, userId: user.id },
  });

  return NextResponse.json(deal);
}
