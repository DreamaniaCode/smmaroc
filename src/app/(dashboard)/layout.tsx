"use client";

import { useEffect, useState } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Layers,
  Server,
  Users,
  Settings,
  LogOut,
  Wallet,
  Shield,
  Zap,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!data.authenticated) router.push("/login");
        else setUser(data.user);
      })
      .catch(() => router.push("/login"));

    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.totalBalance !== undefined) setTotalBalance(data.totalBalance);
      })
      .catch(() => {});
  }, [router, pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "New Order", href: "/orders/new", icon: PlusCircle, highlight: true },
    { label: "Orders Desk", href: "/orders", icon: ListOrdered },
    { label: "Services & Routing", href: "/services", icon: Layers },
    { label: "Providers & APIs", href: "/providers", icon: Server },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Settings & Automations", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block leading-none text-base">
                SMM ENGINE
              </span>
              <span className="text-[11px] font-medium text-brand-400 uppercase tracking-widest mt-1 block">
                Agency Ops
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                    : item.highlight
                    ? "text-brand-300 hover:bg-brand-500/10 border border-brand-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                {user?.name?.[0] || "A"}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.name || "User"}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                  <Shield className="w-2.5 h-2.5" /> {user?.role || "OPERATOR"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-200">
              {navItems.find((n) => n.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Combined Provider Balance Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Wallet className="w-3.5 h-3.5" />
              <span>Provider Balance: ${totalBalance.toFixed(2)}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
