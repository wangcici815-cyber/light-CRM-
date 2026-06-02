"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  TERMINATED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "草稿",
  ACTIVE: "进行中",
  COMPLETED: "已完成",
  TERMINATED: "已终止",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/contracts?page=${page}`);
    const json = await res.json();
    setContracts(json.data);
    setTotal(json.total);
    setLoading(false);
  }

  useEffect(() => { load() }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">合同</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {total} 个合同</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1" /> 新建合同
        </button>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-500">合同编号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">合同名称</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">客户</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">金额</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">开始日期</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">结束日期</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">暂无合同</td></tr>
                ) : contracts.map((c: any) => (
                  <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => setDetailId(c.id)}>
                    <td className="px-4 py-3 font-medium text-indigo-600">{c.contractNumber}</td>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3">{c.deal?.customer?.name || "-"}</td>
                    <td className="px-4 py-3 text-right font-medium">¥{c.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{statusLabels[c.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}</td>
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

      {showCreate && <CreateContractModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
      {detailId && <ContractDetailModal id={detailId} onClose={() => setDetailId(null)} onUpdated={() => { setDetailId(null); load() }} />}
    </div>
  );
}

function CreateContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [form, setForm] = useState({ dealId: "", title: "", totalAmount: "", status: "DRAFT", startDate: "", endDate: "", content: "", signedDate: "", remark: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/deals?pageSize=100").then(r => r.json()).then(j => setDeals(j.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dealId || !form.title) return;
    setSaving(true);
    await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold">新建合同</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">关联商机 *</label>
            <select className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.dealId} onChange={e => setForm(f => ({ ...f, dealId: e.target.value }))} required>
              <option value="">选择商机...</option>
              {deals.map((d: any) => (
                <option key={d.id} value={d.id}>{d.title} - {d.customer?.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">合同名称 *</label>
            <input className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">金额</label>
              <input type="number" step="0.01" min="0" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">状态</label>
              <select className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="DRAFT">草稿</option>
                <option value="ACTIVE">进行中</option>
                <option value="COMPLETED">已完成</option>
                <option value="TERMINATED">已终止</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">开始日期</label>
              <input type="date" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">结束日期</label>
              <input type="date" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">签约日期</label>
            <input type="date" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.signedDate} onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">合同内容</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">备注</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
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

function ContractDetailModal({ id, onClose, onUpdated }: { id: string; onClose: () => void; onUpdated: () => void }) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/contracts/${id}`).then(r => r.json()).then(data => {
      setContract(data);
      setForm({
        title: data.title,
        totalAmount: String(data.totalAmount || ""),
        status: data.status,
        startDate: data.startDate ? data.startDate.split("T")[0] : "",
        endDate: data.endDate ? data.endDate.split("T")[0] : "",
        content: data.content || "",
        signedDate: data.signedDate ? data.signedDate.split("T")[0] : "",
        remark: data.remark || "",
      });
      setLoading(false);
    });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/contracts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditing(false);
    onUpdated();
  }

  async function handleDelete() {
    if (!confirm("确定删除此合同？")) return;
    await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    onUpdated();
  }

  async function transitionStatus(newStatus: string) {
    await fetch(`/api/contracts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onUpdated();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">{contract.contractNumber}</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>{statusLabels[contract.status]}</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-lg leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">客户：</span>
                  <span className="font-medium">{contract.deal?.customer?.name || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">商机：</span>
                  <span className="font-medium">{contract.deal?.title || "-"}</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">合同名称：</span>
                <span className="font-medium">{contract.title}</span>
              </div>

              {contract.totalAmount > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500">金额：</span>
                  <span className="font-medium">¥{contract.totalAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {contract.startDate && (
                  <div>
                    <span className="text-gray-500">开始日期：</span>
                    <span className="font-medium">{new Date(contract.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {contract.endDate && (
                  <div>
                    <span className="text-gray-500">结束日期：</span>
                    <span className="font-medium">{new Date(contract.endDate).toLocaleDateString()}</span>
                  </div>
                )}
                {contract.signedDate && (
                  <div>
                    <span className="text-gray-500">签约日期：</span>
                    <span className="font-medium">{new Date(contract.signedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {contract.content && (
                <div className="text-sm">
                  <span className="text-gray-500">合同内容：</span>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{contract.content}</p>
                </div>
              )}

              {contract.remark && (
                <div className="text-sm">
                  <span className="text-gray-500">备注：</span>
                  <span className="text-gray-600">{contract.remark}</span>
                </div>
              )}

              {/* Status transitions */}
              {contract.status === "DRAFT" && (
                <button onClick={() => transitionStatus("ACTIVE")} className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700">激活合同</button>
              )}
              {contract.status === "ACTIVE" && (
                <button onClick={() => transitionStatus("COMPLETED")} className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">标记为已完成</button>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditing(true)} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200 hover:bg-gray-50">编辑</button>
                <button onClick={handleDelete} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50">删除</button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900">合同名称</label>
                <input className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-900">金额</label>
                  <input type="number" step="0.01" min="0" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-900">状态</label>
                  <select className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="DRAFT">草稿</option>
                    <option value="ACTIVE">进行中</option>
                    <option value="COMPLETED">已完成</option>
                    <option value="TERMINATED">已终止</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-900">开始日期</label>
                  <input type="date" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-900">结束日期</label>
                  <input type="date" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900">签约日期</label>
                <input type="date" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.signedDate} onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900">合同内容</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-900">备注</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200 hover:bg-gray-50">取消</button>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
