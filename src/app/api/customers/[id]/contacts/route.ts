import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: any) {
  const { id } = await params;
  const contacts = await prisma.contact.findMany({
    where: { customerId: id },
    orderBy: { isPrimary: "desc" },
  });
  return NextResponse.json(contacts);
}
