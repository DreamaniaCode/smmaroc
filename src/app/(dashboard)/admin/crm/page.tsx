"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Users, Search, Download, MessageCircle, Send, Shield, 
  Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Edit, 
  CheckCircle2, AlertTriangle, X, Plus, Clock, FileText, 
  ExternalLink, Sparkles, Filter 
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  telegram: string | null;
  company: string | null;
  tier: "STANDARD" | "VIP" | "RESELLER" | "AGENCY";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  balance: number;
  currency: string;
  customDiscountPercent: number;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    orders: number;
    deposits: number;
    crmNotes: number;
  };
}

interface ClientDetail extends Client {
  adminNotes: string | null;
  totalOrders: number;
  totalDeposits: number;
  totalSpent: number;
  orders: {
    id: string;
    serviceName: string;
    category: string;
    link: string;
    quantity: number;
    charge: number;
    status: string;
    createdAt: string;
  }[];
  deposits: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    createdAt: string;
  }[];
  crmNotes: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
}

export default function AdminCrmPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({ totalClients: 0, vipCount: 0, resellerCount: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawer / 360 view
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"profile" | "balance" | "notes" | "orders">("profile");

  // Edit Form in Drawer
  const [editForm, setEditForm] = useState({
    tier: "STANDARD",
    status: "ACTIVE",
    phone: "",
    telegram: "",
    company: "",
    customDiscountPercent: 0,
    adminNotes: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Balance Form
  const [balanceForm, setBalanceForm] = useState({ type: "CREDIT", amount: "", reason: "" });
  const [adjustingBalance, setAdjustingBalance] = useState(false);

  // Notes Form
  const [newNoteContent, setNewNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Feedback Messages
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (tierFilter !== "ALL") params.set("tier", tierFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/crm/clients?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tierFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const openClient360 = async (id: string) => {
    setSelectedClientId(id);
    setDetailLoading(true);
    setDrawerTab("profile");
    setFeedback(null);
    try {
      const res = await fetch(`/api/crm/clients/${id}`);
      const data = await res.json();
      if (res.ok && data.client) {
        setDetail(data.client);
        setEditForm({
          tier: data.client.tier,
          status: data.client.status,
          phone: data.client.phone || "",
          telegram: data.client.telegram || "",
          company: data.client.company || "",
          customDiscountPercent: data.client.customDiscountPercent || 0,
          adminNotes: data.client.adminNotes || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    setSavingProfile(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/crm/clients/${selectedClientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");

      setFeedback({ type: "success", text: "Profil client mis à jour avec succès." });
      fetchClients();
      // Refresh details
      openClient360(selectedClientId);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    setAdjustingBalance(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/crm/clients/${selectedClientId}/adjust-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: balanceForm.type,
          amount: Number(balanceForm.amount),
          reason: balanceForm.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'ajustement du solde");

      setFeedback({ type: "success", text: data.message });
      setBalanceForm({ type: "CREDIT", amount: "", reason: "" });
      fetchClients();
      openClient360(selectedClientId);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setAdjustingBalance(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newNoteContent.trim()) return;
    setAddingNote(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/crm/clients/${selectedClientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'ajout de la note");

      setNewNoteContent("");
      openClient360(selectedClientId);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setAddingNote(false);
    }
  };

  const cleanPhoneForWhatsApp = (phone: string | null) => {
    if (!phone) return null;
    let clean = phone.replace(/[^\d+]/g, "");
    if (clean.startsWith("0")) {
      clean = "212" + clean.substring(1);
    } else if (clean.startsWith("+")) {
      clean = clean.substring(1);
    }
    return clean;
  };

  const tierBadge = (tier: string) => {
    switch (tier) {
      case "VIP":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">★ VIP</span>;
      case "RESELLER":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Revendeur</span>;
      case "AGENCY":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">Agence</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">Standard</span>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">● Actif</span>;
      case "SUSPENDED":
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">● Suspendu</span>;
      case "BANNED":
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">● Banni</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
            <Users className="h-7 w-7 text-coral" />
            CRM Clients &amp; Comptes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue 360° des clients enregistrés, ajustement direct des portefeuilles, statuts VIP et historique d&apos;activité.
          </p>
        </div>
        <div>
          <a
            href="/api/crm/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink bg-card border border-border hover:bg-ivory-deep rounded-lg transition-colors shadow-sm"
          >
            <Download size={16} />
            Exporter CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Comptes Clients</p>
          <p className="mt-2 text-2xl font-bold text-ink">{stats.totalClients}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clients VIP &amp; Revendeurs</p>
          <p className="mt-2 text-2xl font-bold text-coral">{stats.vipCount + stats.resellerCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Solde Total Clients (MAD)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
            {stats.totalBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clients Filtrés</p>
          <p className="mt-2 text-2xl font-bold text-ink">{clients.length}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone, entreprise, telegram..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border pl-9 pr-3 text-sm bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-10 rounded-lg border border-border px-3 text-xs font-medium bg-background"
          >
            <option value="ALL">Tous les rangs</option>
            <option value="STANDARD">Standard</option>
            <option value="VIP">VIP</option>
            <option value="RESELLER">Revendeur</option>
            <option value="AGENCY">Agence</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-border px-3 text-xs font-medium bg-background"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
            <option value="BANNED">Banni</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ivory-deep border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Client</th>
                <th className="px-5 py-3.5 font-semibold">Contact &amp; Réseaux</th>
                <th className="px-5 py-3.5 font-semibold">Rang</th>
                <th className="px-5 py-3.5 font-semibold">Statut</th>
                <th className="px-5 py-3.5 font-semibold">Solde Portefeuille</th>
                <th className="px-5 py-3.5 font-semibold">Commandes</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    Chargement des fiches clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    Aucun client ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                clients.map((c) => {
                  const waNumber = cleanPhoneForWhatsApp(c.phone);
                  return (
                    <tr key={c.id} className="hover:bg-ivory-deep/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-ink">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                        {c.company && (
                          <div className="text-[11px] text-coral font-medium">{c.company}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {waNumber ? (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                              title="Discuter sur WhatsApp"
                            >
                              <MessageCircle size={13} />
                              {c.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}

                          {c.telegram && (
                            <a
                              href={`https://t.me/${c.telegram.replace("@", "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors"
                              title="Telegram"
                            >
                              <Send size={12} />
                              {c.telegram}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{tierBadge(c.tier)}</td>
                      <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-ink">
                          {c.balance.toFixed(2)} {c.currency}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-ink">
                          <span className="font-semibold">{c._count.orders}</span> commandes
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {c._count.deposits} recharges
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openClient360(c.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-coral bg-coral-tint hover:bg-coral hover:text-white rounded-lg transition-colors"
                        >
                          <FileText size={13} />
                          Fiche 360°
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Client Drawer / Modal */}
      {selectedClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60">
          <div className="h-full w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-ivory-deep">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">{detail?.name || "Client"}</h2>
                  {detail && tierBadge(detail.tier)}
                </div>
                <p className="text-xs text-muted-foreground">{detail?.email} • ID: {detail?.id}</p>
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                className="p-2 text-muted-foreground hover:text-ink rounded-lg hover:bg-card"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics */}
            {detail && (
              <div className="grid grid-cols-3 gap-2 p-4 bg-card border-b border-border text-center">
                <div className="p-2 rounded bg-ivory-deep">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Solde Portefeuille</span>
                  <p className="text-base font-bold font-mono text-emerald-600">{detail.balance.toFixed(2)} {detail.currency}</p>
                </div>
                <div className="p-2 rounded bg-ivory-deep">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Dépensé</span>
                  <p className="text-base font-bold font-mono text-ink">{detail.totalSpent.toFixed(2)} {detail.currency}</p>
                </div>
                <div className="p-2 rounded bg-ivory-deep">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Commandes Passées</span>
                  <p className="text-base font-bold text-ink">{detail.totalOrders}</p>
                </div>
              </div>
            )}

            {/* Notification alert */}
            {feedback && (
              <div className={`p-3 text-xs mx-4 mt-3 rounded-lg ${
                feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {feedback.text}
              </div>
            )}

            {/* Drawer Tabs */}
            <div className="flex border-b border-border px-4 bg-card text-xs font-semibold">
              <button
                onClick={() => setDrawerTab("profile")}
                className={`py-3 px-3 border-b-2 transition-colors ${
                  drawerTab === "profile" ? "border-coral text-coral" : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                Profil &amp; Paramètres
              </button>
              <button
                onClick={() => setDrawerTab("balance")}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  drawerTab === "balance" ? "border-coral text-coral" : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                <Wallet size={13} />
                Ajuster Solde
              </button>
              <button
                onClick={() => setDrawerTab("notes")}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  drawerTab === "notes" ? "border-coral text-coral" : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                Notes CRM ({detail?.crmNotes?.length || 0})
              </button>
              <button
                onClick={() => setDrawerTab("orders")}
                className={`py-3 px-3 border-b-2 transition-colors ${
                  drawerTab === "orders" ? "border-coral text-coral" : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                Commandes Récentes
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Chargement des données du client...
                </div>
              ) : (
                <>
                  {/* Tab 1: Profile & Settings */}
                  {drawerTab === "profile" && (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-ink">Rang Client (Tier)</label>
                          <select
                            value={editForm.tier}
                            onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as any })}
                            className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                          >
                            <option value="STANDARD">STANDARD</option>
                            <option value="VIP">VIP</option>
                            <option value="RESELLER">RESELLER (Revendeur)</option>
                            <option value="AGENCY">AGENCY (Grand Compte)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ink">Statut du Compte</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                            className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                          >
                            <option value="ACTIVE">ACTIF</option>
                            <option value="SUSPENDED">SUSPENDU</option>
                            <option value="BANNED">BANNI</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-ink">Téléphone / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="+212 600 000000"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ink">Pseudo Telegram</label>
                          <input
                            type="text"
                            placeholder="@utilisateur"
                            value={editForm.telegram}
                            onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
                            className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-ink">Société / Marque</label>
                          <input
                            type="text"
                            placeholder="Nom de l'entreprise"
                            value={editForm.company}
                            onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                            className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ink">Remise Personnalisée (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={editForm.customDiscountPercent}
                            onChange={(e) => setEditForm({ ...editForm, customDiscountPercent: Number(e.target.value) })}
                            className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Notes Permanentes Administrateur</label>
                        <textarea
                          rows={3}
                          placeholder="Informations clés sur le client, accords commerciaux, préférences..."
                          value={editForm.adminNotes}
                          onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-border p-3 text-sm bg-background"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                      >
                        {savingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
                      </button>
                    </form>
                  )}

                  {/* Tab 2: Adjust Balance */}
                  {drawerTab === "balance" && (
                    <form onSubmit={handleAdjustBalance} className="space-y-4">
                      <div className="p-4 rounded-xl bg-ivory-deep border border-border flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Solde Actuel</span>
                          <p className="text-xl font-bold font-mono text-ink">
                            {detail?.balance.toFixed(2)} {detail?.currency}
                          </p>
                        </div>
                        <Wallet className="h-8 w-8 text-coral opacity-80" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setBalanceForm({ ...balanceForm, type: "CREDIT" })}
                          className={`py-3 rounded-lg border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                            balanceForm.type === "CREDIT"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          <ArrowUpRight size={15} />
                          Créditer (+)
                        </button>

                        <button
                          type="button"
                          onClick={() => setBalanceForm({ ...balanceForm, type: "DEBIT" })}
                          className={`py-3 rounded-lg border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                            balanceForm.type === "DEBIT"
                              ? "bg-red-50 border-red-500 text-red-800"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          <ArrowDownRight size={15} />
                          Débiter (-)
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Montant en {detail?.currency}</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          required
                          placeholder="Ex: 500"
                          value={balanceForm.amount}
                          onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                          className="mt-1 h-11 w-full rounded-lg border border-border px-3 text-lg font-mono font-bold bg-background"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink">Motif obligatoire (Justificatif d&apos;audit)</label>
                        <input
                          type="text"
                          required
                          minLength={5}
                          placeholder="Ex: Virement CIH reçu #48291 / Geste commercial"
                          value={balanceForm.reason}
                          onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Cette action sera inscrite dans le journal d&apos;audit sécurisé et la chronologie CRM.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={adjustingBalance || !balanceForm.amount || !balanceForm.reason}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-ink hover:bg-ink-line rounded-lg transition-colors"
                      >
                        {adjustingBalance ? "Application..." : "Confirmer l'opération financière"}
                      </button>
                    </form>
                  )}

                  {/* Tab 3: CRM Notes Timeline */}
                  {drawerTab === "notes" && (
                    <div className="space-y-4">
                      {/* Add Note Input */}
                      <form onSubmit={handleAddNote} className="space-y-2">
                        <textarea
                          rows={2}
                          required
                          placeholder="Ajouter une note de suivi interne ou compte-rendu d'appel..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          className="w-full rounded-lg border border-border p-3 text-xs bg-background"
                        />
                        <button
                          type="submit"
                          disabled={addingNote || !newNoteContent.trim()}
                          className="px-4 py-2 text-xs font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                        >
                          {addingNote ? "Ajout..." : "Publier la note"}
                        </button>
                      </form>

                      {/* Notes list */}
                      <div className="mt-6 space-y-3">
                        {detail?.crmNotes && detail.crmNotes.length > 0 ? (
                          detail.crmNotes.map((note) => (
                            <div key={note.id} className="p-3 rounded-lg border border-border bg-ivory-deep text-xs space-y-1">
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span className="font-semibold text-ink">{note.authorName}</span>
                                <span>{new Date(note.createdAt).toLocaleString("fr-FR")}</span>
                              </div>
                              <p className="text-ink leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-6 text-xs text-muted-foreground">
                            Aucune note enregistrée pour ce client.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Recent Orders */}
                  {drawerTab === "orders" && (
                    <div className="space-y-3">
                      {detail?.orders && detail.orders.length > 0 ? (
                        detail.orders.map((o) => (
                          <div key={o.id} className="p-3 rounded-lg border border-border bg-card text-xs flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-ink">{o.serviceName}</p>
                              <p className="text-muted-foreground text-[11px] truncate max-w-[300px]">{o.link}</p>
                              <span className="text-[10px] text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-ink">{o.charge.toFixed(2)} {detail.currency}</p>
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-ivory-deep border border-border">
                                {o.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-xs text-muted-foreground">
                          Aucune commande récente.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
