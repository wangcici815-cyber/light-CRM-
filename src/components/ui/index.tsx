import React from "react";

export function Btn(p: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) {
  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const v = p.variant === "primary" ? "bg-indigo-600 text-white hover:bg-indigo-700" : p.variant === "danger" ? "bg-red-500 text-white hover:bg-red-600" : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50";
  const s = p.size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4";
  const { variant, size, ...rest } = p;
  return <button className={`${base} ${v} ${s} ${p.className || ""}`} {...rest}>{p.children}</button>;
}

export function Card(p: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-white rounded-xl border border-gray-200 ${p.className || ""}`} {...p}>{p.children}</div>;
}

export function Badge(p: { children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.className || ""}`} style={p.style}>{p.children}</span>;
}

export function Loading() {
  return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
}

export function Modal(p: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!p.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={p.onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold">{p.title}</h2>
          <button onClick={p.onClose} className="text-gray-500 hover:text-gray-900 text-lg leading-none">&times;</button>
        </div>
        <div className="p-5">{p.children}</div>
      </div>
    </div>
  );
}

export function Input(p: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {p.label && <label className="block text-sm font-medium text-gray-900">{p.label}</label>}
      <input className={`w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${p.error ? "border-red-500" : ""} ${p.className || ""}`} {...p} />
      {p.error && <p className="text-xs text-red-500">{p.error}</p>}
    </div>
  );
}

export const Button = Btn;
