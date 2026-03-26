import { useInfiniteQuery } from "@tanstack/react-query";

export interface Article {
  id: string;
  feedId: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  author: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  feedTitle: string | null;
  feedFavicon: string | null;
}

interface ArticlesResponse {
  articles: Article[];
  nextCursor: string | null;
}

export function useArticles(feedId: string | null, feedType?: string | null) {
  return useInfiniteQuery<ArticlesResponse>({
    queryKey: ["articles", feedId, feedType],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam as string);
      if (feedId) params.set("feedId", feedId);
      if (feedType) params.set("feedType", feedType);
      params.set("limit", "30");

      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) throw new Error("Error loading articles");
      return res.json();
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
