"use client";
import { useEffect, useState } from "react";
import { Send, FileSpreadsheet, Save, CheckCircle, AlertCircle, Sparkles, Key, Shield, Loader2, ExternalLink, } from "lucide-react";
export default function SettingsPage() {
    const [payments, setPayments] = useState<Record<string, string>>({});
    const [telegramToken, setTelegramToken] = useState("");
    const [telegramChatId, setTelegramChatId] = useState("");
    const [sheetId, setSheetId] = useState("");
    const [sheetTabName, setSheetTabName] = useState("Orders");
    const [sheetCredentials, setSheetCredentials] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [testSuccess, setTestSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
            if (data.error)
                throw new Error(data.error);
            const s = data.settings || {};
            setPayments(Object.fromEntries(["BANK_TRANSFER", "BINANCE_PAY", "PAYPAL"].map(m => [m, s["PAYMENT_" + m] ?? ({ BANK_TRANSFER: "007 450 0013991700300104 14", BINANCE_PAY: "13110721", PAYPAL: "transwbox2@gmail.com" } as Record<string, string>)[m]])));
            if (s.TELEGRAM_BOT_TOKEN)
                setTelegramToken(s.TELEGRAM_BOT_TOKEN);
            if (s.TELEGRAM_CHAT_ID)
                setTelegramChatId(s.TELEGRAM_CHAT_ID);
            if (s.GOOGLE_SPREADSHEET_ID)
                setSheetId(s.GOOGLE_SPREADSHEET_ID);
            if (s.GOOGLE_SHEET_TAB_NAME)
                setSheetTabName(s.GOOGLE_SHEET_TAB_NAME);
            if (s.GOOGLE_SHEETS_CREDENTIALS)
                setSheetCredentials(s.GOOGLE_SHEETS_CREDENTIALS);
        })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);
    const saveSetting = async (key: string, value: string) => {
        setSavingKey(key);
        setError(null);
        setTestSuccess(null);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Enregistrement impossible");
            setTestSuccess(`Setting "${key}" saved successfully!`);
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setSavingKey(null);
        }
    };
    const testTelegram = async () => {
        setSavingKey("test-tg");
        setError(null);
        setTestSuccess(null);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testTelegram: true }),
            });
            const data = await res.json();
            if (!data.success)
                throw new Error("Could not send Telegram test message. Check your Token and Chat ID.");
            setTestSuccess("Telegram test alert sent successfully! Check your Telegram chat.");
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setSavingKey(null);
        }
    };
    return (<div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Réglages et intégrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez les intégrations utilisées par votre processus d’automatisation.
        </p>
      </div>

      {testSuccess && (<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-coral flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0"/>
          <p className="text-sm">{testSuccess}</p>
        </div>)}

      {error && (<div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-danger flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0"/>
          <p className="text-sm">{error}</p>
        </div>)}

      <section className="p-6 rounded-2xl glass-panel space-y-5"><h2 className="font-bold text-ink">Coordonnées de paiement</h2><p className="text-sm text-muted-foreground">Renseignez les coordonnées réelles, le bénéficiaire et les instructions. Un champ vide désactive ce moyen de paiement.</p>{["BANK_TRANSFER", "BINANCE_PAY", "PAYPAL"].map(method => <div key={method} className="space-y-2"><label className="block text-xs font-bold">{method}</label><textarea aria-label={method} value={payments[method] || ""} onChange={e => setPayments({ ...payments, [method]: e.target.value })} rows={3} className="w-full rounded-xl border p-3 text-sm" placeholder="Bénéficiaire, RIB ou adresse et instructions…"/><button disabled={savingKey !== null} onClick={() => saveSetting("PAYMENT_" + method, payments[method] || "")} className="primary-gradient px-4 py-2 rounded-xl text-xs">Enregistrer</button></div>)}</section>
      {/* 1. Telegram Bot Integration */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Send className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Alertes Telegram</h2>
            <p className="text-xs text-muted-foreground">
              Paramétrez les alertes de solde et de suivi envoyées par votre processus d’automatisation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Jeton du bot Telegram
            </label>
            <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="123456789:ABCdefGHIjklMNO..." className="w-full px-4 py-2.5 rounded-xl bg-ivory-deep border border-border text-ink placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-coral text-xs font-mono"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Identifiant du chat ou canal Telegram
            </label>
            <input type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="e.g. 987654321 or -10012345678" className="w-full px-4 py-2.5 rounded-xl bg-ivory-deep border border-border text-ink placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-coral text-xs font-mono"/>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button onClick={testTelegram} disabled={savingKey === "test-tg" || !telegramToken} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory-deep hover:bg-slate-700 text-ink text-xs font-semibold transition border border-border disabled:opacity-50">
            {savingKey === "test-tg" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5 text-warning"/>}
            Tester l’envoi
          </button>

          <button onClick={async () => {
            await saveSetting("TELEGRAM_BOT_TOKEN", telegramToken);
            await saveSetting("TELEGRAM_CHAT_ID", telegramChatId);
        }} disabled={savingKey !== null} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-coral hover:bg-coral text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50">
            <Save className="w-3.5 h-3.5"/> Enregistrer Telegram
          </button>
        </div>
      </div>

      {/* 2. Google Sheets 2-Way Sync */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-coral border border-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5"/>
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Synchronisation Google Sheets</h2>
            <p className="text-xs text-muted-foreground">
              Reliez votre feuille au processus d’automatisation pour importer les lignes et mettre à jour leur suivi.
            </p>
          </div>
        </div>

        {/* Template Instructions */}
        <div className="p-4 rounded-xl bg-ivory-deep border border-border text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-ink">En-têtes recommandés pour la feuille :</p>
          <div className="p-2.5 rounded-lg bg-card border border-border font-mono text-[11px] text-coral overflow-x-auto">
            [A: Timestamp] | [B: Client] | [C: Service Name/ID] | [D: Link] | [E: Quantity] | [F: Status] | [G: Order ID] | [H: Start Count] | [I: Remains]
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tip: Share your Google Sheet with the <code>client_email</code> found in your Google Service Account JSON with "Editor" permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Identifiant du document Google Sheets
            </label>
            <input type="text" value={sheetId} onChange={(e) => setSheetId(e.target.value)} placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" className="w-full px-4 py-2.5 rounded-xl bg-ivory-deep border border-border text-ink placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-coral text-xs font-mono"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Nom de l’onglet
            </label>
            <input type="text" value={sheetTabName} onChange={(e) => setSheetTabName(e.target.value)} placeholder="Orders" className="w-full px-4 py-2.5 rounded-xl bg-ivory-deep border border-border text-ink placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-coral text-xs font-mono"/>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
            Clé JSON du compte de service Google
          </label>
          <textarea rows={5} value={sheetCredentials} onChange={(e) => setSheetCredentials(e.target.value)} placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}' className="w-full p-4 rounded-xl bg-ivory-deep border border-border text-ink placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-coral text-xs font-mono"/>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={async () => {
            await saveSetting("GOOGLE_SPREADSHEET_ID", sheetId);
            await saveSetting("GOOGLE_SHEET_TAB_NAME", sheetTabName);
            await saveSetting("GOOGLE_SHEETS_CREDENTIALS", sheetCredentials);
        }} disabled={savingKey !== null} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-coral hover:bg-coral text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50">
            <Save className="w-3.5 h-3.5"/> Enregistrer Google Sheets
          </button>
        </div>
      </div>
    </div>);
}
