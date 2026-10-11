"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  CreditCard,
  Building,
  Coins,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function AddFundsPage() {
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [user, setUser] = useState<any>(null);
  const [method, setMethod] = useState<"CIH_BANK" | "ATTIJARIWAFA" | "CASH_PLUS" | "USDT_TRC20">("CIH_BANK");
  const [amount, setAmount] = useState<number>(200);
  const [reference, setReference] = useState("");
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const uRes = await fetch("/api/auth/me");
      const uData = await uRes.json();
      if (uData.authenticated) setUser(uData.user);

      const dRes = await fetch("/api/deposits");
      const dData = await dRes.json();
      setDeposits(dData.deposits || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetch("/api/payment-methods").then(r => r.json()).then(d => { setPaymentMethods(d.methods || {}); const first = Object.keys(d.methods || {})[0]; if (first) setMethod(first as any); }).catch(() => setError("Chargement des coordonnées impossible"));
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "MAD",
          method,
          reference,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deposit submission failed");

      setMessage("Deposit request submitted successfully! An administrator will review and credit your wallet shortly.");
      setReference("");
      fetchUserData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" /> Add Funds to Your Wallet
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deposit Moroccan Dirhams (MAD) via local Moroccan banks with validation manuelle du dépôt.
          </p>
        </div>

        {/* Live Wallet Pill */}
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl emerald-gradient flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Current Available Balance
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {(user?.balance || 0).toFixed(2)} {user?.currency || "MAD"}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Payment Methods Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setMethod("CIH_BANK")}
          className={`p-4 rounded-2xl border text-left transition ${
            method === "CIH_BANK"
              ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
              : "glass-panel border-white/5 hover:border-slate-700"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs mb-3">
            CIH
          </div>
          <h3 className="font-bold text-sm text-white">CIH Bank</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Instant Moroccan Transfer</p>
        </button>

        <button
          type="button"
          onClick={() => setMethod("ATTIJARIWAFA")}
          className={`p-4 rounded-2xl border text-left transition ${
            method === "ATTIJARIWAFA"
              ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
              : "glass-panel border-white/5 hover:border-slate-700"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-black text-xs mb-3">
            AWB
          </div>
          <h3 className="font-bold text-sm text-white">Attijariwafa</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Virement Bancaire</p>
        </button>

        <button
          type="button"
          onClick={() => setMethod("CASH_PLUS")}
          className={`p-4 rounded-2xl border text-left transition ${
            method === "CASH_PLUS"
              ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
              : "glass-panel border-white/5 hover:border-slate-700"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs mb-3">
            CP
          </div>
          <h3 className="font-bold text-sm text-white">Cash Plus</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Agency Cash Deposit</p>
        </button>

        <button
          type="button"
          onClick={() => setMethod("USDT_TRC20")}
          className={`p-4 rounded-2xl border text-left transition ${
            method === "USDT_TRC20"
              ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
              : "glass-panel border-white/5 hover:border-slate-700"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs mb-3">
            ₮
          </div>
          <h3 className="font-bold text-sm text-white">Crypto USDT</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Binance Pay / TRC20</p>
        </button>
      </div>

      {/* Payment Details Box */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="space-y-3"><h3 className="font-bold text-white">Coordonnées de paiement · {method}</h3>{paymentMethods[method] ? <><p className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">{paymentMethods[method]}</p><button type="button" onClick={() => handleCopy(paymentMethods[method], "instructions")} className="text-sm text-emerald-400">{copied === "instructions" ? "Copié" : "Copier les coordonnées"}</button></> : <p className="text-sm text-slate-400">Ce mode de paiement sera disponible après configuration par un administrateur. Aucune coordonnée de démonstration n’est utilisée.</p>}</div>
        {/* Deposit Confirmation Form */}
        <form onSubmit={handleSubmitDeposit} className="pt-4 border-t border-slate-800/80 space-y-4">
          <h4 className="text-sm font-bold text-white">Submit Transfer Confirmation</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Deposit Amount (MAD)
              </label>
              <input
                type="number"
                min={50}
                max={50000}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Minimum deposit: 50 MAD</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Transaction Reference / Transfer ID
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                placeholder="e.g. CIH Virement #9821421 or TxHash"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !paymentMethods[method]}
            className="w-full py-3.5 px-4 rounded-xl emerald-gradient hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Deposit Confirmation
          </button>
        </form>
      </div>

      {/* User Deposit History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Your Deposit History</h2>

        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Method</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                    No deposits submitted yet. Choose a payment method above to fund your wallet.
                  </td>
                </tr>
              ) : (
                deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 text-slate-400 font-sans">
                      {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-sans font-semibold text-slate-200">{d.method}</td>
                    <td className="p-4 text-slate-400 truncate max-w-xs">{d.reference || "—"}</td>
                    <td className="p-4 text-emerald-400 font-bold">
                      +{d.amount.toFixed(2)} {d.currency}
                    </td>
                    <td className="p-4 text-right font-sans">
                      {d.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {d.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3 animate-pulse" /> In Review
                        </span>
                      )}
                      {d.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Rejected
                        </span>
                      )}
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
