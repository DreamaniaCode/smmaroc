"use client";

import { useEffect, useState } from "react";
import {readApi} from "@/lib/api-client";
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function OrdersPage() {
  const [error,setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { readApi("/api/auth/me").then(data => setIsAdmin(data.user?.role === "ADMIN")).catch(err=>setError(err.message)); }, []);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      const selectedUser = new URLSearchParams(window.location.search).get("userId");
      const selectedClient = new URLSearchParams(window.location.search).get("clientId");
      if(selectedUser) params.set("userId", selectedUser);
      if(selectedClient && clientFilter === "ALL") params.set("clientId", selectedClient);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (clientFilter !== "ALL") params.append("clientId", clientFilter);
      if (search) params.append("search", search);

      const data = await readApi(`/api/orders?${params.toString()}`);
      setOrders(data.orders || []);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 30000);
    readApi("/api/clients")
      .then((data) => setClients(data.clients || [])).catch(err=>setError(err.message));
    return () => clearInterval(timer);
  }, [statusFilter, clientFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // 1-Click Refill
  const handleRefill = async (orderId: string) => {
    setActionLoading(`refill-${orderId}`);
    try {
      const res = await fetch(`/api/orders/${orderId}/refill`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Refill failed");
      else alert("Demande de complément enregistrée.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Cancel
  const handleCancel = async (orderId: string) => {
    if (!confirm("Voulez-vous demander l’annulation de cette commande ?")) return;
    setActionLoading(`cancel-${orderId}`);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Cancel failed");
      else {
        alert("Demande d’annulation enregistrée.");
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Export CSV for clients
  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ["Order ID", "Client", "Service", "Link", "Quantity", "Start Count", "Remains", "Status", "Date"];
    const rows = orders.map((o) => [
      o.id,
      o.client?.name || "General",
      `"${o.service?.name?.replace(/"/g, '""') || ""}"`,
      `"${o.link}"`,
      o.quantity,
      o.startCount ?? "",
      o.remains ?? "",
      o.status,
      new Date(o.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smm_orders_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string, failoverAttempted: boolean) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Terminée
          </span>
        );
      case "AWAITING_FUNDS":
      case "DISPATCHING":
      case "REVIEW_REQUIRED":
      case "IN_PROGRESS":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-pulse" /> {status === "AWAITING_FUNDS" ? "En attente de traitement" : status === "REVIEW_REQUIRED" ? "Vérification nécessaire" : status === "DISPATCHING" || status === "PROCESSING" ? "En traitement" : status === "IN_PROGRESS" ? "En cours" : status}
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Partial
          </span>
        );
      case "CANCELED":
      case "FAILED":
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="w-3 h-3" /> {status}
            </span>
            {failoverAttempted && (
              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                <ShieldAlert className="w-2.5 h-2.5" /> Failover attempted
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {error && <div role="alert" className="dashboard-alert">{error}<button onClick={fetchOrders}>Réessayer</button></div>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Orders Desk</h1>
          <p className="text-sm text-slate-400 mt-1">
            Suivez l’avancement de vos commandes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export Client CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL, Order ID, or Provider ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option><option value="AWAITING_FUNDS">En attente de traitement</option><option value="REVIEW_REQUIRED">Vérification nécessaire</option>
            <option value="PROCESSING">Processing</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIAL">Partial</option>
            <option value="CANCELED">Canceled</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">ID / Date</th>
                <th className="p-4">Client</th>
                <th className="p-4">Service & Link</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Counts</th>
                {isAdmin && <th className="p-4">Provider / Remote ID</th>}
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-slate-500">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition font-mono">
                    <td className="p-4">
                      <span className="text-brand-400 font-bold">#{o.id.slice(0, 8)}</span>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    <td className="p-4 font-sans">
                      <span className="font-semibold text-slate-300">
                        {o.client?.name || <span className="text-slate-500 italic">None</span>}
                      </span>
                    </td>

                    <td className="p-4 font-sans max-w-xs truncate">
                      <p className="font-medium text-slate-200 truncate">{o.service?.name}</p>
                      <a
                        href={o.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand-400 hover:underline flex items-center gap-1 truncate font-mono mt-0.5"
                      >
                        {o.link} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </td>

                    <td className="p-4 font-bold text-slate-200">
                      {o.quantity.toLocaleString()}
                      {o.runs > 1 && (
                        <p className="text-[10px] text-brand-400 font-sans font-normal">
                          {o.runs} runs / {o.intervalMinutes}m
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-[11px] text-slate-400">
                      <div>Start: {o.startCount !== null ? o.startCount : "—"}</div>
                      <div>Remains: {o.remains !== null ? o.remains : "—"}</div>
                    </td>

{isAdmin && (                    <td className="p-4 font-sans">
                      <span className="text-slate-300 font-medium">
                        {o.currentProvider?.name || "Pending Routing"}
                      </span>
                      {o.providerOrderId && (
                        <p className="text-[10px] font-mono text-slate-500">
                          ID: #{o.providerOrderId}
                        </p>
                      )}
                    </td>)}

                    <td className="p-4 font-sans">
                      {getStatusBadge(o.status, isAdmin && o.failoverAttempted)}
                    </td>

                    <td className="p-4 font-sans text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleRefill(o.id)}
                          disabled={actionLoading === `refill-${o.id}`}
                          title="Request Refill"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === `refill-${o.id}` ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleCancel(o.id)}
                          disabled={actionLoading === `cancel-${o.id}`}
                          title="Request Cancel"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
