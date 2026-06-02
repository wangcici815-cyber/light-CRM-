"use client";

import { useState } from "react";
import { useFetch } from "@/lib/use-fetch";
import { Card, Badge, Button, Loading } from "@/components/ui";
import { Plus, Filter } from "lucide-react";

const typeLabels: Record<string, string> = {
  CALL: "电话", MEETING: "拜访", EMAIL: "邮件", WECHAT: "微信", OTHER: "其他",
};
const typeColors: Record<string, string> = {
  CALL: "bg-blue-100 text-blue-700", MEETING: "bg-green-100 text-green-700",
  EMAIL: "bg-amber-100 text-amber-700", WECHAT: "bg-purple-100 text-purple-700", OTHER: "bg-gray-100 text-gray-700",
};

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const { data, loading, refresh } = useFetch<any>(`/api/activities?page=${page}`);

  const activities = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">跟进记录</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">共 {total} 条记录</p>
        </div>
      </div>

      {loading ? <Loading /> : activities.length === 0 ? (
        <Card className="p-12 text-center text-sm text-[#6b7280]">暂无跟进记录</Card>
      ) : (
        <div className="space-y-3">
          {activities.map((a: any) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={typeColors[a.type]}>{typeLabels[a.type]}</Badge>
                <span className="text-sm font-medium">{a.customer?.name}</span>
                {a.deal && <span className="text-xs text-[#6b7280]">· {a.deal.title}</span>}
                <span className="text-xs text-[#6b7280] ml-auto">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{a.content}</p>
              {a.nextStep && (
                <p className="text-xs text-amber-600 mt-2">📌 下一步：{a.nextStep} {a.nextDate ? `(${new Date(a.nextDate).toLocaleDateString()})` : ""}</p>
              )}
              <p className="text-xs text-[#6b7280] mt-1">记录人：{a.owner?.name}</p>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-[#6b7280]">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  );
}
