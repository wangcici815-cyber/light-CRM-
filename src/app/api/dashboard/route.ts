import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    todayActivities,
    newCustomers,
    activeDeals,
    wonDeals,
    pipelineSummary,
    todos,
  ] = await Promise.all([
    prisma.activity.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.deal.count({ where: { status: "OPEN" } }),
    prisma.deal.aggregate({ where: { status: "WON", updatedAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.dealStage.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { deals: { where: { status: "OPEN" } } } } },
    }),
    prisma.activity.findMany({
      where: { nextDate: { lte: now }, ...(user.role === "MEMBER" ? { ownerId: user.id } : {}) },
      include: { customer: { select: { name: true } }, owner: { select: { name: true } } },
      orderBy: { nextDate: "asc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    todayActivities,
    newCustomers,
    activeDeals,
    wonAmount: wonDeals._sum.amount || 0,
    pipelineSummary,
    todos,
  });
}
