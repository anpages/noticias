import { auth } from "@/auth";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feedId } = await params;

  const deleted = await db
    .delete(feeds)
    .where(and(eq(feeds.id, feedId), eq(feeds.userId, session.user.id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Feed no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
