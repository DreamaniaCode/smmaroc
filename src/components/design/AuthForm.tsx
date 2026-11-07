"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Loader2, ArrowRight } from 'lucide-react';
export function AuthForm({ mode }: {
    mode: 'login' | 'register';
}) {
    const router = useRouter();
    const register = mode === 'register';
    const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [target, setTarget] = useState('');
    useEffect(() => {
        const value = new URLSearchParams(window.location.search).get('redirect') || '';
        if (value.startsWith('/') && !value.startsWith('//') && !value.includes(String.fromCharCode(92)) && !Array.from(value).some(char => char.charCodeAt(0) < 32))
            setTarget(value);
    }, []);
    const suffix = target ? '?redirect=' + encodeURIComponent(target) : '';
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const response = await fetch(register ? '/api/auth/register' : '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
            let data;
            try {
                data = await response.json();
            }
            catch {
                throw Error('Le service de connexion est momentanément indisponible.');
            }
            if (!response.ok)
                throw Error(data.error || 'Connexion impossible.');
            router.replace(target || (data.user?.role === 'ADMIN' ? '/dashboard' : '/services'));
            router.refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Connexion impossible.');
            setBusy(false);
        }
    }
    return <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1fr_440px] lg:items-start"><div className="hidden lg:block"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">Espace client</p><h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-ink">Un seul espace pour commander et suivre.</h1><ul className="mt-6 space-y-3 text-ink-soft">{['Catalogue filtrable avec prix par 1 000 en MAD', 'Devis affiché avant chaque commande', 'Suivi daté : départ, livrés et restants', 'Historique des dépôts et support intégré'].map(t => <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success"/>{t}</li>)}</ul><Link href="/catalogue" className="mt-8 inline-flex items-center gap-2 font-semibold text-coral text-sm">Découvrir les services<ArrowRight size={16}/></Link></div><section className="rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="mb-6 grid grid-cols-2 rounded-lg bg-ivory-deep p-1">{[{ href: '/login', label: 'Connexion', selected: !register }, { href: '/register', label: 'Inscription', selected: register }].map(item => <Link key={item.href} href={item.href + suffix} aria-current={item.selected ? 'page' : undefined} className={'rounded-md py-2 text-center text-sm font-semibold ' + (item.selected ? 'bg-card text-ink shadow-sm' : 'text-ink-soft')}>{item.label}</Link>)}</div><h2 className="text-xl font-bold">{register ? 'Créer votre compte' : 'Bon retour'}</h2><p className="mt-1 text-sm text-muted-foreground">{register ? 'Gratuit. Aucun accès à vos réseaux sociaux n’est demandé.' : 'Connectez-vous pour accéder à votre espace.'}</p>{error && <div role="alert" className="dashboard-alert mt-5">{error}</div>}<form onSubmit={submit} className="mt-5 space-y-4">{register && <label className="block text-sm font-medium" htmlFor="name">Nom ou activité<input id="name" autoComplete="name" required minLength={2} value={name} onChange={e => setName(e.target.value)} className="mt-1.5 h-11 w-full px-3"/></label>}<label className="block text-sm font-medium" htmlFor="email">Adresse e-mail<input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 h-11 w-full px-3"/></label><label className="block text-sm font-medium" htmlFor="password">Mot de passe<input id="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 h-11 w-full px-3"/>{register && <span className="mt-1 block text-xs font-normal text-muted-foreground">Au moins 8 caractères.</span>}</label><button disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-coral font-semibold text-white hover:bg-coral-dark">{busy && <Loader2 size={16} className="animate-spin"/>}{busy ? 'Vérification…' : register ? 'Créer mon compte' : 'Se connecter'}</button></form><p className="mt-4 text-center text-sm text-muted-foreground">{register ? 'Déjà inscrit ?' : 'Pas encore de compte ?'} <Link href={(register ? '/login' : '/register') + suffix} className="font-semibold text-coral">{register ? 'Se connecter' : 'Créer un compte'}</Link></p></section></div>;
}
