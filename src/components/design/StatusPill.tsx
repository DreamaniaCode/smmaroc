import React from 'react';
import type { Tone } from '@/lib/design/status';
import { toneClasses } from '@/lib/design/status';
interface StatusPillProps {
    tone: Tone;
    label: string;
}
export function StatusPill({ tone, label }: StatusPillProps) {
    return (<span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"/>
      {label}
    </span>);
}
