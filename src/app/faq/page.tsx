import type { Metadata } from "next";
import { PublicLayout } from "@/components/design/PublicLayout";
import { Faq } from "@/components/design/Faq";
import { faqItems } from "@/lib/design/faq";

export const metadata: Metadata = {
  title: "Questions Fréquentes (FAQ) | SMMaroc",
  description:
    "Toutes les réponses à vos questions sur SMMaroc : inscription, sécurité des comptes, devis en Dirhams (MAD), délais de livraison et recharge de solde.",
  alternates: {
    canonical: "https://smmaroc.com/faq",
  },
  openGraph: {
    title: "Questions Fréquentes (FAQ) | SMMaroc",
    description:
      "Tout ce que vous devez savoir avant de commander : tarifs en MAD, sécurité et support.",
    url: "https://smmaroc.com/faq",
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

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
        name: "FAQ",
        item: "https://smmaroc.com/faq",
      },
    ],
  };

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Faq />
    </PublicLayout>
  );
}
