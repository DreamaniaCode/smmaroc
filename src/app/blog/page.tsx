import type { Metadata } from "next";
import { PublicLayout } from "@/components/design/PublicLayout";
import { BlogClientIndex } from "@/components/design/BlogClientIndex";

export const metadata: Metadata = {
  title: "Blog & Conseils Réseaux Sociaux au Maroc",
  description: "Guides pratiques, actualités d'algorithmes et astuces pour développer votre notoriété et booster vos ventes sur Instagram, TikTok, Facebook et YouTube au Maroc.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog SMMaroc | Conseils & Croissance Réseaux Sociaux au Maroc",
    description: "Guides, analyses algorithmes et stratégies pour maximiser votre visibilité sur les réseaux sociaux au Maroc.",
    url: "https://smmaroc.com/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog SMMaroc | Conseils & Croissance Réseaux Sociaux au Maroc",
    description: "Guides, analyses algorithmes et stratégies pour maximiser votre visibilité sur les réseaux sociaux au Maroc.",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://smmaroc.com",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog & Conseils",
      "item": "https://smmaroc.com/blog",
    },
  ],
};

export default function BlogIndexPage() {
  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogClientIndex />
    </PublicLayout>
  );
}
