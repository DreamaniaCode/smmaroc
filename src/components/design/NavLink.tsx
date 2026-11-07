"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
export function NavLink({ to, children, className, end = false }: {
    to: string;
    children: ReactNode;
    className: string | ((state: {
        isActive: boolean;
    }) => string);
    end?: boolean;
}) { const path = usePathname(); const isActive = end ? path === to : path === to || path.startsWith(to + '/'); return <Link href={to} aria-current={isActive ? 'page' : undefined} className={typeof className === 'function' ? className({ isActive }) : className}>{children}</Link>; }
