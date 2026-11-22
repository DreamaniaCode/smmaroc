"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Loader2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export function AuthForm({ mode }: {
    mode: 'login' | 'register';
}) {
    const router = useRouter();
    const register = mode === 'register';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [target, setTarget] = useState('');

    // 2FA state
    const [require2FA, setRequire2FA] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [isBackupCode, setIsBackupCode] = useState(false);

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
            const response = await fetch(register ? '/api/auth/register' : '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            let data;
            try {
                data = await response.json();
            } catch {
                throw Error('Le service de connexion est momentanément indisponible.');
            }

            if (!response.ok) {
                throw Error(data.error || 'Connexion impossible.');
            }

            // Check if 2FA verification is required
            if (data.require2FA) {
                setTempToken(data.tempToken || '');
                setRequire2FA(true);
                setBusy(false);
                return;
            }

            const isStaffOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'OPERATOR'].includes(data.user?.role);
            router.replace(target || (isStaffOrAdmin ? '/dashboard' : '/services'));
            router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Connexion impossible.');
            setBusy(false);
        }
    }

    async function submit2FA(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: totpCode.trim(), tempToken })
            });

            const data = await res.json();
            if (!res.ok) {
                throw Error(data.error || 'Code de sécurité invalide.');
            }

            const isStaffOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'OPERATOR'].includes(data.user?.role);
            router.replace(target || (isStaffOrAdmin ? '/dashboard' : '/services'));
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la validation 2FA.');
            setBusy(false);
        }
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1fr_440px] lg:items-start">
            <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">Espace SMMaroc</p>
                <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-ink">
                    Plateforme professionnelle de services réseaux sociaux au Maroc.
                </h1>
                <ul className="mt-6 space-y-3 text-ink-soft">
                    {[
                        'Catalogue transparent avec prix directs en Dirham marocain (MAD)',
                        'Haute sécurité des comptes & authentification 2FA renforcée',
                        'Suivi en temps réel de chaque commande et livraison',
                        'Assistance réactive WhatsApp et gestion dédiée'
                    ].map(t => (
                        <li key={t} className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success"/>
                            {t}
                        </li>
                    ))}
                </ul>
                <div className="mt-8 flex items-center gap-4">
                    <Link href="/catalogue" className="inline-flex items-center gap-2 font-semibold text-coral text-sm">
                        Découvrir les services
                        <ArrowRight size={16}/>
                    </Link>
                    <span className="text-ink-soft">•</span>
                    <Link href="/blog" className="inline-flex items-center gap-2 font-semibold text-ink text-sm hover:text-coral">
                        Lire notre Blog & Conseils
                    </Link>
                </div>
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
                {!require2FA ? (
                    <>
                        <div className="mb-6 grid grid-cols-2 rounded-lg bg-ivory-deep p-1">
                            {[
                                { href: '/login', label: 'Connexion', selected: !register },
                                { href: '/register', label: 'Inscription', selected: register }
                            ].map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href + suffix}
                                    aria-current={item.selected ? 'page' : undefined}
                                    className={'rounded-md py-2 text-center text-sm font-semibold ' + (item.selected ? 'bg-card text-ink shadow-sm' : 'text-ink-soft')}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <h2 className="text-xl font-bold">{register ? 'Créer votre compte' : 'Bon retour'}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {register ? 'Gratuit. Aucun mot de passe de vos réseaux n’est requis.' : 'Connectez-vous pour accéder à votre espace sécurisé.'}
                        </p>

                        {error && <div role="alert" className="dashboard-alert mt-5">{error}</div>}

                        <form onSubmit={submit} className="mt-5 space-y-4">
                            {register && (
                                <label className="block text-sm font-medium" htmlFor="name">
                                    Nom ou Entreprise
                                    <input
                                        id="name"
                                        autoComplete="name"
                                        required
                                        minLength={2}
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 bg-background"
                                        placeholder="Ex: Mon Agence / Prénom Nom"
                                    />
                                </label>
                            )}

                            <label className="block text-sm font-medium" htmlFor="email">
                                Adresse e-mail
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 bg-background"
                                    placeholder="nom@exemple.com"
                                />
                            </label>

                            <label className="block text-sm font-medium" htmlFor="password">
                                <div className="flex justify-between">
                                    <span>Mot de passe</span>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete={register ? 'new-password' : 'current-password'}
                                    required
                                    minLength={register ? 8 : undefined}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 bg-background"
                                />
                                {register && (
                                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                        Au moins 8 caractères (chiffres, lettres et symboles recommandés).
                                    </span>
                                )}
                            </label>

                            <button
                                disabled={busy}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-coral font-semibold text-white hover:bg-coral-dark transition-colors"
                            >
                                {busy && <Loader2 size={16} className="animate-spin"/>}
                                {busy ? 'Vérification…' : register ? 'Créer mon compte' : 'Se connecter'}
                            </button>
                        </form>

                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            {register ? 'Déjà inscrit ?' : 'Pas encore de compte ?'}{' '}
                            <Link href={(register ? '/login' : '/register') + suffix} className="font-semibold text-coral">
                                {register ? 'Se connecter' : 'Créer un compte'}
                            </Link>
                        </p>
                    </>
                ) : (
                    /* 2FA Challenge Screen */
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Vérification de sécurité (2FA)</h2>
                                <p className="text-xs text-muted-foreground">Votre compte est protégé par la double authentification.</p>
                            </div>
                        </div>

                        <p className="text-sm text-ink-soft mb-5">
                            {isBackupCode 
                                ? "Entrez l'un de vos codes de secours à 8 caractères reçus lors de la configuration."
                                : "Ouvrez votre application d'authentification (Google Authenticator, Authy, etc.) et saisissez le code à 6 chiffres."}
                        </p>

                        {error && <div role="alert" className="dashboard-alert mb-5">{error}</div>}

                        <form onSubmit={submit2FA} className="space-y-4">
                            <label className="block text-sm font-medium" htmlFor="totp">
                                {isBackupCode ? "Code de secours de secours" : "Code d'authentification (6 chiffres)"}
                                <input
                                    id="totp"
                                    type="text"
                                    inputMode={isBackupCode ? "text" : "numeric"}
                                    autoFocus
                                    required
                                    value={totpCode}
                                    onChange={e => setTotpCode(e.target.value.toUpperCase())}
                                    placeholder={isBackupCode ? "A1B2C3D4" : "123456"}
                                    maxLength={isBackupCode ? 12 : 8}
                                    className="mt-1.5 h-12 w-full text-center text-xl tracking-widest font-mono rounded-lg border border-border px-3 bg-background font-bold"
                                />
                            </label>

                            <button
                                disabled={busy || !totpCode.trim()}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-coral font-semibold text-white hover:bg-coral-dark transition-colors"
                            >
                                {busy && <Loader2 size={16} className="animate-spin"/>}
                                {busy ? 'Validation…' : 'Confirmer et déverrouiller'}
                            </button>

                            <div className="pt-2 text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBackupCode(!isBackupCode);
                                        setTotpCode('');
                                        setError('');
                                    }}
                                    className="text-xs font-semibold text-coral inline-flex items-center gap-1.5 hover:underline"
                                >
                                    <KeyRound size={13} />
                                    {isBackupCode ? "Utiliser le code de l'application (6 chiffres)" : "Utiliser un code de secours (8 caractères)"}
                                </button>
                            </div>

                            <div className="pt-2 border-t border-border text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRequire2FA(false);
                                        setTotpCode('');
                                        setError('');
                                    }}
                                    className="text-xs text-muted-foreground hover:text-ink"
                                >
                                    ← Annuler et revenir à la connexion
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </section>
        </div>
    );
}
