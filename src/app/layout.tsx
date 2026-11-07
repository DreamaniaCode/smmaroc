import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
    title: "SMMaroc | Votre panel de services sociaux",
    description: "Services pour réseaux sociaux en MAD : catalogue, commandes, paiements vérifiés et suivi de livraison.",
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>);
}
