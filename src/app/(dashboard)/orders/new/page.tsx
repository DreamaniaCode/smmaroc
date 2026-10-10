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
} from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"SINGLE" | "MASS" | "CSV">("SINGLE");

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

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
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

  // Handle Single Order Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setResult({ success: true, count: 1, message: "Order placed and dispatched upstream!" });
      setLink("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Mass Order Submit
  const handleMassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MASS",
          clientId: selectedClient || undefined,
          rawText: massText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place mass orders");

      setResult({
        success: true,
        count: data.count,
        message: `Successfully processed ${data.count} orders!`,
        errors: data.errors,
      });
      setMassText("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file selection
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const parsed: any[] = [];
      // Skip header if first line is string
      const startIndex = lines[0].toLowerCase().includes("service") ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length >= 3) {
          parsed.push({
            serviceId: parts[0],
            link: parts[1],
            quantity: parseInt(parts[2], 10),
          });
        }
      }
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  };

  // Handle CSV Submit
  const handleCsvSubmit = async () => {
    if (csvPreview.length === 0) return;
    setLoading(true);
    setError("");

    const formattedLines = csvPreview.map((c) => `${c.serviceId} | ${c.link} | ${c.quantity}`).join("\n");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MASS",
          clientId: selectedClient || undefined,
          rawText: formattedLines,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "CSV upload failed");

      setResult({
        success: true,
        count: data.count,
        message: `Imported and dispatched ${data.count} CSV orders!`,
        errors: data.errors,
      });
      setCsvPreview([]);
      setCsvFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Order Placement Desk</h1>
        <p className="text-sm text-slate-400 mt-1">
          Instant dispatch to upstream wholesale providers with automatic failover redundancy.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setTab("SINGLE"); setResult(null); setError(""); }}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            tab === "SINGLE"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Send className="w-4 h-4" /> Single Order
        </button>
        <button
          onClick={() => { setTab("MASS"); setResult(null); setError(""); }}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            tab === "MASS"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" /> Mass Order (Multi-line)
        </button>
        <button
          onClick={() => { setTab("CSV"); setResult(null); setError(""); }}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            tab === "CSV"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> CSV Batch Import
        </button>
      </div>

      {/* Notifications */}
      {result && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">{result.message}</p>
            <p className="text-xs text-emerald-300/80 mt-1">
              You can monitor real-time delivery and upstream status in the{" "}
              <a href="/orders" className="underline font-bold">
                Orders Desk
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Tab 1: Single Order */}
      {tab === "SINGLE" && (
        <form onSubmit={handleSingleSubmit} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
          {/* Client Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Agency Client Tag (Optional)
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- No Client (Internal Agency Work) --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Service Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const firstInCat = services.find((s) => s.category === e.target.value);
                  if (firstInCat) setSelectedService(firstInCat.id);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.ratePer1000}/1k)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Routing Info Pill */}
          {activeServiceObj?.mapping && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between text-slate-400">
              <span>
                Primary Provider:{" "}
                <span className="text-brand-400 font-semibold">
                  {activeServiceObj.mapping.primaryProvider?.name || "Configured"}
                </span>
              </span>
              {activeServiceObj.mapping.autoFailover && activeServiceObj.mapping.backupProvider && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Auto-failover to{" "}
                  {activeServiceObj.mapping.backupProvider.name}
                </span>
              )}
            </div>
          )}

          {/* Target Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Link / URL
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              placeholder="https://instagram.com/p/xxx or https://youtube.com/watch?v=xxx"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
            />
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Quantity
              </label>
              <span className="text-xs text-slate-500">
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
            />
          </div>

          {/* Drip Feed Toggle */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={enableDripFeed}
                onChange={(e) => setEnableDripFeed(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 bg-slate-950 border-slate-800 focus:ring-brand-500"
              />
              Enable Drip-Feed (Interval Delivery)
            </label>

            {enableDripFeed && (
              <div className="grid grid-cols-2 gap-4 mt-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Runs</label>
                  <input
                    type="number"
                    value={runs}
                    onChange={(e) => setRuns(parseInt(e.target.value, 10))}
                    min={2}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Interval (Minutes)</label>
                  <input
                    type="number"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(parseInt(e.target.value, 10))}
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Dispatch Order
          </button>
        </form>
      )}

      {/* Tab 2: Mass Order */}
      {tab === "MASS" && (
        <form onSubmit={handleMassSubmit} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Agency Client Tag (Optional)
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- No Client (Internal Agency Work) --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Mass Orders Input
              </label>
              <span className="text-xs text-slate-400 font-mono">Format: service_id | link | quantity</span>
            </div>
            <textarea
              rows={8}
              value={massText}
              onChange={(e) => setMassText(e.target.value)}
              required
              placeholder={`service_id | https://instagram.com/p/xxx | 1000\nservice_id | https://youtube.com/watch?v=xxx | 2500`}
              className="w-full p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Dispatch Mass Batch
          </button>
        </form>
      )}

      {/* Tab 3: CSV Batch Import */}
      {tab === "CSV" && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Upload CSV Spreadsheet
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 file:cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2 font-mono">
              CSV Format columns: ServiceID, TargetLink, Quantity
            </p>
          </div>

          {csvPreview.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Preview ({csvPreview.length} rows detected)
              </h3>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Service ID</th>
                      <th className="p-3">Link</th>
                      <th className="p-3">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {csvPreview.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-brand-400">{row.serviceId}</td>
                        <td className="p-3 text-slate-300 truncate max-w-xs">{row.link}</td>
                        <td className="p-3 text-slate-300">{row.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleCsvSubmit}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Dispatch {csvPreview.length} Orders from CSV
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
