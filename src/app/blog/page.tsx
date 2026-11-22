"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicLayout } from "@/components/design/PublicLayout";
import { 
  Search, Clock, Eye, ArrowRight, Sparkles, 
  BookOpen, ChevronRight, Share2 
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags?: string | string[] | null;
  readingTimeMin?: number;
  viewsCount: number;
  authorName: string;
  publishedAt: string;
}

const CATEGORIES = ["TOUS", "Guide", "Actualités", "Instagram", "TikTok", "YouTube", "Stratégie"];

export default function PublicBlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("TOUS");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory !== "TOUS") params.set("category", selectedCategory);

      const res = await fetch(`/api/blog?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen">
        {/* Hero Section */}
        <section className="border-b border-border bg-ivory-deep/40 py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-coral-tint text-coral border border-coral/20">
                <Sparkles size={13} />
                Conseils, Actualités &amp; Croissance Social Media
              </span>
              <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-ink leading-tight">
                Le Magazine &amp; Guides <span className="text-coral">SMMaroc</span>
              </h1>
              <p className="mt-3 text-base sm:text-lg text-ink-soft leading-relaxed">
                Retrouvez nos analyses d&apos;algorithmes, guides pratiques et stratégies pour développer votre visibilité sur Instagram, TikTok, YouTube et booster vos conversions au Maroc.
              </p>
            </div>

            {/* Filter pills & search */}
            <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-coral text-white shadow-sm"
                        : "bg-card border border-border text-ink-soft hover:bg-ivory-deep hover:text-ink"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <input
                  type="text"
                  placeholder="Rechercher un sujet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-full border border-border pl-8 pr-3 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-coral"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {loading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Chargement des articles...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-bold text-ink">Aucun article trouvé</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Aucun article ne correspond à votre recherche ou catégorie sélectionnée.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Card */}
              {featuredPost && (
                <article className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div className="relative h-64 md:h-80 w-full overflow-hidden bg-ivory-deep">
                      {featuredPost.coverImage ? (
                        <Image
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-coral-tint text-coral font-bold text-2xl">
                          SMMaroc
                        </div>
                      )}
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-coral shadow-sm backdrop-blur-sm">
                        {featuredPost.category}
                      </span>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            ~{featuredPost.readingTimeMin || 4} min de lecture
                          </span>
                          <span>•</span>
                          <span>{new Date(featuredPost.publishedAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}</span>
                        </div>

                        <h2 className="text-2xl font-bold text-ink group-hover:text-coral transition-colors line-clamp-2">
                          <Link href={`/blog/${featuredPost.slug}`}>
                            {featuredPost.title}
                          </Link>
                        </h2>

                        <p className="mt-3 text-sm text-ink-soft leading-relaxed line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-xs font-semibold text-ink">
                          Par {featuredPost.authorName}
                        </span>
                        <Link
                          href={`/blog/${featuredPost.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-coral group-hover:underline"
                        >
                          Lire l&apos;article complet
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Grid of other articles */}
              {gridPosts.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-ink mb-6">Dernières publications</h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {gridPosts.map((post) => (
                      <article
                        key={post.id}
                        className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-48 w-full overflow-hidden bg-ivory-deep">
                          {post.coverImage ? (
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-coral-tint text-coral font-bold">
                              SMMaroc
                            </div>
                          )}
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 text-coral shadow-sm backdrop-blur-sm">
                            {post.category}
                          </span>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                              <span>~{post.readingTimeMin || 3} min</span>
                              <span>•</span>
                              <span>{new Date(post.publishedAt).toLocaleDateString("fr-FR")}</span>
                            </div>

                            <h4 className="text-base font-bold text-ink group-hover:text-coral transition-colors line-clamp-2">
                              <Link href={`/blog/${post.slug}`}>
                                {post.title}
                              </Link>
                            </h4>

                            <p className="mt-2 text-xs text-ink-soft leading-relaxed line-clamp-2">
                              {post.excerpt}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                            <span className="text-muted-foreground text-[11px]">{post.authorName}</span>
                            <Link
                              href={`/blog/${post.slug}`}
                              className="font-semibold text-coral inline-flex items-center gap-1 hover:underline"
                            >
                              Lire
                              <ChevronRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* CTA Bottom Banner */}
        <section className="border-t border-border bg-ivory-deep py-12">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Prêt à booster votre visibilité en ligne au Maroc ?
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Commandez en direct vos abonnés, vues, likes et interactions vérifiés au meilleur tarif en Dirhams (MAD).
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-coral hover:bg-coral-dark transition-colors shadow-sm"
              >
                Créer un compte gratuit
              </Link>
              <Link
                href="/catalogue"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-ink bg-card border border-border hover:bg-ivory-deep transition-colors"
              >
                Consulter les tarifs
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
