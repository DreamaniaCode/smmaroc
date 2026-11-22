import { NextRequest, NextResponse } from "next/server";
import { prisma, db } from "@/lib/db";
import { verifySessionToken, isStaff } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu de la note ne peut être vide." }, { status: 400 });
    }

    const client = await prisma.user.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    }

    const note = await db.crmNote.create({
      data: {
        userId: id,
        authorId: session.userId,
        authorName: session.name || session.email,
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error("[CRM_ADD_NOTE]", error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de la note CRM" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("smm_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ error: "noteId manquant" }, { status: 400 });
    }

    const existing = await prisma.crmNote.findUnique({ where: { id: noteId } });
    if (!existing) {
      return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
    }

    // Only allow author or ADMIN to delete note
    if (existing.authorId !== session.userId && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Vous n'avez pas le droit de supprimer cette note." }, { status: 403 });
    }

    await db.crmNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CRM_DELETE_NOTE]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de la note" }, { status: 500 });
  }
}
