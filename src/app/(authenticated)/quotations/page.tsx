"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Pagination } from "@/components/ui";
import { quotationStatusColors, quotationStatusLabels } from "@/lib/constants";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/quotations?page=${page}`);
    const json = await res.json();
    setQuotations(json.data);
    setTotal(json.total);
    setLoading(false);
  }

  useEffect(() => { load() }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">报价单</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {total} 个报价单</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1" /> 新建报价单
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
                  <th className="text-left px-4 py-3 font-medium text-gray-500">报价单号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">客户</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">关联商机</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">总金额</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">暂无报价单</td></tr>
                ) : quotations.map((q: any) => (
                  <tr key={q.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => setDetailId(q.id)}>
                    <td className="px-4 py-3 font-medium text-indigo-600">{q.quoteNumber}</td>
                    <td className="px-4 py-3">{q.deal?.customer?.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{q.deal?.title || "-"}</td>
                    <td className="px-4 py-3 text-right font-medium">¥{q.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${quotationStatusColors[q.status]}`}>{quotationStatusLabels[q.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(q.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showCreate && <CreateQuotationModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
      {detailId && <QuotationDetailModal id={detailId} onClose={() => setDetailId(null)} onUpdated={() => { setDetailId(null); load() }} />}
    </div>
  );
}

function CreateQuotationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [dealId, setDealId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [remark, setRemark] = useState("");
  const [items, setItems] = useState<any[]>([{ itemName: "", description: "", quantity: 1, unitPrice: 0, amount: 0, image: "" }]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/deals?pageSize=100").then(r => r.json()).then(j => setDeals(j.data || []));
  }, []);

  function updateItem(i: number, field: string, value: any) {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(newItems[i].quantity) || 0;
      const price = parseFloat(newItems[i].unitPrice) || 0;
      newItems[i].amount = qty * price;
    }
    setItems(newItems);
  }

  const gridRef = useRef<HTMLDivElement>(null);
  const COL_KEYS = ["itemName", "quantity", "unitPrice", "image"];

  function cellId(row: number, col: number) { return `r${row}c${col}`; }

  function focusCell(row: number, col: number) {
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-cell="${cellId(row, col)}"]`);
    el?.focus();
    if (el instanceof HTMLInputElement) el.select();
  }

  function handleKeyDown(e: React.KeyboardEvent, ri: number, ci: number) {
    let tr = ri, tc = ci;
    switch (e.key) {
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) { tc--; if (tc < 0) { tc = COL_KEYS.length - 1; tr--; } }
        else { tc++; if (tc >= COL_KEYS.length) { tc = 0; tr++; } }
        break;
      case "Enter":
        e.preventDefault();
        tr = ri + 1; tc = ci;
        break;
      default: return;
    }
    if (tr < 0) return;
    if (tr >= items.length) {
      addItem();
      requestAnimationFrame(() => focusCell(tr, tc));
      return;
    }
    focusCell(tr, tc);
  }

  function handlePaste(e: React.ClipboardEvent, startRow: number) {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    const rows = text.split("\n").filter((r) => r.trim());
    if (rows.length === 0) return;
    const next = [...items];
    rows.forEach((row, ri) => {
      const idx = startRow + ri;
      while (next.length <= idx) next.push({ itemName: "", description: "", quantity: 1, unitPrice: 0, amount: 0, image: "" });
      const vals = row.split("\t");
      if (vals[0] !== undefined) next[idx].itemName = vals[0];
      if (vals[1] !== undefined) next[idx].description = vals[1];
      if (vals[2] !== undefined) next[idx].quantity = parseFloat(vals[2]) || 1;
      if (vals[3] !== undefined) next[idx].unitPrice = parseFloat(vals[3]) || 0;
      if (vals[4] !== undefined) next[idx].image = vals[4];
      next[idx].amount = (parseFloat(next[idx].quantity) || 0) * (parseFloat(next[idx].unitPrice) || 0);
    });
    setItems(next);
  }

  function addItem() {
    setItems([...items, { itemName: "", description: "", quantity: 1, unitPrice: 0, amount: 0, image: "" }]);
  }

  function removeItem(i: number) {
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
  }

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  function descPreview(d: string) {
    if (!d) return <span className="text-gray-300">添加描述</span>;
    return d.length > 40 ? d.slice(0, 40) + "..." : d;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dealId) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId,
        validUntil: validUntil || null,
        remark: remark || null,
        items: items.map(item => ({
          itemName: item.itemName,
          description: item.description || null,
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          image: item.image || null,
        })),
      }),
    });
    if (!res.ok) { setSaving(false); setError("创建失败"); return; }
    setSaving(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold">新建报价单</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">关联商机 *</label>
            <select className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={dealId} onChange={e => setDealId(e.target.value)} required>
              <option value="">选择商机...</option>
              {deals.map((d: any) => (
                <option key={d.id} value={d.id}>{d.title} - {d.customer?.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">有效期至</label>
              <input type="date" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900">行项目 <span className="text-xs text-gray-400 font-normal">(Tab/Enter切换单元格，支持从Excel粘贴)</span></label>
              <button type="button" onClick={addItem} className="inline-flex items-center h-7 px-3 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">+ 添加行</button>
            </div>
            <div ref={gridRef} className="border border-gray-200 rounded-lg overflow-hidden" onPaste={e => handlePaste(e, items.length > 0 ? items.length - 1 : 0)}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-10"></th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 w-[200px]">商品名称</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500">描述</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 w-[80px]">数量</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 w-[100px]">单价</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 w-[100px]">金额</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 w-[120px]">图片</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <Fragment key={i}>
                      <tr className="border-b border-gray-100">
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} className="text-gray-400 hover:text-gray-700">
                            {expandedIndex === i ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 0)} onKeyDown={e => handleKeyDown(e, i, 0)} className="w-full h-8 px-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="商品名称" value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)} required />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500 truncate max-w-[160px]">
                          {descPreview(item.description)}
                        </td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 1)} onKeyDown={e => handleKeyDown(e, i, 1)} type="number" step="1" min="1" className="w-full h-8 px-2 rounded border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} />
                        </td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 2)} onKeyDown={e => handleKeyDown(e, i, 2)} type="number" step="0.01" min="0" className="w-full h-8 px-2 rounded border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">¥{(parseFloat(item.amount) || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 3)} onKeyDown={e => handleKeyDown(e, i, 3)} className="w-full h-8 px-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="商品图URL" value={item.image} onChange={e => updateItem(i, "image", e.target.value)} />
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                      {expandedIndex === i && (
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <td colSpan={8} className="px-4 py-3">
                            <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" rows={4} placeholder="输入商品描述..." value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-3 py-2 text-right font-medium text-gray-700">合计</td>
                    <td className="px-3 py-2 text-right font-bold text-indigo-600">¥{totalAmount.toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">备注</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} value={remark} onChange={e => setRemark(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200 hover:bg-gray-50">取消</button>
            <button type="submit" disabled={saving} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "创建中..." : "创建"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuotationDetailModal({ id, onClose, onUpdated }: { id: string; onClose: () => void; onUpdated: () => void }) {
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [remark, setRemark] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quotations/${id}`).then(r => r.json()).then(data => {
      setQuotation(data);
      setStatus(data.status);
      setValidUntil(data.validUntil ? data.validUntil.split("T")[0] : "");
      setRemark(data.remark || "");
      setItems(data.items || []);
      setLoading(false);
    });
  }, [id]);

  function updateItem(i: number, field: string, value: any) {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(newItems[i].quantity) || 0;
      const price = parseFloat(newItems[i].unitPrice) || 0;
      newItems[i].amount = qty * price;
    }
    setItems(newItems);
  }

  const gridRef = useRef<HTMLDivElement>(null);
  const COL_KEYS = ["itemName", "quantity", "unitPrice", "image"];

  function cellId(row: number, col: number) { return `r${row}c${col}`; }

  function focusCell(row: number, col: number) {
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-cell="${cellId(row, col)}"]`);
    el?.focus();
    if (el instanceof HTMLInputElement) el.select();
  }

  function handleKeyDown(e: React.KeyboardEvent, ri: number, ci: number) {
    let tr = ri, tc = ci;
    switch (e.key) {
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) { tc--; if (tc < 0) { tc = COL_KEYS.length - 1; tr--; } }
        else { tc++; if (tc >= COL_KEYS.length) { tc = 0; tr++; } }
        break;
      case "Enter":
        e.preventDefault();
        tr = ri + 1; tc = ci;
        break;
      default: return;
    }
    if (tr < 0) return;
    if (tr >= items.length) {
      addItem();
      requestAnimationFrame(() => focusCell(tr, tc));
      return;
    }
    focusCell(tr, tc);
  }

  function handlePaste(e: React.ClipboardEvent, startRow: number) {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    const rows = text.split("\n").filter((r) => r.trim());
    if (rows.length === 0) return;
    const next = [...items];
    rows.forEach((row, ri) => {
      const idx = startRow + ri;
      while (next.length <= idx) next.push({ itemName: "", description: "", quantity: 1, unitPrice: 0, amount: 0, image: "" });
      const vals = row.split("\t");
      if (vals[0] !== undefined) next[idx].itemName = vals[0];
      if (vals[1] !== undefined) next[idx].description = vals[1];
      if (vals[2] !== undefined) next[idx].quantity = parseFloat(vals[2]) || 1;
      if (vals[3] !== undefined) next[idx].unitPrice = parseFloat(vals[3]) || 0;
      if (vals[4] !== undefined) next[idx].image = vals[4];
      next[idx].amount = (parseFloat(next[idx].quantity) || 0) * (parseFloat(next[idx].unitPrice) || 0);
    });
    setItems(next);
  }

  function addItem() {
    setItems([...items, { itemName: "", description: "", quantity: 1, unitPrice: 0, amount: 0, image: "" }]);
  }

  function removeItem(i: number) {
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
  }

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  function descPreview(d: string) {
    if (!d) return <span className="text-gray-300">添加描述</span>;
    return d.length > 40 ? d.slice(0, 40) + "..." : d;
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/quotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        validUntil: validUntil || null,
        remark,
        items: items.map(item => ({
          itemName: item.itemName,
          description: item.description || null,
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          image: item.image || null,
        })),
      }),
    });
    setSaving(false);
    setEditing(false);
    onUpdated();
  }

  async function handleDelete() {
    if (!confirm("确定删除此报价单？")) return;
    await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    onUpdated();
  }

  const nextStatus: Record<string, string> = {
    DRAFT: "SENT",
    SENT: "ACCEPTED",
  };

  async function transitionStatus(newStatus: string) {
    await fetch(`/api/quotations/${id}`, {
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
        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-3xl mx-4 p-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!quotation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">{quotation.quoteNumber}</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${quotationStatusColors[status]}`}>{quotationStatusLabels[status]}</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-lg leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">客户：</span>
              <span className="font-medium">{quotation.deal?.customer?.name || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500">商机：</span>
              <span className="font-medium">{quotation.deal?.title || "-"}</span>
            </div>
            {validUntil && (
              <div>
                <span className="text-gray-500">有效期至：</span>
                <span className="font-medium">{validUntil}</span>
              </div>
            )}
          </div>

          {!editing && quotation.status === "DRAFT" && (
            <div className="flex gap-2">
              <button onClick={() => transitionStatus("SENT")} className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">标记为已发送</button>
            </div>
          )}
          {!editing && quotation.status === "SENT" && (
            <div className="flex gap-2">
              <button onClick={() => transitionStatus("ACCEPTED")} className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700">标记为已接受</button>
              <button onClick={() => transitionStatus("REJECTED")} className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700">标记为已拒绝</button>
            </div>
          )}

          <div ref={gridRef} className="border border-gray-200 rounded-lg overflow-hidden" onPaste={editing ? (e) => handlePaste(e, items.length > 0 ? items.length - 1 : 0) : undefined}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {editing && <th className="w-10"></th>}
                  <th className="text-left px-3 py-2 font-medium text-gray-500">商品名称</th>
                  {!editing && <th className="text-left px-3 py-2 font-medium text-gray-500">描述</th>}
                  <th className="text-right px-3 py-2 font-medium text-gray-500">数量</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">单价</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">金额</th>
                  {editing && <th className="text-left px-3 py-2 font-medium text-gray-500">图片</th>}
                  {editing && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {(editing ? items : quotation.items || []).map((item: any, i: number) =>
                  editing ? (
                    <Fragment key={i}>
                      <tr className="border-b border-gray-100">
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} className="text-gray-400 hover:text-gray-700">
                            {expandedIndex === i ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 0)} onKeyDown={e => handleKeyDown(e, i, 0)} className="w-full h-8 px-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)} required />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500 truncate max-w-[160px]">
                          {descPreview(item.description)}
                        </td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 1)} onKeyDown={e => handleKeyDown(e, i, 1)} type="number" step="1" min="1" className="w-full h-8 px-2 rounded border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} />
                        </td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 2)} onKeyDown={e => handleKeyDown(e, i, 2)} type="number" step="0.01" min="0" className="w-full h-8 px-2 rounded border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">¥{(parseFloat(item.amount) || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <input data-cell={cellId(i, 3)} onKeyDown={e => handleKeyDown(e, i, 3)} className="w-full h-8 px-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.image || ""} onChange={e => updateItem(i, "image", e.target.value)} />
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                      {expandedIndex === i && (
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <td colSpan={8} className="px-4 py-3">
                            <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" rows={4} placeholder="输入商品描述..." value={item.description || ""} onChange={e => updateItem(i, "description", e.target.value)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ) : (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium">{item.itemName}</td>
                      <td className="px-3 py-2 text-gray-500">{item.description || "-"}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">¥{item.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-medium">¥{item.amount.toLocaleString()}</td>
                    </tr>
                  )
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-3 py-2 text-right font-medium text-gray-700">合计</td>
                  <td className="px-3 py-2 text-right font-bold text-indigo-600">¥{(editing ? totalAmount : quotation.totalAmount || 0).toLocaleString()}</td>
                  {editing && <td colSpan={3}></td>}
                </tr>
              </tfoot>
            </table>
            {editing && (
              <div className="px-3 py-2 border-t border-gray-200">
                <button type="button" onClick={addItem} className="inline-flex items-center h-7 px-3 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">+ 添加行</button>
              </div>
            )}
          </div>

          {remark && <div className="text-sm text-gray-600"><span className="text-gray-500">备注：</span>{remark}</div>}

          <div className="flex justify-between pt-2">
            {editing ? (
              <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200 hover:bg-gray-50">取消编辑</button>
            ) : (
              <div className="flex gap-2">
                {(quotation.status === "DRAFT" || quotation.status === "SENT") && (
                  <button onClick={() => setEditing(true)} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200 hover:bg-gray-50">编辑</button>
                )}
                <button onClick={handleDelete} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50">删除</button>
              </div>
            )}
            {editing && (
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
