import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db, prisma } from "@/lib/db";
import { PublicLayout } from "@/components/design/PublicLayout";
import { BlogPostReaderClient, BlogPostItem } from "@/components/design/BlogPostReaderClient";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return { title: "Article introuvable" };

  try {
    const post = await db.blogPost.findUnique({
      where: { slug },
    });

    if (!post || !post.isPublished) {
      return {
        title: "Article introuvable",
        description: "L'article demandé n'est pas disponible ou a été déplacé.",
        robots: { index: false, follow: true },
      };
    }

    const title = post.seoTitle || post.title;
    const description = post.seoDescription || post.excerpt;
    const canonical = `/blog/${post.slug}`;
    const images = post.coverImage ? [post.coverImage] : ["https://smmaroc.site/opengraph-image"];

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: `https://smmaroc.site${canonical}`,
        type: "article",
        publishedTime: post.publishedAt?.toISOString(),
        modifiedTime: post.updatedAt?.toISOString(),
        authors: [post.authorName || "Équipe SMMaroc"],
        images: images.map((url) => ({ url, alt: title })),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
  } catch {
    return { title: "Blog SMMaroc" };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const post = await db.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.isPublished) {
    return (
      <PublicLayout>
        <div className="bg-background min-h-[60vh] flex items-center justify-center py-16 px-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-ink">Article introuvable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cet article n&apos;existe pas, a été déplacé ou n&apos;est plus publié.
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-coral rounded-lg hover:bg-coral-dark transition-colors"
            >
              <ArrowLeft size={14} />
              Retour au Blog
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Increment views count asynchronously
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // Fetch related posts from same category
  const relatedPosts = await db.blogPost.findMany({
    where: {
      category: post.category,
      isPublished: true,
      id: { not: post.id },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const postUrl = `https://smmaroc.site/blog/${post.slug}`;
  const publishedDateIso = (post.publishedAt || post.createdAt).toISOString();
  const modifiedDateIso = (post.updatedAt || post.createdAt).toISOString();
  const coverImg = post.coverImage || "https://smmaroc.site/opengraph-image";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://smmaroc.site",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://smmaroc.site/blog",
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl,
      },
    ],
  };

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    "headline": post.title,
    "description": post.excerpt,
    "image": coverImg,
    "datePublished": publishedDateIso,
    "dateModified": modifiedDateIso,
    "author": {
      "@type": "Person",
      "name": post.authorName || "Équipe SMMaroc",
    },
    "publisher": {
      "@type": "Organization",
      "@id": "https://smmaroc.site/#organization",
      "name": "SMMaroc",
      "url": "https://smmaroc.site",
      "logo": {
        "@type": "ImageObject",
        "url": "https://smmaroc.site/icons/icon-512.png",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl,
    },
    "articleSection": post.category,
    "inLanguage": "fr-FR",
  };

  const clientPost: BlogPostItem = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    category: post.category,
    tags: post.tags,
    readingTimeMin: 4,
    viewsCount: post.viewsCount + 1,
    authorName: post.authorName,
    publishedAt: post.publishedAt,
  };

  const clientRelated: BlogPostItem[] = relatedPosts.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    content: r.content,
    coverImage: r.coverImage,
    category: r.category,
    tags: r.tags,
    readingTimeMin: 4,
    viewsCount: r.viewsCount,
    authorName: r.authorName,
    publishedAt: r.publishedAt,
  }));

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <BlogPostReaderClient post={clientPost} related={clientRelated} />
    </PublicLayout>
  );
}
