"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {readApi} from "@/lib/api-client";
import { Users, PlusCircle, ExternalLink, Mail, FileText, CheckCircle } from "lucide-react";

export default function ClientsPage() {
  const [accounts,setAccounts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = async () => {
    try {
      const data = await readApi("/api/clients");
      setClients(data.clients || []);
      setAccounts(data.accounts || []);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");

      setShowModal(false);
      setName("");
      setEmail("");
      setNotes("");
      fetchClients();
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Clients</h1>
          <p className="text-sm text-slate-400 mt-1">
            Retrouvez les comptes inscrits et vos fiches de clients d’agence.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Add Agency Client
        </button>
      </div>

      {error && !showModal && <div role="alert" className="dashboard-alert">{error}<button onClick={fetchClients}>Réessayer</button></div>}
      <section><h2 className="font-semibold mb-4">Comptes inscrits ({accounts.length})</h2>
      {loading ? <p role="status">Chargement…</p> : accounts.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{accounts.map(account=><article key={account.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"><h3 className="font-bold">{account.name}</h3><p className="text-sm break-all">{account.email}</p><p className="text-sm">Solde : {Number(account.balance).toFixed(2)} {account.currency} · {account._count?.orders || 0} commandes</p><p className="text-xs text-slate-500">Inscrit le {new Date(account.createdAt).toLocaleDateString("fr-MA")}</p><Link className="text-brand-400 text-sm" href={"/orders?userId="+account.id}>Voir les commandes →</Link></article>)}</div> : <p>Aucun compte client inscrit.</p>}</section>
      <h2 className="font-semibold">Fiches d’agence ({clients.length})</h2>
      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{c.name}</h3>
                {c.email && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                    <Mail className="w-3 h-3 text-slate-500" /> {c.email}
                  </p>
                )}
              </div>
              <div className="px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold font-mono">
                {c._count?.orders || 0} Orders
              </div>
            </div>

            {c.notes && (
              <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                {c.notes}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
              <span className="text-[10px] text-slate-500">
                Created {new Date(c.createdAt).toLocaleDateString()}
              </span>
              <Link
                href={`/orders?clientId=${c.id}`}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
              >
                View Client Orders <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Client */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Add Agency Client Tag</h2>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Name / Brand</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Acme Corporation, Nike Promo"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marketing@client.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Campaign Details</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Target goals, monthly budget, preferred services..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
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
                  {saving ? "Saving..." : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
