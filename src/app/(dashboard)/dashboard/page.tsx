"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ListOrdered, Clock, CheckCircle2, AlertTriangle, RefreshCw, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { StatusPill } from '@/components/design/StatusPill';
import { readApi } from '@/lib/api-client';
import { formatMAD } from '@/lib/design/format';
interface Stats {
    totalOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    failedOrders: number;
    totalClients: number;
    recentClients: {
        id: string;
        name: string;
        email: string;
        balance: number;
        currency: string;
    }[];
    providers: {
        id: string;
        name: string;
        balance: number;
        currency: string;
        lowBalanceLimit: number;
        isActive: boolean;
    }[];
}
export default function Overview() {
    const [stats, setStats] = useState<Stats | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(true);
    async function load() {
        setBusy(true);
        try {
            setStats(await readApi('/api/stats'));
            setError('');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Chargement impossible');
        }
        finally {
            setBusy(false);
        }
    }
    useEffect(() => { void load(); }, []);
    const metrics = [{ label: 'Commandes', value: stats?.totalOrders, help: 'Volume total', icon: ListOrdered, tone: 'text-coral bg-coral-tint' }, { label: 'En traitement', value: stats?.inProgressOrders, help: 'Prise en charge et livraison', icon: Clock, tone: 'text-info bg-info-tint' }, { label: 'Terminées', value: stats?.completedOrders, help: 'Livraison signalée comme terminée', icon: CheckCircle2, tone: 'text-success bg-success-tint' }, { label: 'À examiner', value: stats?.failedOrders, help: 'Échec ou vérification nécessaire', icon: AlertTriangle, tone: 'text-warning bg-warning-tint' }];
    return <div className="space-y-6"><PageHeader eyebrow="Administration" title="Synthèse des opérations" description="Commandes, clients et soldes : l’état connu de votre activité." actions={<button onClick={load} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-semibold"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/>Actualiser</button>}/>{error && <p role="alert" className="dashboard-alert">{error}</p>}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m => <article key={m.label} className="rounded-xl border border-border bg-card p-5"><div className="flex justify-between items-center"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p><span className={'rounded-lg p-2 ' + m.tone}><m.icon size={17}/></span></div><p className="tabular mt-3 text-3xl font-bold">{m.value ?? '—'}</p><p className="mt-2 text-xs text-muted-foreground">{m.help}</p></article>)}</div><section className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex flex-wrap justify-between items-center gap-3 border-b border-border p-5"><div><h2 className="font-semibold">Clients inscrits</h2><p className="mt-1 text-xs text-muted-foreground">{stats?.totalClients ?? '—'} comptes · dernières inscriptions</p></div><Link href="/clients" className="text-sm font-semibold text-coral">Voir tous les clients →</Link></div><div className="divide-y divide-border">{stats?.recentClients?.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground mt-1">{c.email}</p></div><div className="text-right"><p className="text-sm font-semibold tabular">{c.currency === 'MAD' ? formatMAD(c.balance) : c.balance.toFixed(2) + ' ' + c.currency}</p><Link className="mt-1 block text-xs text-coral font-semibold" href={'/orders?userId=' + c.id}>Commandes →</Link></div></div>)}{stats && !stats.recentClients?.length && <p className="p-8 text-center text-sm text-muted-foreground">Aucun compte client inscrit.</p>}</div></section><section><div className="flex justify-between items-center mb-4"><h2 className="font-semibold">Soldes fournisseurs</h2><Link href="/providers" className="text-sm font-semibold text-coral">Gérer →</Link></div><div className="grid gap-4 sm:grid-cols-2">{stats?.providers.map(p => <article key={p.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap gap-2 items-center justify-between"><h3 className="text-sm font-semibold">{p.name}</h3><StatusPill tone={!p.isActive ? 'neutral' : p.balance < p.lowBalanceLimit ? 'warning' : 'success'} label={!p.isActive ? 'Désactivé' : p.balance < p.lowBalanceLimit ? 'Solde faible' : 'Actif'}/></div><p className="tabular mt-4 text-2xl font-bold">{p.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-sm text-muted-foreground">{p.currency}</span></p><p className="mt-2 text-xs text-muted-foreground">Solde enregistré. Actualisez depuis la fiche du fournisseur.</p></article>)}</div></section><div className="grid gap-4 md:grid-cols-3">{[{ href: '/orders', title: 'Suivre les commandes', text: 'Consulter l’avancement et examiner les blocages.' }, { href: '/admin/deposits', title: 'Vérifier les dépôts', text: 'Valider les justificatifs avant le crédit du portefeuille.' }, { href: '/support', title: 'Répondre aux clients', text: 'Traiter les demandes de paiement et de suivi.' }].map(a => <Link key={a.href} href={a.href} className="rounded-xl border border-border bg-card p-5 hover:border-coral"><h3 className="flex justify-between gap-3 font-semibold text-sm">{a.title}<ArrowUpRight size={16}/></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p></Link>)}</div></div>;
}
