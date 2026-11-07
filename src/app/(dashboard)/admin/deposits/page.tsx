"use client";
import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, XCircle, Clock, RefreshCw, Search, Check, AlertCircle, Loader2, } from "lucide-react";
export default function AdminDepositsPage() {
    const [deposits, setDeposits] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const fetchDeposits = async () => {
        try {
            const res = await fetch("/api/deposits");
            const data = await res.json();
            setDeposits(data.deposits || []);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDeposits();
    }, []);
    const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
        setActionLoading(`${id}-${status}`);
        try {
            const res = await fetch(`/api/deposits/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok)
                alert(data.error || "Action failed");
            else
                fetchDeposits();
        }
        catch (err: any) {
            alert(err.message);
        }
        finally {
            setActionLoading(null);
        }
    };
    const filteredDeposits = deposits.filter((d) => {
        if (statusFilter === "ALL")
            return true;
        return d.status === statusFilter;
    });
    return (<div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-coral"/> Customer Deposit Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez la réception des paiements et les justificatifs avant de créditer le portefeuille client.
          </p>
        </div>

        <button onClick={fetchDeposits} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ivory-deep hover:bg-slate-700 text-ink text-xs font-semibold transition border border-border">
          <RefreshCw className="w-3.5 h-3.5"/> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (<button key={st} onClick={() => setStatusFilter(st)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${statusFilter === st
                ? "bg-coral text-white shadow-lg shadow-emerald-600/20"
                : "bg-card text-muted-foreground hover:text-ink border border-border"}`}>
            {st} {st === "PENDING" && deposits.filter((d) => d.status === "PENDING").length > 0 && `(${deposits.filter((d) => d.status === "PENDING").length})`}
          </button>))}
      </div>

      {/* Deposits Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-ivory-deep text-muted-foreground border-b border-border font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Méthode</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Référence / justificatif</th>
              <th className="p-4">Date</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredDeposits.length === 0 ? (<tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground font-sans">
                  Aucun dépôt dans cette vue.
                </td>
              </tr>) : (filteredDeposits.map((d) => (<tr key={d.id} className="hover:bg-ivory-deep transition">
                  <td className="p-4">
                    <span className="font-bold text-ink block">{d.user?.name || "Client"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{d.user?.email}</span>
                  </td>
                  <td className="p-4 font-bold text-ink">{d.method}</td>
                  <td className="p-4 font-mono text-base font-black text-coral">
                    +{d.amount.toFixed(2)} {d.currency}<span className="block text-xs">À vérifier : {(d.paidAmount ?? d.amount).toFixed(2)} {d.currency} · Frais : {(d.feeAmount ?? 0).toFixed(2)}</span>
                  </td>
                  <td className="p-4 font-mono text-ink max-w-xs truncate">
                    {d.reference || "Non renseignée"}{d.proofFilename && <a href={`/api/deposits/${d.id}/proof`} className="block underline mt-2">Télécharger le justificatif</a>}<span className="block text-xs">{d.paymentTiming === "INSTANT" ? "Virement instantané déclaré" : "Paiement classique"}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    {d.status === "APPROVED" && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-coral border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3"/> Approuvé
                      </span>)}
                    {d.status === "PENDING" && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-warning border border-amber-500/20">
                        <Clock className="w-3 h-3 animate-pulse"/> Pending
                      </span>)}
                    {d.status === "REJECTED" && (<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-danger border border-rose-500/20">
                        <XCircle className="w-3 h-3"/> Refusé
                      </span>)}
                  </td>
                  <td className="p-4 text-right">
                    {d.status === "PENDING" ? (<div className="inline-flex items-center gap-2">
                        <button onClick={() => handleUpdateStatus(d.id, "APPROVED")} disabled={actionLoading !== null} className="px-3 py-1.5 rounded-lg bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1 transition">
                          <Check className="w-3.5 h-3.5"/> Approve (+Credit)
                        </button>
                        <button onClick={() => handleUpdateStatus(d.id, "REJECTED")} disabled={actionLoading !== null} className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-danger text-xs font-semibold transition">
                          Refuser
                        </button>
                      </div>) : (<span className="text-[10px] text-muted-foreground italic">Traité</span>)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
}
