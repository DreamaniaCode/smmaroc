"use client";

import { useEffect, useState } from "react";
import {
  ListOrdered,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Server,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function OverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agency Operations Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time monitoring of SMM order routing, provider balances, and smart failovers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <a
            href="/orders/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Place Order
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <ListOrdered className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats?.totalOrders ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Lifetime agency volume</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats?.inProgressOrders ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Currently fulfilling upstream</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats?.completedOrders ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Successfully delivered</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Failed / Issues</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats?.failedOrders ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">Requiring manual review</p>
        </div>
      </div>

      {/* Upstream Providers Balance Monitor */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-400" />
            <h2 className="text-base font-semibold text-white">Upstream Wholesale Providers</h2>
          </div>
          <a
            href="/providers"
            className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
          >
            Manage Providers <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.providers?.map((provider: any) => {
            const isLow = provider.balance < (provider.lowBalanceLimit || 20);
            return (
              <div
                key={provider.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200 text-sm">{provider.name}</span>
                    {isLow && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <ShieldAlert className="w-2.5 h-2.5" /> Low
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    Balance: <span className="font-bold text-slate-200">${provider.balance.toFixed(2)}</span> {provider.currency}
                  </p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <a
          href="/orders/new"
          className="p-6 rounded-2xl bg-gradient-to-br from-brand-950/40 to-slate-900 border border-brand-800/40 hover:border-brand-500/50 transition group"
        >
          <h3 className="font-semibold text-white text-base group-hover:text-brand-300 transition">
            Dispatch Single or Mass Orders →
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Submit multi-link campaigns, format with lines or import CSV spreadsheets directly.
          </p>
        </a>

        <a
          href="/services"
          className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/40 hover:border-indigo-500/50 transition group"
        >
          <h3 className="font-semibold text-white text-base group-hover:text-indigo-300 transition">
            Configure Smart Failover Rules →
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Map internal catalog to Primary and Backup upstream providers for automatic failover.
          </p>
        </a>

        <a
          href="/settings"
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-800/40 hover:border-purple-500/50 transition group"
        >
          <h3 className="font-semibold text-white text-base group-hover:text-purple-300 transition">
            Google Sheets & Telegram Alerts →
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Connect your 2-way Google Sheet template and configure instant Telegram bot alerts.
          </p>
        </a>
      </div>
    </div>
  );
}
