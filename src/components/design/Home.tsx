"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Clock4, Code2, FileCheck2, ReceiptText, RefreshCw } from 'lucide-react';
import { LinkButton } from '@/components/design/LinkButton';
import { PlatformIcon } from '@/components/design/PlatformIcon';
import { StatusPill } from '@/components/design/StatusPill';
import { fetchCatalog } from '@/lib/catalog-client';
import { platformFor } from '@/components/design/PlatformIcon';
import type { CatalogueService } from '@/components/design/ServiceCatalog';
const platforms = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Telegram', 'X'];
import { faqItems } from '@/lib/design/faq';
import { formatMAD, formatNumber } from '@/lib/design/format';
const steps = [
    { title: 'Créez votre compte', text: 'Inscription gratuite. Aucun mot de passe de réseau social demandé.' },
    { title: 'Rechargez votre solde', text: 'Choisissez un moyen de paiement et joignez votre justificatif. Crédit après vérification.' },
    { title: 'Commandez', text: 'Choisissez un service, collez le lien, indiquez la quantité. Le devis s’affiche avant validation.' },
    { title: 'Suivez la livraison', text: 'Compteur de départ, livrés, restants et date de dernière synchronisation.' }
];
const features = [
    { icon: ReceiptText, title: 'Prix lisibles en MAD', text: 'Chaque service affiche son prix pour 1000 unités, ses quantités minimum et maximum.' },
    { icon: RefreshCw, title: 'Suivi daté', text: 'Chaque commande indique quand ses chiffres ont été synchronisés pour la dernière fois.' },
    { icon: FileCheck2, title: 'Dépôts vérifiés', text: 'Vos recharges sont validées manuellement à partir du justificatif que vous envoyez.' },
    { icon: Code2, title: 'API revendeur', text: 'Automatisez commandes et suivi depuis votre propre plateforme.' }
];
export function Home() {
    const [services, setServices] = useState<CatalogueService[]>([]);
    const [catalogError, setCatalogError] = useState(false), [catalogLoading, setCatalogLoading] = useState(true);
    useEffect(() => {
        let live = true;
        fetchCatalog().then(rows => {
            if (live) {
                setServices(rows);
                setCatalogLoading(false);
                setCatalogError(false);
            }
        }).catch(() => {
            if (live) {
                setCatalogError(true);
                setCatalogLoading(false);
            }
        });
        return () => { live = false; };
    }, []);
    const featured = services.slice(0, 5);
    return (<div>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">Le panel SMM pour vos ambitions</p>
            <h1 className="mt-4 text-[42px] font-bold leading-[1.04] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[72px]">
              Votre présence.
              <br />
              Plus forte.
              <br />
              <span className="text-coral">Plus loin.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Vos services de réseaux sociaux, réunis dans un seul espace. Comparez les tarifs en dirhams, lancez vos commandes et suivez leur progression.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LinkButton to="/register" size="lg">
                Créer mon compte <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
              </LinkButton>
              <LinkButton to="/catalogue" size="lg" variant="outline">
                Voir les services et tarifs <ArrowRight className="h-4 w-4" aria-hidden="true"/>
              </LinkButton>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
              {['Inscription gratuite', 'Tarifs en MAD', 'API revendeur'].map((t) => (<li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" aria-hidden="true"/> {t}</li>))}
            </ul>
          </div>

          <figure className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_#E3D8C8,0_24px_48px_-28px_rgba(42,30,24,0.35)] sm:p-6">
            <figcaption className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">Aperçu du suivi</span>
              <span>Votre suivi au même endroit</span>
            </figcaption>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <PlatformIcon platform="Instagram"/>
                <div>
                  <p className="font-semibold text-ink">Abonnés Instagram</p>
                  <p className="font-mono text-xs text-muted-foreground">Statut et compteurs, après commande</p>
                </div>
              </div>
              <StatusPill tone="info" label="Suivi centralisé"/>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border text-center">
              {[
            { l: 'Départ', v: '—' },
            { l: 'Livrés', v: '—' },
            { l: 'Restants', v: '—' }
        ].map((m) => (<div key={m.l} className="bg-card px-2 py-3">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.l}</dt>
                  <dd className="tabular mt-0.5 text-xl font-bold text-ink">{m.v}</dd>
                </div>))}
            </dl>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ivory-deep" aria-hidden="true">
              <div className="h-full w-0 rounded-full bg-coral"/>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock4 className="h-3.5 w-3.5" aria-hidden="true"/> Date de synchronisation visible</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 font-semibold text-ink">
                <RefreshCw className="h-3 w-3" aria-hidden="true"/> Actualiser
              </span>
            </div>
          </figure>
        </div>
      </section>

      <section aria-label="Plateformes couvertes" className="border-b border-border bg-ivory-deep">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Vos plateformes, un seul espace</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {platforms.map((p) => (<li key={p} className="flex items-center gap-2 text-sm font-semibold text-ink">
                <PlatformIcon platform={p} size="sm"/> {p}
              </li>))}
          </ul>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">Tarifs</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Un aperçu du catalogue</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Prix en MAD pour 1000 unités. Le montant exact est calculé dans le devis avant chaque commande.</p>
          </div>
          <Link href="/catalogue" className="inline-flex items-center gap-1 text-sm font-semibold text-coral hover:text-coral-dark">
            Tout le catalogue <ArrowRight className="h-4 w-4" aria-hidden="true"/>
          </Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          {catalogLoading && <p role="status" className="p-5 text-sm text-muted-foreground">Chargement des tarifs…</p>}
          {catalogError && <p className="p-5 text-sm text-muted-foreground">Les tarifs sont momentanément indisponibles. <Link href="/catalogue" className="font-semibold text-coral">Ouvrir le catalogue</Link></p>}
          {!catalogLoading && !catalogError && !featured.length && <p className="p-5 text-sm text-muted-foreground">Aucun service disponible pour le moment.</p>}
          <ul>
            {featured.map((s) => (<li key={s.id} className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5">
                <PlatformIcon platform={platformFor(s.name + ' ' + s.category)} size="sm"/>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Min {formatNumber(s.minQuantity)} · Max {formatNumber(s.maxQuantity)}</p>
                </div>
                <p className="tabular shrink-0 text-right text-sm font-bold text-ink">
                  {formatMAD(s.sellingRatePer1000)}
                  <span className="block text-[11px] font-normal text-muted-foreground">/ 1000</span>
                </p>
              </li>))}
          </ul>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">Fonctionnement</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Quatre étapes, du compte au suivi</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (<li key={s.title} className="rounded-xl border border-border bg-background p-5">
                <span className="tabular flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-ivory">{i + 1}</span>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>))}
          </ol>
          <Link href="/fonctionnement" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-coral hover:text-coral-dark">
            Comprendre les statuts et le suivi <ArrowRight className="h-4 w-4" aria-hidden="true"/>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <h2 className="text-3xl font-bold tracking-tight text-ink">Ce que vous trouvez dans l’espace client</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (<div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-coral" aria-hidden="true"/>
              <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>))}
        </div>
      </section>

      <section id="faq" className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Questions fréquentes</h2>
          <p className="mt-2 text-sm text-muted-foreground">Les réponses aux questions les plus posées avant de commencer.</p>
          <LinkButton to="/faq" variant="outline" className="mt-5">Toutes les questions</LinkButton>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {faqItems.slice(0, 3).map((f) => (<li key={f.question} className="p-5">
              <h3 className="font-semibold text-ink">{f.question}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
            </li>))}
        </ul>
      </section>

      <section className="bg-ink">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ivory sm:text-3xl">Prêt à lancer votre première commande ?</h2>
            <p className="mt-1.5 text-sm text-[#D9CBBE]">Créez un compte gratuit puis rechargez votre solde en MAD.</p>
          </div>
          <LinkButton to="/register" size="lg">
            Créer mon compte <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
          </LinkButton>
        </div>
      </section>
    </div>);
}
