"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ArticleList } from "@/components/reader/article-list";

export default function ReaderPage() {
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);

  return (
    <>
      <Sidebar activeFeedId={activeFeedId} onFeedSelect={setActiveFeedId} />
      <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ArticleList feedId={activeFeedId} />
        </div>
      </main>
    </>
  );
}
