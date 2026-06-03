import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest, { params }: any) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const tag = await prisma.tag.update({ where: { id }, data: body });
  return NextResponse.json(tag);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
