"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Server,
  Lock,
  MessageCircle,
  TrendingUp,
} from "lucide-react";

export default function LandingPage() {
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [currency, setCurrency] = useState<"MAD" | "USD">("MAD");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch(() => {});

    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => setServices(data.services || []))
      .catch(() => {});
  }, []);

  const categories = ["ALL", ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getPrice = (rateInMad: number) => {
    if (currency === "USD") {
      return `$${(rateInMad / 10).toFixed(2)}`;
    }
    return `${rateInMad.toFixed(2)} MAD`;
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl emerald-gradient flex items-center justify-center emerald-glow shadow-lg shadow-emerald-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white">SMM</span>
                <span className="text-xl font-black tracking-tight text-emerald-400">aroc</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  🇲🇦 MA
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block">
                Social Growth Engine
              </span>
            </div>
          </a>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#services" className="hover:text-emerald-400 transition">Services Catalog</a>
            <a href="#features" className="hover:text-emerald-400 transition">Why SMMaroc</a>
            <a href="#payments" className="hover:text-emerald-400 transition">Moroccan Payments</a>
            <a href="/api-docs" className="hover:text-emerald-400 transition">Reseller API</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
              <button
                onClick={() => setCurrency("MAD")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  currency === "MAD"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                MAD
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  currency === "USD"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD ($)
              </button>
            </div>

            {user ? (
              <a
                href="/orders/new"
                className="px-5 py-2.5 rounded-xl emerald-gradient hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="px-5 py-2.5 rounded-xl emerald-gradient hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition"
                >
                  Create Account <Sparkles className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-emerald-glow">
        <div className="max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Morocco's #1 Automated Social Media Growth & Wholesale Reseller Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-[1.1]">
            Scale Your Presence With{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              SMMaroc
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The fastest, most reliable automated SMM service in Morocco. Instant delivery, smart auto-failover backup, local Moroccan bank transfers (CIH, Attijariwafa), and crypto payments.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl emerald-gradient hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
            >
              Get Started for Free <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#services"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-emerald-400" /> Browse 9,000+ Services
            </a>
          </div>

          {/* Payment Badges Banner */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">
              Accepted Moroccan & Global Payment Methods
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-slate-300">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                🏦 <b>CIH Bank</b>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                🏦 <b>Attijariwafa Bank</b>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                💳 <b>Cash Plus / Wafacash</b>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                ⚡ <b>USDT (TRC20 / Binance Pay)</b>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                💳 <b>Visa / Mastercard</b>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights KPI Bar */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white font-mono">10,000,000+</p>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mt-1">Orders Processed</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">0.3s</p>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mt-1">Instant API Dispatch</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">99.98%</p>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mt-1">Uptime with Failover</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white font-mono">24 / 7</p>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mt-1">Moroccan Support</p>
          </div>
        </div>
      </section>

      {/* Live Services Catalog Section */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              Transparent Pricing
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">Live Services & Rates</h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time wholesale rates for Instagram, TikTok, YouTube, Telegram, and more.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Instagram, TikTok, Views..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Min / Max</th>
                  <th className="p-4">Rate (per 1k)</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredServices.slice(0, 50).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 font-mono text-slate-500">#{s.id.slice(0, 6)}</td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-200 block text-sm">{s.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[10px]">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {s.minQuantity.toLocaleString()} – {s.maxQuantity.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-base font-bold text-emerald-400">
                      {getPrice(s.sellingRatePer1000 || 25.0)}
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href="/register"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition"
                      >
                        Order Now
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              Engineered for Moroccan Growth
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Why Agencies & Resellers Choose SMMaroc
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Automated Dispatch</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Orders are processed instantaneously 24/7 without manual intervention. Our upstream connectors route to wholesale servers in milliseconds.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Auto-Failover Backup</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Never lose an order to upstream server downtime. If a primary provider cancels or stalls, SMMaroc automatically reroutes to our backup provider network.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Moroccan Local Payments</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Deposit easily in Moroccan Dirham (MAD) via CIH Bank, Attijariwafa Bank, Cash Plus, or globally via USDT Crypto & Cards. Zero international conversion fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl emerald-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">SMMaroc</span>
            <span className="text-xs text-slate-500">© 2026 SMMaroc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="/login" className="hover:text-emerald-400 transition">Sign In</a>
            <a href="/register" className="hover:text-emerald-400 transition">Register</a>
            <a href="/api-docs" className="hover:text-emerald-400 transition">Reseller API</a>
            <a href="#services" className="hover:text-emerald-400 transition">Services</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
