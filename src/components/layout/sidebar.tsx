"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers";
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  FileSignature,
  PhoneCall,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/customers", label: "客户", icon: Users },
  { href: "/deals", label: "销售看板", icon: Kanban },
  { href: "/quotations", label: "报价单", icon: FileText },
  { href: "/contracts", label: "合同", icon: FileSignature },
  { href: "/activities", label: "跟进记录", icon: PhoneCall },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <aside className="w-56 bg-[#1a1a2e] text-white flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <h1 className="text-lg font-bold">轻量 CRM</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-[#4f46e5] text-white"
                  : "text-gray-300 hover:bg-[#16213e] hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-3 py-3 border-t border-white/10 relative">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#16213e] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-medium">
            {user?.name?.charAt(0) || "U"}
          </div>
          <span className="flex-1 text-left truncate">
            {user?.name || "用户"}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showProfile && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#16213e] rounded-lg py-1 shadow-lg">
            <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10">
              {user?.email}
              <br />
              <span className="text-[#4f46e5]">
                {user?.role === "ADMIN"
                  ? "管理员"
                  : "普通成员"}
              </span>
            </div>
            <button
              onClick={() => { logout(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
