"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, PlusCircle, ListChecks, Wallet, History, LifeBuoy, Code2, 
  LayoutDashboard, Users, ClipboardCheck, Boxes, Truck, Settings, Menu, 
  X, LogOut, ArrowUpRight, ShieldCheck, Newspaper, Lock, ShieldAlert 
} from 'lucide-react';
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

    useEffect(() => { 
        mounted.current = true; 
        const wake = () => { void refresh(); }; 
        window.addEventListener('focus', wake); 
        window.addEventListener('wallet-updated', wake); 
        return () => { 
            mounted.current = false; 
            window.removeEventListener('focus', wake); 
            window.removeEventListener('wallet-updated', wake); 
        }; 
    }, [refresh]);

    useEffect(() => { void refresh(); }, [path, refresh]);

    const isStaff = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SUPPORT' || user?.role === 'OPERATOR';
    const isFullAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // Restricted routes for regular USER
    const restricted = ['/dashboard', '/providers', '/clients', '/settings', '/admin'];
    const forbidden = user && !isStaff && restricted.some(p => path === p || path.startsWith(p + '/'));

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
        return () => { 
            document.body.style.overflow = previous; 
            window.removeEventListener('keydown', escape); 
        };
    }, [open]);

    // Build navigation groups depending on staff or user role
    const staffGroups: NavGroup[] = [
        { 
            title: 'Pilotage & CRM', 
            items: [
                { href: '/dashboard', label: 'Synthèse', icon: LayoutDashboard },
                { href: '/admin/crm', label: 'CRM Clients', icon: Users },
                ...(isFullAdmin ? [{ href: '/admin/admins', label: 'Équipe & Sécurité', icon: ShieldCheck }] : []),
            ] 
        },
        { 
            title: 'Opérations', 
            items: [
                { href: '/orders', label: 'Commandes', icon: ClipboardCheck },
                { href: '/orders/new', label: 'Nouvelle commande', icon: PlusCircle },
                { href: '/admin/deposits', label: 'Dépôts clients', icon: Wallet },
                { href: '/support', label: 'Support & Tickets', icon: LifeBuoy },
            ] 
        },
        {
            title: 'Contenu',
            items: [
                { href: '/admin/blog', label: 'Gestion du Blog', icon: Newspaper },
            ]
        },
        { 
            title: 'Catalogue & Sécurité', 
            items: [
                { href: '/services', label: 'Catalogue Services', icon: Boxes },
                { href: '/providers', label: 'Fournisseurs API', icon: Truck },
                { href: '/admin/securite', label: 'Mon Compte & 2FA', icon: Lock },
                ...(isFullAdmin ? [{ href: '/settings', label: 'Réglages Système', icon: Settings }] : []),
            ] 
        }
    ];

    const clientGroups: NavGroup[] = [
        { 
            title: 'Commander', 
            items: [
                { href: '/services', label: 'Catalogue', icon: BookOpen },
                { href: '/orders/new', label: 'Nouvelle commande', icon: PlusCircle },
                { href: '/orders', label: 'Mes commandes', icon: ListChecks }
            ] 
        },
        { 
            title: 'Solde', 
            items: [
                { href: '/add-funds', label: 'Ajouter des fonds', icon: Wallet },
                { href: '/deposits', label: 'Historique des dépôts', icon: History }
            ] 
        },
        { 
            title: 'Aide & API', 
            items: [
                { href: '/support', label: 'Support', icon: LifeBuoy },
                { href: '/api-docs', label: 'API revendeur', icon: Code2 },
                { href: '/admin/securite', label: 'Sécurité & 2FA', icon: Lock },
            ] 
        }
    ];

    const groups: NavGroup[] = isStaff ? staffGroups : clientGroups;
    const title = groups.flatMap(g => g.items).find(i => i.href === path)?.label || 'Mon espace';
    const sidebar = isStaff ? 'bg-ink text-ivory' : 'bg-card text-ink border-r border-border';

    const navigation = (
        <nav aria-label={isStaff ? 'Menu administration' : 'Menu espace client'} className="space-y-6">
            {groups.map(group => (
                <div key={group.title}>
                    <p className={'mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] ' + (isStaff ? 'text-[#BFAEA0]' : 'text-muted-foreground')}>
                        {group.title}
                    </p>
                    <ul className="space-y-0.5">
                        {group.items.map(item => {
                            const active = path === item.href;
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link 
                                        href={item.href} 
                                        aria-current={active ? 'page' : undefined} 
                                        className={'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ' + 
                                            (isStaff ? (active ? 'bg-coral text-white font-semibold' : 'text-[#E6D9CD] hover:bg-ink-line') 
                                                     : (active ? 'bg-coral-tint text-coral-dark font-semibold' : 'text-ink-soft hover:bg-ivory-deep'))}
                                    >
                                        <Icon className="h-4 w-4 shrink-0"/>
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );

    const summary = isStaff ? (
        <div className="rounded-xl border border-ink-line bg-ink-line px-4 py-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ivory">Console d&apos;Administration</p>
                <span className="rounded bg-coral/20 px-1.5 py-0.5 text-[10px] font-semibold text-coral">
                    {user?.role}
                </span>
            </div>
            <p className="mt-1 text-xs text-[#BFAEA0]">CRM, Sécurité, Commandes &amp; Catalogue</p>
        </div>
    ) : (
        <div className="rounded-xl border border-border bg-ivory px-4 py-3.5">
            <p className="text-xs text-muted-foreground">Solde disponible</p>
            <p className="tabular mt-1 text-xl font-bold">
                {Number(user?.balance ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {user?.currency || 'MAD'}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                <Link href="/add-funds" className="shrink-0 text-xs font-semibold text-coral hover:underline">
                    Recharger
                </Link>
            </div>
        </div>
    );

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

    const footer = (
        <div className={'mt-auto p-4 border-t ' + (isStaff ? 'border-ink-line' : 'border-border')}>
            <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                {isStaff && (
                    <span className="rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        Actif
                    </span>
                )}
            </div>
            <p className={'truncate mt-1 text-xs ' + (isStaff ? 'text-[#BFAEA0]' : 'text-muted-foreground')}>
                {user?.email}
            </p>
            <button 
                disabled={loggingOut} 
                onClick={logout} 
                className="mt-3 flex items-center gap-2 text-xs font-medium text-coral hover:underline"
            >
                <LogOut size={14}/>
                {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
            <div className="mt-3 flex items-center gap-3 pt-2 border-t border-border/20 text-xs">
                <Link href="/" className="underline underline-offset-4 hover:text-coral">
                    Site public
                </Link>
                <span>•</span>
                <Link href="/blog" className="underline underline-offset-4 hover:text-coral">
                    Blog
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <aside className={'fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto lg:flex ' + sidebar}>
                <div className={'px-5 py-5 border-b ' + (isStaff ? 'border-ink-line' : 'border-border')}>
                    <Logo to={isStaff ? '/dashboard' : '/services'} inverted={isStaff} suffix={isStaff ? 'Admin' : 'Client'}/>
                </div>
                <div className="px-3 py-4">{user && summary}</div>
                <div className="flex-1 px-3 pb-6">{user && navigation}</div>
                {user && footer}
            </aside>

            <div className="min-w-0 lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-10">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setOpen(true)} 
                            className="lg:hidden inline-flex h-10 w-10 items-center justify-center border border-border rounded-lg" 
                            aria-label="Ouvrir le menu" 
                            aria-expanded={open} 
                            aria-controls="mobile-navigation"
                        >
                            <Menu size={20}/>
                        </button>
                        <span className="lg:hidden"><Logo /></span>
                        <div className="hidden sm:block">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                {isStaff ? 'Administration' : 'Espace client'}
                            </p>
                            <p className="text-sm font-semibold">{title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link 
                            className="inline-flex items-center gap-2 rounded-lg bg-coral px-3 py-2 text-xs font-semibold text-white sm:text-sm hover:bg-coral-dark transition-colors" 
                            href={isStaff ? '/orders/new' : '/add-funds'}
                        >
                            {isStaff ? 'Nouvelle commande' : 'Ajouter des fonds'}
                            <ArrowUpRight size={15}/>
                        </Link>
                    </div>
                </header>

                {open && (
                    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
                        <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Fermer le menu"/>
                        <div id="mobile-navigation" className={'absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col overflow-y-auto ' + sidebar}>
                            <div className="flex items-center justify-between p-4">
                                <Logo inverted={isStaff} suffix={isStaff ? 'Admin' : 'Client'}/>
                                <button autoFocus onClick={() => setOpen(false)} aria-label="Fermer le menu" className="h-10 w-10 flex items-center justify-center">
                                    <X size={20}/>
                                </button>
                            </div>
                            <div className="px-3 py-4">{summary}</div>
                            <div className="flex-1 px-3 pb-6">{navigation}</div>
                            {footer}
                        </div>
                    </div>
                )}

                <main className="dashboard-content mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
                    {error && (
                        <div role="alert" className="dashboard-alert mb-5">
                            {error}
                            <button onClick={() => void refresh()} className="font-semibold underline ml-2">
                                Réessayer
                            </button>
                        </div>
                    )}
                    {!user || forbidden ? (
                        <div role="status" className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
                            <span className="screen-spinner"/>Chargement de votre espace…
                        </div>
                    ) : children}
                </main>
            </div>
        </div>
    );
}
