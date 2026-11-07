"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink } from './NavLink';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { LinkButton } from './LinkButton';
const links = [
    { to: '/catalogue', label: 'Services & tarifs' },
    { to: '/fonctionnement', label: 'Fonctionnement' },
    { to: '/faq', label: 'Questions fréquentes' }
];
export function PublicLayout({ children }: {
    children: React.ReactNode;
}) {
    const [role, setRole] = useState('visiteur');
    useEffect(() => {
        fetch('/api/auth/me', { cache: 'no-store' }).then(async (r) => r.ok ? r.json() : null).then(data => {
            if (data?.user)
                setRole(data.user.role === 'ADMIN' ? 'admin' : 'client');
        }).catch(() => { });
    }, []);
    const [open, setOpen] = useState(false);
    const location = { pathname: usePathname() };
    useEffect(() => {
        setOpen(false);
        window.scrollTo(0, 0);
    }, [location.pathname]);
    const spaceLink = role === 'admin' ? { to: '/dashboard', label: 'Administration' } : role === 'client' ? { to: '/services', label: 'Mon espace' } : null;
    return (<div className="flex min-h-screen w-full flex-col bg-background">

      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (<NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-ivory-deep text-ink' : 'text-ink-soft hover:text-ink'}`}>
                {l.label}
              </NavLink>))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {spaceLink ? (<LinkButton to={spaceLink.to} variant="dark">{spaceLink.label}</LinkButton>) : (<>
                <LinkButton to="/login" variant="ghost">Connexion</LinkButton>
                <LinkButton to="/register">Créer un compte</LinkButton>
              </>)}
          </div>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border lg:hidden" aria-expanded={open} aria-controls="menu-public" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
          </button>
        </div>
        {open && (<nav id="menu-public" aria-label="Navigation mobile" className="border-t border-border bg-background px-4 pb-4 pt-2 lg:hidden">
            {links.map((l) => (<NavLink key={l.to} to={l.to} className={({ isActive }) => `block rounded-md px-3 py-3 text-[15px] font-medium ${isActive ? 'bg-ivory-deep text-ink' : 'text-ink-soft'}`}>
                {l.label}
              </NavLink>))}
            <div className="mt-3 grid gap-2">
              {spaceLink ? (<LinkButton to={spaceLink.to} variant="dark">{spaceLink.label}</LinkButton>) : (<>
                  <LinkButton to="/login" variant="outline">Connexion</LinkButton>
                  <LinkButton to="/register">Créer un compte</LinkButton>
                </>)}
            </div>
          </nav>)}
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-ivory-deep">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Panel de services pour réseaux sociaux. Tarifs affichés en dirhams (MAD), commandes suivies depuis votre espace.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Découvrir</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map((l) => (<li key={l.to}><Link href={l.to} className="text-ink-soft hover:text-coral">{l.label}</Link></li>))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Compte</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/login" className="text-ink-soft hover:text-coral">Connexion</Link></li>
              <li><Link href="/register" className="text-ink-soft hover:text-coral">Inscription</Link></li>
              <li><Link href="/api-docs" className="text-ink-soft hover:text-coral">API revendeur</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
            © {new Date().getFullYear()} SMMaroc — Services pour réseaux sociaux.
          </p>
        </div>
      </footer>
    </div>);
}
