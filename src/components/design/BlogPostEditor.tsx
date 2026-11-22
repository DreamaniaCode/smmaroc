"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, Save, Eye, Edit3, Image as ImageIcon, 
  Sparkles, Globe, Tag, CheckCircle2, AlertTriangle 
} from "lucide-react";

interface BlogPostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string | string[] | null;
  isPublished: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export function BlogPostEditor({ initialData, isEdit }: { initialData?: BlogPostData; isEdit?: boolean }) {
  const router = useRouter();

  const getInitialTags = () => {
    if (!initialData?.tags) return "SMM, Maroc, Réseaux Sociaux";
    if (Array.isArray(initialData.tags)) return initialData.tags.join(", ");
    return initialData.tags;
  };

  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    coverImage: initialData?.coverImage || "",
    category: initialData?.category || "Guides",
    isPublished: initialData?.isPublished ?? true,
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
  });

  const [tagsInput, setTagsInput] = useState(getInitialTags());
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: autoSlug ? generateSlug(val) : prev.slug,
      seoTitle: prev.seoTitle || val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setError("Le titre, le slug et le contenu sont obligatoires.");
      setSubmitting(false);
      return;
    }

    try {
      const url = isEdit ? `/api/blog/${initialData?.id}` : "/api/blog";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        ...form,
        tags: tagsInput,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement");

      setSuccess(isEdit ? "Article mis à jour avec succès !" : "Article créé avec succès !");
      setTimeout(() => {
        router.push("/admin/blog");
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="p-2 border border-border rounded-lg hover:bg-card text-muted-foreground hover:text-ink transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink">
              {isEdit ? "Modifier l'article" : "Rédiger un nouvel article"}
            </h1>
            <p className="text-xs text-muted-foreground">Éditeur enrichi avec aperçu direct et métadonnées SEO</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold px-3 py-1.5 border border-border rounded-lg bg-card">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="rounded text-coral focus:ring-coral"
            />
            {form.isPublished ? "Publier immédiatement" : "Enregistrer en brouillon"}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            {submitting ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Publier l'article"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Content Editor */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-ink">Titre de l&apos;article *</label>
              <input
                type="text"
                required
                placeholder="Ex: Comment booster sa visibilité Instagram au Maroc en 2026 ?"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="mt-1 h-12 w-full text-base font-bold rounded-lg border border-border px-3 bg-background"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-ink">Slug d&apos;URL *</label>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[11px] text-coral hover:underline"
                >
                  {autoSlug ? "Personnaliser le slug" : "Génération automatique"}
                </button>
              </div>
              <div className="mt-1 flex items-center rounded-lg border border-border bg-background px-3">
                <span className="text-xs text-muted-foreground font-mono">/blog/</span>
                <input
                  type="text"
                  required
                  value={form.slug}
                  disabled={autoSlug}
                  onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })}
                  className="h-10 w-full bg-transparent text-xs font-mono font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Extrait résumé (Chapô)</label>
              <textarea
                rows={2}
                placeholder="Court résumé de 1 à 2 phrases affiché dans les cartes du blog et Google..."
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border p-3 text-xs bg-background"
              />
            </div>
          </div>

          {/* Content & Markdown Editor */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-ivory-deep px-4 py-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditorMode("edit")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    editorMode === "edit" ? "bg-card text-ink shadow-sm" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  <Edit3 size={13} />
                  Éditeur Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    editorMode === "preview" ? "bg-card text-ink shadow-sm" : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  <Eye size={13} />
                  Aperçu en direct
                </button>
              </div>

              <span className="text-xs text-muted-foreground">
                Temps de lecture estimé : ~{estimatedReadingTime} min
              </span>
            </div>

            <div className="p-4">
              {editorMode === "edit" ? (
                <textarea
                  rows={16}
                  required
                  placeholder="Rédigez le contenu complet de votre article en Markdown (titres avec ###, listes, conseils)..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full font-mono text-sm leading-relaxed p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-coral"
                />
              ) : (
                <div className="prose prose-slate max-w-none min-h-[380px] p-2 bg-background rounded-lg border border-border">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink font-sans">
                    {form.content || "L'aperçu apparaîtra ici dès que vous saisirez du contenu."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sidebar & Settings */}
        <div className="space-y-4">
          {/* Metadata Card */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-ink">Paramètres de publication</h3>

            <div>
              <label className="block text-xs font-semibold text-ink">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-xs bg-background"
              >
                <option value="Guides">Guides</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Facebook">Facebook</option>
                <option value="Stratégie">Stratégie</option>
                <option value="E-commerce">E-commerce</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Image de couverture (URL)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border px-3 text-xs bg-background"
                />
              </div>
              {form.coverImage && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden h-32 relative bg-ivory-deep">
                  <Image
                    src={form.coverImage}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Tags (séparés par virgules)</label>
              <input
                type="text"
                placeholder="instagram, maroc, reels, ecommerce"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-xs bg-background"
              />
            </div>
          </div>

          {/* SEO Card */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Globe size={15} className="text-coral" />
              Optimisation Référencement (SEO)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink">Titre SEO (seoTitle)</label>
              <input
                type="text"
                placeholder="Titre affiché dans les résultats Google"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-xs bg-background"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Description SEO (seoDescription)</label>
              <textarea
                rows={3}
                placeholder="Courte description pour Google (150-160 car.)"
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border p-3 text-xs bg-background"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
