import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicLayout } from "@/components/design/PublicLayout";
import { BlogPostReaderClient, BlogPostItem } from "@/components/design/BlogPostReaderClient";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function toIsoDate(d: Date | string | null | undefined, fallback?: string): string {
  if (!d) return fallback || new Date().toISOString();
  if (d instanceof Date) return isNaN(d.getTime()) ? (fallback || new Date().toISOString()) : d.toISOString();
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? (fallback || new Date().toISOString()) : parsed.toISOString();
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return { title: "Article introuvable" };

  try {
    const post = await prisma.blogPost.findUnique({
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

    const publishedTime = post.publishedAt ? toIsoDate(post.publishedAt) : undefined;
    const modifiedTime = (post.updatedAt || post.createdAt) ? toIsoDate(post.updatedAt || post.createdAt) : undefined;

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
        publishedTime,
        modifiedTime,
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

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.isPublished) {
    notFound();
  }

  // Increment views count asynchronously
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // Fetch related posts from same category
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      category: post.category,
      isPublished: true,
      id: { not: post.id },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const postUrl = `https://smmaroc.site/blog/${post.slug}`;
  const publishedDateIso = toIsoDate(post.publishedAt || post.createdAt);
  const modifiedDateIso = toIsoDate(post.updatedAt || post.createdAt);
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
    viewsCount: (post.viewsCount || 0) + 1,
    authorName: post.authorName,
    publishedAt: post.publishedAt ? toIsoDate(post.publishedAt) : null,
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
    viewsCount: r.viewsCount || 0,
    authorName: r.authorName,
    publishedAt: r.publishedAt ? toIsoDate(r.publishedAt) : null,
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
