import { AtSign, Instagram, Music2, Send, ThumbsUp, Youtube, Layers } from 'lucide-react';
export function platformFor(name: string) { const text = name.toLowerCase(); return text.includes('instagram') ? 'Instagram' : text.includes('tiktok') ? 'TikTok' : text.includes('youtube') ? 'YouTube' : text.includes('facebook') ? 'Facebook' : text.includes('telegram') ? 'Telegram' : /twitter|\bx\b/.test(text) ? 'X' : 'Autres'; }
export function PlatformIcon({ platform, size = 'md' }: {
    platform: string;
    size?: 'sm' | 'md';
}) { const Icon = ({ Instagram, TikTok: Music2, YouTube: Youtube, Facebook: ThumbsUp, Telegram: Send, X: AtSign } as Record<string, typeof Layers>)[platform] || Layers; return <span aria-hidden="true" className={'inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-ivory-deep text-ink ' + (size === 'sm' ? 'h-7 w-7' : 'h-9 w-9')}><Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}/></span>; }
