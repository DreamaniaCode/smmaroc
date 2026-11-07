"use client";
import { ServiceCatalog } from "@/components/design/ServiceCatalog";
import { PageHeader } from "@/components/design/PageHeader";
import { useEffect, useState } from "react";
import { fetchCatalog } from "@/lib/catalog-client";
import { Layers, PlusCircle, ShieldCheck, Server, ArrowRight, Sparkles, Loader2, CheckCircle, } from "lucide-react";
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
                if (!response.ok)
                    throw new Error(data.error || "Fournisseurs indisponibles.");
                const pList = data.providers || [];
                setProviders(pList);
                if (pList.length > 0)
                    setPrimaryProviderId(pList[0].id);
                if (pList.length > 1)
                    setBackupProviderId(pList[1].id);
            }
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
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
            if (!res.ok)
                throw new Error(data.error || "Failed to create service");
            setShowModal(false);
            setName("");
            setPrimaryServiceId("");
            setBackupServiceId("");
            fetchData();
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    if (!loading && !isAdmin)
        return <div><PageHeader eyebrow="Commander" title="Catalogue des services" description="Comparez les services disponibles et leurs tarifs. Le devis final s’affiche avant validation."/><ServiceCatalog mode="client" initialServices={error ? undefined : services}/></div>;
    return (<div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Services et routage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les services du catalogue et leurs connexions aux fournisseurs.
          </p>
        </div>
        {isAdmin && <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-coral hover:bg-coral text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition">
          <PlusCircle className="w-3.5 h-3.5"/> Ajouter un service
        </button>}
      </div>

      <div className="flex flex-wrap gap-3 items-center"><input aria-label="Rechercher un service" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher un service, catégorie ou ID…" className="flex-1 border rounded-xl px-4 py-3 text-sm"/><span className="text-xs text-muted-foreground">{services.length} services disponibles</span></div>
      {error && <div role="alert" className="text-danger p-4 border rounded-xl">{error} <button onClick={fetchData}>Réessayer</button></div>}
      {/* Services List */}
      <div className="grid grid-cols-1 gap-4">
        {services.filter(s => (s.name + " " + s.category + " " + s.id).toLowerCase().includes(search.toLowerCase())).slice((page - 1) * 50, page * 50).map((service) => {
            const m = service.mapping;
            return (<div key={service.id} className="p-5 rounded-2xl bg-card border border-border hover:border-border transition">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-coral/10 text-coral border border-brand-500/20">
                      {service.category}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">ID: {service.id}</span>
                  </div>
                  <h3 className="font-semibold text-ink text-base">{service.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Limits: {service.minQuantity.toLocaleString()} – {service.maxQuantity.toLocaleString()} | Rate: {service.sellingRatePer1000} MAD/1k
                  </p>
                </div>

                {/* Routing Visualization */}
                {m && (<div className="flex flex-wrap items-center gap-3 bg-ivory-deep p-3 rounded-xl border border-border text-xs">
                    {/* Primary Provider */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"/>
                      <div>
                        <span className="text-muted-foreground text-[10px] block uppercase font-bold">Fournisseur principal</span>
                        <span className="font-semibold text-ink">
                          {m.primaryProvider?.name || "Fournisseur"} (ID: #{m.primaryServiceId})
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-muted-foreground"/>

                    {/* Backup Provider */}
                    {m.backupProvider ? (<div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"/>
                        <div>
                          <span className="text-muted-foreground text-[10px] block uppercase font-bold">
                            Fournisseur de secours
                          </span>
                          <span className="font-semibold text-coral">
                            {m.backupProvider.name} (ID: #{m.backupServiceId})
                          </span>
                        </div>
                      </div>) : (<div className="text-muted-foreground italic">Aucun secours configuré</div>)}

                    {m.autoFailover && m.backupProvider && (<span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-coral bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Sparkles className="w-3 h-3"/> Redundancy Active
                      </span>)}
                  </div>)}
              </div>
            </div>);
        })}
      </div>

      <div className="flex items-center justify-between text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button><span>Page {page}</span><button disabled={page * 50 >= services.filter(s => (s.name + " " + s.category + " " + s.id).toLowerCase().includes(search.toLowerCase())).length} onClick={() => setPage(page + 1)}>Suivant</button></div>
      {/* Modal: Add New Service */}
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-ink mb-4">Ajouter un service au catalogue</h2>

            {error && (<div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-danger text-xs">
                {error}
              </div>)}

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Nom du service</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Instagram Followers [Non Drop]" className="w-full px-3 py-2 rounded-xl bg-ivory-deep border border-border text-ink text-xs"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Catégorie</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="Instagram / YouTube / TikTok" className="w-full px-3 py-2 rounded-xl bg-ivory-deep border border-border text-ink text-xs"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Tarif fournisseur pour 1 000</label>
                  <input type="number" step="0.01" value={ratePer1000} onChange={(e) => setRatePer1000(parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-ivory-deep border border-border text-ink text-xs font-mono"/>
                </div>
              </div>

              {/* Primary Provider */}
              <div className="p-4 rounded-xl bg-ivory-deep border border-border space-y-3">
                <span className="text-xs font-bold text-coral uppercase tracking-wider block">
                  Connexion principale
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Fournisseur principal</label>
                    <select value={primaryProviderId} onChange={(e) => setPrimaryProviderId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-ink text-xs">
                      {providers.map((p) => (<option key={p.id} value={p.id}>
                          {p.name}
                        </option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">ID du service chez le fournisseur</label>
                    <input type="text" value={primaryServiceId} onChange={(e) => setPrimaryServiceId(e.target.value)} required placeholder="e.g. 1024" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-ink text-xs font-mono"/>
                  </div>
                </div>
              </div>

              {/* Backup Provider (Failover) */}
              <div className="p-4 rounded-xl bg-ivory-deep border border-border space-y-3">
                <span className="text-xs font-bold text-coral uppercase tracking-wider block">
                  Smart Failover Backup (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Fournisseur de secours</label>
                    <select value={backupProviderId} onChange={(e) => setBackupProviderId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-ink text-xs">
                      <option value="">-- None --</option>
                      {providers.map((p) => (<option key={p.id} value={p.id}>
                          {p.name}
                        </option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">ID du service de secours</label>
                    <input type="text" value={backupServiceId} onChange={(e) => setBackupServiceId(e.target.value)} placeholder="e.g. 842" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-ink text-xs font-mono"/>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-ink font-medium pt-1">
                  <input type="checkbox" checked={autoFailover} onChange={(e) => setAutoFailover(e.target.checked)} className="w-3.5 h-3.5 rounded text-brand-600 bg-ivory-deep border-border"/>
                  Activer le fournisseur de secours si le fournisseur principal échoue ou annule
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-ivory-deep text-ink hover:bg-slate-700 text-xs font-medium">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-coral hover:bg-coral text-white text-xs font-semibold shadow-lg shadow-brand-600/20">
                  {saving ? "Enregistrement…" : "Enregistrer le service"}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
