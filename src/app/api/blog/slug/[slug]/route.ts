import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug manquant." }, { status: 400 });
  }

  try {
    const post = await db.blogPost.findUnique({
      where: { slug },
    });

    if (!post || !post.isPublished) {
      return NextResponse.json({ error: "Article non trouvé ou non publié." }, { status: 404 });
    }

    // Increment views count asynchronously
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    // Related posts in same category
    const related = await db.blogPost.findMany({
      where: {
        category: post.category,
        isPublished: true,
        id: { not: post.id },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      post: {
        ...post,
        viewsCount: post.viewsCount + 1,
      },
      related,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de lecture de l'article" }, { status: 500 });
  }
}
