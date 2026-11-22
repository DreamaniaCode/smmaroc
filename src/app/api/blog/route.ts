import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, isStaff } from "@/lib/auth";
import { logAdminAction } from "@/lib/security";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace to -
    .replace(/-+/g, "-") // collapse dashes
    .trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");
  const adminView = searchParams.get("admin") === "true";

  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  const canSeeDrafts = session && isStaff(session.role) && adminView;

  const where: any = {};
  if (!canSeeDrafts) {
    where.isPublished = true;
  }
  if (category && category !== "ALL") {
    where.category = category;
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
    ];
  }

  try {
    const posts = await db.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const total = await db.blogPost.count({ where });
    const categories = ["Tous", "Instagram", "TikTok", "YouTube", "Facebook", "Guides", "E-commerce"];

    return NextResponse.json({ posts, total, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de chargement des articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé. Privilèges requis pour publier." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      coverImage,
      category,
      tags,
      isPublished,
      seoTitle,
      seoDescription,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Le titre et le contenu sont obligatoires." }, { status: 400 });
    }

    let finalSlug = slugify(customSlug || title);
    if (!finalSlug) finalSlug = "article-" + Date.now();

    // Check slug uniqueness
    const existing = await db.blogPost.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const post = await db.blogPost.create({
      data: {
        slug: finalSlug,
        title: title.trim(),
        excerpt: excerpt?.trim() || title.slice(0, 160),
        content,
        coverImage: coverImage?.trim() || null,
        category: category || "Guides",
        tags: tags?.trim() || null,
        authorName: session.name || "Équipe SMMaroc",
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date() : null,
        seoTitle: seoTitle?.trim() || title,
        seoDescription: seoDescription?.trim() || excerpt?.slice(0, 160) || null,
      },
    });

    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "BLOG_POST_CREATED",
      targetType: "BLOG",
      targetId: post.id,
      details: `Création de l'article "${post.title}" (${isPublished ? "Publié" : "Brouillon"})`,
    });

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur lors de la création de l'article" }, { status: 500 });
  }
}
