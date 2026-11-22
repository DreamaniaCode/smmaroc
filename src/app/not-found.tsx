import Link from "next/link";
import { Home, BookOpen } from "lucide-react";
import { PublicLayout } from "@/components/design/PublicLayout";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="bg-background min-h-[60vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md text-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-coral-tint text-coral border border-coral/20">
            Erreur 404
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-ink tracking-tight">
            Page ou article introuvable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            La page ou l&apos;article que vous recherchez n&apos;existe pas, a été renommé ou a été déplacé.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-ink bg-card border border-border rounded-lg hover:bg-ivory-deep transition-colors"
            >
              <BookOpen size={14} />
              Voir le Blog
            </Link>
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
