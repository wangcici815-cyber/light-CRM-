import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const dealId = searchParams.get("dealId");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 50;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (dealId) where.dealId = dealId;
  if (user.role === "MEMBER") where.ownerId = user.id;

  const [data, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activity.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, content, nextStep, nextDate, customerId, dealId } = body;

  if (!content || !customerId) {
    return NextResponse.json({ error: "跟进内容和客户为必填" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      type: type || "OTHER",
      content,
      nextStep,
      nextDate: nextDate ? new Date(nextDate) : undefined,
      customerId,
      dealId: dealId || undefined,
      ownerId: user.id,
    },
    include: {
      customer: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(activity);
}
