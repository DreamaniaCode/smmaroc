"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, PlusCircle, ListChecks, Wallet, History, LifeBuoy, Code2, LayoutDashboard, Users, ClipboardCheck, Boxes, Truck, Settings, Menu, X, LogOut, ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/design/Logo';
import type { LucideIcon } from 'lucide-react';
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    balance: number;
    currency: string;
}
interface NavGroup {
    title: string;
    items: {
        href: string;
        label: string;
        icon: LucideIcon;
    }[];
}
export default function DashboardLayout({ children }: {
    children: React.ReactNode;
}) {
    const path = usePathname(), router = useRouter();
    const [user, setUser] = useState<User | null>(null), [error, setError] = useState(''), [open, setOpen] = useState(false), [loggingOut, setLoggingOut] = useState(false);
    const mounted = useRef(true);
    const refresh = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/me', { cache: 'no-store' });
            if (response.status === 401) {
                router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
                return;
            }
            if (!response.ok)
                throw new Error('Impossible de vérifier votre connexion.');
            const data = await response.json();
            if (!data.authenticated || !data.user) {
                router.replace('/login');
                return;
            }
            if (mounted.current) {
                setUser(data.user);
                setError('');
            }
        }
        catch {
            if (mounted.current)
                setError('Connexion à votre espace indisponible. Veuillez réessayer.');
        }
    }, [router]);
    useEffect(() => { mounted.current = true; const wake = () => { void refresh(); }; window.addEventListener('focus', wake); window.addEventListener('wallet-updated', wake); return () => { mounted.current = false; window.removeEventListener('focus', wake); window.removeEventListener('wallet-updated', wake); }; }, [refresh]);
    useEffect(() => { void refresh(); }, [path, refresh]);
    const restricted = ['/dashboard', '/providers', '/clients', '/settings', '/admin/deposits'];
    const forbidden = user?.role === 'USER' && restricted.some(p => path === p || path.startsWith(p + '/'));
    useEffect(() => {
        setOpen(false);
        if (forbidden)
            router.replace('/services');
    }, [path, forbidden, router]);
    useEffect(() => {
        if (!open)
            return;
        const escape = (e: KeyboardEvent) => {
            if (e.key === 'Escape')
                setOpen(false);
        };
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', escape);
        return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', escape); };
    }, [open]);
    const admin = user?.role === 'ADMIN';
    const groups: NavGroup[] = admin ? [{ title: 'Pilotage', items: [{ href: '/dashboard', label: 'Synthèse', icon: LayoutDashboard }, { href: '/clients', label: 'Clients inscrits', icon: Users }] }, { title: 'Opérations', items: [{ href: '/orders', label: 'Commandes', icon: ClipboardCheck }, { href: '/orders/new', label: 'Nouvelle commande', icon: PlusCircle }, { href: '/admin/deposits', label: 'Dépôts', icon: Wallet }, { href: '/support', label: 'Support', icon: LifeBuoy }] }, { title: 'Catalogue', items: [{ href: '/services', label: 'Services', icon: Boxes }, { href: '/providers', label: 'Fournisseurs', icon: Truck }, { href: '/settings', label: 'Réglages', icon: Settings }] }] : [{ title: 'Commander', items: [{ href: '/services', label: 'Catalogue', icon: BookOpen }, { href: '/orders/new', label: 'Nouvelle commande', icon: PlusCircle }, { href: '/orders', label: 'Mes commandes', icon: ListChecks }] }, { title: 'Solde', items: [{ href: '/add-funds', label: 'Ajouter des fonds', icon: Wallet }, { href: '/deposits', label: 'Historique des dépôts', icon: History }] }, { title: 'Aide', items: [{ href: '/support', label: 'Support', icon: LifeBuoy }, { href: '/api-docs', label: 'API revendeur', icon: Code2 }] }];
    const title = groups.flatMap(g => g.items).find(i => i.href === path)?.label || 'Mon espace';
    const sidebar = admin ? 'bg-ink text-ivory' : 'bg-card text-ink border-r border-border';
    const navigation = <nav aria-label={admin ? 'Menu administration' : 'Menu espace client'} className="space-y-6">{groups.map(group => <div key={group.title}><p className={'mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] ' + (admin ? 'text-[#BFAEA0]' : 'text-muted-foreground')}>{group.title}</p><ul className="space-y-0.5">{group.items.map(item => { const active = path === item.href; const Icon = item.icon; return <li key={item.href}><Link href={item.href} aria-current={active ? 'page' : undefined} className={'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' + (admin ? (active ? 'bg-coral text-white' : 'text-[#E6D9CD] hover:bg-ink-line') : (active ? 'bg-coral-tint text-coral-dark' : 'text-ink-soft hover:bg-ivory-deep'))}><Icon className="h-4 w-4 shrink-0"/>{item.label}</Link></li>; })}</ul></div>)}</nav>;
    const summary = admin ? <div className="rounded-xl border border-ink-line bg-ink-line px-4 py-3"><p className="text-xs font-semibold text-ivory">Espace administration</p><p className="mt-1 text-xs text-[#BFAEA0]">Paiements, commandes et catalogue.</p></div> : <div className="rounded-xl border border-border bg-ivory px-4 py-3.5"><p className="text-xs text-muted-foreground">Solde disponible</p><p className="tabular mt-1 text-xl font-bold">{Number(user?.balance ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {user?.currency || 'MAD'}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="truncate text-xs text-muted-foreground">{user?.email}</span><Link href="/add-funds" className="shrink-0 text-xs font-semibold text-coral">Recharger</Link></div></div>;
    const logout = async () => {
        setLoggingOut(true);
        try {
            const r = await fetch('/api/auth/logout', { method: 'POST' });
            if (!r.ok)
                throw Error();
            router.replace('/login');
            router.refresh();
        }
        catch {
            setError('Déconnexion impossible. Réessayez.');
            setLoggingOut(false);
        }
    };
    const footer = <div className={'mt-auto p-4 border-t ' + (admin ? 'border-ink-line' : 'border-border')}><p className="truncate text-sm font-semibold">{user?.name}</p><p className={'truncate mt-1 text-xs ' + (admin ? 'text-[#BFAEA0]' : 'text-muted-foreground')}>{user?.email}</p><button disabled={loggingOut} onClick={logout} className="mt-3 flex items-center gap-2 text-xs font-medium"><LogOut size={14}/>{loggingOut ? 'Déconnexion…' : 'Se déconnecter'}</button><Link href="/" className="mt-3 block text-xs underline underline-offset-4">Voir le site public</Link></div>;
    return <div className="min-h-screen bg-background"><aside className={'fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto lg:flex ' + sidebar}><div className={'px-5 py-5 border-b ' + (admin ? 'border-ink-line' : 'border-border')}><Logo to={admin ? '/dashboard' : '/services'} inverted={admin} suffix={admin ? 'Admin' : 'Client'}/></div><div className="px-3 py-4">{user && summary}</div><div className="flex-1 px-3 pb-6">{user && navigation}</div>{user && footer}</aside><div className="min-w-0 lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-10"><div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="lg:hidden inline-flex h-10 w-10 items-center justify-center border border-border rounded-lg" aria-label="Ouvrir le menu" aria-expanded={open} aria-controls="mobile-navigation"><Menu size={20}/></button><span className="lg:hidden"><Logo /></span><div className="hidden sm:block"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{admin ? 'Administration' : 'Espace client'}</p><p className="text-sm font-semibold">{title}</p></div></div><Link className="inline-flex items-center gap-2 rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white sm:text-sm" href={admin ? '/orders/new' : '/add-funds'}>{admin ? 'Nouvelle commande' : 'Ajouter des fonds'}<ArrowUpRight size={15}/></Link></header>{open && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation"><button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Fermer le menu"/><div id="mobile-navigation" className={'absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col overflow-y-auto ' + sidebar}><div className="flex items-center justify-between p-4"><Logo inverted={admin} suffix={admin ? 'Admin' : 'Client'}/><button autoFocus onClick={() => setOpen(false)} aria-label="Fermer le menu" className="h-10 w-10 flex items-center justify-center"><X size={20}/></button></div><div className="px-3 py-4">{summary}</div><div className="flex-1 px-3 pb-6">{navigation}</div>{footer}</div></div>}<main className="dashboard-content mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{error && <div role="alert" className="dashboard-alert mb-5">{error}<button onClick={() => void refresh()}>Réessayer</button></div>}{!user || forbidden ? <div role="status" className="flex items-center gap-3 py-10 text-sm text-muted-foreground"><span className="screen-spinner"/>Chargement de votre espace…</div> : children}</main></div></div>;
}
