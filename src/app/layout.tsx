import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://smmaroc.site";

export const viewport: Viewport = {
  themeColor: "#06080F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SMMaroc | N°1 Panel SMM au Maroc en Dirhams (MAD)",
    template: "%s | SMMaroc",
  },
  description:
    "Premier panel SMM professionnel au Maroc. Achat d'abonnés, likes, vues et interactions ciblées pour Instagram, TikTok, YouTube et Facebook en Dirhams (MAD). Livraison rapide et assistance réactive.",
  applicationName: "SMMaroc",
  keywords: [
    "panel smm maroc",
    "smm maroc",
    "acheter followers maroc",
    "acheter abonnés instagram maroc",
    "vues tiktok maroc",
    "boost reseaux sociaux maroc",
    "panel revendeur smm mad",
    "marketing digital maroc",
    "smmaroc",
  ],
  authors: [{ name: "SMMaroc Team", url: siteUrl }],
  creator: "SMMaroc",
  publisher: "SMMaroc",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: siteUrl,
    siteName: "SMMaroc",
    title: "SMMaroc | N°1 Panel SMM au Maroc en Dirhams (MAD)",
    description:
      "Premier panel SMM professionnel au Maroc. Boostez votre présence sur Instagram, TikTok, YouTube et Facebook avec des tarifs directs en Dirhams (MAD).",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SMMaroc - Panel de Réseaux Sociaux au Maroc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SMMaroc | N°1 Panel SMM au Maroc en Dirhams (MAD)",
    description:
      "Développez vos réseaux sociaux en dirhams marocains avec des services fiables et un suivi transparent.",
    images: ["/og-image.png"],
    creator: "@smmaroc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google159838da1a429b07",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/smmaroc-logo.png", type: "image/png" },
    ],
    apple: [{ url: "/smmaroc-logo.png" }],
  },
  category: "marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "SMMaroc",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/smmaroc-logo.png`,
          caption: "SMMaroc Logo",
        },
        description:
          "Fournisseur de référence pour la croissance des réseaux sociaux au Maroc en Dirham marocain (MAD).",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["French", "Arabic"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "SMMaroc",
        description:
          "Panel SMM au Maroc en Dirhams (MAD) pour Instagram, TikTok, YouTube, Facebook et Telegram.",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        inLanguage: "fr-MA",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/catalogue?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="fr" dir="ltr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
