import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: any) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contacts = await prisma.contact.findMany({
    where: { customerId: id },
    orderBy: { isPrimary: "desc" },
  });
  return NextResponse.json(contacts);
}
