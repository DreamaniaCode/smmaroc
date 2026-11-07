import React from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
type Variant = 'primary' | 'outline' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg';
interface LinkButtonProps {
    to: string;
    children: ReactNode;
    variant?: Variant;
    size?: Size;
    className?: string;
}
const variants: Record<Variant, string> = {
    primary: 'bg-coral text-white hover:bg-coral-dark',
    outline: 'border border-input bg-card text-ink hover:bg-ivory-deep',
    ghost: 'text-ink hover:bg-ivory-deep',
    dark: 'bg-ink text-ivory hover:bg-ink-soft'
};
const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-[15px]'
};
export function LinkButton({ to, children, variant = 'primary', size = 'md', className = '' }: LinkButtonProps) {
    return (<Link href={to} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>);
}
