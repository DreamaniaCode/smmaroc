"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";
import { PublicLayout } from "@/components/design/PublicLayout";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <PublicLayout>
      <div className="bg-background min-h-[60vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md text-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Une erreur est survenue
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink tracking-tight">
            Impossible de charger cette page
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Un problème technique temporaire s&apos;est produit. Veuillez réessayer ou retourner à l&apos;accueil.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-ink bg-card border border-border rounded-lg hover:bg-ivory-deep transition-colors"
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-coral rounded-lg hover:bg-coral-dark transition-colors shadow-sm"
            >
              <Home size={14} />
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
