"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Newspaper, PlusCircle, Search, Edit3, Trash2, Eye, 
  CheckCircle2, Clock, Filter, ExternalLink, RefreshCw, AlertTriangle 
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  authorName: string;
  viewsCount: number;
  readingTimeMin?: number;
  createdAt: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ admin: "true" });
      if (searchQuery) params.set("q", searchQuery);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);

      const res = await fetch(`/api/blog?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger les articles");
      setPosts(data.posts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Supprimer définitivement l'article "${post.title}" ?`)) return;
    try {
      const res = await fetch(`/api/blog/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur lors de la suppression");
      }
      setSuccess("Article supprimé avec succès.");
      fetchPosts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalViews = posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.filter((p) => !p.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
            <Newspaper className="h-7 w-7 text-coral" />
            Gestion du Blog &amp; Actualités
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rédigez des guides, actualités et tutoriels pour booster le SEO et informer vos clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/blog/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Rédiger un article
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-xs font-bold">Fermer</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-xs font-bold">Fermer</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Articles</p>
          <p className="mt-2 text-2xl font-bold text-ink">{posts.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Articles Publiés</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{publishedCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brouillons</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{draftCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vues Totales</p>
          <p className="mt-2 text-2xl font-bold text-coral">{totalViews.toLocaleString("fr-FR")}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Rechercher un article par titre, mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border pl-9 pr-3 text-sm bg-background"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-lg border border-border px-3 text-xs font-medium bg-background"
        >
          <option value="ALL">Toutes les catégories</option>
          <option value="Guide">Guide</option>
          <option value="Actualités">Actualités</option>
          <option value="Instagram">Instagram</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
          <option value="Stratégie">Stratégie</option>
        </select>
      </div>

      {/* Articles Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ivory-deep border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Article</th>
                <th className="px-6 py-3.5 font-semibold">Catégorie</th>
                <th className="px-6 py-3.5 font-semibold">Statut</th>
                <th className="px-6 py-3.5 font-semibold">Vues</th>
                <th className="px-6 py-3.5 font-semibold">Auteur &amp; Date</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    Chargement des articles...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-ink">Aucun article de blog pour le moment.</p>
                    <p className="text-xs mt-1">Commencez par rédiger votre premier article pour animer votre plateforme.</p>
                    <Link
                      href="/admin/blog/nouveau"
                      className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                    >
                      <PlusCircle size={14} />
                      Créer un article
                    </Link>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-ivory-deep/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover border border-border shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-ivory-deep border border-border flex items-center justify-center text-muted-foreground shrink-0">
                            <Newspaper size={20} />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/blog/${post.id}`}
                            className="font-bold text-ink hover:text-coral transition-colors line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={13} />
                          Publié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock size={13} />
                          Brouillon
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-ink">
                      {post.viewsCount.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div>{post.authorName}</div>
                      <div className="text-[11px]">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("fr-FR")
                          : new Date(post.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {post.isPublished && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-1.5 text-muted-foreground hover:text-coral hover:bg-ivory-deep rounded-md transition-colors"
                            title="Voir l'article public"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="p-1.5 text-muted-foreground hover:text-ink hover:bg-ivory-deep rounded-md transition-colors"
                          title="Éditer"
                        >
                          <Edit3 size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
