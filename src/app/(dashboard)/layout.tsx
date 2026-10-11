"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {readApi} from "@/lib/api-client";
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
  Send,
  Zap,
  CreditCard,
  Terminal,
  Plus,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wholesaleBalance, setWholesaleBalance] = useState<number>(0);

  const [sessionError, setSessionError] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionRetry, setSessionRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setSessionError("");
    setSessionLoading(true);
    fetch("/api/auth/me", {cache:"no-store"}).then(async response => {
      if (response.status === 401) { if(active) router.replace("/login"); return; }
      if (!response.ok) throw new Error("Impossible de vérifier votre connexion. Veuillez réessayer.");
      const data = await response.json();
      if (!active) return;
      if (!data.authenticated) {router.replace("/login"); return;}
      setUser(data.user);
      if (data.user.role === "USER" && ["/dashboard","/providers","/clients","/settings","/admin/deposits"].includes(pathname)) {router.replace("/orders/new"); return;}
      setSessionLoading(false);
      if (data.user.role === "ADMIN") readApi("/api/stats").then(stats => {if(active) setWholesaleBalance(stats.totalBalance || 0);}).catch(()=>{});
    }).catch(() => {if(active) setSessionError("Impossible de vérifier votre connexion. Veuillez réessayer.");});
    return () => {active=false;};
  }, [router, pathname, sessionRetry]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isAdmin = user?.role === "ADMIN";

  const customerNav = [
    { label: "Services", href: "/services", icon: Layers },
    { label: "New Order", href: "/orders/new", icon: PlusCircle, highlight: true },
    { label: "My Orders", href: "/orders", icon: ListOrdered },
    { label: "Ajouter des fonds", href: "/add-funds", icon: CreditCard },
    { label: "Support", href: "/support", icon: Send },
    { label: "Reseller API v2", href: "/api-docs", icon: Terminal },
  ];

  const adminNav = [
    { label: "Operations Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Order Desk", href: "/orders/new", icon: PlusCircle, highlight: true },
    { label: "Orders Desk", href: "/orders", icon: ListOrdered },
    { label: "Deposit Approvals", href: "/admin/deposits", icon: CreditCard },
    { label: "Services & Routing", href: "/services", icon: Layers },
    { label: "Providers & APIs", href: "/providers", icon: Server },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Support clients", href: "/support", icon: Send },
    { label: "Settings & Alerts", href: "/settings", icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : customerNav;

  return (
    <div className="app-shell flex h-screen bg-[#050811] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0b1120]/80 backdrop-blur-xl flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl emerald-gradient flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <img src="/smmaroc-logo.png" alt="" width={32} height={32}/>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black tracking-tight text-white leading-none text-base">
                  SMMaroc.
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  MA
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 block">
                {isAdmin ? "Admin Deck" : "Client Portal"}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "emerald-gradient text-white shadow-lg shadow-emerald-600/20"
                    : item.highlight
                    ? "text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/5 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                {user?.name?.[0] || "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || "Client"}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-2.5 h-2.5" /> {user?.role || "USER"}
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
        <header className="h-16 border-b border-white/5 bg-[#0b1120]/50 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              {navItems.find((n) => n.href === pathname)?.label || "SMMaroc"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Customer Live Balance Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Wallet className="w-3.5 h-3.5" />
              <span>Balance: {(user?.balance || 0).toFixed(2)} {user?.currency || "MAD"}</span>
              <Link
                href="/add-funds"
                className="ml-1 w-5 h-5 rounded-full emerald-gradient flex items-center justify-center text-white hover:opacity-90 transition"
                title="Add Funds"
              >
                <Plus className="w-3 h-3" />
              </Link>
            </div>

            {/* Admin Wholesale Indicator */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <span>Wholesale: ${wholesaleBalance.toFixed(2)}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8">{sessionError ? <div role="alert" className="dashboard-alert">{sessionError}<button onClick={()=>setSessionRetry(n=>n+1)}>Réessayer</button></div> : sessionLoading ? <p role="status">Chargement de votre espace…</p> : children}</main>
      </div>
    </div>
  );
}
