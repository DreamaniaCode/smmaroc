"use client";
import React, { useMemo, useState } from 'react';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { LinkButton } from '@/components/design/LinkButton';
import { faqItems } from '@/lib/design/faq';
export function Faq() {
    const categories = useMemo(() => ['Toutes', ...Array.from(new Set(faqItems.map((f) => f.category)))], []);
    const [category, setCategory] = useState('Toutes');
    const items = faqItems.filter((f) => category === 'Toutes' || f.category === category);
    return (<div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
      <PageHeader eyebrow="Aide" title="Questions fréquentes" description="Tarifs, commandes, paiements et API : l’essentiel avant de commencer."/>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrer par thème">
        {categories.map((c) => (<button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${category === c ? 'border-ink bg-ink text-ivory' : 'border-input bg-card text-ink-soft hover:text-ink'}`}>
            {c}
          </button>))}
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {items.map((f) => (<details key={f.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span>{f.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true"/>
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">
              <span className="mb-2 inline-block rounded-md bg-ivory-deep px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.category}</span>
              <p>{f.answer}</p>
            </div>
          </details>))}
      </div>
      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-ivory-deep p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <LifeBuoy className="mt-0.5 h-5 w-5 text-coral" aria-hidden="true"/>
          <div>
            <p className="font-semibold text-ink">Vous ne trouvez pas votre réponse ?</p>
            <p className="text-sm text-muted-foreground">Le support est accessible depuis votre espace client.</p>
          </div>
        </div>
        <LinkButton to="/login" variant="dark">Accéder au support</LinkButton>
      </div>
    </div>);
}
