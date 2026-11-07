"use client";
import { useEffect, useState } from 'react';
import { Send, MessageSquare, Plus } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { StatusPill } from '@/components/design/StatusPill';
import { formatDateTime } from '@/lib/design/format';
interface Request {
    id: string;
    message: string;
    reply: string | null;
    createdAt: string;
    updatedAt: string;
    email?: string;
}
export default function Support() {
    const [requests, setRequests] = useState<Request[]>([]), [admin, setAdmin] = useState(false), [selectedId, setSelectedId] = useState<string | null>(null), [filter, setFilter] = useState('all'), [message, setMessage] = useState(''), [drafts, setDrafts] = useState<Record<string, string>>({}), [compose, setCompose] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function refresh() {
        const r = await fetch('/api/support', { cache: 'no-store' }), d = await r.json();
        if (!r.ok)
            throw Error(d.error || 'Chargement du support impossible.');
        setRequests(d.requests || []);
        setAdmin(d.isAdmin);
        setSelectedId(current => (d.requests || []).some((x: Request) => x.id === current) ? current : d.requests?.[0]?.id || null);
        setLoading(false);
    }
    useEffect(() => { refresh().catch(e => { setError(e.message); setLoading(false); }); }, []);
    async function send(body: {
        message?: string;
        id?: string;
        reply?: string;
    }) {
        setBusy(true);
        setError('');
        try {
            const r = await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), d = await r.json();
            if (!r.ok || !d.success)
                throw Error(d.error || 'Envoi impossible.');
            if (body.message) {
                setMessage('');
                setCompose(false);
                setSelectedId(null);
            }
            await refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Envoi impossible.');
        }
        finally {
            setBusy(false);
        }
    }
    const list = requests.filter(r => filter === 'all' || (filter === 'answered' ? !!r.reply : !r.reply));
    const selected = requests.find(r => r.id === selectedId);
    return <div><PageHeader eyebrow={admin ? 'Administration' : 'Aide'} title="Support" description={admin ? 'Répondez aux demandes de vos clients et consultez les échanges.' : 'Paiements, recharges ou suivi de commande : retrouvez vos échanges avec notre équipe.'} actions={!admin ? <button className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white" onClick={() => setCompose(v => !v)}><Plus size={16}/>Nouvelle demande</button> : undefined}/>{error && <p role="alert" className="dashboard-alert mb-5">{error}</p>}{!admin && (compose || (!loading && !requests.length)) && <form onSubmit={e => { e.preventDefault(); void send({ message }); }} className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4"><label className="block font-semibold text-sm" htmlFor="support-message">Votre demande<textarea id="support-message" required maxLength={4000} rows={5} value={message} onChange={e => setMessage(e.target.value)} className="mt-2 w-full p-3 text-sm" placeholder="Décrivez votre demande. Pour une commande, précisez son identifiant."/></label><p className="text-xs text-muted-foreground">Ne partagez ni mot de passe ni clé API dans votre message.</p><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white"><Send size={14}/>{busy ? 'Envoi…' : 'Envoyer ma demande'}</button></form>}<div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer les demandes">{[{ id: 'all', label: 'Toutes' }, { id: 'pending', label: 'En attente' }, { id: 'answered', label: 'Répondues' }].map(f => <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={'rounded-full border px-3.5 py-1.5 text-sm font-medium ' + (filter === f.id ? 'border-ink bg-ink text-ivory' : 'border-input bg-card text-ink-soft')}>{f.label}</button>)}</div>{loading ? <p role="status">Chargement des échanges…</p> : <div className="grid gap-5 lg:grid-cols-[300px_1fr]"><ul className="space-y-2">{list.map(r => <li key={r.id}><button onClick={() => setSelectedId(r.id)} aria-current={selectedId === r.id} className={'w-full rounded-xl border p-4 text-left ' + (selectedId === r.id ? 'border-coral bg-coral-tint' : 'border-border bg-card')}><div className="flex justify-between items-start gap-2"><p className="line-clamp-2 text-sm font-semibold">{r.message.slice(0, 90)}</p><StatusPill tone={r.reply ? 'success' : 'warning'} label={r.reply ? 'Répondu' : 'En attente'}/></div><p className="mt-2 text-xs text-muted-foreground">{admin && r.email ? r.email + ' · ' : ''}{formatDateTime(r.createdAt)}</p></button></li>)}{!list.length && <li className="rounded-xl border border-dashed border-input p-5 text-sm text-muted-foreground">Aucune demande dans cette vue.</li>}</ul>{selected ? <section className="overflow-hidden rounded-xl border border-border bg-card"><header className="border-b border-border p-5"><h2 className="font-semibold">Demande #{selected.id.slice(0, 8)}</h2><p className="mt-1 text-xs text-muted-foreground">{admin && selected.email ? selected.email + ' · ' : ''}{formatDateTime(selected.createdAt)}</p></header><div className="p-5 space-y-5"><article className="rounded-xl border border-border bg-card p-4"><p className="mb-2 text-xs font-semibold text-muted-foreground">{admin ? 'Client' : 'Votre message'}</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p></article>{selected.reply ? <article className="rounded-xl border border-coral/15 bg-coral-tint p-4"><p className="mb-2 text-xs font-semibold text-coral">Réponse du support</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.reply}</p></article> : <p className="text-sm text-muted-foreground">Votre demande est enregistrée et attend une réponse.</p>}{admin && <form onSubmit={e => { e.preventDefault(); void send({ id: selected.id, reply: drafts[selected.id] ?? selected.reply ?? '' }); }} className="border-t border-border pt-5 space-y-3"><label htmlFor="support-reply" className="block text-sm font-medium">Réponse au client<textarea id="support-reply" required maxLength={4000} rows={5} value={drafts[selected.id] ?? selected.reply ?? ''} onChange={e => setDrafts(d => ({ ...d, [selected.id]: e.target.value }))} className="mt-2 w-full p-3"/></label><button disabled={busy} className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white">{busy ? 'Envoi…' : 'Enregistrer la réponse'}</button></form>}</div></section> : <section className="rounded-xl border border-dashed border-input bg-card p-10 text-center"><MessageSquare className="mx-auto text-muted-foreground"/><h2 className="mt-3 font-semibold">Aucun échange sélectionné</h2><p className="mt-2 text-sm text-muted-foreground">Choisissez une demande pour consulter les messages.</p></section>}</div>}</div>;
}
