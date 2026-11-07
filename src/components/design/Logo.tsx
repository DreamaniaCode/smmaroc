import React from 'react';
import Link from 'next/link';
interface LogoProps {
    to?: string;
    inverted?: boolean;
    suffix?: string;
}
export function Logo({ to = '/', inverted = false, suffix }: LogoProps) {
    return (<Link href={to} className="inline-flex items-center gap-2.5 rounded-md" aria-label="SMMaroc — accueil">
      <img src="/smmaroc-logo.png" width={32} height={32} alt="" className="h-8 w-8 rounded-md"/>
      <span className={`text-lg font-extrabold tracking-tight ${inverted ? 'text-ivory' : 'text-ink'}`}>
        SMMaroc<span className="text-coral">.</span>
      </span>
      {suffix && (<span className={`ml-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${inverted ? 'border-ink-line text-coral-light' : 'border-border text-muted-foreground'}`}>
          {suffix}
        </span>)}
    </Link>);
}
