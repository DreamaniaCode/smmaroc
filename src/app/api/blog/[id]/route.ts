import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, isStaff } from "@/lib/auth";
import { logAdminAction } from "@/lib/security";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const currentPost = await db.blogPost.findUnique({ where: { id } });
  if (!currentPost) {
    return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.slug !== undefined) updateData.slug = slugify(body.slug);
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt.trim();
    if (body.content !== undefined) updateData.content = body.content;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage ? body.coverImage.trim() : null;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags?.trim() || null;
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle?.trim() || null;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription?.trim() || null;

    if (body.isPublished !== undefined) {
      updateData.isPublished = Boolean(body.isPublished);
      if (body.isPublished && !currentPost.isPublished) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await db.blogPost.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "BLOG_POST_UPDATED",
      targetType: "BLOG",
      targetId: id,
      details: `Mise à jour de l'article "${updated.title}"`,
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  }

  try {
    await db.blogPost.delete({ where: { id } });

    await logAdminAction({
      adminId: session.userId,
      adminEmail: session.email,
      action: "BLOG_POST_DELETED",
      targetType: "BLOG",
      targetId: id,
      details: `Suppression de l'article "${post.title}"`,
    });

    return NextResponse.json({ success: true, message: "Article supprimé." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de suppression" }, { status: 500 });
  }
}
