"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/design/PageHeader';
import { StatusPill } from '@/components/design/StatusPill';
import { formatMAD, formatDateTime } from '@/lib/design/format';
import { readApi } from '@/lib/api-client';
interface Deposit {
    id: string;
    amount: number;
    paidAmount: number | null;
    method: string;
    status: string;
    createdAt: string;
    adminNotes: string | null;
    proofFilename: string | null;
}
export default function Deposits() {
    const [rows, setRows] = useState<Deposit[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
    async function load() {
        setError('');
        setLoading(true);
        try {
            const data = await readApi('/api/deposits');
            setRows(data.deposits || []);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Chargement impossible.');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { void load(); }, []);
    return <div><PageHeader eyebrow="Solde" title="Historique des dépôts" description="Consultez vos recharges, leurs justificatifs et le résultat de leur vérification." actions={<Link href="/add-funds" className="rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white">Ajouter des fonds</Link>}/>{error && <div role="alert" className="dashboard-alert">{error}<button onClick={load}>Réessayer</button></div>}{loading ? <p role="status">Chargement des dépôts…</p> : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="min-w-[660px] text-sm"><thead><tr><th>Date / référence</th><th>Méthode</th><th>Montant crédité / payé</th><th>Statut</th><th>Justificatif</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{formatDateTime(row.createdAt)}<p className="mt-1 font-mono text-xs text-muted-foreground">#{row.id.slice(0, 8)}</p></td><td>{({ BANK_TRANSFER: 'Virement bancaire', BINANCE_PAY: 'Binance Pay', PAYPAL: 'PayPal' } as Record<string, string>)[row.method] || row.method}</td><td className="tabular">{formatMAD(row.amount)}<p className="text-xs text-muted-foreground mt-1">Payé : {formatMAD(row.paidAmount ?? row.amount)}</p></td><td><StatusPill tone={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'} label={row.status === 'APPROVED' ? 'Approuvé' : row.status === 'REJECTED' ? 'Refusé' : 'En attente'}/>{row.adminNotes && <p className="mt-2 max-w-xs text-xs text-muted-foreground">{row.adminNotes}</p>}</td><td>{row.proofFilename ? <a href={'/api/deposits/' + row.id + '/proof'} className="font-semibold text-coral underline">Télécharger</a> : '—'}</td></tr>)}</tbody></table>{!rows.length && <div className="p-10 text-center"><h2 className="font-semibold">Aucun dépôt pour le moment</h2><p className="text-sm mt-2 text-muted-foreground">Votre historique apparaîtra après votre première déclaration de paiement.</p></div>}</div>}</div>;
}
