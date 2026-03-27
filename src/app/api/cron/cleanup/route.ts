import { db } from "@/db";
import { articles } from "@/db/schema";
import { lt } from "drizzle-orm";
import { NextResponse } from "next/server";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const deleted = await db
    .delete(articles)
    .where(lt(articles.fetchedAt, sevenDaysAgo))
    .returning({ id: articles.id });

  return NextResponse.json({
    deletedOld: deleted.length,
  }, { headers: { "Cache-Control": "no-store" } });
}
