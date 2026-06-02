import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      stage: true,
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      activities: {
        include: { owner: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      quotations: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(deal);
}

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const deal = await prisma.deal.update({
    where: { id },
    data: {
      title: body.title,
      amount: body.amount ? parseFloat(body.amount) : null,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
      remark: body.remark,
    },
  });
  return NextResponse.json(deal);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = await params;
  await prisma.deal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
