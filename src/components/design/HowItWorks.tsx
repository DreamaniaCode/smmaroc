"use client";
import React from 'react';
import { ArrowRight, Link2, ShieldCheck, Wallet, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { StatusPill } from '@/components/design/StatusPill';
import { LinkButton } from '@/components/design/LinkButton';
import { statuses as orderStatusMeta } from '@/lib/design/status';
const steps = [
    { icon: ShieldCheck, title: '1. Créez votre compte', text: 'Une adresse e-mail et un mot de passe suffisent. Nous ne demandons jamais l’accès à vos réseaux sociaux.' },
    { icon: Wallet, title: '2. Rechargez votre solde', text: 'Depuis « Ajouter des fonds », choisissez un moyen de paiement, indiquez le montant et joignez votre justificatif. L’équipe vérifie puis crédite votre solde. Vous suivez l’état dans l’historique des dépôts.' },
    { icon: Link2, title: '3. Passez commande', text: 'Choisissez un service, collez le lien public (profil, publication, vidéo, canal) et une quantité comprise entre le minimum et le maximum. Le devis affiche le montant exact et votre solde après commande.' },
    { icon: ListChecks, title: '4. Suivez la progression', text: 'Chaque commande dispose d’une carte de suivi : statut, compteur de départ, quantités livrées et restantes, date de dernière synchronisation et bouton Actualiser.' }
];
const statusOrder = ['REVIEW_REQUIRED', 'AWAITING_FUNDS', 'IN_PROGRESS', 'PARTIAL', 'COMPLETED', 'CANCELED'];
export function HowItWorks() {
    return (<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
      <PageHeader eyebrow="Fonctionnement" title="Comment ça marche" description="Du compte au suivi de livraison, voici le parcours complet et la signification de chaque statut."/>

      <ol className="grid gap-4 md:grid-cols-2">
        {steps.map((s) => (<li key={s.title} className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <s.icon className="h-5 w-5 text-coral" aria-hidden="true"/>
            <h2 className="mt-3 text-lg font-semibold text-ink">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </li>))}
      </ol>

      <section className="mt-12" aria-labelledby="statuts">
        <h2 id="statuts" className="text-2xl font-bold tracking-tight text-ink">Les statuts de commande</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">Les statuts sont mis à jour à chaque synchronisation. Ils décrivent l’état connu au moment indiqué, sans constituer une garantie de délai.</p>
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">Signification des statuts</caption>
            <thead className="border-b border-border bg-ivory-deep">
              <tr>
                <th scope="col" className="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-48">Statut</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Signification</th>
              </tr>
            </thead>
            <tbody>
              {statusOrder.map((s) => (<tr key={s} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3.5 align-top"><StatusPill tone={orderStatusMeta[s].tone} label={orderStatusMeta[s].label}/></td>
                  <td className="px-4 py-3.5 leading-relaxed text-ink-soft">{orderStatusMeta[s].help}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3" aria-label="Lexique du suivi">
        {[
            { t: 'Compteur de départ', d: 'Le nombre relevé sur votre lien au démarrage. Il sert de référence pour mesurer la livraison.' },
            { t: 'Livrés / restants', d: 'Les quantités livrées et restantes selon la dernière synchronisation connue.' },
            { t: 'Données périmées', d: 'Si la dernière synchronisation est ancienne, un avertissement s’affiche. Utilisez Actualiser pour obtenir l’état le plus récent.' }
        ].map((x) => (<div key={x.t} className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-ink">{x.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
          </div>))}
      </section>

      <div className="mt-12 flex flex-col gap-3 rounded-xl bg-ink p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-semibold text-ivory">Consultez les tarifs avant de créer votre compte.</p>
        <LinkButton to="/catalogue">Voir le catalogue <ArrowRight className="h-4 w-4" aria-hidden="true"/></LinkButton>
      </div>
    </div>);
}
