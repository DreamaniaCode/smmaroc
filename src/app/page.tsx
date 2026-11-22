import type { Metadata } from "next";
import { PublicLayout } from "@/components/design/PublicLayout";
import { Home } from "@/components/design/Home";

export const metadata: Metadata = {
  title: "SMMaroc | N°1 Panel SMM au Maroc en Dirhams (MAD)",
  description:
    "Plateforme professionnelle pour réseaux sociaux au Maroc : Instagram, TikTok, YouTube, Facebook. Tarifs en Dirhams (MAD), livraison rapide et suivi en temps réel.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SMMaroc | N°1 Panel SMM au Maroc en Dirhams (MAD)",
    description:
      "Plateforme professionnelle pour réseaux sociaux au Maroc. Tarifs en MAD, commandes directes et suivi transparent.",
    url: "https://smmaroc.site",
  },
};

export default function Page() {
  return (
    <PublicLayout>
      <Home />
    </PublicLayout>
  );
}
