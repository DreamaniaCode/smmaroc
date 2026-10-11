"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {readApi} from "@/lib/api-client";
import {
  Send,
  FileSpreadsheet,
  Layers,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Wallet,
  CreditCard,
  Plus,
  ShieldCheck,
  Check,
  Zap,
  Info,
} from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"SINGLE" | "MASS">("SINGLE");

  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("General");
  const [selectedService, setSelectedService] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(1000);

  // Drip-feed
  const [enableDripFeed, setEnableDripFeed] = useState(false);
  const [runs, setRuns] = useState(2);
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  // Mass Order
  const [massText, setMassText] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    readApi("/api/auth/me")
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      }).catch(err=>setError(err.message));

    readApi("/api/clients")
      .then((data) => setClients(data.clients || [])).catch(err=>setError(err.message));

    readApi("/api/services")
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const sList = data.services || [];
        setServices(sList);
        if (sList.length > 0) {
          setSelectedService(sList[0].id);
        }
      }).catch(err => setError(err.message || "Catalogue indisponible"));
  }, []);

  const platforms = [
    { id: "Instagram", name: "Instagram", icon: "📸", color: "from-pink-500 to-purple-600" },
    { id: "TikTok", name: "TikTok", icon: "🎵", color: "from-cyan-400 to-slate-900" },
    { id: "YouTube", name: "YouTube", icon: "▶️", color: "from-red-500 to-rose-700" },
    { id: "Telegram", name: "Telegram", icon: "✈️", color: "from-sky-400 to-blue-600" },
    { id: "Facebook", name: "Facebook", icon: "👥", color: "from-blue-600 to-indigo-700" },
    { id: "General", name: "All Other", icon: "⚡", color: "from-emerald-500 to-teal-700" },
  ];

  const filteredServices = services.filter((s) => {
    if (selectedPlatform === "General") return true;
    return s.category.toLowerCase().includes(selectedPlatform.toLowerCase());
  });

  const activeServiceObj = filteredServices.find((s) => s.id === selectedService) || filteredServices[0];

  const isAdmin = user?.role === "ADMIN";
  const userBalance = user?.balance || 0.0;
  const userCurrency = user?.currency || "MAD";

  // Real-time calculations
  const ratePerThousand = activeServiceObj?.sellingRatePer1000 ?? 0;
  const totalCost = (quantity / 1000) * ratePerThousand;
  const remainingBalance = userBalance - totalCost;
  const hasEnoughFunds = isAdmin || userBalance >= totalCost;

  const handleMassSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(""); setResult(null);
    try { const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "MASS", rawText: massText }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || data.errors?.[0]?.error || "Aucune commande acceptée"); setResult({ success: true, message: `${data.count} commandes acceptées` }); if (data.errors?.length) setError(data.errors.map((item: any) => item.error).join(" · ")); else setMassText(""); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  // Handle Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServiceObj) { setError("Choisissez un service disponible"); return; }
    if (!hasEnoughFunds) {
      setError(`Insufficient wallet balance. Cost: ${totalCost.toFixed(2)} ${userCurrency}. Please deposit funds.`);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SINGLE",
          clientId: selectedClient || undefined,
          serviceId: activeServiceObj?.id || selectedService,
          link,
          quantity,
          runs: enableDripFeed ? runs : 1,
          intervalMinutes: enableDripFeed ? intervalMinutes : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.errors?.[0]?.error || "Failed to place order");

      setResult({
        success: true,
        count: 1,
        message: data.orders?.[0]?.status === "AWAITING_FUNDS" ? (user?.role === "ADMIN" ? "Commande enregistrée, en attente de traitement." : `Commande enregistrée, en attente de traitement. ${totalCost.toFixed(2)} ${userCurrency} débités. Aucun nouveau débit lors de son envoi.`) : user?.role === "ADMIN" ? "Commande enregistrée. Portefeuille administrateur non débité." : `Commande enregistrée. ${totalCost.toFixed(2)} ${userCurrency} débités du portefeuille.`,
      });
      setLink("");

      // Refresh live user balance
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (d.authenticated) setUser(d.user);
        });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-400" /> New Order Desk
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Direct wholesale routing with automated start and live failover backup.
          </p>
        </div>

        {/* User Balance Chip */}
        <div className="px-5 py-2.5 rounded-2xl glass-card border border-emerald-500/20 flex items-center gap-3">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <span className="text-slate-400 block font-bold uppercase text-[10px]">Your Balance</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              {userBalance.toFixed(2)} {userCurrency}
            </span>
          </div>
          <a
            href="/add-funds"
            className="ml-2 px-3 py-1.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition"
          >
            + Top Up
          </a>
        </div>
      </div>

      {/* Notifications */}
      {result && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">{result.message}</p>
            <p className="text-xs text-emerald-300/80 mt-1">
              Track live progress and start counts in{" "}
              <a href="/orders" className="underline font-bold">
                My Orders
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          {!hasEnoughFunds && (
            <a
              href="/add-funds"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
            >
              Deposit Funds via CIH
            </a>
          )}
        </div>
      )}

      <div className="flex gap-3"><button type="button" onClick={() => setTab("SINGLE")} className={`px-4 py-2 rounded-xl border text-sm ${tab === "SINGLE" ? "primary-gradient" : ""}`}>Commande simple</button><button type="button" onClick={() => setTab("MASS")} className={`px-4 py-2 rounded-xl border text-sm ${tab === "MASS" ? "primary-gradient" : ""}`}>Commandes en lot</button></div>
      {tab === "MASS" && <form onSubmit={handleMassSubmit} className="glass-card rounded-2xl p-6 space-y-4"><h2 className="font-bold">Commandes en lot</h2><p className="text-xs text-slate-400">Une ligne par commande : ID du service | lien public | quantité. Copiez les IDs depuis le catalogue.</p><textarea aria-label="Commandes en lot" value={massText} onChange={e => setMassText(e.target.value)} required rows={8} placeholder="ID | https://instagram.com/profil | 1000" className="w-full rounded-xl border p-4 font-mono text-xs"/><button disabled={loading} className="primary-gradient rounded-xl px-5 py-3 text-sm">{loading ? "Envoi…" : "Envoyer les commandes"}</button></form>}
      {/* 2-Column Dribbble Order Workspace */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${tab === "MASS" ? "hidden" : ""}`}>
        {/* Left Column: Input Form (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Platform Selector Grid */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Step 1: Choose Platform
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(p.id);
                    const matched = services.find((s) => s.category.toLowerCase().includes(p.id.toLowerCase()));
                    setSelectedService(matched?.id || "");
                  }}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    selectedPlatform === p.id
                      ? "bg-dark-800 border-emerald-500 ring-2 ring-emerald-500/20 text-white shadow-md"
                      : "bg-dark-900/60 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-xs font-bold">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Service & Link Form */}
          <form onSubmit={handleSingleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
            {/* Service Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Step 2: Choose Service
                </label>
                <span className="text-xs text-emerald-400 font-bold">
                  {ratePerThousand} {userCurrency} / 1k
                </span>
              </div>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-white/10 text-slate-100 font-medium text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.sellingRatePer1000 ?? 0} {userCurrency}/1k)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Link */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Step 3: Target Link / Profile URL
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
                placeholder="https://instagram.com/p/xxx or profile URL"
                className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-white/10 text-slate-100 placeholder-slate-500 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quantity & Quick Step Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Step 4: Quantity
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  Min: {activeServiceObj?.minQuantity || 10} | Max: {activeServiceObj?.maxQuantity || 100000}
                </span>
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                min={activeServiceObj?.minQuantity || 1}
                max={activeServiceObj?.maxQuantity || 1000000}
                required
                className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-white/10 text-slate-100 font-mono text-base font-bold focus:ring-2 focus:ring-emerald-500"
              />

              {/* Quick Qty Buttons */}
              <div className="flex items-center gap-2 mt-2.5">
                {[1000, 2500, 5000, 10000].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="px-3 py-1 rounded-lg bg-dark-900 border border-white/5 text-slate-400 hover:text-white text-xs font-mono font-bold hover:border-emerald-500/40 transition"
                  >
                    +{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button (Mobile / Desktop) */}
            <button
              type="submit"
              disabled={loading || !hasEnoughFunds || !activeServiceObj}
              className="w-full py-4 px-4 rounded-2xl primary-gradient text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Order Now ({totalCost.toFixed(2)} {userCurrency})
            </button>
          </form>
        </div>

        {/* Right Column: Real-time Live Order Summary Card (Dribbble Signature) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-card space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Live Order Summary
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {activeServiceObj?.mapping?.autoFailover ? "Routage de secours" : "Commande directe"}
              </span>
            </div>

            {/* Selected Service Card */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Service:</span>
              <p className="text-sm font-bold text-slate-100">{activeServiceObj?.name || "Select a service"}</p>
              <div className="flex items-center gap-3 text-xs text-emerald-400 pt-1">
                <span>Les délais dépendent du service choisi.</span>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-dark-950/80 border border-white/5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Rate per 1,000:</span>
                <span className="text-white font-bold">{ratePerThousand.toFixed(2)} {userCurrency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Ordered Quantity:</span>
                <span className="text-white font-bold">{quantity.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-slate-200 font-bold font-sans">Total Order Charge:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {totalCost.toFixed(2)} {userCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>USD Equivalent:</span>
                <span>${(totalCost / 10).toFixed(2)} USD</span>
              </div>
            </div>

            {/* Wallet Impact */}
            <div className="p-4 rounded-2xl bg-dark-950/40 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Available Wallet:</span>
                <span className="font-mono font-bold text-slate-200">{userBalance.toFixed(2)} {userCurrency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Balance After Order:</span>
                <span className={`font-mono font-bold ${remainingBalance < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {remainingBalance.toFixed(2)} {userCurrency}
                </span>
              </div>
            </div>

            {/* Top Up Notice if low balance */}
            {!hasEnoughFunds && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-3">
                <p className="font-bold">Insufficient funds in your SMMaroc wallet.</p>
                <a
                  href="/add-funds"
                  className="w-full py-2.5 px-4 rounded-xl primary-gradient text-white font-bold text-center block shadow-lg hover:opacity-95 transition"
                >
                  Deposit via CIH / Attijariwafa Bank
                </a>
              </div>
            )}

            {/* Security Guarantee Strip */}
            <div className="pt-3 border-t border-white/5 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No password or account access required.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automatic wholesale failover redundancy active.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
