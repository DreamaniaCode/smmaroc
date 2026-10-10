"use client";

import { useEffect, useState } from "react";
import {
  Server,
  PlusCircle,
  RefreshCw,
  Wallet,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Shield,
  Loader2,
} from "lucide-react";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New Provider Form
  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("https://");
  const [apiKey, setApiKey] = useState("");
  const [lowBalanceLimit, setLowBalanceLimit] = useState(25.0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/providers/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Sync failed");
      else {
        fetchProviders();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiUrl, apiKey, lowBalanceLimit }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add provider");

      setShowModal(false);
      setName("");
      setApiUrl("https://");
      setApiKey("");
      fetchProviders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Upstream Wholesale Providers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect any SMM provider supporting universal SMM v2 protocol with automatic balance alerts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Connect Upstream Provider
        </button>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {providers.map((p) => {
          const isLow = p.balance < (p.lowBalanceLimit || 20);
          return (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{p.name}</h3>
                  <a
                    href={p.apiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-500 hover:text-brand-400 flex items-center gap-1 font-mono mt-0.5 truncate max-w-[200px]"
                  >
                    {p.apiUrl} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    p.isActive ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-slate-600"
                  }`}
                />
              </div>

              {/* Balance Widget */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Wholesale Wallet</span>
                  {isLow && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3" /> Low Balance
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    ${p.balance.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{p.currency}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Alert threshold: &lt; ${p.lowBalanceLimit.toFixed(2)}
                </p>
              </div>

              {/* API Key Security */}
              <div className="text-xs text-slate-400 flex items-center justify-between font-mono bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 text-[10px] uppercase font-bold">API Key:</span>
                <span className="text-slate-300">{p.apiKey}</span>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500">
                  {p._count?.orders || 0} orders dispatched
                </span>
                <button
                  onClick={() => handleSync(p.id)}
                  disabled={syncingId === p.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingId === p.id ? "animate-spin" : ""}`} />
                  Check Live Balance
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Connect Provider */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Connect Wholesale SMM Provider</h2>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Provider Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. JustAnotherPanel, SMMKings, Peakerr"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">API v2 Endpoint URL</label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  required
                  placeholder="https://providerdomain.com/api/v2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Provider API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  placeholder="Paste your upstream API secret key"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Low Balance Telegram Alert Threshold ($)
                </label>
                <input
                  type="number"
                  step="1"
                  value={lowBalanceLimit}
                  onChange={(e) => setLowBalanceLimit(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20"
                >
                  {saving ? "Connecting..." : "Connect Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
