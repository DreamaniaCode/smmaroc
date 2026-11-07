const moneyFormatter = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat('fr-FR');
const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export function formatMAD(value: number): string {
  return `${moneyFormatter.format(value)} MAD`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function minutesSince(iso: string, now: number = Date.now()): number {
  return Math.max(0, (now - new Date(iso).getTime()) / 60000);
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.floor(minutesSince(iso, now));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeCharge(pricePer1000: number, quantity: number): number {
  return round2((pricePer1000 * quantity) / 1000);
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

