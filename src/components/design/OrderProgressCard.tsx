"use client";
import { ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { PlatformIcon, platformFor } from './PlatformIcon';
import { statuses } from '@/lib/design/status';
import { formatMAD, formatDateTime, formatNumber } from '@/lib/design/format';
interface TrackedOrder {
    id: string;
    status: string;
    quantity: number;
    startCount: number | null;
    remains: number | null;
    customerCost: number;
    createdAt: string;
    updatedAt: string;
    link: string;
    service?: {
        name: string;
        category?: string;
    };
}
export function OrderProgressCard({ order, onRefresh, busy = false }: {
    order: TrackedOrder;
    onRefresh: () => void;
    busy?: boolean;
}) { const meta = statuses[order.status] || { label: order.status, tone: 'neutral' as const, help: 'Consultez les dernières informations connues.' }; const known = order.remains !== null && order.remains !== undefined; const remaining = known ? Math.max(0, order.remains!) : order.status === 'COMPLETED' ? 0 : null; const delivered = remaining === null ? null : Math.max(0, Math.min(order.quantity, order.quantity - remaining)); const progress = delivered === null ? 0 : Math.min(100, Math.round(delivered / order.quantity * 100)); const active = ['AWAITING_FUNDS', 'DISPATCHING', 'PENDING', 'PROCESSING', 'IN_PROGRESS', 'REVIEW_REQUIRED'].includes(order.status); const dated = known || order.startCount !== null; const stale = active && dated && Date.now() - new Date(order.updatedAt).getTime() > 300000; return <article className="overflow-hidden rounded-xl border border-border bg-card"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4 sm:p-5"><div className="flex items-start gap-3 min-w-0 flex-1"><PlatformIcon platform={platformFor((order.service?.name || '') + ' ' + (order.service?.category || ''))}/><div className="min-w-0"><h2 className="font-semibold text-sm leading-snug break-words">{order.service?.name || 'Commande'}</h2><p className="mt-1 text-xs text-muted-foreground"><span className="font-mono">#{order.id.slice(0, 8)}</span> · {formatDateTime(order.createdAt)} · {formatMAD(order.customerCost)}</p><a href={order.link} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-ink-soft hover:text-coral"><span className="truncate">{order.link}</span><ExternalLink size={12} className="shrink-0"/></a></div></div><StatusPill tone={meta.tone} label={meta.label}/></header><div className="p-4 sm:p-5"><dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">{[{ label: 'Compteur de départ', value: order.startCount === null ? '—' : formatNumber(order.startCount) }, { label: 'Quantité', value: formatNumber(order.quantity) }, { label: 'Livrés', value: delivered === null ? '—' : formatNumber(delivered) }, { label: 'Restants', value: remaining === null ? '—' : formatNumber(remaining) }].map(item => <div className="bg-card px-3 py-3" key={item.label}><dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</dt><dd className="tabular mt-1 text-xl font-bold">{item.value}</dd></div>)}</dl><div className="mt-4"><div className="mb-2 flex justify-between text-xs"><span>Progression</span><b>{delivered === null ? 'En attente de chiffres' : progress + ' %'}</b></div><div role="progressbar" aria-label="Progression de la commande" aria-valuenow={delivered === null ? undefined : progress} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-ivory-deep"><div className="h-full rounded-full bg-coral transition-all" style={{ width: progress + '%' }}/></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{meta.help}</p></div>{stale && <p role="status" className="mt-4 flex gap-2 rounded-lg border border-warning/20 bg-warning-tint p-3 text-xs text-ink-soft"><AlertTriangle size={15} className="shrink-0 text-warning"/>Les chiffres affichés datent de plus de 5 minutes. Actualisez pour vérifier leur évolution.</p>}</div><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-ivory px-4 py-3 sm:px-5"><p className="text-xs text-muted-foreground">{dated ? 'Dernière actualisation : ' + formatDateTime(order.updatedAt) : 'Les compteurs apparaîtront après la première synchronisation.'}</p>{active && <button onClick={onRefresh} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-xs font-semibold"><RefreshCw size={14} className={busy ? 'animate-spin' : ''}/>{busy ? 'Actualisation…' : 'Actualiser'}</button>}</footer></article>; }
