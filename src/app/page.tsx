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
  Star,
  Users,
  Check,
  ChevronRight,
  Flame,
  Globe2,
} from "lucide-react";

export default function LandingPage() {
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [currency, setCurrency] = useState<"MAD" | "USD">("MAD");
  const [user, setUser] = useState<any>(null);

  // Live Simulator State (Interactive Hero Card)
  const [simPlatform, setSimPlatform] = useState<"instagram" | "tiktok" | "youtube" | "telegram">("instagram");
  const [simQty, setSimQty] = useState(2500);

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

  // Simulator pricing
  const simRates: Record<string, { name: string; rate: number; speed: string }> = {
    instagram: { name: "Instagram Real Followers [HQ - 30D Refill]", rate: 38, speed: "5K - 15K / Day" },
    tiktok: { name: "TikTok High Retention Views [Instant Viral Boost]", rate: 12, speed: "50K - 100K / Day" },
    youtube: { name: "YouTube Monetization WatchTime & Views", rate: 27, speed: "2K - 5K / Day" },
    telegram: { name: "Telegram Channel Members [Non Drop - 100% Active]", rate: 30, speed: "10K / Day" },
  };

  const simSelected = simRates[simPlatform];
  const simTotal = (simQty / 1000) * simSelected.rate;

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 selection:bg-emerald-500 selection:text-white relative">
      {/* Ambient background mesh */}
      <div className="ambient-mesh" />

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto h-16 sm:h-20 glass-card rounded-2xl sm:rounded-3xl px-6 flex items-center justify-between border border-white/10 backdrop-blur-2xl">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white">SMM</span>
                <span className="text-xl font-black tracking-tight text-emerald-400">aroc</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30">
                  🇲🇦 MA
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block">
                Wholesale Growth Engine
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#services" className="hover:text-emerald-400 transition">Services Catalog</a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition">How It Works</a>
            <a href="#payments" className="hover:text-emerald-400 transition">Moroccan Payments</a>
            <a href="/api-docs" className="hover:text-emerald-400 transition">Reseller API</a>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center bg-dark-900 border border-dark-700 rounded-xl p-1 text-xs font-bold">
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
                className="px-5 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 hover:opacity-95 transition"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-dark-900/80 hover:bg-dark-800 text-slate-200 text-xs font-semibold border border-white/5 transition"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="px-5 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 hover:opacity-95 transition"
                >
                  Create Account <Sparkles className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (2-Column Dribbble Layout) */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Pitch & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Live Ticker Chip */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>9,100+ Live Services • Automated 24/7 Dispatch</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Scale Your Social Presence{" "}
              <span className="text-gradient-emerald">
                Faster Than Ever.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed mx-auto lg:mx-0">
              The premier automated SMM panel built for Morocco. Direct wholesale connections, instant delivery, <b>CIH Bank & Attijariwafa</b> local deposits, and automated failover backup.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl primary-gradient text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition"
              >
                Start Growing Today <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#services"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-dark-900/90 hover:bg-dark-800 text-slate-200 font-semibold text-sm border border-white/10 transition flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-emerald-400" /> Explore Catalog & Prices
              </a>
            </div>

            {/* Social Proof Cluster */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 border-t border-white/5">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-dark-950 bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  YA
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-dark-950 bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  SM
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-dark-950 bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  KB
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-dark-950 bg-dark-800 text-emerald-400 flex items-center justify-center text-xs font-bold shadow-md">
                  +25k
                </div>
              </div>
              <div className="text-center sm:text-left text-xs">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                  <span className="font-bold ml-1 text-white">4.9/5</span>
                </div>
                <p className="text-slate-400 mt-0.5">Trusted by 28,000+ creators, influencers & marketing agencies in Morocco</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Order Simulator (Growfollows Dribbble Widget) */}
          <div className="lg:col-span-5 relative">
            {/* Glow Aura */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 to-indigo-600 opacity-20 blur-2xl pointer-events-none" />

            <div className="relative glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-card space-y-5">
              {/* Card Header: Platform Selector Pills */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Live Order Simulator
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Instant Fulfill
                </span>
              </div>

              {/* Platform Tabs */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "instagram", name: "Instagram", color: "from-pink-500 to-purple-600" },
                  { id: "tiktok", name: "TikTok", color: "from-cyan-400 to-slate-900" },
                  { id: "youtube", name: "YouTube", color: "from-red-500 to-rose-700" },
                  { id: "telegram", name: "Telegram", color: "from-sky-400 to-blue-600" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSimPlatform(p.id as any)}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 border ${
                      simPlatform === p.id
                        ? "bg-dark-800 border-emerald-500 text-white shadow-md"
                        : "bg-dark-900/60 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${p.color}`} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Simulated Service */}
              <div className="p-3 rounded-xl bg-dark-950/70 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Service Selected:</span>
                <p className="text-xs font-bold text-slate-200">{simSelected.name}</p>
                <div className="flex items-center gap-3 text-[11px] text-emerald-400 pt-1">
                  <span>⚡ Speed: {simSelected.speed}</span>
                  <span>• 30-Day Refill</span>
                </div>
              </div>

              {/* Target Link Input Mockup */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Profile / Link</label>
                <input
                  type="text"
                  readOnly
                  value={`https://${simPlatform}.com/your_profile`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-slate-300 font-mono text-xs"
                />
              </div>

              {/* Quantity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Quantity:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{simQty.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={25000}
                  step={500}
                  value={simQty}
                  onChange={(e) => setSimQty(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-dark-950 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>500</span>
                  <span>10,000</span>
                  <span>25,000</span>
                </div>
              </div>

              {/* Live Price & Delivery Bar */}
              <div className="p-4 rounded-2xl bg-dark-950/80 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Estimated Price:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {simTotal.toFixed(2)} MAD
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      (${(simTotal / 10).toFixed(2)} USD)
                    </span>
                  </div>
                </div>

                <a
                  href="/register"
                  className="px-4 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:opacity-95 transition flex items-center gap-1"
                >
                  Order This <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Live Simulation Progress Strip */}
              <div className="p-3 rounded-xl bg-dark-950/40 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-400 animate-spin" /> Fulfilling Order #9842:
                  </span>
                  <span className="font-mono font-bold text-emerald-400">84% Completed</span>
                </div>
                <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden">
                  <div className="w-[84%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Moroccan Payment Methods Showcase */}
      <section id="payments" className="py-12 border-y border-white/5 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-slate-400 font-bold mb-6">
            Instant Zero-Fee Moroccan Banking & Global Crypto
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 font-black text-xs flex items-center justify-center">
                CIH
              </div>
              <div>
                <p className="text-xs font-bold text-white">CIH Bank</p>
                <p className="text-[10px] text-slate-400">Direct Virement</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 font-black text-xs flex items-center justify-center">
                AWB
              </div>
              <div>
                <p className="text-xs font-bold text-white">Attijariwafa</p>
                <p className="text-[10px] text-slate-400">Virement Bancaire</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center">
                CP
              </div>
              <div>
                <p className="text-xs font-bold text-white">Cash Plus</p>
                <p className="text-[10px] text-slate-400">Cash Deposit</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                ₮
              </div>
              <div>
                <p className="text-xs font-bold text-white">USDT TRC20</p>
                <p className="text-[10px] text-slate-400">Binance Pay</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 border border-white/5 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">
                💳
              </div>
              <div>
                <p className="text-xs font-bold text-white">Card / PayPal</p>
                <p className="text-[10px] text-slate-400">International</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (4-Step Flow) */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
            Simplicity & Speed
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            How SMMaroc Works in 4 Simple Steps
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            No password or login credentials required for your social accounts. 100% safe & automated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Create Account",
              desc: "Sign up in 10 seconds. Get your instant personal customer wallet and Reseller API key.",
            },
            {
              step: "02",
              title: "Deposit Funds",
              desc: "Add Moroccan Dirhams (MAD) via CIH Bank, Attijariwafa, Cash Plus, or Crypto USDT.",
            },
            {
              step: "03",
              title: "Select Service & Link",
              desc: "Choose from 9,000+ verified services and enter your public link (Instagram, TikTok, YouTube).",
            },
            {
              step: "04",
              title: "Instant Delivery",
              desc: "Orders start immediately. If an upstream server stalls, our smart failover auto-reroutes.",
            },
          ].map((item) => (
            <div key={item.step} className="glass-card p-6 rounded-3xl border border-white/5 space-y-3 relative group">
              <div className="text-3xl font-black text-emerald-500/30 group-hover:text-emerald-400 transition font-mono">
                {item.step}
              </div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Services Catalog */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-6 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              Transparent Pricing
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white">Live Services & Rates</h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time rates for Instagram, TikTok, YouTube, Telegram, Facebook, and more.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Instagram, TikTok, Views..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "primary-gradient text-white shadow-lg shadow-emerald-600/20"
                  : "bg-dark-900/60 text-slate-400 hover:text-slate-200 border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Table */}
        <div className="rounded-3xl border border-white/10 bg-dark-900/60 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-dark-950/80 text-slate-400 border-b border-white/5 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Platform</th>
                  <th className="p-4">Min / Max</th>
                  <th className="p-4">Rate (per 1k)</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredServices.slice(0, 50).map((s) => (
                  <tr key={s.id} className="hover:bg-dark-800/40 transition">
                    <td className="p-4 font-mono text-slate-500">#{s.id.slice(0, 6)}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-200 block text-sm">{s.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {s.minQuantity.toLocaleString()} – {s.maxQuantity.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-base font-black text-emerald-400">
                      {getPrice(s.sellingRatePer1000 || 25.0)}
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href="/register"
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl primary-gradient text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:opacity-95 transition"
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

      {/* CTA Bottom Banner */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="glass-card rounded-3xl p-8 sm:p-14 text-center border border-white/10 relative overflow-hidden">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 blur-xl pointer-events-none" />

          <div className="relative space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
              Morocco's Leading Wholesale Provider
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Accelerate Your Social Growth?
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Join thousands of Moroccan creators, brands, and digital marketing agencies who rely on SMMaroc for automated delivery every single day.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl primary-gradient text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition"
              >
                Create Your Account Now <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/api-docs"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-dark-900 text-slate-300 font-semibold text-sm border border-white/10 transition"
              >
                Explore Reseller API
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-dark-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl primary-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white text-base">SMMaroc</span>
            <span className="text-xs text-slate-500">© 2026 SMMaroc SARL. Morocco.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="/login" className="hover:text-emerald-400 transition">Sign In</a>
            <a href="/register" className="hover:text-emerald-400 transition">Register</a>
            <a href="/add-funds" className="hover:text-emerald-400 transition">CIH Bank Deposit</a>
            <a href="/api-docs" className="hover:text-emerald-400 transition">Reseller API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
