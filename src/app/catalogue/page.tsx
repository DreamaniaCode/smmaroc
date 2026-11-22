import type { Metadata } from "next";
import { PublicLayout } from "@/components/design/PublicLayout";
import { PageHeader } from "@/components/design/PageHeader";
import { ServiceCatalog } from "@/components/design/ServiceCatalog";

export const metadata: Metadata = {
  title: "Catalogue des Services & Tarifs MAD | SMMaroc",
  description:
    "Découvrez notre catalogue complet de services pour réseaux sociaux : Instagram, TikTok, YouTube, Facebook, Telegram. Tarifs transparents par 1 000 en Dirhams marocains (MAD).",
  alternates: {
    canonical: "https://smmaroc.com/catalogue",
  },
  openGraph: {
    title: "Catalogue des Services & Tarifs MAD | SMMaroc",
    description:
      "Abonnés, likes, vues et partages pour tous vos réseaux sociaux. Comparez les tarifs en MAD et commandez en direct.",
    url: "https://smmaroc.com/catalogue",
  },
};

export default function CataloguePage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://smmaroc.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalogue des Services",
        item: "https://smmaroc.com/catalogue",
      },
    ],
  };

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        <PageHeader
          eyebrow="Services & tarifs"
          title="Le catalogue, en toute clarté"
          description="Comparez les services disponibles, leurs tarifs en MAD et leurs limites avant de commander."
        />
        <ServiceCatalog />
      </div>
    </PublicLayout>
  );
}
