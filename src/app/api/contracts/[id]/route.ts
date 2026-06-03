import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      deal: {
        select: { id: true, title: true, ownerId: true, customer: { select: { id: true, name: true } } },
      },
    },
  });

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "MEMBER" && contract.deal.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(contract);
}

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, totalAmount, status, startDate, endDate, content, signedDate, remark } = body;

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      title: title !== undefined ? title : undefined,
      totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
      status: status || undefined,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      content: content !== undefined ? content : undefined,
      signedDate: signedDate !== undefined ? (signedDate ? new Date(signedDate) : null) : undefined,
      remark: remark !== undefined ? remark : undefined,
    },
    include: {
      deal: {
        select: { id: true, title: true, ownerId: true, customer: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(contract);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
