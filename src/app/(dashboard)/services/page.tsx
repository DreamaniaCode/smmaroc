"use client";

import { useEffect, useState } from "react";
import { fetchCatalog } from "@/lib/catalog-client";
import {
  Layers,
  PlusCircle,
  ShieldCheck,
  Server,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // New Service Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Instagram");
  const [minQuantity, setMinQuantity] = useState(10);
  const [maxQuantity, setMaxQuantity] = useState(100000);
  const [ratePer1000, setRatePer1000] = useState(2.0);
  const [primaryProviderId, setPrimaryProviderId] = useState("");
  const [primaryServiceId, setPrimaryServiceId] = useState("");
  const [backupProviderId, setBackupProviderId] = useState("");
  const [backupServiceId, setBackupServiceId] = useState("");
  const [autoFailover, setAutoFailover] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [catalog, me] = await Promise.all([
        fetchCatalog(),
        fetch("/api/auth/me").then(r => r.json()),
      ]);
      setServices(catalog);
      const admin = me.user?.role === "ADMIN";
      setIsAdmin(admin);
      if (admin) {
        const response = await fetch("/api/providers");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Fournisseurs indisponibles.");
        const pList = data.providers || [];
        setProviders(pList);
        if (pList.length > 0) setPrimaryProviderId(pList[0].id);
        if (pList.length > 1) setBackupProviderId(pList[1].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          minQuantity,
          maxQuantity,
          ratePer1000,
          primaryProviderId,
          primaryServiceId,
          backupProviderId: backupProviderId || null,
          backupServiceId: backupServiceId || null,
          autoFailover,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create service");

      setShowModal(false);
      setName("");
      setPrimaryServiceId("");
      setBackupServiceId("");
      fetchData();
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Services & Failover Routing</h1>
          <p className="text-sm text-slate-400 mt-1">
            Map internal catalog to Primary wholesale providers with automated backup rerouting.
          </p>
        </div>
        {isAdmin && <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Map New Service
        </button>}
      </div>

      <div className="flex flex-wrap gap-3 items-center"><input aria-label="Rechercher un service" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher un service, catégorie ou ID…" className="flex-1 border rounded-xl px-4 py-3 text-sm"/><span className="text-xs text-slate-400">{services.length} services disponibles</span></div>
      {error && <div role="alert" className="text-rose-500 p-4 border rounded-xl">{error} <button onClick={fetchData}>Réessayer</button></div>}
      {/* Services List */}
      <div className="grid grid-cols-1 gap-4">
        {services.filter(s => (s.name + " " + s.category + " " + s.id).toLowerCase().includes(search.toLowerCase())).slice((page - 1) * 50, page * 50).map((service) => {
          const m = service.mapping;
          return (
            <div
              key={service.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {service.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">ID: {service.id}</span>
                  </div>
                  <h3 className="font-semibold text-slate-100 text-base">{service.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Limits: {service.minQuantity.toLocaleString()} – {service.maxQuantity.toLocaleString()} | Rate: {service.sellingRatePer1000} MAD/1k
                  </p>
                </div>

                {/* Routing Visualization */}
                {m && (
                  <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                    {/* Primary Provider */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">Primary Provider</span>
                        <span className="font-semibold text-slate-200">
                          {m.primaryProvider?.name || "Provider"} (ID: #{m.primaryServiceId})
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600" />

                    {/* Backup Provider */}
                    {m.backupProvider ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">
                            Auto-Failover Backup
                          </span>
                          <span className="font-semibold text-emerald-400">
                            {m.backupProvider.name} (ID: #{m.backupServiceId})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No backup configured</div>
                    )}

                    {m.autoFailover && m.backupProvider && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Sparkles className="w-3 h-3" /> Redundancy Active
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button><span>Page {page}</span><button disabled={page * 50 >= services.filter(s => (s.name + " " + s.category + " " + s.id).toLowerCase().includes(search.toLowerCase())).length} onClick={() => setPage(page + 1)}>Suivant</button></div>
      {/* Modal: Add New Service */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Map New Internal Service</h2>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Instagram Followers [Non Drop]"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    placeholder="Instagram / YouTube / TikTok"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rate ($ per 1,000)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ratePer1000}
                    onChange={(e) => setRatePer1000(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Primary Provider */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">
                  Primary Routing
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Primary Provider</label>
                    <select
                      value={primaryProviderId}
                      onChange={(e) => setPrimaryProviderId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                    >
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Upstream Service ID</label>
                    <input
                      type="text"
                      value={primaryServiceId}
                      onChange={(e) => setPrimaryServiceId(e.target.value)}
                      required
                      placeholder="e.g. 1024"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Backup Provider (Failover) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Smart Failover Backup (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Backup Provider</label>
                    <select
                      value={backupProviderId}
                      onChange={(e) => setBackupProviderId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                    >
                      <option value="">-- None --</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Backup Service ID</label>
                    <input
                      type="text"
                      value={backupServiceId}
                      onChange={(e) => setBackupServiceId(e.target.value)}
                      placeholder="e.g. 842"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium pt-1">
                  <input
                    type="checkbox"
                    checked={autoFailover}
                    onChange={(e) => setAutoFailover(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-brand-600 bg-slate-950 border-slate-800"
                  />
                  Enable automated failover rerouting if Primary fails or cancels
                </label>
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
                  {saving ? "Saving..." : "Save Service Mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
