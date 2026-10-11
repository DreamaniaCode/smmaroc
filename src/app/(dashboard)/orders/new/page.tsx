"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  FileSpreadsheet,
  Layers,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Wallet,
  CreditCard,
  Plus,
} from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"SINGLE" | "MASS" | "CSV">("SINGLE");

  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(100);

  // Drip-feed controls
  const [enableDripFeed, setEnableDripFeed] = useState(false);
  const [runs, setRuns] = useState(2);
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  // Mass Order
  const [massText, setMassText] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      });

    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data.clients || []));

    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        const sList = data.services || [];
        setServices(sList);
        if (sList.length > 0) {
          setSelectedCategory(sList[0].category);
          setSelectedService(sList[0].id);
        }
      });
  }, []);

  const categories = Array.from(new Set(services.map((s) => s.category)));
  const filteredServices = services.filter((s) => !selectedCategory || s.category === selectedCategory);
  const activeServiceObj = services.find((s) => s.id === selectedService);

  const isAdmin = user?.role === "ADMIN";
  const userBalance = user?.balance || 0.0;
  const userCurrency = user?.currency || "MAD";

  // Calculate live order cost
  const ratePerThousand = activeServiceObj?.sellingRatePer1000 || 25.0;
  const totalCost = (quantity / 1000) * ratePerThousand;
  const hasEnoughFunds = isAdmin || userBalance >= totalCost;

  // Handle Single Order Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnoughFunds) {
      setError(`Insufficient balance. Cost: ${totalCost.toFixed(2)} ${userCurrency}, Available: ${userBalance.toFixed(2)} ${userCurrency}. Please add funds.`);
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
          serviceId: selectedService,
          link,
          quantity,
          runs: enableDripFeed ? runs : 1,
          intervalMinutes: enableDripFeed ? intervalMinutes : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setResult({
        success: true,
        count: 1,
        message: `Order placed successfully! ${totalCost.toFixed(2)} ${userCurrency} deducted.`,
      });
      setLink("");

      // Refresh balance
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Place New Order</h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated instant dispatch across Instagram, TikTok, YouTube, and Telegram.
          </p>
        </div>

        {/* Live Wallet Chip */}
        <div className="px-4 py-2 rounded-2xl glass-panel border border-white/5 flex items-center gap-3">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <span className="text-slate-400 block font-semibold">Wallet:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {userBalance.toFixed(2)} {userCurrency}
            </span>
          </div>
          <a
            href="/add-funds"
            className="ml-1 px-2.5 py-1 rounded-lg emerald-gradient text-white text-[11px] font-bold shadow-md hover:opacity-95 transition"
          >
            + Add Funds
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => { setTab("SINGLE"); setResult(null); setError(""); }}
          className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            tab === "SINGLE"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Send className="w-4 h-4" /> Single Order
        </button>
        <button
          onClick={() => { setTab("MASS"); setResult(null); setError(""); }}
          className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            tab === "MASS"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" /> Mass Multi-Link
        </button>
      </div>

      {/* Notifications */}
      {result && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">{result.message}</p>
            <p className="text-xs text-emerald-300/80 mt-1">
              Track live start counts and delivery progress in{" "}
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
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
            >
              Deposit Funds
            </a>
          )}
        </div>
      )}

      {/* Form: Single Order */}
      {tab === "SINGLE" && (
        <form onSubmit={handleSingleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          {/* Admin Client Tag */}
          {isAdmin && clients.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Agency Client Tag (Admin Only)
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- No Client (Direct Commercial Order) --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category & Service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const firstInCat = services.find((s) => s.category === e.target.value);
                  if (firstInCat) setSelectedService(firstInCat.id);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.sellingRatePer1000 || 25} MAD / 1k)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Link / Profile URL
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              placeholder="https://instagram.com/p/xxx or https://tiktok.com/@user/video/xxx"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
            />
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Quantity
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 font-mono text-base font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Live Order Summary & Cost Pill */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Total Charge:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {totalCost.toFixed(2)} {userCurrency}
                </span>
                <span className="text-xs text-slate-500">
                  ({(totalCost / 10).toFixed(2)} USD)
                </span>
              </div>
            </div>

            <div>
              {!hasEnoughFunds ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5" /> Insufficient Funds
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready to Order
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !hasEnoughFunds}
            className="w-full py-4 px-4 rounded-2xl emerald-gradient hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Confirm Order ({totalCost.toFixed(2)} {userCurrency})
          </button>
        </form>
      )}

      {/* Form: Mass Order */}
      {tab === "MASS" && (
        <form onSubmit={handleSingleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Mass Orders Input
            </label>
            <span className="text-xs text-slate-400 font-mono">service_id | link | quantity</span>
          </div>
          <textarea
            rows={8}
            value={massText}
            onChange={(e) => setMassText(e.target.value)}
            required
            placeholder={`service_id | https://instagram.com/p/xxx | 1000\nservice_id | https://tiktok.com/@user/video/xxx | 2500`}
            className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-2xl emerald-gradient hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Dispatch Mass Batch
          </button>
        </form>
      )}
    </div>
  );
}
