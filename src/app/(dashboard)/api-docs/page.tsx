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
            if (data.authenticated)
                setUser(data.user);
        })
            .catch(() => { });
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
    return (<div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
          <Terminal className="w-6 h-6 text-coral"/> Reseller API v2 Documentation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connectez votre panel, site ou outil à SMMaroc avec l’API SMM v2.
        </p>
      </div>

      {/* User API Key Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-coral"/>
            <h2 className="text-base font-bold text-ink">Votre clé API revendeur</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-coral border border-emerald-500/20">
            Active
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Pass this key with every request in the <code>key</code> parameter. Keep it private.
        </p>

        <div className="flex items-center gap-3">
          <input type="text" readOnly value={apiKey} className="flex-1 px-4 py-3 rounded-xl bg-ivory-deep border border-border text-coral font-mono text-sm tracking-wider"/>
          <button type="button" onClick={handleCopy} className="px-5 py-3 rounded-xl emerald-gradient hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition">
            {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
            {copied ? "Copied" : "Copy Key"}
          </button>
        </div>
      </div>

      {/* API Endpoint & Specification */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-border space-y-6">
        <h2 className="text-lg font-bold text-ink">Point d’accès API</h2>

        <div className="p-4 rounded-2xl bg-ivory-deep border border-border space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Méthode HTTP :</span>
            <span className="font-bold text-coral">POST</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Adresse API :</span>
            <span className="text-ink">{apiUrl}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Protocole :</span>
            <span className="text-ink font-sans">Standard SMM API v2</span>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Exemples de code</h3>
            <div className="flex rounded-xl bg-ivory-deep p-1 border border-border text-xs font-bold">
              <button onClick={() => setTab("CURL")} className={`px-3 py-1 rounded-lg transition ${tab === "CURL" ? "bg-coral text-white" : "text-muted-foreground hover:text-ink"}`}>
                cURL
              </button>
              <button onClick={() => setTab("PYTHON")} className={`px-3 py-1 rounded-lg transition ${tab === "PYTHON" ? "bg-coral text-white" : "text-muted-foreground hover:text-ink"}`}>
                Python
              </button>
              <button onClick={() => setTab("PHP")} className={`px-3 py-1 rounded-lg transition ${tab === "PHP" ? "bg-coral text-white" : "text-muted-foreground hover:text-ink"}`}>
                PHP
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-ivory-deep border border-border text-xs font-mono text-ink overflow-x-auto leading-relaxed">
            {tab === "CURL" && curlCode}
            {tab === "PYTHON" && pythonCode}
            {tab === "PHP" && phpCode}
          </pre>
        </div>
      </div>
    </div>);
}
