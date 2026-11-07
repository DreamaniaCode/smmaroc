import { redirect } from 'next/navigation';
export default async function Page({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const entries = await searchParams;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(entries)) {
        if (Array.isArray(value))
            value.forEach(v => params.append(key, v));
        else if (value)
            params.set(key, value);
    }
    const query = params.toString();
    redirect('/orders/new' + (query ? '?' + query : ''));
}
