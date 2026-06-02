import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const activity = await prisma.activity.update({ where: { id }, data: body });
  return NextResponse.json(activity);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const { id } = await params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
