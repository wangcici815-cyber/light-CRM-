import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Kanban, PhoneCall, DollarSign } from "lucide-react";

async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayActivities,
    newCustomers,
    activeDeals,
    wonDeals,
    pipelineStages,
    recentActivities,
    myCustomers,
  ] = await Promise.all([
    prisma.activity.count({
      where: { createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } },
    }),
    prisma.customer.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.deal.count({
      where: { status: "OPEN" },
    }),
    prisma.deal.findMany({
      where: { status: "WON", updatedAt: { gte: startOfMonth } },
      select: { amount: true },
    }),
    prisma.dealStage.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { deals: true } } },
    }),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, owner: { select: { name: true } } },
    }),
    prisma.customer.count({ where: { ownerId: { not: null } } }),
  ]);

  const wonAmount = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

  return {
    todayActivities,
    newCustomers,
    activeDeals,
    wonAmount,
    pipelineStages,
    recentActivities,
    myCustomers,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = await getStats();

  const cards = [
    { label: "今日跟进", value: stats.todayActivities, icon: PhoneCall, color: "bg-blue-500" },
    { label: "本月新增客户", value: stats.newCustomers, icon: Users, color: "bg-green-500" },
    { label: "进行中商机", value: stats.activeDeals, icon: Kanban, color: "bg-amber-500" },
    { label: "本月成交额", value: `$${stats.wonAmount.toLocaleString()}`, icon: DollarSign, color: "bg-purple-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1a1a2e]">
          你好，{user?.name}
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          这是你的工作概览
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6b7280]">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e5e7eb] p-5">
          <h2 className="text-sm font-semibold mb-4">销售漏斗概览</h2>
          <div className="space-y-3">
            {stats.pipelineStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="text-sm flex-1">{stage.name}</span>
                <span className="text-sm font-medium">{stage._count.deals}</span>
              </div>
            ))}
          </div>
          <Link
            href="/deals"
            className="inline-block mt-4 text-sm text-[#4f46e5] hover:underline"
          >
            查看看板 →
          </Link>
        </div>

        {/* Recent activities */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
          <h2 className="text-sm font-semibold mb-4">最近跟进</h2>
          <div className="space-y-3">
            {stats.recentActivities.length === 0 ? (
              <p className="text-sm text-[#6b7280]">暂无跟进记录</p>
            ) : (
              stats.recentActivities.map((act) => (
                <div key={act.id} className="text-sm border-b border-[#e5e7eb] pb-2 last:border-0">
                  <p className="text-[#1a1a2e] truncate">{act.content}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    {act.customer.name} · {act.owner.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
