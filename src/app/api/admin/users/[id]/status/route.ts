import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  if (body.active !== undefined) {
    await prisma.user.update({ where: { id }, data: { active: body.active } });
  }
  if (body.role) {
    await prisma.user.update({ where: { id }, data: { role: body.role } });
  }
  if (body.password) {
    const hashedPassword = await bcrypt.hash(body.password, 12);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  }
  if (body.name) {
    await prisma.user.update({ where: { id }, data: { name: body.name } });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (id === user.id) return NextResponse.json({ error: "不能删除自己" }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
