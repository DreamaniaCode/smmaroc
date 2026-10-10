import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMM Agency Panel | Operations & Failover Engine",
  description: "Automated SMM order fulfillment, smart failover, and provider routing hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
