"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Search } from "lucide-react";

const typeColors: Record<string, string> = {
  "高意向": "bg-green-100 text-green-700",
  "意向一般": "bg-amber-100 text-amber-700",
  "已流失": "bg-red-100 text-red-700",
  "VIP客户": "bg-purple-100 text-purple-700",
  "新客户": "bg-blue-100 text-blue-700",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    const res = await fetch(`/api/customers?${params}`);
    const json = await res.json();
    setCustomers(json.data);
    setTotal(json.total);
    setLoading(false);
  }

  useEffect(() => { load() }, [page, search]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">客户列表</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {total} 个客户</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1" /> 新建客户
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="搜索客户名称、电话、邮箱..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">客户名称</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">行业</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">负责人</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">标签</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">联系人</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">商机</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">暂无客户数据</td></tr>
                ) : customers.map((c: any) => (
                  <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                    <td className="px-4 py-3 font-medium text-indigo-600">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.industry || "-"}</td>
                    <td className="px-4 py-3">{c.owner?.name || <span className="text-gray-500">公海</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags?.map((t: any) => (
                          <span key={t.tag.id} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[t.tag.name] || "bg-gray-100 text-gray-700"}`}>{t.tag.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{c._count.contacts}</td>
                    <td className="px-4 py-3 text-center">{c._count.deals}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="inline-flex items-center h-8 px-3 text-xs rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button className="inline-flex items-center h-8 px-3 text-xs rounded-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
        </div>
      )}

      {showCreate && (
        <CreateCustomerModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />
      )}
    </div>
  );
}

function CreateCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", industry: "", phone: "", email: "", address: "", remark: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold">新建客户</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">客户名称 *</label>
            <input className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">行业</label>
            <input className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">电话</label>
            <input className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">邮箱</label>
            <input type="email" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">地址</label>
            <input className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">备注</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200 hover:bg-gray-50">取消</button>
            <button type="submit" disabled={saving} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "创建中..." : "创建"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
