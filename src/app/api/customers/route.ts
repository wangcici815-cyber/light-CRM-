import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const ownerId = searchParams.get("ownerId");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;

  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (ownerId) where.ownerId = ownerId;
  if (user.role === "MEMBER") where.ownerId = user.id;

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        _count: { select: { contacts: true, deals: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, industry, source, phone, email, address, remark, ownerId, tagIds } = body;
  if (!name) return NextResponse.json({ error: "客户名称为必填" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      name,
      industry,
      source: source || "manual",
      phone,
      email,
      address,
      remark,
      ownerId: ownerId || user.id,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId: string) => ({ tagId })) }
        : undefined,
    },
    include: { tags: { include: { tag: true } }, owner: { select: { id: true, name: true } } },
  });

  return NextResponse.json(customer);
}
