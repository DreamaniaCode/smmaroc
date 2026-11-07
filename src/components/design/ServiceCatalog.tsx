"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, SearchX, RefreshCw } from 'lucide-react';
import { fetchCatalog } from '@/lib/catalog-client';
import { PlatformIcon, platformFor } from './PlatformIcon';
import { formatMAD, formatNumber } from '@/lib/design/format';
export interface CatalogueService {
    id: string;
    name: string;
    category: string;
    minQuantity: number;
    maxQuantity: number;
    sellingRatePer1000: number;
    dripFeedAllowed?: boolean;
}
export function ServiceCatalog({ mode = 'public', initialServices }: {
    mode?: 'public' | 'client';
    initialServices?: CatalogueService[];
}) {
    const [services, setServices] = useState<CatalogueService[]>(initialServices || []), [loading, setLoading] = useState(initialServices === undefined), [error, setError] = useState(''), [query, setQuery] = useState(''), [platform, setPlatform] = useState('Toutes'), [category, setCategory] = useState('Toutes'), [page, setPage] = useState(1);
    async function load() {
        setLoading(true);
        setError('');
        try {
            setServices(await fetchCatalog());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Catalogue indisponible');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (initialServices === undefined)
            void load();
        else {
            setServices(initialServices);
            setLoading(false);
        }
    }, [initialServices]);
    useEffect(() => setPage(1), [query, platform, category]);
    const categories = useMemo(() => Array.from(new Set(services.map(s => s.category))).sort(), [services]);
    const filtered = useMemo(() => services.filter(s => (platform === 'Toutes' || platformFor(s.name + ' ' + s.category) === platform) && (category === 'Toutes' || s.category === category) && (!query || (s.name + ' ' + s.category + ' ' + s.id).toLowerCase().includes(query.trim().toLowerCase()))), [services, platform, category, query]);
    const pages = Math.max(1, Math.ceil(filtered.length / 24));
    const visible = filtered.slice((page - 1) * 24, page * 24);
    const href = (s: CatalogueService) => '/orders/new?service=' + encodeURIComponent(s.id);
    return <div><div className="mb-4 grid gap-3 md:grid-cols-[1fr_240px]"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><span className="sr-only">Rechercher dans le catalogue</span><input type="search" className="h-11 w-full pl-10 pr-3 text-sm" placeholder="Rechercher un service, une catégorie ou un ID" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Filtrer par catégorie" className="h-11 w-full px-3 text-sm" value={category} onChange={e => setCategory(e.target.value)}><option>Toutes</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div><div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrer par plateforme">{['Toutes', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Telegram', 'X', 'Autres'].map(p => <button key={p} type="button" aria-pressed={platform === p} onClick={() => setPlatform(p)} className={'rounded-full border px-3.5 py-1.5 text-sm font-medium ' + (platform === p ? 'border-ink bg-ink text-ivory' : 'border-input bg-card text-ink-soft hover:border-ink-soft')}>{p}</button>)}</div>{loading ? <div role="status" className="rounded-xl border border-border bg-card p-8 flex gap-3 items-center"><span className="screen-spinner"/>Chargement des services…</div> : error ? <div role="alert" className="dashboard-alert">{error}<button onClick={load}>Réessayer</button></div> : !filtered.length ? <div className="rounded-xl border border-dashed border-input bg-card p-10 text-center"><SearchX className="mx-auto mb-3 text-muted-foreground"/><h2 className="font-semibold">Aucun service trouvé</h2><p className="text-sm text-muted-foreground mt-2">Essayez une autre plateforme ou un autre mot-clé.</p><button className="mt-4 text-coral font-semibold" onClick={() => { setQuery(''); setPlatform('Toutes'); setCategory('Toutes'); }}>Réinitialiser les filtres</button></div> : <><p className="mb-3 text-xs text-muted-foreground" aria-live="polite">{formatNumber(filtered.length)} services disponibles · prix en MAD pour 1 000 unités</p><div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card"><table><caption className="sr-only">Services disponibles et tarifs</caption><thead><tr><th>Service</th><th className="text-right">Prix / 1 000</th><th className="text-right">Min – Max</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{visible.map(s => <tr key={s.id}><td><div className="flex items-start gap-3"><PlatformIcon platform={platformFor(s.name + ' ' + s.category)} size="sm"/><div className="min-w-0"><p className="text-sm font-medium text-ink break-words">{s.name}</p><p className="text-xs text-muted-foreground mt-1">{s.category}</p><span className="text-[10px] font-mono text-muted-foreground" title={s.id}>#{s.id.slice(0, 8)}</span></div></div></td><td className="tabular text-right whitespace-nowrap text-sm font-semibold">{formatMAD(s.sellingRatePer1000)}</td><td className="tabular text-right text-xs whitespace-nowrap">{formatNumber(s.minQuantity)} – {formatNumber(s.maxQuantity)}</td><td><Link href={href(s)} className="inline-flex items-center gap-1 text-sm font-semibold text-coral whitespace-nowrap">Commander<ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div><ul className="space-y-3 md:hidden">{visible.map(s => <li key={s.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start gap-3"><PlatformIcon platform={platformFor(s.name + ' ' + s.category)} size="sm"/><div><h3 className="text-sm font-semibold">{s.name}</h3><p className="text-xs text-muted-foreground mt-1">{s.category}</p></div></div><dl className="mt-4 grid grid-cols-2 gap-3 bg-ivory rounded-lg p-3 text-xs"><div><dt className="text-muted-foreground">Prix / 1 000</dt><dd className="font-bold mt-1">{formatMAD(s.sellingRatePer1000)}</dd></div><div><dt className="text-muted-foreground">Min – Max</dt><dd className="mt-1">{formatNumber(s.minQuantity)} – {formatNumber(s.maxQuantity)}</dd></div></dl><Link href={href(s)} className="mt-3 flex h-10 items-center justify-center rounded-lg border border-input font-semibold text-coral text-sm">Commander<ArrowRight size={14}/></Link></li>)}</ul><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>Page {page} sur {pages}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(v => v - 1)} className="px-3 py-2 rounded-lg border border-input bg-card">Précédent</button><button disabled={page >= pages} onClick={() => setPage(v => v + 1)} className="px-3 py-2 rounded-lg border border-input bg-card">Suivant</button></div></div></>}<p className="mt-4 text-xs text-muted-foreground">Le montant exact et les limites sont rappelés avant validation de la commande.</p></div>;
}
