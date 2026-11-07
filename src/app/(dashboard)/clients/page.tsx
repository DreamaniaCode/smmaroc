"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { formatMAD, formatDate } from '@/lib/design/format';
import { readApi } from '@/lib/api-client';
interface Account {
    id: string;
    name: string;
    email: string;
    balance: number;
    currency: string;
    createdAt: string;
    _count?: {
        orders: number;
    };
}
interface Agency {
    id: string;
    name: string;
    email: string | null;
    notes: string | null;
    _count?: {
        orders: number;
    };
}
export default function Clients() {
    const [accounts, setAccounts] = useState<Account[]>([]), [agencies, setAgencies] = useState<Agency[]>([]), [query, setQuery] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false), [name, setName] = useState(''), [email, setEmail] = useState(''), [notes, setNotes] = useState('');
    async function load() {
        try {
            const d = await readApi('/api/clients');
            setAccounts(d.accounts || []);
            setAgencies(d.clients || []);
            setError('');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Chargement impossible');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { void load(); }, []);
    async function add(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const r = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, notes }) });
            const d = await r.json();
            if (!r.ok)
                throw Error(d.error);
            setName('');
            setEmail('');
            setNotes('');
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Création impossible');
        }
        finally {
            setBusy(false);
        }
    }
    const visible = accounts.filter(a => (a.name + ' ' + a.email).toLowerCase().includes(query.toLowerCase()));
    return <div className="space-y-6"><PageHeader eyebrow="Administration" title="Clients inscrits" description={accounts.length + ' comptes clients. Consultez leur solde et leurs commandes.'}/>{error && <div className="dashboard-alert" role="alert">{error}<button onClick={load}>Réessayer</button></div>}<label className="relative block max-w-xl"><span className="sr-only">Rechercher un client</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><input className="h-11 w-full pl-9 pr-3 text-sm" placeholder="Rechercher par nom ou e-mail" value={query} onChange={e => setQuery(e.target.value)}/></label>{loading ? <p role="status">Chargement des comptes…</p> : <><div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card"><table className="text-sm"><thead><tr><th>Client</th><th>Inscription</th><th className="text-right">Commandes</th><th className="text-right">Solde</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(c => <tr key={c.id}><td><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground mt-1">{c.email}</p></td><td>{formatDate(c.createdAt)}</td><td className="tabular text-right">{c._count?.orders || 0}</td><td className="tabular text-right font-semibold">{c.currency === 'MAD' ? formatMAD(c.balance) : c.balance.toFixed(2) + ' ' + c.currency}</td><td><Link href={'/orders?userId=' + c.id} className="inline-flex gap-1 items-center text-coral font-semibold text-xs">Commandes<ArrowUpRight size={14}/></Link></td></tr>)}</tbody></table>{!visible.length && <p className="p-10 text-center text-muted-foreground">Aucun client ne correspond à cette recherche.</p>}</div><ul className="md:hidden space-y-3">{visible.map(c => <li key={c.id} className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">{c.name}</h2><p className="mt-1 break-all text-xs text-muted-foreground">{c.email}</p><div className="mt-4 flex justify-between text-sm"><b>{formatMAD(c.balance)}</b><span>{c._count?.orders || 0} commandes</span></div><Link href={'/orders?userId=' + c.id} className="mt-3 block text-sm font-semibold text-coral">Voir les commandes →</Link></li>)}</ul></>}<details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">Fiches d’agence ({agencies.length})</summary><p className="mt-2 text-sm text-muted-foreground">Ces étiquettes de campagne sont distinctes des comptes clients inscrits.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{agencies.map(c => <Link href={'/orders?clientId=' + c.id} key={c.id} className="rounded-lg border border-border p-3 text-sm"><b>{c.name}</b><p className="mt-1 text-xs text-muted-foreground">{c.email || 'Sans e-mail'} · {c._count?.orders || 0} commandes</p></Link>)}</div><form onSubmit={add} className="mt-5 space-y-3 border-t border-border pt-5"><h2 className="font-semibold text-sm">Ajouter une fiche d’agence</h2><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Nom / marque<input required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2"/></label><label className="text-xs font-medium">E-mail (facultatif)<input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2"/></label></div><label className="block text-xs font-medium">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full p-3"/></label><button disabled={busy} className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white">{busy ? 'Enregistrement…' : 'Créer la fiche'}</button></form></details></div>;
}
