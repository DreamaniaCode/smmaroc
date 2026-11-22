import type { Metadata } from "next";
import { PublicLayout } from "@/components/design/PublicLayout";
import { HowItWorks } from "@/components/design/HowItWorks";

export const metadata: Metadata = {
  title: "Comment Fonctionne SMMaroc | Guide & Utilisation",
  description:
    "Guide étape par étape pour utiliser SMMaroc : inscription gratuite, recharge sécurisée en Dirhams (MAD), sélection du service et suivi en direct de vos commandes.",
  alternates: {
    canonical: "https://smmaroc.com/fonctionnement",
  },
  openGraph: {
    title: "Comment Fonctionne SMMaroc | Guide & Utilisation",
    description:
      "Tout comprendre sur le fonctionnement de SMMaroc : recharge de solde, passage de commande et livraison rapide.",
    url: "https://smmaroc.com/fonctionnement",
  },
};

export default function FonctionnementPage() {
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
        name: "Fonctionnement",
        item: "https://smmaroc.com/fonctionnement",
      },
    ],
  };

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HowItWorks />
    </PublicLayout>
  );
}
