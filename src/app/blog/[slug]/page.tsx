"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PublicLayout } from "@/components/design/PublicLayout";
import { 
  Clock, Eye, ArrowLeft, Share2, MessageCircle, Send, 
  Twitter, Linkedin, Copy, Check, ChevronRight, Sparkles 
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string | string[] | null;
  readingTimeMin?: number;
  viewsCount: number;
  authorName: string;
  publishedAt: string;
}

export default function BlogPostReaderPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/slug/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Article introuvable");
        setPost(data.post);
        setRelated(data.relatedPosts || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const copyUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getShareUrl = (platform: "whatsapp" | "telegram" | "twitter" | "linkedin") => {
    if (typeof window === "undefined" || !post) return "#";
    const currentUrl = window.location.href;
    const title = post.title;

    switch (platform) {
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " - " + currentUrl)}`;
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`;
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    }
  };

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen py-8 md:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/" className="hover:text-ink">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-ink">Blog</Link>
            <span>/</span>
            <span className="text-ink truncate max-w-[200px] sm:max-w-none font-medium">
              {post?.title || "Article"}
            </span>
          </nav>

          {loading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Chargement de l&apos;article...
            </div>
          ) : error || !post ? (
            <div className="py-16 text-center">
              <h2 className="text-xl font-bold text-ink">Article introuvable</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error || "Cet article n'existe pas ou n'est plus disponible."}</p>
              <Link
                href="/blog"
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-coral rounded-lg"
              >
                <ArrowLeft size={14} />
                Retour au Blog
              </Link>
            </div>
          ) : (
            <article className="space-y-8">
              {/* Post Header */}
              <header className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full font-bold bg-coral-tint text-coral border border-coral/20">
                    {post.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock size={13} />
                    ~{post.readingTimeMin || 4} min de lecture
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1 text-muted-foreground font-mono">
                    <Eye size={13} />
                    {post.viewsCount} vues
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight leading-tight">
                  {post.title}
                </h1>

                <p className="text-base sm:text-lg text-ink-soft leading-relaxed font-medium">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-coral-tint text-coral font-bold flex items-center justify-center">
                      {post.authorName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{post.authorName}</p>
                      <p className="text-[11px]">
                        Publié le {new Date(post.publishedAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                      </p>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getShareUrl("whatsapp")}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Partager sur WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                    <a
                      href={getShareUrl("telegram")}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                      title="Partager sur Telegram"
                    >
                      <Send size={15} />
                    </a>
                    <a
                      href={getShareUrl("twitter")}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
                      title="Partager sur X (Twitter)"
                    >
                      <Twitter size={15} />
                    </a>
                    <button
                      onClick={copyUrl}
                      className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-ivory-deep transition-colors"
                      title="Copier le lien"
                    >
                      {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
              </header>

              {/* Cover Image */}
              {post.coverImage && (
                <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-border bg-ivory-deep">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
              )}

              {/* Article Content Prose */}
              <div className="prose prose-slate max-w-none text-ink text-base sm:text-lg leading-relaxed space-y-6">
                <div className="whitespace-pre-wrap font-sans">
                  {post.content}
                </div>
              </div>

              {/* Tags */}
              {(() => {
                const tagsList = typeof post.tags === "string" 
                  ? post.tags.split(",").map(t => t.trim()).filter(Boolean)
                  : Array.isArray(post.tags) ? post.tags : [];
                if (tagsList.length === 0) return null;
                return (
                  <div className="pt-6 border-t border-border flex flex-wrap gap-2">
                    {tagsList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-ivory-deep text-ink-soft border border-border"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                );
              })()}

              {/* Conversion Box */}
              <div className="rounded-2xl border border-coral/30 bg-coral/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-coral uppercase tracking-wider">
                    <Sparkles size={14} />
                    Passez à l&apos;action
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-ink">
                    Développez vos réseaux sociaux en Dirhams marocains
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-ink-soft">
                    Bénéficiez des meilleurs tarifs au Maroc, d&apos;une livraison rapide et d&apos;un support dédié via WhatsApp.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <Link
                    href="/register"
                    className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-coral hover:bg-coral-dark transition-colors shadow-sm"
                  >
                    Créer un compte
                  </Link>
                  <Link
                    href="/catalogue"
                    className="px-5 py-2.5 rounded-lg text-xs font-semibold text-ink bg-card border border-border hover:bg-ivory-deep transition-colors"
                  >
                    Voir le catalogue
                  </Link>
                </div>
              </div>

              {/* Related Posts */}
              {related.length > 0 && (
                <div className="pt-8 border-t border-border space-y-4">
                  <h3 className="text-xl font-bold text-ink">Articles similaires</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {related.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/blog/${rel.slug}`}
                        className="group p-4 rounded-xl border border-border bg-card hover:bg-ivory-deep/40 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-coral uppercase tracking-wider">
                            {rel.category}
                          </span>
                          <h4 className="mt-1 text-sm font-bold text-ink group-hover:text-coral transition-colors line-clamp-2">
                            {rel.title}
                          </h4>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>~{rel.readingTimeMin} min</span>
                          <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
