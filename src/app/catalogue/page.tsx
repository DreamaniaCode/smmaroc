import { PublicLayout } from '@/components/design/PublicLayout';
import { PageHeader } from '@/components/design/PageHeader';
import { ServiceCatalog } from '@/components/design/ServiceCatalog';
export default function Page() { return <PublicLayout><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14"><PageHeader eyebrow="Services & tarifs" title="Le catalogue, en toute clarté" description="Comparez les services disponibles, leurs tarifs en MAD et leurs limites avant de commander."/><ServiceCatalog /></div></PublicLayout>; }
