"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useFetch } from "@/lib/use-fetch";
import { Button, Card, Input, Loading } from "@/components/ui";
import { Users, Shield, Plus, Trash2, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#1a1a2e]">系统设置</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[#4f46e5]" />
            <div>
              <p className="text-sm font-medium">个人资料</p>
              <p className="text-xs text-[#6b7280]">修改密码</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-[#6b7280] space-y-1">
            <p>姓名：{session?.user?.name}</p>
            <p>邮箱：{session?.user?.email}</p>
            <p>角色：{isAdmin ? "管理员" : "普通成员"}</p>
          </div>
        </Card>

        {isAdmin && (
          <>
            <Card className="p-5 cursor-pointer hover:bg-[#f8f9fa] transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#4f46e5]" />
                <div>
                  <p className="text-sm font-medium">成员管理</p>
                  <p className="text-xs text-[#6b7280]">添加/禁用团队成员</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 cursor-pointer hover:bg-[#f8f9fa] transition-colors">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-[#4f46e5]" />
                <div>
                  <p className="text-sm font-medium">阶段配置</p>
                  <p className="text-xs text-[#6b7280]">管理销售阶段</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {isAdmin && <UserManagementSection />}
      {isAdmin && <StageManagementSection />}
    </div>
  );
}

function UserManagementSection() {
  const { data: users, loading, refresh } = useFetch<any[]>("/api/admin/users");
  const [showCreate, setShowCreate] = useState(false);

  if (loading) return <Loading />;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">成员管理</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5 mr-1" /> 添加成员</Button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="text-left py-2 font-medium text-[#6b7280]">姓名</th>
            <th className="text-left py-2 font-medium text-[#6b7280]">邮箱</th>
            <th className="text-left py-2 font-medium text-[#6b7280]">角色</th>
            <th className="text-left py-2 font-medium text-[#6b7280]">状态</th>
            <th className="text-left py-2 font-medium text-[#6b7280]">操作</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((u: any) => (
            <tr key={u.id} className="border-b border-[#e5e7eb]">
              <td className="py-2.5">{u.name}</td>
              <td className="py-2.5 text-[#6b7280]">{u.email}</td>
              <td className="py-2.5">{u.role === "ADMIN" ? "管理员" : "普通成员"}</td>
              <td className="py-2.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {u.active ? "启用" : "禁用"}
                </span>
              </td>
              <td className="py-2.5">
                <div className="flex gap-2">
                  <button
                    className="text-xs text-[#4f46e5] hover:underline"
                    onClick={async () => {
                      await fetch(`/api/admin/users/${u.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ active: !u.active }),
                      });
                      refresh();
                    }}
                  >
                    {u.active ? "禁用" : "启用"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refresh() }} />}
    </Card>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) return;
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-5">
        <h3 className="text-sm font-semibold mb-4">添加成员</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="姓名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="邮箱 *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="初始密码 *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <div className="space-y-1">
            <label className="block text-sm font-medium">角色</label>
            <select className="w-full h-9 px-3 rounded-lg border border-[#e5e7eb] text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="MEMBER">普通成员</option>
              <option value="ADMIN">管理员</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
            <Button type="submit">创建</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StageManagementSection() {
  const { data: stages, loading, refresh } = useFetch<any[]>("/api/pipeline/stages");
  const [showCreate, setShowCreate] = useState(false);

  if (loading) return <Loading />;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">销售阶段配置</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5 mr-1" /> 添加阶段</Button>
      </div>

      <div className="space-y-2">
        {stages?.map((s: any) => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-lg">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-sm flex-1">{s.name}</span>
            <span className="text-xs text-[#6b7280]">{s.probability}%</span>
          </div>
        ))}
      </div>

      {showCreate && (
        <StageCreateForm onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refresh() }} />
      )}
    </Card>
  );
}

function StageCreateForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    await fetch("/api/pipeline/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-5">
        <h3 className="text-sm font-semibold mb-4">添加销售阶段</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="阶段名称 *" value={name} onChange={e => setName(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
            <Button type="submit">添加</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
