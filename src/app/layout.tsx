import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMMaroc | Votre panel de services sociaux",
  description: "Automated SMM order fulfillment, smart failover, and provider routing hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
