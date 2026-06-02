import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { generateContractNumber } from "@/lib/number-gen";

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
    prisma.contract.findMany({
      where,
      include: {
        deal: {
          select: { id: true, title: true, customer: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contract.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { dealId, title, totalAmount, status, startDate, endDate, content, signedDate, remark } = body;

  if (!dealId || !title) {
    return NextResponse.json({ error: "商机和标题为必填" }, { status: 400 });
  }

  const contractNumber = await generateContractNumber();

  const contract = await prisma.contract.create({
    data: {
      contractNumber,
      dealId,
      title,
      totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
      status: status || "DRAFT",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      content: content || null,
      signedDate: signedDate ? new Date(signedDate) : null,
      remark: remark || null,
    },
    include: {
      deal: {
        select: { id: true, title: true, customer: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(contract);
}
