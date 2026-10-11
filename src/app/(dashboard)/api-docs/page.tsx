"use client";

import { useState, useEffect } from "react";
import { Key, Copy, Check, Terminal, Code2, Globe, ShieldCheck, Zap } from "lucide-react";

export default function ApiDocsPage() {
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"CURL" | "PYTHON" | "PHP">("CURL");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const apiKey = user?.apiKey || "YOUR_SMMAROC_API_KEY";
  const apiUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v2` : "https://smmaroc.com/api/v2";

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlCode = `# 1. Check your SMMaroc Balance:
curl -X POST ${apiUrl} \\
  -d "key=${apiKey}" \\
  -d "action=balance"

# 2. Place an Order:
curl -X POST ${apiUrl} \\
  -d "key=${apiKey}" \\
  -d "action=add" \\
  -d "service=1" \\
  -d "link=https://instagram.com/p/xxx" \\
  -d "quantity=1000"

# 3. Check Order Status:
curl -X POST ${apiUrl} \\
  -d "key=${apiKey}" \\
  -d "action=status" \\
  -d "order=ORDER_ID"`;

  const pythonCode = `import requests

API_URL = "${apiUrl}"
API_KEY = "${apiKey}"

# Add order
response = requests.post(API_URL, data={
    "key": API_KEY,
    "action": "add",
    "service": "1",
    "link": "https://instagram.com/p/xxx",
    "quantity": 1000
})
order_id = response.json().get("order")
print("Order placed:", order_id)`;

  const phpCode = `<?php
$apiUrl = "${apiUrl}";
$apiKey = "${apiKey}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'key' => $apiKey,
    'action' => 'add',
    'service' => '1',
    'link' => 'https://instagram.com/p/xxx',
    'quantity' => 1000
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);

print_r($response);
?>`;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Terminal className="w-6 h-6 text-emerald-400" /> Reseller API v2 Documentation
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect your own panel, website, bot, or CRM directly to SMMaroc using our universal SMM v2 protocol.
        </p>
      </div>

      {/* User API Key Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Your Personal Reseller API Key</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Pass this key with every request in the <code>key</code> parameter. Keep it private.
        </p>

        <div className="flex items-center gap-3">
          <input
            type="text"
            readOnly
            value={apiKey}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-emerald-400 font-mono text-sm tracking-wider"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-3 rounded-xl emerald-gradient hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Key"}
          </button>
        </div>
      </div>

      {/* API Endpoint & Specification */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <h2 className="text-lg font-bold text-white">Endpoint Details</h2>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">HTTP Method:</span>
            <span className="font-bold text-emerald-400">POST</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">API URL:</span>
            <span className="text-slate-200">{apiUrl}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Protocol:</span>
            <span className="text-slate-200 font-sans">Standard SMM API v2</span>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Code Examples</h3>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setTab("CURL")}
                className={`px-3 py-1 rounded-lg transition ${
                  tab === "CURL" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setTab("PYTHON")}
                className={`px-3 py-1 rounded-lg transition ${
                  tab === "PYTHON" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setTab("PHP")}
                className={`px-3 py-1 rounded-lg transition ${
                  tab === "PHP" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                PHP
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
            {tab === "CURL" && curlCode}
            {tab === "PYTHON" && pythonCode}
            {tab === "PHP" && phpCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
