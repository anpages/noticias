import { auth } from "@/auth";
import { upsertReadStatus } from "@/lib/queries";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  articleIds: z.array(z.string()).min(1).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await upsertReadStatus(session.user.id, parsed.data.articleIds);
  return NextResponse.json({ success: true });
}
