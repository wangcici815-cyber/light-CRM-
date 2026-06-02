import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      contacts: { orderBy: { isPrimary: "desc" } },
      deals: {
        include: { stage: true, owner: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      },
      activities: {
        include: { owner: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { contacts: true, deals: true, activities: true } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, industry, source, phone, email, address, remark, ownerId, tagIds } = body;

  const customer = await prisma.customer.findFirst({ where: { id, deletedAt: null } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update tags if provided
  if (tagIds !== undefined) {
    await prisma.customerTag.deleteMany({ where: { customerId: id } });
    if (tagIds.length > 0) {
      await prisma.customerTag.createMany({
        data: tagIds.map((tagId: string) => ({ customerId: id, tagId })),
      });
    }
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      name, industry, source, phone, email, address, remark,
      ...(ownerId ? { ownerId } : {}),
    },
    include: { tags: { include: { tag: true } }, owner: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findFirst({ where: { id, deletedAt: null } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
