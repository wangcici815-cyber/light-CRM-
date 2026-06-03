import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, position, phone, email, wechat, isPrimary, customerId } = body;
  if (!name || !customerId) {
    return NextResponse.json({ error: "姓名和客户为必填" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { name, position, phone, email, wechat, isPrimary: isPrimary || false, customerId },
  });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, position, phone, email, wechat, isPrimary } = body;
  if (!id) return NextResponse.json({ error: "ID为必填" }, { status: 400 });

  const contact = await prisma.contact.update({
    where: { id },
    data: { name, position, phone, email, wechat, isPrimary },
  });
  return NextResponse.json(contact);
}
