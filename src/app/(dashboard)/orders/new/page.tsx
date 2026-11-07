"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from '@/components/design/PageHeader';
import { PlatformIcon } from '@/components/design/PlatformIcon';
import Link from 'next/link';
import { readApi } from "@/lib/api-client";
import { Send, FileSpreadsheet, Layers, CheckCircle, CheckCircle2, AlertCircle, Loader2, Clock, Sparkles, Wallet, CreditCard, Plus, ShieldCheck, Check, Zap, Info, } from "lucide-react";
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
            if (data.authenticated)
                setUser(data.user);
        }).catch(err => setError(err.message));
        readApi("/api/clients")
            .then((data) => setClients(data.clients || [])).catch(err => setError(err.message));
        readApi("/api/services")
            .then((data) => {
            if (data.error)
                throw new Error(data.error);
            const sList = data.services || [];
            setServices(sList);
            if (sList.length > 0) {
                const requested = new URLSearchParams(window.location.search).get("service");
                setSelectedService(sList.some((s: any) => s.id === requested) ? requested! : sList[0].id);
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
        if (selectedPlatform === "General")
            return true;
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
        e.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "MASS", rawText: massText }) });
            const data = await response.json();
            if (!response.ok || !data.success)
                throw new Error(data.error || data.errors?.[0]?.error || "Aucune commande acceptée");
            setResult({ success: true, message: `${data.count} commandes acceptées` });
            if (data.errors?.length)
                setError(data.errors.map((item: any) => item.error).join(" · "));
            else
                setMassText("");
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setLoading(false);
            window.dispatchEvent(new Event("wallet-updated"));
            readApi("/api/auth/me").then(data => { if (data.user)
                setUser(data.user); }).catch(() => { });
        }
    };
    // Handle Submit
    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeServiceObj) {
            setError("Choisissez un service disponible");
            return;
        }
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
            if (!res.ok || !data.success)
                throw new Error(data.error || data.errors?.[0]?.error || "Failed to place order");
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
                if (d.authenticated) {
                    setUser(d.user);
                    window.dispatchEvent(new Event("wallet-updated"));
                }
            });
        }
        catch (err: any) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return <div className="space-y-6"><PageHeader eyebrow="Commander" title="Nouvelle commande" description="Choisissez un service, renseignez votre lien public et vérifiez le devis avant de valider." actions={<Link href="/orders" className="text-sm font-semibold text-coral">Voir mes commandes →</Link>}/>{result && <div role="status" className="rounded-xl border border-success/20 bg-success-tint p-4 text-sm text-success"><p className="font-semibold">{result.message}</p><Link href="/orders" className="mt-2 inline-block underline">Consulter le suivi</Link></div>}{error && <div role="alert" className="dashboard-alert">{error}</div>}<div className="inline-flex rounded-lg bg-ivory-deep p-1" role="group" aria-label="Type de commande">{[{ id: 'SINGLE', label: 'Commande unique' }, { id: 'MASS', label: 'Commandes en lot' }].map(t => <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id as 'SINGLE' | 'MASS')} className={'rounded-md px-4 py-2 text-sm font-semibold ' + (tab === t.id ? 'bg-card shadow-sm' : 'text-muted-foreground')}>{t.label}</button>)}</div>{tab === 'MASS' ? <form onSubmit={handleMassSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4"><h2 className="font-semibold">Commandes en lot</h2><p className="text-sm text-muted-foreground">Une ligne par commande : ID du service | lien public | quantité. Copiez les IDs depuis le catalogue.</p><label className="block text-sm font-medium">Vos commandes<textarea aria-label="Commandes en lot" required rows={9} value={massText} onChange={e => setMassText(e.target.value)} placeholder="ID | https://instagram.com/profil | 1000" className="mt-2 w-full p-3 font-mono text-xs"/></label><button disabled={loading} className="rounded-lg bg-coral px-5 py-3 text-sm font-semibold text-white">{loading ? 'Envoi…' : 'Envoyer les commandes'}</button></form> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><form onSubmit={handleSingleSubmit} className="min-w-0 space-y-5"><section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold text-sm"><span className="mr-2 text-coral">01</span>Choisir une plateforme</h2><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{platforms.map(p => <button key={p.id} type="button" aria-pressed={selectedPlatform === p.id} onClick={() => { setSelectedPlatform(p.id); setSelectedService(''); }} className={'flex min-w-0 flex-col items-center gap-2 rounded-lg border px-2 py-3 text-xs font-medium ' + (selectedPlatform === p.id ? 'border-coral bg-coral-tint text-coral-dark' : 'border-border bg-card text-ink-soft hover:border-ink-soft')}><PlatformIcon platform={p.id}/>{p.id === 'General' ? 'Toutes' : p.name}</button>)}</div></section><section className="rounded-xl border border-border bg-card p-5 space-y-4"><h2 className="font-semibold text-sm"><span className="mr-2 text-coral">02</span>Configurer la commande</h2>{isAdmin && clients.length > 0 && <label className="block text-sm font-medium">Fiche d’agence (facultatif)<select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="mt-1.5 w-full px-3 py-2 text-sm"><option value="">Aucune fiche</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}<label className="block text-sm font-medium" htmlFor="service">Service<select id="service" required value={activeServiceObj?.id || ''} onChange={e => setSelectedService(e.target.value)} className="mt-1.5 w-full px-3 py-2 text-sm"><option value="" disabled>Choisir un service</option>{filteredServices.map(s => <option key={s.id} value={s.id}>{s.name} · {Number(s.sellingRatePer1000).toFixed(2)} {userCurrency} / 1 000</option>)}</select></label>{!services.length && <p className="text-xs text-muted-foreground">Chargement du catalogue, ou aucun service disponible.</p>}{activeServiceObj && <p className="rounded-lg bg-ivory p-3 text-xs leading-relaxed text-muted-foreground">{activeServiceObj.category} · ID <span className="font-mono break-all">{activeServiceObj.id}</span></p>}<label className="block text-sm font-medium" htmlFor="order-link">Lien public<input id="order-link" type="url" required value={link} onChange={e => setLink(e.target.value)} className="mt-1.5 w-full px-3 py-2 text-sm" placeholder="https://www.instagram.com/votre-profil/"/><span className="mt-1 block text-xs font-normal text-muted-foreground">Utilisez le lien correspondant au service choisi. Aucun mot de passe de réseau social n’est nécessaire.</span></label><label className="block text-sm font-medium" htmlFor="quantity">Quantité<input id="quantity" type="number" required min={activeServiceObj?.minQuantity || 1} max={activeServiceObj?.maxQuantity} step="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="tabular mt-1.5 w-full px-3 py-2 text-sm"/><span className="mt-1 block text-xs font-normal text-muted-foreground">Minimum {activeServiceObj?.minQuantity?.toLocaleString() || '—'} · Maximum {activeServiceObj?.maxQuantity?.toLocaleString() || '—'}</span></label>{activeServiceObj?.dripFeedAllowed && <details className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Livraison échelonnée</summary><label className="mt-3 flex gap-2 items-center text-sm"><input type="checkbox" checked={enableDripFeed} onChange={e => setEnableDripFeed(e.target.checked)}/>Activer l’échelonnement</label>{enableDripFeed && <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs">Nombre de passages<input type="number" min={2} value={runs} onChange={e => setRuns(Number(e.target.value))} className="mt-1 w-full p-2"/></label><label className="text-xs">Intervalle en minutes<input type="number" min={1} value={intervalMinutes} onChange={e => setIntervalMinutes(Number(e.target.value))} className="mt-1 w-full p-2"/></label></div>}</details>}<button disabled={loading || !hasEnoughFunds || !activeServiceObj || !Number.isFinite(quantity)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-dark">{loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Traitement…</> : <>Valider la commande · {Number.isFinite(totalCost) ? totalCost.toFixed(2) : '—'} {userCurrency}<Send size={15}/></>}</button><p className="text-xs text-muted-foreground">Vérifiez le service, le lien et la quantité avant de valider.</p></section></form><aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24"><p className="text-xs font-semibold uppercase tracking-wider text-coral">Votre devis</p><h2 className="mt-2 text-lg font-semibold">Récapitulatif</h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">{activeServiceObj?.name || 'Sélectionnez un service pour calculer le devis.'}</p><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Prix / 1 000</dt><dd className="tabular font-medium">{ratePerThousand.toFixed(2)} {userCurrency}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Quantité</dt><dd className="tabular">{quantity.toLocaleString()}</dd></div><div className="flex justify-between border-t border-border pt-4"><dt className="font-semibold">Montant</dt><dd className="tabular font-bold text-lg">{Number.isFinite(totalCost) ? totalCost.toFixed(2) : '—'} {userCurrency}</dd></div></dl>{isAdmin ? <p className="mt-5 rounded-lg bg-ivory p-3 text-xs text-muted-foreground">Vos commandes administrateur utilisent le solde fournisseur. Aucun débit du portefeuille client de votre compte administrateur.</p> : <div className="mt-5 rounded-lg bg-ivory p-3 text-sm space-y-2"><p className="flex justify-between"><span>Solde actuel</span><b className="tabular">{userBalance.toFixed(2)} {userCurrency}</b></p><p className="flex justify-between"><span>Après commande</span><b className={'tabular ' + (!hasEnoughFunds ? 'text-danger' : 'text-success')}>{Number.isFinite(remainingBalance) ? remainingBalance.toFixed(2) : '—'} {userCurrency}</b></p></div>}{!hasEnoughFunds && <div className="mt-4 rounded-lg border border-warning/20 bg-warning-tint p-3 text-xs"><p>Solde insuffisant pour cette commande.</p><Link className="mt-2 inline-block font-semibold text-coral underline" href="/add-funds">Ajouter des fonds</Link></div>}</aside></div>}</div>;
}
