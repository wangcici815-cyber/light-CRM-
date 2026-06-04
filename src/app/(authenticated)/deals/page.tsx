"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { useFetch } from "@/lib/use-fetch";
import { Button, Card, Badge, Modal, Input, Loading } from "@/components/ui";
import { Plus, FileText, FileSignature, ChevronRight, ChevronDown } from "lucide-react";
import { quotationStatusColors, quotationStatusLabels, contractStatusColors, contractStatusLabels } from "@/lib/constants";
export default function DealsPage() {
  const { data: board, loading, refresh } = useFetch<any[]>("/api/deals/board");
  const [showCreate, setShowCreate] = useState(false);
  const [dragDeal, setDragDeal] = useState<any>(null);

  async function handleDrop(stageId: string) {
    if (!dragDeal || dragDeal.stageId === stageId) return;
    await fetch(`/api/deals/${dragDeal.id}/stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    setDragDeal(null);
    refresh();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">销售看板</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">拖拽卡片变更销售阶段</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" />新建商机</Button>
      </div>

      {loading ? <Loading /> : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
          {board?.map((stage: any) => {
            const totalAmount = stage.deals.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-72 bg-[#f1f3f5] rounded-xl"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Stage header */}
                <div className="px-3 py-3 border-b border-[#e5e7eb]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-semibold">{stage.name}</span>
                    <span className="text-xs text-[#6b7280] ml-auto">{stage.deals.length}</span>
                  </div>
                  <p className="text-xs text-[#6b7280] mt-1">${totalAmount.toLocaleString()}</p>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2">
                  {stage.deals.length === 0 ? (
                    <div className="text-xs text-[#6b7280] text-center py-4">暂无商机</div>
                  ) : stage.deals.map((deal: any) => (
                    <DealCard key={deal.id} deal={deal} onDragStart={() => setDragDeal({ ...deal, stageId: stage.id })} onUpdate={refresh} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateDealModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refresh() }} />}
    </div>
  );
}

function DealCard({ deal, onDragStart, onUpdate }: { deal: any; onDragStart: () => void; onUpdate: () => void }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div
        className="bg-white rounded-lg p-3 shadow-sm border border-[#e5e7eb] cursor-grab hover:shadow-md transition-shadow"
        draggable
        onDragStart={onDragStart}
        onClick={() => setShowDetail(true)}
      >
        <p className="text-sm font-medium">{deal.title}</p>
        <p className="text-xs text-[#6b7280] mt-1">{deal.customer?.name}</p>
        <div className="flex items-center justify-between mt-2">
          {deal.amount ? <span className="text-sm font-semibold">${deal.amount.toLocaleString()}</span> : <span />}
          <span className="text-xs text-[#6b7280]">{deal.owner?.name}</span>
        </div>
      </div>

      {showDetail && (
        <DealDetailModal deal={deal} onClose={() => setShowDetail(false)} onUpdate={onUpdate} />
      )}
    </>
  );
}

function DealDetailModal({ deal, onClose, onUpdate }: { deal: any; onClose: () => void; onUpdate: () => void }) {
  const { data: fullDeal, loading } = useFetch<any>(`/api/deals/${deal.id}`);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);

  async function handleClose(status: "WON" | "LOST") {
    await fetch(`/api/deals/${deal.id}/close`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onUpdate();
    onClose();
  }

  if (loading) return <Modal open={true} onClose={onClose} title="加载中..."><Loading /></Modal>;

  const quotations = fullDeal?.quotations || [];
  const contracts = fullDeal?.contracts || [];

  return (
    <Modal open={true} onClose={onClose} title={deal.title}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#6b7280]">客户</p>
            <p className="font-medium">{deal.customer?.name}</p>
          </div>
          <div>
            <p className="text-[#6b7280]">金额</p>
            <p className="font-medium">${deal.amount?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-[#6b7280]">阶段</p>
            <p className="font-medium">{deal.stage?.name}</p>
          </div>
          <div>
            <p className="text-[#6b7280]">负责人</p>
            <p className="font-medium">{deal.owner?.name}</p>
          </div>
        </div>

        {fullDeal?.activities?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">跟进记录</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {fullDeal.activities.map((a: any) => (
                <div key={a.id} className="text-xs border-b border-[#e5e7eb] pb-2">
                  <p>{a.content}</p>
                  <p className="text-[#6b7280] mt-0.5">{a.owner?.name} · {new Date(a.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotations */}
        {quotations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> 报价单</h4>
            <div className="space-y-1">
              {quotations.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-indigo-600">{q.quoteNumber}</span>
                  <span>¥{q.totalAmount.toLocaleString()}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${quotationStatusColors[q.status]}`}>
                    {quotationStatusLabels[q.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contracts */}
        {contracts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><FileSignature className="w-3.5 h-3.5" /> 合同</h4>
            <div className="space-y-1">
              {contracts.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-indigo-600">{c.contractNumber}</span>
                  <span className="text-gray-700">{c.title}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${contractStatusColors[c.status]}`}>
                    {contractStatusLabels[c.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {deal.status === "OPEN" && (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={() => handleClose("WON")}>成交</Button>
              <Button variant="danger" className="flex-1" onClick={() => handleClose("LOST")}>丢单</Button>
            </div>
            <Button onClick={() => setShowCreateQuote(true)} className="w-full">创建报价单</Button>
          </div>
        )}
        {deal.status === "WON" && (
          <div className="space-y-2 pt-2">
            <Badge className="bg-green-100 text-green-700">已成交</Badge>
            <Button onClick={() => setShowCreateContract(true)} className="w-full">生成合同</Button>
          </div>
        )}
        {deal.status === "LOST" && <Badge className="bg-red-100 text-red-700">已丢失</Badge>}
      </div>

      {showCreateQuote && (
        <CreateQuoteInlineModal
          dealId={deal.id}
          onClose={() => setShowCreateQuote(false)}
          onCreated={() => { setShowCreateQuote(false); onUpdate(); }}
        />
      )}
      {showCreateContract && (
        <CreateContractInlineModal
          dealId={deal.id}
          defaultTitle={deal.title}
          defaultAmount={deal.amount}
          onClose={() => setShowCreateContract(false)}
          onCreated={() => { setShowCreateContract(false); onUpdate(); }}
        />
      )}
    </Modal>
  );
}

function CreateQuoteInlineModal({ dealId, onClose, onCreated }: { dealId: string; onClose: () => void; onCreated: () => void }) {
  const [items, setItems] = useState<any[]>([{ itemName: "", description: "", quantity: 1, unitPrice: 0, amount: 0, image: "" }]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const COL_KEYS = ["itemName", "quantity", "unitPrice"];
  function cellId(row: number, col: number) { return `g${row}c${col}`; }
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
    if (tr >= items.length) { addItem(); requestAnimationFrame(() => focusCell(tr, tc)); return; }
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
      next[idx].amount = (parseFloat(next[idx].quantity) || 0) * (parseFloat(next[idx].unitPrice) || 0);
    });
    setItems(next);
  }

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

  function addItem() {
    setItems([...items, { itemName: "", description: "", quantity: 1, unitPrice: 0, amount: 0, image: "" }]);
  }

  function removeItem(i: number) {
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
  }

  function descPreview(d: string) {
    if (!d) return <span className="text-gray-300">添加描述</span>;
    return d.length > 40 ? d.slice(0, 40) + "..." : d;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId,
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
    onCreated();
  }

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <Modal open={true} onClose={onClose} title="新建报价单">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={gridRef} className="border border-gray-200 rounded-lg overflow-hidden" onPaste={e => handlePaste(e, items.length > 0 ? items.length - 1 : 0)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-8"></th>
                <th className="text-left px-2 py-1.5 font-medium text-gray-500">商品名称</th>
                <th className="text-left px-2 py-1.5 font-medium text-gray-500">描述</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500 w-16">数量</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500 w-20">单价</th>
                <th className="text-right px-2 py-1.5 font-medium text-gray-500 w-20">金额</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <Fragment key={i}>
                  <tr className="border-b border-gray-100">
                    <td className="px-1 py-1">
                      <button type="button" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} className="text-gray-400 hover:text-gray-700">
                        {expandedIndex === i ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-2 py-1">
                      <input data-cell={cellId(i, 0)} onKeyDown={e => handleKeyDown(e, i, 0)} className="w-full h-7 px-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="名称" value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)} required />
                    </td>
                    <td className="px-2 py-1 text-xs text-gray-500 truncate max-w-[120px]">
                      {descPreview(item.description)}
                    </td>
                    <td className="px-2 py-1">
                      <input data-cell={cellId(i, 1)} onKeyDown={e => handleKeyDown(e, i, 1)} type="number" min="1" className="w-full h-7 px-1.5 rounded border border-gray-200 text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input data-cell={cellId(i, 2)} onKeyDown={e => handleKeyDown(e, i, 2)} type="number" step="0.01" min="0" className="w-full h-7 px-1.5 rounded border border-gray-200 text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} />
                    </td>
                    <td className="px-2 py-1 text-right text-xs font-medium">¥{(parseFloat(item.amount) || 0).toLocaleString()}</td>
                    <td className="px-1 py-1">
                      <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                    </td>
                  </tr>
                  {expandedIndex === i && (
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <td colSpan={7} className="px-3 py-2">
                        <textarea className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" rows={3} placeholder="输入商品描述..." value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-2 py-1 text-right text-xs font-medium text-gray-700">合计</td>
                <td className="px-2 py-1 text-right text-xs font-bold text-indigo-600">¥{totalAmount.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-800">+ 添加行项目</button>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={saving}>{saving ? "创建中..." : "创建"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateContractInlineModal({ dealId, defaultTitle, defaultAmount, onClose, onCreated }: { dealId: string; defaultTitle: string; defaultAmount: number; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: defaultTitle || "", totalAmount: String(defaultAmount || ""), startDate: "", endDate: "", content: "", signedDate: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dealId }),
    });
    setSaving(false);
    onCreated();
  }

  return (
    <Modal open={true} onClose={onClose} title="生成合同">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="合同名称 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        <Input label="合同金额" type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="开始日期" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          <Input label="结束日期" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <Input label="签约日期" type="date" value={form.signedDate} onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))} />
        <div className="space-y-1">
          <label className="block text-sm font-medium">合同内容</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm" rows={3} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={saving}>{saving ? "创建中..." : "创建"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateDealModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data: stages } = useFetch<any[]>("/api/pipeline/stages");
  const { data: customersData } = useFetch<any>("/api/customers?pageSize=100");
  const [form, setForm] = useState({ title: "", amount: "", customerId: "", stageId: "", expectedCloseDate: "", remark: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.customerId || !form.stageId) return;
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onCreated();
  }

  return (
    <Modal open={true} onClose={onClose} title="新建商机">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="商机名称 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        <Input label="预计金额" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />

        <div className="space-y-1">
          <label className="block text-sm font-medium">关联客户 *</label>
          <select className="w-full h-9 px-3 rounded-lg border border-[#e5e7eb] text-sm" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
            <option value="">请选择</option>
            {customersData?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">销售阶段 *</label>
          <select className="w-full h-9 px-3 rounded-lg border border-[#e5e7eb] text-sm" value={form.stageId} onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))} required>
            <option value="">请选择</option>
            {stages?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <Input label="预计成交日期" type="date" value={form.expectedCloseDate} onChange={e => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))} />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
          <Button type="submit">创建</Button>
        </div>
      </form>
    </Modal>
  );
}
