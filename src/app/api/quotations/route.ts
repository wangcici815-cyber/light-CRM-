import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { generateQuoteNumber } from "@/lib/number-gen";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;

  const where: any = {};
  if (dealId) where.dealId = dealId;
  if (user.role === "MEMBER") where.deal = { ownerId: user.id };

  const [data, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: {
        deal: {
          select: { id: true, title: true, customer: { select: { id: true, name: true } } },
        },
        items: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quotation.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { dealId, validUntil, remark, items } = body;

  if (!dealId) {
    return NextResponse.json({ error: "商机为必填" }, { status: 400 });
  }

  const quoteNumber = await generateQuoteNumber();
  let totalAmount = 0;
  const itemData = (items || []).map((item: any, i: number) => {
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unitPrice) || 0;
    const amount = qty * price;
    totalAmount += amount;
    return {
      itemName: item.itemName,
      description: item.description || null,
      quantity: qty,
      unitPrice: price,
      amount,
      image: item.image || null,
      sortOrder: i,
    };
  });

  const quotation = await prisma.quotation.create({
    data: {
      quoteNumber,
      dealId,
      totalAmount,
      validUntil: validUntil ? new Date(validUntil) : null,
      remark: remark || null,
      items: { create: itemData },
    },
    include: {
      deal: {
        select: { id: true, title: true, customer: { select: { id: true, name: true } } },
      },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(quotation);
}
