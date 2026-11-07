"use client";
import { useEffect, useState } from "react";
import { Server, PlusCircle, RefreshCw, Wallet, AlertTriangle, CheckCircle, ExternalLink, Shield, Loader2, } from "lucide-react";
export default function ProvidersPage() {
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [notice, setNotice] = useState("");
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
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
            if (!res.ok)
                throw new Error(data.error || "Chargement impossible");
            setProviders(data.providers || []);
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProviders();
    }, []);
    const refreshBalance = async (id: string) => {
        setRefreshingId(id);
        setError("");
        setNotice("");
        try {
            const response = await fetch(`/api/providers/${id}/balance`, { method: "POST" });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Vérification impossible.");
            setProviders(current => current.map(p => p.id === id ? { ...p, ...data } : p));
            window.dispatchEvent(new Event("wallet-updated"));
            setNotice(data.queueWarning || (data.dispatched ? "Solde actualisé. Une commande en attente a repris son traitement, sans nouveau débit du portefeuille client." : "Solde fournisseur actualisé : " + Number(data.balance).toFixed(2) + " " + data.currency + (data.balance === 0 ? ". Le fournisseur confirme un solde nul pour la clé API configurée." : ".")));
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setRefreshingId(null);
        }
    };
    const handleSync = async (id: string) => {
        setSyncingId(id);
        setError("");
        setNotice("");
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 125000);
        try {
            const response = await fetch(`/api/providers/${id}/sync`, { method: "POST", signal: controller.signal });
            let data;
            try {
                data = await response.json();
            }
            catch {
                throw new Error("La synchronisation n’a pas renvoyé de réponse valide. Vérifiez le catalogue avant de réessayer.");
            }
            if (!response.ok)
                throw new Error(data.error || "Synchronisation impossible.");
            setNotice(data.imported + " services actifs synchronisés. Les services indisponibles sont masqués, les commandes existantes sont conservées.");
            await fetchProviders();
        }
        catch (err: any) {
            setError(err.name === "AbortError" ? "La synchronisation prend trop de temps. Vérifiez le catalogue avant de relancer." : err.message);
        }
        finally {
            clearTimeout(timer);
            setSyncingId(null);
        }
    };
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await fetch(editingId ? `/api/providers/${editingId}` : "/api/providers", {
                method: editingId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, apiUrl, apiKey, lowBalanceLimit }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Failed to add provider");
            setShowModal(false);
            setName("");
            setApiUrl("https://");
            setApiKey("");
            fetchProviders();
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Fournisseurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos connexions API, les soldes disponibles et la synchronisation du catalogue.
          </p>
        </div>
        <button onClick={() => { setEditingId(null); setName(""); setApiUrl("https://"); setApiKey(""); setError(""); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-coral hover:bg-coral text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition">
          <PlusCircle className="w-3.5 h-3.5"/> Ajouter un fournisseur
        </button>
      </div>

      {error && <div role="alert" className="p-4 text-danger border rounded-xl">{error}</div>}
      {notice && <p role="status" className="p-4 border rounded-xl">{notice}</p>}
      <p className="text-sm text-muted-foreground">Le portefeuille fournisseur est distinct du solde client SMMaroc. Après une recharge fournisseur, actualisez le solde pour reprendre les commandes payées en attente.</p>
      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {providers.map((p) => {
            const isLow = p.balance < (p.lowBalanceLimit || 20);
            return (<div key={p.id} className="p-6 rounded-2xl bg-card border border-border space-y-4 hover:border-border transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-ink text-base">{p.name}</h3>
                  <a href={p.apiUrl} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-coral flex items-center gap-1 font-mono mt-0.5 truncate max-w-[200px]">
                    {p.apiUrl} <ExternalLink className="w-2.5 h-2.5 shrink-0"/>
                  </a>
                </div>
                <div className={`w-3 h-3 rounded-full ${p.isActive ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-slate-600"}`}/>
              </div>

              {/* Balance Widget */}
              <div className="p-4 rounded-xl bg-ivory-deep border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Solde fournisseur</span>
                  {isLow && (<span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3"/> Solde faible
                    </span>)}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-ink font-mono">
                    ${p.balance.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{p.currency}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Alert threshold: &lt; ${p.lowBalanceLimit.toFixed(2)}
                </p>
              </div>

              <button onClick={() => refreshBalance(p.id)} disabled={refreshingId !== null} className="px-3 py-2 rounded-xl bg-coral text-white text-xs font-semibold">{refreshingId === p.id ? "Vérification…" : "Actualiser le solde et reprendre les commandes"}</button>
              <p className="text-xs text-muted-foreground">Dernière vérification : {p.lastCheckedAt ? new Date(p.lastCheckedAt).toLocaleString("fr-MA") : "jamais"}</p>

              <button onClick={() => { setEditingId(p.id); setName(p.name); setApiUrl(p.apiUrl); setApiKey(""); setLowBalanceLimit(p.lowBalanceLimit); setError(""); setShowModal(true); }} className="text-xs underline">Modifier l’URL ou la clé API</button>
              {/* API Key Security */}
              <div className="text-xs text-muted-foreground flex items-center justify-between font-mono bg-ivory-deep px-3 py-2 rounded-lg border border-border">
                <span className="text-muted-foreground text-[10px] uppercase font-bold">Clé API :</span>
                <span className="text-ink">{"••••••••••••"}</span>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-border">
                <span className="text-[10px] text-muted-foreground">
                  {p._count?.orders || 0} commandes affectées
                </span>
                <button onClick={() => handleSync(p.id)} disabled={syncingId === p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-deep hover:bg-slate-700 text-ink text-xs font-semibold transition border border-border">
                  <RefreshCw className={`w-3 h-3 ${syncingId === p.id ? "animate-spin" : ""}`}/>
                  Synchroniser les services
                </button>
              </div>
            </div>);
        })}
      </div>

      {/* Modal: Connect Provider */}
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-ink mb-4">{editingId ? "Modifier la connexion fournisseur" : "Ajouter un fournisseur"}</h2>

            {error && (<div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-danger text-xs">
                {error}
              </div>)}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Nom du fournisseur</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. JustAnotherPanel, SMMKings, Peakerr" className="w-full px-3 py-2 rounded-xl bg-ivory-deep border border-border text-ink text-xs"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Adresse API v2</label>
                <input type="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required placeholder="https://providerdomain.com/api/v2" className="w-full px-3 py-2 rounded-xl bg-ivory-deep border border-border text-ink text-xs font-mono"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Clé API fournisseur</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required={!editingId} placeholder={editingId ? "Laisser vide pour conserver la clé actuelle" : "Paste your upstream API secret key"} className="w-full px-3 py-2 rounded-xl bg-ivory-deep border border-border text-ink text-xs font-mono"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Solde faible Telegram Alert Threshold ($)
                </label>
                <input type="number" step="1" value={lowBalanceLimit} onChange={(e) => setLowBalanceLimit(parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-ivory-deep border border-border text-ink text-xs font-mono"/>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-ivory-deep text-ink hover:bg-slate-700 text-xs font-medium">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-coral hover:bg-coral text-white text-xs font-semibold shadow-lg shadow-brand-600/20">
                  {saving ? "Vérification…" : editingId ? "Vérifier et enregistrer" : "Enregistrer le fournisseur"}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
