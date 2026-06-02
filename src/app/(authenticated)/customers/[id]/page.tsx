"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Card, Loading, Input } from "@/components/ui";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Plus, Trash2 } from "lucide-react";
import { useFetch } from "@/lib/use-fetch";

const typeColors: Record<string, string> = {
  "高意向": "bg-green-100 text-green-700",
  "意向一般": "bg-amber-100 text-amber-700",
  "已流失": "bg-red-100 text-red-700",
  "VIP客户": "bg-purple-100 text-purple-700",
  "新客户": "bg-blue-100 text-blue-700",
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: customer, loading, refresh } = useFetch<any>(`/api/customers/${id}`);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEdit, setShowEdit] = useState(false);

  if (loading) return <div className="p-6"><Loading /></div>;
  if (!customer) return <div className="p-6 text-[#6b7280]">客户不存在</div>;

  const tabs = [
    { key: "overview", label: "概览" },
    { key: "contacts", label: `联系人 (${customer.contacts?.length || 0})` },
    { key: "deals", label: `商机 (${customer.deals?.length || 0})` },
    { key: "activities", label: "跟进" },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Back button */}
      <button onClick={() => router.push("/customers")} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a2e]">
        <ArrowLeft className="w-4 h-4" /> 返回客户列表
      </button>

      {/* Header card */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{customer.name}</h1>
            <p className="text-sm text-[#6b7280] mt-1">{customer.industry || "未设置行业"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>编辑</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {customer.phone && <span className="flex items-center gap-1 text-[#6b7280]"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>}
          {customer.email && <span className="flex items-center gap-1 text-[#6b7280]"><Mail className="w-3.5 h-3.5" />{customer.email}</span>}
          {customer.address && <span className="flex items-center gap-1 text-[#6b7280]"><MapPin className="w-3.5 h-3.5" />{customer.address}</span>}
          <span className="flex items-center gap-1 text-[#6b7280]"><Building2 className="w-3.5 h-3.5" />负责人：{customer.owner?.name || "公海"}</span>
        </div>
        {customer.tags?.length > 0 && (
          <div className="flex gap-1 mt-3">
            {customer.tags.map((t: any) => (
              <Badge key={t.tag.id} className={typeColors[t.tag.name] || "bg-gray-100"}>{t.tag.name}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e7eb]">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-[#4f46e5] text-[#4f46e5]" : "border-transparent text-[#6b7280] hover:text-[#1a1a2e]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-medium">备注</h3>
          <p className="text-sm text-[#6b7280]">{customer.remark || "暂无备注"}</p>
        </Card>
      )}

      {activeTab === "contacts" && <ContactsTab customerId={id} contacts={customer.contacts} refresh={refresh} />}
      {activeTab === "deals" && <DealsTab deals={customer.deals} customerId={id} onUpdate={refresh} />}
      {activeTab === "activities" && <ActivitiesTab customerId={id} />}

      {/* Edit modal */}
      {showEdit && (
        <EditCustomerModal customer={customer} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refresh() }} />
      )}
    </div>
  );
}

function ContactsTab({ customerId, contacts, refresh }: { customerId: string; contacts: any[]; refresh: () => void }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5 mr-1" />添加联系人</Button>
      </div>
      {contacts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6b7280]">暂无联系人</Card>
      ) : (
        <div className="grid gap-3">
          {contacts.map((c: any) => (
            <Card key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.name} {c.isPrimary && <Badge className="bg-blue-100 text-blue-700 ml-1">主要</Badge>}</p>
                <p className="text-xs text-[#6b7280] mt-0.5">{c.position} · {c.phone} · {c.email}</p>
              </div>
              <button className="text-xs text-red-500 hover:text-red-600"
                onClick={async () => { await fetch(`/api/contacts/${c.id}`, { method: "DELETE" }); refresh() }}
              >删除</button>
            </Card>
          ))}
        </div>
      )}
      {showForm && <ContactForm customerId={customerId} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); refresh() }} />}
    </div>
  );
}

function ContactForm({ customerId, onClose, onCreated }: { customerId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", position: "", phone: "", email: "", wechat: "" });
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, customerId }) });
    onCreated();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-5">
        <h3 className="text-sm font-semibold mb-4">添加联系人</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="姓名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="职位" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
          <Input label="电话" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="邮箱" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="微信" value={form.wechat} onChange={e => setForm(f => ({ ...f, wechat: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
            <Button type="submit">添加</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealsTab({ deals, customerId, onUpdate }: { deals: any[]; customerId: string; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5 mr-1" />新建商机</Button>
      </div>
      {deals.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6b7280]">暂无商机</Card>
      ) : (
        <div className="grid gap-3">
          {deals.map((d: any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    {d.stage?.name} · {d.status === "WON" ? "已成交" : d.status === "LOST" ? "已丢失" : "跟进中"}
                  </p>
                </div>
                <span className="text-sm font-semibold">${d.amount?.toLocaleString() || 0}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showForm && <CreateDealModal customerId={customerId} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); onUpdate() }} />}
    </div>
  );
}

function CreateDealModal({ customerId, onClose, onCreated }: { customerId: string; onClose: () => void; onCreated: () => void }) {
  const { data: stages } = useFetch<any[]>("/api/pipeline/stages");
  const [form, setForm] = useState({ title: "", amount: "", expectedCloseDate: "", stageId: "", remark: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.stageId) return;
    await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, customerId }) });
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-5">
        <h3 className="text-sm font-semibold mb-4">新建商机</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="商机名称 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Input label="预计金额" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Input label="预计成交日期" type="date" value={form.expectedCloseDate} onChange={e => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))} />
          <div className="space-y-1">
            <label className="block text-sm font-medium">销售阶段 *</label>
            <select className="w-full h-9 px-3 rounded-lg border border-[#e5e7eb] text-sm" value={form.stageId} onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))} required>
              <option value="">请选择</option>
              {stages?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
            <Button type="submit">创建</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActivitiesTab({ customerId }: { customerId: string }) {
  const { data: activities, loading, refresh } = useFetch<any[]>(`/api/activities?customerId=${customerId}`);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5 mr-1" />记录跟进</Button>
      </div>
      {loading ? <Loading /> : activities?.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6b7280]">暂无跟进记录</Card>
      ) : (
        <div className="space-y-3">
          {activities?.map((a: any) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <Badge className={
                  a.type === "CALL" ? "bg-blue-100 text-blue-700" :
                  a.type === "MEETING" ? "bg-green-100 text-green-700" :
                  a.type === "EMAIL" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-700"
                }>
                  {a.type === "CALL" ? "电话" : a.type === "MEETING" ? "拜访" : a.type === "EMAIL" ? "邮件" : a.type === "WECHAT" ? "微信" : "其他"}
                </Badge>
                <span className="text-xs text-[#6b7280]">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{a.content}</p>
              {a.nextStep && <p className="text-xs text-[#f59e0b] mt-1">下一步：{a.nextStep}</p>}
              <p className="text-xs text-[#6b7280] mt-1">记录人：{a.owner?.name}</p>
            </Card>
          ))}
        </div>
      )}
      {showForm && (
        <ActivityForm customerId={customerId} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); refresh() }} />
      )}
    </div>
  );
}

function ActivityForm({ customerId, dealId, onClose, onCreated }: { customerId: string; dealId?: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ type: "OTHER", content: "", nextStep: "", nextDate: "" });
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.content) return;
    await fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, customerId, dealId }) });
    onCreated();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-5">
        <h3 className="text-sm font-semibold mb-4">记录跟进</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">跟进方式</label>
            <select className="w-full h-9 px-3 rounded-lg border border-[#e5e7eb] text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="CALL">电话</option>
              <option value="MEETING">拜访</option>
              <option value="EMAIL">邮件</option>
              <option value="WECHAT">微信</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">跟进内容 *</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]" rows={4} required
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <Input label="下一步计划" value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))} />
          <Input label="下次跟进日期" type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCustomerModal({ customer, onClose, onSaved }: { customer: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: customer.name, industry: customer.industry || "", phone: customer.phone || "", email: customer.email || "", address: customer.address || "", remark: customer.remark || "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/customers/${customer.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-5">
        <h3 className="text-base font-semibold mb-4">编辑客户</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="客户名称 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="行业" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
          <Input label="电话" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="邮箱" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="地址" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div className="space-y-1">
            <label className="block text-sm font-medium">备注</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]" rows={3}
              value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
