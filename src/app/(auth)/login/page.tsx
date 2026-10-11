"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/orders/new");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center p-4 bg-[#050811] bg-emerald-glow">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl emerald-gradient emerald-glow shadow-xl shadow-emerald-500/25 mb-4">
            <img src="/smmaroc-logo.png" alt="Logo SMMaroc" width={44} height={44}/>
          </a>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            Welcome to <span className="text-emerald-400">SMMaroc</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your client or reseller portal</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="name@agency.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl emerald-gradient hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Access SMMaroc Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Hint Box */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="text-center">
              <p className="text-xs text-slate-400">
                Don't have an account?{" "}
                <a href="/register" className="text-emerald-400 hover:underline font-bold">
                  Create a commercial account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
