import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      deal: {
        select: { id: true, title: true, ownerId: true, customer: { select: { id: true, name: true } } },
      },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "MEMBER" && quotation.deal.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(quotation);
}

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, validUntil, remark, items } = body;

  let totalAmount: number | undefined;

  if (items) {
    let sum = 0;
    const itemData = items.map((item: any, i: number) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const amt = qty * price;
      sum += amt;
      return {
        itemName: item.itemName,
        description: item.description || null,
        quantity: qty,
        unitPrice: price,
        amount: amt,
        image: item.image || null,
        sortOrder: i,
      };
    });
    totalAmount = sum;

    await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      await tx.quotation.update({
        where: { id },
        data: {
          status: status || undefined,
          validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : undefined,
          remark: remark !== undefined ? remark : undefined,
          totalAmount,
          items: { create: itemData },
        },
      });
    });
  } else {
    await prisma.quotation.update({
      where: { id },
      data: {
        status: status || undefined,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : undefined,
        remark: remark !== undefined ? remark : undefined,
      },
    });
  }

  const updated = await prisma.quotation.findUnique({
    where: { id },
    include: {
      deal: {
        select: { id: true, title: true, ownerId: true, customer: { select: { id: true, name: true } } },
      },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.quotation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
